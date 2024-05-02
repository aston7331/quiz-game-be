const express = require('express');
const fs = require('fs');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const PORT = 8080;

// Middleware
app.use(bodyParser.json());

// CORS Headers
app.use(cors({
    allowedHeaders: '*',
    origin:'*'
}));

// In-memory data
let questions = [
    {
        id: 1, category: "AI", question: "If a robot is able to change its own trajectory as per the external conditions, then the robot is considered as the__",
        answer: "Intelligent", distractors: ["Mobile", "Non-Servo", "Open Loop", "Intelligent"]
    },
    {
        id: 2, category: "AI", question: "Which of the given language is not commonly used for AI?",
        answer: "Perl", distractors: ["LISP", "PROLOG", "Python", "Perl"]
    },
    {
        id: 3, category: "AI", question: "A technique that was developed to determine whether a machine could or could not demonstrate the artificial intelligence known as the___",
        answer: "Turing Test", distractors: ["Boolean Algebra", "Turing Test", "Logarithm", "Algorithm"]
    },
    {
        id: 4, category: "AI", question: "The component of an Expert system is_________.",
        answer: "All of the above", distractors: ["Knowledge Base", "Inference Engine", "User Interface", "All of the above"]
    },
    {
        id: 5, category: "AI", question: "Which algorithm is used in the Game tree to make decisions of Win/Lose?",
        answer: "Min/Max algorithm", distractors: ["Heuristic Search Algorithm", "DFS/BFS algorithm", "Greedy Search Algorithm", "Min/Max algorithm"]
    },
    // {
    //     id: 6, category: "AI", question: "The available ways to solve a problem of state-space-search.",
    //     answer: "4", distractors: ["1", "2", "3", "4"]
    // },
    // {
    //     id: 7, category: "AI", question: "Among the given options, which is not the required property of Knowledge representation?",
    //     answer: "Representational Verification", distractors: ["Inferential Efficiency", "Inferential Adequacy", "Representational Verification", "Representational Adequacy"]
    // },
    // {
    //     id: 8, category: "AI", question: "An AI agent perceives and acts upon the environment using___.",
    //     answer: "Both a and c", distractors: ["Sensors", "Perceiver", "Actuators", "Both a and c"]
    // },
    // {
    //     id: 9, category: "AI", question: "Which rule is applied for the Simple reflex agent?",
    //     answer: "Condition-action rule", distractors: ["Simple-action rule", "Simple &Condition-action rule", "Condition-action rule", "None of the above"]
    // },
    // {
    //     id: 10, category: "AI", question: "Which agent deals with the happy and unhappy state?",
    //     answer: "Utility-based agent", distractors: ["Utility-based agent", "Model-based agent", "Goal-based Agent", "Learning Agent"]
    // }
];

// Helper functions
function getLocalData() {
    const data = fs.readFileSync('local_data.json');
    return JSON.parse(data);
}

function saveToLocal(data) {
    fs.writeFileSync('local_data.json', JSON.stringify(data, null, 2));
}

// Routes
app.post("/add_user", (req, res) => {
    console.log("first")
    const localData = getLocalData();
    const users = localData.users || [];
    const { name } = req.body;

    if (users.some(user => user.name === name)) {
        return res.status(400).json({ message: "User already exists" });
    }

    users.push({ name });
    localData.users = users;
    saveToLocal(localData);
    res.json({ message: "User added successfully", user: name });
});

app.get("/questions", (req, res) => {
    res.send(questions);
});

app.post("/submit-answer", (req, res) => {
    const { question_id, user_answer, name, timestamp } = req.body;
    const question = questions.find(q => q.id === question_id);

    if (!question) {
        return res.status(404).json({ message: "Invalid question ID" });
    }

    const correct = question.answer === user_answer;
    const time_taken = (new Date() - new Date(timestamp)) / 1000; // Calculate time taken in seconds

    const localData = getLocalData();
    const prevAnswers = localData.answers || [];
    prevAnswers.push({ name, correct, question_id, user_answer, time_taken });
    localData.answers = prevAnswers;
    saveToLocal(localData);

    res.json({ correct, time_taken });
});

// app.post("/score", (req, res) => {
//     const { name } = req.query;
//     console.log(req, name)
//     const localData = getLocalData();
//     const answers = localData.answers || [];

//     // console.log(answers,"fgh",localData,"drtfg", name ,"1")
//     const filteredAnswers = name ? answers.filter(answer => answer.name === name) : answers;
//     // console.log(filteredAnswers," 2")


//     const score = filteredAnswers.filter(answer => answer.correct).length;
//     // console.log(score, "3")

//     res.json({ score });
// });


app.post("/score/:name", (req, res) => {
    const localData = getLocalData();
    const answers = localData.answers || [];

    // Filter answers based on the provided name or name
    const filteredAnswers = answers.filter(answer => answer.name === req?.params?.name);

    // Calculate score based on correct answers
    const score = filteredAnswers.filter(answer => answer.correct).length;

    res.json({ score });
});


app.get("/top-scorers", (req, res) => {
    const localData = getLocalData();
    const answers = localData.answers || [];

    // Calculate scores for each user
    const userScores = {};
    answers.forEach(answer => {
        if (!userScores[answer.name]) {
            userScores[answer.name] = 0;
        }
        if (answer.correct) {
            userScores[answer.name]++;
        }
    });

    // Sort users based on their scores
    const sortedUsers = Object.entries(userScores)
        .sort(([, scoreA], [, scoreB]) => scoreB - scoreA)
        .slice(0, 5); // Take top 5 scorers

    // Format the response with ranks, names, and scores
    const topScorers = sortedUsers.map(([name, score], index) => ({
        rank: index + 1,
        name,
        score
    }));

    res.json(topScorers);
});


app.post("/clear-db", (req, res) => {
    const emptyData = { answers: [] };

    saveToLocal(emptyData);
    res.json({ message: "Database cleared successfully" });
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
