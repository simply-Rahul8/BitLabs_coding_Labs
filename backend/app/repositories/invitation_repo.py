import uuid
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models import AssessmentInvitation, InvitationStatus


class InvitationRepository:
    @staticmethod
    def create(
        db: Session, assessment_id: uuid.UUID, candidate_id: uuid.UUID, token: str, expires_at: datetime
    ) -> AssessmentInvitation:
        invitation = AssessmentInvitation(
            assessment_id=assessment_id,
            candidate_id=candidate_id,
            token=token,
            expires_at=expires_at,
        )
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        return invitation

    @staticmethod
    def get_by_token(db: Session, token: str) -> AssessmentInvitation | None:
        return db.scalar(select(AssessmentInvitation).where(AssessmentInvitation.token == token))

    @staticmethod
    def update_status(
        db: Session, invitation_id: uuid.UUID, status: str | InvitationStatus
    ) -> AssessmentInvitation:
        invitation = db.get(AssessmentInvitation, invitation_id)
        if invitation is None:
            raise ValueError("Assessment invitation not found")
        invitation.status = InvitationStatus(status)
        db.add(invitation)
        db.commit()
        db.refresh(invitation)
        return invitation
