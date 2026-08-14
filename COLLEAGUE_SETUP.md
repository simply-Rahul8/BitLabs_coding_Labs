# BitLabs Coding Lab — Setup Guide for Colleagues

## Prerequisites
- Docker Desktop installed and running
- Git (optional)

## Step 1 — Login to DockerHub
Open terminal and run:
  docker login
  Username: rahul720
  Password: {SHARED_PASSWORD_OR_TOKEN}

## Step 2 — Create .env file
Create a file named .env in the same folder as docker-compose.prod.yml:
  SECRET_KEY=bitlabs-secret-key-2026
  GEMINI_API_KEY={GEMINI_KEY_HERE}
  OPENAI_API_KEY=not-configured

## Step 3 — Pull and Run
  docker-compose -f docker-compose.prod.yml up

## Step 4 — Open the App
  Frontend:  http://localhost
  API Docs:  http://localhost/docs

## Step 5 — Register an account
  Go to http://localhost/docs
  Use POST /api/v1/auth/register to create your account
  Set role to "recruiter" or "candidate"

## To stop:
  docker-compose -f docker-compose.prod.yml down

## To update to latest version:
  docker-compose -f docker-compose.prod.yml pull
  docker-compose -f docker-compose.prod.yml up
