from datetime import datetime
from typing import List
from fastapi import FastAPI, Body, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from models import Question, UserAnswer
from json import load, dump

app = FastAPI()


def get_local_data():
    with open('local_data.json') as file:
        local_data = load(file)
    return local_data

def save_to_local(data):
    with open('local_data.json', 'w') as file:
        local_data = dump(data, file)
    return local_data


origins = ["*"]  # Replace with your frontend origin
app.add_middleware(
    CORSMiddleware, allow_origins=origins, allow_methods=["POST"], allow_headers=["Content-Type"]
)


# In-memory data (replace with database if needed)
questions = [
    Question(id=1, category="AI", question="If a robot is able to change its own trajectory as per the external conditions, then the robot is considered as the__",
             answer="Intelligent", distractors=["Mobile", "Non-Servo", "Open Loop", "Intelligent"]),
    Question(id=2, category="AI", question="Which of the given language is not commonly used for AI?",
             answer="Perl", distractors=["LISP", "PROLOG", "Python", "Perl"]),
    Question(id=3, category="AI", question="A technique that was developed to determine whether a machine could or could not demonstrate the artificial intelligence known as the___",
             answer="Turing Test", distractors=["Boolean Algebra", "Turing Test", "Logarithm", "Algorithm"]),
    Question(id=4, category="AI", question="The component of an Expert system is_________.",
             answer="All of the above", distractors=["Knowledge Base", "Inference Engine", "User Interface", "All of the above"]),
    Question(id=5, category="AI", question="Which algorithm is used in the Game tree to make decisions of Win/Lose?",
             answer="Min/Max algorithm", distractors=["Heuristic Search Algorithm", "DFS/BFS algorithm", "Greedy Search Algorithm", "Min/Max algorithm"]),
    # Question(id=6, category="AI", question="The available ways to solve a problem of state-space-search.",
    #          answer="4", distractors=["1", "2", "3", "4"]),
    # Question(id=7, category="AI", question="Among the given options, which is not the required property of Knowledge representation?",
    #          answer="Representational Verification", distractors=["Inferential Efficiency", "Inferential Adequacy", "Representational Verification", "Representational Adequacy"]),
    # Question(id=8, category="AI", question="An AI agent perceives and acts upon the environment using___.",
    #          answer="Both a and c", distractors=["Sensors", "Perceiver", "Actuators", "Both a and c"]),
    # Question(id=9, category="AI", question="Which rule is applied for the Simple reflex agent?",
    #          answer="Condition-action rule", distractors=["Simple-action rule", "Simple &Condition-action rule", "Condition-action rule", "None of the above"]),
    # Question(id=10, category="AI", question="Which agent deals with the happy and unhappy state?",
    #          answer="Utility-based agent", distractors=["Utility-based agent", "Model-based agent", "Goal-based Agent", "Learning Agent"])
]


@app.post("/add_user")
async def add_user(user: dict):
    """Adds a new user to the local data file."""
    local_data = get_local_data()
    users = local_data.get('users', [])
    if any(existing_user['name'] == user['name'] for existing_user in users):
        raise HTTPException(status_code=400, detail="User already exists")
    users.append(user)
    local_data['users'] = users
    save_to_local(local_data)
    return {"message": "User added successfully", "user": user['name']}


@app.post("/questions")
async def get_questions():
    """Returns a list of all quiz questions."""
    return questions

@app.post("/submit-answer")
async def submit_answer(answer: UserAnswer = Body(...)):
    """Submits a user's answer for a question and returns feedback."""
    question = next((q for q in questions if q.id == answer.question_id), None)
    if not question:
        raise HTTPException(status_code=404, detail="Invalid question ID")

    correct = question.answer == answer.user_answer
    time_taken = (datetime.now() - answer.timestamp).total_seconds()  # Calculate time taken in seconds

    local_data = get_local_data()

    prev_answers = local_data.get('answers', None)
    
    if prev_answers is None:
        prev_answers = []
    prev_answers.append({
        "username": answer.username,
        "correct": correct,
        'question_id': answer.question_id,
        'user_answer': answer.user_answer,
        'time_taken': time_taken,
    })

    local_data['answers'] = prev_answers

    save_to_local(local_data)
    return {"correct": correct, "time_taken": time_taken}


@app.post("/score")
async def calculate_score():
    """Calculates and returns the user's score based on correct answers."""
    local_data = get_local_data()
    answers = local_data.get('answers', [])
    score = sum(1 for answer in answers if answer['correct'])
    return {"score": score}


@app.post("/clear-db")
async def clear_database():
    """Clears the local database (answers)."""
    empty_data = {"answers": []}
    save_to_local(empty_data)
    return {"message": "Database cleared successfully"}

# Add more endpoints as needed (e.g., for creating/updating quizzes, managing users)

if __name__ == "__main__": 
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True) 