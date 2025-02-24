from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.services import subscription_service, auth_service
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse
from app.db.models import User

router = APIRouter()

@router.post("/create-subscription", response_model=SubscriptionResponse)
async def create_subscription(
    subscription: SubscriptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Create a new subscription."""
    return await subscription_service.create_subscription(db, current_user, subscription)

@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Handle Stripe webhook events."""
    return await subscription_service.handle_stripe_webhook(request, db)

@router.post("/apply-discount")
async def apply_discount(
    code: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Apply discount code to subscription."""
    return await subscription_service.apply_discount(db, current_user, code)

@router.get("/subscription-status")
async def get_subscription_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Get current subscription status."""
    return await subscription_service.get_subscription_status(db, current_user)

@router.post("/cancel-subscription")
async def cancel_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(auth_service.get_current_user)
):
    """Cancel current subscription."""
    return await subscription_service.cancel_subscription(db, current_user)
