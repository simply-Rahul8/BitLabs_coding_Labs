# BitLabs Coding Lab

BitLabs Coding Lab is a full-stack, containerized platform that empowers candidates to practice coding and allows recruiters to create, manage, and evaluate programming assessments. It features a secure sandbox execution engine and integrates AI capabilities to generate hints, evaluate submissions, and assist in question creation.

## 🚀 Key Features

*   **Role-Based Access Control:** Distinct experiences for **Recruiters** and **Candidates**.
*   **Secure Code Sandbox:** Executes untrusted candidate code in isolated, temporary Docker containers (Sandbox Execution Engine).
*   **Concurrency Management:** Built-in semaphore concurrency limiter to prevent resource exhaustion (capped at 10 concurrent executions).
*   **AI-Powered Coaching & Hints:** Uses Google Gemini / OpenAI to provide context-aware hints and detailed evaluation of candidate submissions.
*   **Recruiter Dashboard:** Build custom assessments, track candidate progress, and view detailed submission scoreboards.
*   **Practice Arena:** A feature-rich IDE environment in the browser with syntax highlighting (Monaco Editor) for candidates to hone their skills.
*   **End-to-End Testing:** Includes full UI testing coverage using Playwright.

## 🛠️ Tech Stack

**Frontend**
*   [React](https://reactjs.org/) 18 with [Vite](https://vitejs.dev/)
*   [Tailwind CSS](https://tailwindcss.com/) for styling
*   [Monaco Editor](https://microsoft.github.io/monaco-editor/) for in-browser code editing
*   [Playwright](https://playwright.dev/) for E2E testing

**Backend**
*   [FastAPI](https://fastapi.tiangolo.com/) (Python)
*   [PostgreSQL](https://www.postgresql.org/) with [SQLAlchemy](https://www.sqlalchemy.org/) & [Alembic](https://alembic.sqlalchemy.org/)
*   JWT authentication (python-jose, passlib)
*   Integrations with `google-genai` and `openai`

**Infrastructure & Execution**
*   [Docker](https://www.docker.com/) & Docker Compose
*   Automated DockerHub CI/CD scripts
*   Nginx (Frontend routing)

*(Note: A full list of all technologies and requirements used in both frontend and backend can be found in `requirements.txt` at the root of the project.)*

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   [Node.js](https://nodejs.org/) (v18+)
*   [Python](https://www.python.org/) (v3.9+)
*   [PostgreSQL](https://www.postgresql.org/) (Running locally)
*   Git (to clone the repository)

## ⚙️ Setup & Installation

**1. Clone the repository**
```bash
git clone https://github.com/simply-Rahul8/BitLabs_coding_Labs.git
cd BitLabs-Coding-Lab
```

**2. Configure Environment Variables**
Create a `.env` file in the root directory (or in the `backend` directory). Use the following template and adjust the `DATABASE_URL` to match your local PostgreSQL credentials:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/bitlabs_coding_lab
SECRET_KEY=bitlabs-secret-key-2026
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=not-configured
```

**3. Run the Backend**
Open a new terminal and run the following commands to set up and start the FastAPI server:
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python -m uvicorn app.main:app --reload --port 8000
```

**4. Run the Frontend**
Open another terminal and run the following commands to set up and start the React app:
```bash
cd frontend
npm install
npm run dev
```

## 🌐 Accessing the Application

Once both servers are running, you can access the various services locally:

*   **Frontend (Web App):** [http://localhost:5173](http://localhost:5173) (or the port Vite provides)
*   **Backend API Docs (Swagger):** [http://localhost:8000/docs](http://localhost:8000/docs)

### Creating an Account
1. Navigate to the API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)
2. Use the `POST /api/v1/auth/register` endpoint to create a new user.
3. Set your desired role to either `"recruiter"` or `"candidate"`.
4. Return to the frontend web app and log in with your newly created credentials.

## 🛑 Managing the Application

To stop the services, simply terminate the processes in your terminals (e.g., using `Ctrl+C`).

## 🏗️ Architecture Overview

1.  **Frontend:** React application built with Vite.
2.  **Backend:** FastAPI server handling API requests, authentication, and execution logic.
3.  **Database:** PostgreSQL database storing users, assessments, test cases, and submission metrics.

---
*Created for BitLabs Coding Lab.*
