from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import Base
import enum

class SubscriptionTier(enum.Enum):
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)
    subscription_tier = Column(Enum(SubscriptionTier), default=SubscriptionTier.FREE)
    stripe_customer_id = Column(String, unique=True, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    preferences = relationship("UserPreference", back_populates="user")
    bookmarks = relationship("Bookmark", back_populates="user")
    reading_history = relationship("ReadingHistory", back_populates="user")

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category = Column(String)  # e.g., "cs.CV"
    subtopic = Column(String)  # e.g., "object detection"
    
    user = relationship("User", back_populates="preferences")

class Paper(Base):
    __tablename__ = "papers"

    id = Column(Integer, primary_key=True, index=True)
    arxiv_id = Column(String, unique=True, index=True)
    title = Column(String)
    authors = Column(String)
    abstract = Column(Text)
    category = Column(String)
    published_date = Column(DateTime)
    url = Column(String)
    
    summary = relationship("PaperSummary", back_populates="paper", uselist=False)
    bookmarks = relationship("Bookmark", back_populates="paper")
    reading_history = relationship("ReadingHistory", back_populates="paper")

class PaperSummary(Base):
    __tablename__ = "paper_summaries"

    id = Column(Integer, primary_key=True, index=True)
    paper_id = Column(Integer, ForeignKey("papers.id"))
    observation = Column(Text)
    objective = Column(Text)
    challenge = Column(Text)
    main_idea = Column(Text)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    paper = relationship("Paper", back_populates="summary")

class Bookmark(Base):
    __tablename__ = "bookmarks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    paper_id = Column(Integer, ForeignKey("papers.id"))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="bookmarks")
    paper = relationship("Paper", back_populates="bookmarks")

class ReadingHistory(Base):
    __tablename__ = "reading_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    paper_id = Column(Integer, ForeignKey("papers.id"))
    read_at = Column(DateTime(timezone=True), server_default=func.now())
    
    user = relationship("User", back_populates="reading_history")
    paper = relationship("Paper", back_populates="reading_history")

class DiscountCode(Base):
    __tablename__ = "discount_codes"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    discount_percentage = Column(Float)
    valid_until = Column(DateTime)
    is_active = Column(Boolean, default=True)
