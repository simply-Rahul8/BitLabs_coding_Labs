from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import ai, assessments, auth, execute, practice, submissions

app = FastAPI(title="BitLabs Coding Lab API", version="0.1.0")

app.include_router(auth.router, prefix="/api/v1")
app.include_router(assessments.router, prefix="/api/v1")
app.include_router(practice.router, prefix="/api/v1")
app.include_router(submissions.router, prefix="/api/v1")
app.include_router(ai.router, prefix="/api/v1")
app.include_router(execute.router, prefix="/api/v1")

# Add CORS middleware LAST (so it executes FIRST)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/", tags=["health"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "bitlabs-coding-lab"}
