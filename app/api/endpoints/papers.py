from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.services import paper_service, auth_service
from app.schemas.paper import PaperResponse, PaperSummaryResponse
from app.db.models import User

router = APIRouter()

@router.get("/papers", response_model=List[PaperResponse])
def get_papers(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user),
    category: Optional[str] = Query(None, description="ArXiv category (e.g., cs.CV)"),
    subtopic: Optional[str] = Query(None, description="Specific subtopic"),
    skip: int = 0,
    limit: int = 10
):
    """Get latest papers based on user preferences."""
    return paper_service.get_papers(db, current_user, category, subtopic, skip, limit)

@router.get("/papers/{paper_id}/summary", response_model=PaperSummaryResponse)
def get_paper_summary(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get AI-generated summary for a specific paper."""
    summary = paper_service.get_paper_summary(db, paper_id, current_user)
    if not summary:
        raise HTTPException(status_code=404, detail="Summary not found")
    return summary

@router.post("/papers/{paper_id}/bookmark")
def bookmark_paper(
    paper_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Bookmark a paper."""
    return paper_service.bookmark_paper(db, paper_id, current_user)

@router.get("/papers/bookmarks", response_model=List[PaperResponse])
def get_bookmarks(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user),
    skip: int = 0,
    limit: int = 10
):
    """Get user's bookmarked papers."""
    return paper_service.get_bookmarked_papers(db, current_user, skip, limit)

@router.get("/papers/history", response_model=List[PaperResponse])
def get_reading_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user),
    skip: int = 0,
    limit: int = 10
):
    """Get user's reading history."""
    return paper_service.get_reading_history(db, current_user, skip, limit)
