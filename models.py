from pydantic import BaseModel
from datetime import datetime

class Question(BaseModel):
    id: int
    category: str
    question: str
    answer: str
    distractors: list[str] = []  # Optional list of incorrect answers

class UserAnswer(BaseModel):
    question_id: int
    user_answer: str
    username: str
    timestamp: datetime = datetime.now()