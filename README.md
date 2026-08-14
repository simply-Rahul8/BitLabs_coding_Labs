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

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
*   [Docker Desktop](https://www.docker.com/products/docker-desktop/) (must be running)
*   Git (optional, to clone the repository)

## ⚙️ Setup & Installation

**1. Clone the repository (if applicable)**
```bash
git clone https://github.com/simply-Rahul8/BitLabs_coding_Labs.git
cd BitLabs-Coding-Lab
```

**2. Configure Environment Variables**
Create a `.env` file in the root directory (alongside `docker-compose.prod.yml`). Use the following template:

```env
SECRET_KEY=bitlabs-secret-key-2026
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=not-configured
```
*(Note: You can use `.env.example` as a reference if available).*

**3. DockerHub Login (Optional but recommended for pre-built images)**
If you are pulling images from the remote repository:
```bash
docker login
# Username: rahul720
# Password: <Provide Shared Token>
```

**4. Spin up the application**
Run the production Docker Compose stack. This will start the PostgreSQL database, the FastAPI backend, and the React frontend.
```bash
docker-compose -f docker-compose.prod.yml up -d
```

## 🌐 Accessing the Application

Once the containers are running, you can access the various services locally:

*   **Frontend (Web App):** [http://localhost](http://localhost)
*   **Backend API Docs (Swagger):** [http://localhost/docs](http://localhost/docs)

### Creating an Account
1. Navigate to the API Docs: [http://localhost/docs](http://localhost/docs)
2. Use the `POST /api/v1/auth/register` endpoint to create a new user.
3. Set your desired role to either `"recruiter"` or `"candidate"`.
4. Return to the frontend web app and log in with your newly created credentials.

## 🛑 Managing the Application

**Stop the services:**
```bash
docker-compose -f docker-compose.prod.yml down
```

**Update to the latest version:**
```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## 🏗️ Architecture Overview

1.  **Frontend Container:** Serves the built React application via Nginx.
2.  **Backend Container:** FastAPI server. It mounts the host's Docker socket (`/var/run/docker.sock`) to dynamically spin up short-lived sibling containers for code execution. This allows safe, isolated testing of candidate code against predefined unit tests.
3.  **Database Container:** Standard PostgreSQL 15 instance storing users, assessments, test cases, and submission metrics.

---
*Created for BitLabs Coding Lab.*
