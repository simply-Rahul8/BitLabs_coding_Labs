import uuid
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.session import Base
from app.models import User
from app.repositories import InvitationRepository

DATABASE_URL = "postgresql://postgres:bitlabs123@localhost:5432/bitlabs_db"
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
db = SessionLocal()

candidate_id = uuid.UUID("2d6dc606-831a-4cc7-9f07-322a3176acc9")
invitations = InvitationRepository.get_by_candidate(db, candidate_id)

print(f"Number of invitations found: {len(invitations)}")
for inv in invitations:
    assessment = inv.assessment
    submission = inv.submissions[0] if inv.submissions else None
    print({
        "invitation_id": str(inv.id),
        "assessment_id": str(assessment.id),
        "title": assessment.title,
        "description": assessment.description,
        "difficulty": assessment.difficulty,
        "time_limit_mins": assessment.time_limit_mins,
        "status": inv.status.value,
        "token": inv.token,
        "expires_at": str(inv.expires_at),
        "score": submission.score if submission else None,
    })
