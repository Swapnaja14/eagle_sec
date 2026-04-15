# Assessment Feature

This app provides quiz/assessment functionality for the LearnSphere platform.

## Models

### Quiz
- Main assessment/quiz model
- Links to courses and contains multiple questions
- Settings: time limit, passing score, max attempts, randomization

### QuizQuestion
- Links Quiz to Questions with ordering and point values
- Allows same question to be used in multiple quizzes with different points

### Submission
- Tracks user's quiz attempts
- Stores score, percentage, status, and timing information
- Automatically calculates pass/fail based on passing score

### Answer
- Individual answers for each question in a submission
- Tracks correctness and points earned

## API Endpoints

### Quizzes
- `GET /api/assessments/quizzes/` - List all quizzes
- `POST /api/assessments/quizzes/` - Create new quiz
- `GET /api/assessments/quizzes/{id}/` - Get quiz details
- `PUT /api/assessments/quizzes/{id}/` - Update quiz
- `DELETE /api/assessments/quizzes/{id}/` - Delete quiz
- `POST /api/assessments/quizzes/{id}/start_quiz/` - Start new attempt
- `GET /api/assessments/quizzes/{id}/questions/` - Get quiz questions

### Submissions
- `GET /api/assessments/submissions/` - List user's submissions
- `GET /api/assessments/submissions/{id}/` - Get submission details
- `POST /api/assessments/submissions/{id}/submit_answer/` - Submit answer
- `POST /api/assessments/submissions/{id}/complete_submission/` - Complete quiz
- `GET /api/assessments/submissions/my_submissions/` - Get current user submissions

## Setup

1. Activate virtual environment and install dependencies
2. Run migrations: `python manage.py makemigrations assessments`
3. Apply migrations: `python manage.py migrate`
4. Create superuser if needed: `python manage.py createsuperuser`

## Usage Flow

1. Admin creates Quiz and adds QuizQuestions
2. User starts quiz via `start_quiz` endpoint (creates Submission)
3. User submits answers via `submit_answer` endpoint
4. User completes quiz via `complete_submission` endpoint
5. System calculates score and determines pass/fail
