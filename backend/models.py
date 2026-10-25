"""
PathPilot AI — Database Models (SQLAlchemy)
===========================================
Defines User, LearningPath, Module, SavedResource, and UserActivity.
"""

from datetime import datetime
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Boolean,
    DateTime,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import relationship
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    learning_paths = relationship("LearningPath", back_populates="owner", cascade="all, delete-orphan")
    saved_resources = relationship("SavedResource", back_populates="user", cascade="all, delete-orphan")
    activities = relationship("UserActivity", back_populates="user", cascade="all, delete-orphan")


class LearningPath(Base):
    __tablename__ = "learning_paths"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    learning_goal = Column(Text, nullable=True)
    current_level = Column(String(50), nullable=True)
    target_skill = Column(String(200), nullable=False)
    hours_per_week = Column(Integer, default=10, nullable=False)
    total_weeks = Column(Integer, default=4, nullable=False)
    total_hours = Column(Integer, default=40, nullable=False)
    progress_percentage = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    owner = relationship("User", back_populates="learning_paths")
    modules = relationship("Module", back_populates="path", cascade="all, delete-orphan", order_by="Module.week")
    resources = relationship("SavedResource", back_populates="path", cascade="all, delete-orphan")
    activities = relationship("UserActivity", back_populates="path", cascade="all, delete-orphan")


class Module(Base):
    __tablename__ = "modules"

    id = Column(Integer, primary_key=True, index=True)
    path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="CASCADE"), nullable=False, index=True)
    week = Column(Integer, nullable=False)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    hours = Column(Integer, default=5, nullable=False)
    type = Column(String(50), default="learn", nullable=False)  # learn | practice | project
    resource_id = Column(String(100), nullable=True)
    resource_title = Column(String(255), nullable=True)
    resource_url = Column(Text, nullable=True)
    is_completed = Column(Boolean, default=False, nullable=False)
    completed_at = Column(DateTime, nullable=True)

    path = relationship("LearningPath", back_populates="modules")


class SavedResource(Base):
    __tablename__ = "saved_resources"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False)
    url = Column(Text, nullable=False)
    provider = Column(String(100), nullable=True)
    resource_type = Column(String(50), nullable=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="saved_resources")
    path = relationship("LearningPath", back_populates="resources")


class UserActivity(Base):
    __tablename__ = "user_activities"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    path_id = Column(Integer, ForeignKey("learning_paths.id", ondelete="SET NULL"), nullable=True, index=True)
    module_id = Column(Integer, ForeignKey("modules.id", ondelete="SET NULL"), nullable=True)
    activity_type = Column(String(50), nullable=False)  # complete_module | create_path | study_session
    description = Column(Text, nullable=False)
    hours_spent = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    user = relationship("User", back_populates="activities")
    path = relationship("LearningPath", back_populates="activities")


# Composite index for querying activity by user and date
Index("idx_user_activity_user_date", UserActivity.user_id, UserActivity.created_at)
