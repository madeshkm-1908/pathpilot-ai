"""
PathPilot AI — Authentication & Security Utilities
==================================================
Handles bcrypt password hashing, JWT creation & validation,
and FastAPI dependency injection for current authenticated user.
"""

from datetime import datetime, timedelta
import os
import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from database import get_db, query_one

# Configuration
JWT_SECRET = os.getenv("JWT_SECRET", os.getenv("SECRET_KEY", "pathpilot-production-jwt-secret-key-32charsmin!")).strip()
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 14

security = HTTPBearer(auto_error=False)


def normalize_email(email: str) -> str:
    """Normalize email: strip whitespace and lowercase."""
    return email.strip().lower()


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt."""
    pw_bytes = password.encode("utf-8")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(pw_bytes, salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify that a plaintext password matches the bcrypt hash."""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(user_id: int, email: str) -> str:
    """Generate a signed JWT access token for a user."""
    expire = datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    payload = {
        "sub": str(user_id),
        "email": email,
        "exp": expire,
        "iat": datetime.utcnow(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def get_current_user(
    auth: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict:
    """
    FastAPI dependency to enforce authentication on protected endpoints.
    Raises HTTP 401 if token is missing, invalid, expired, or user does not exist.
    Returns the user dict (id, name, email, created_at).
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required. Please log in.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if not auth or not auth.credentials:
        raise credentials_exception

    payload = decode_access_token(auth.credentials)
    if not payload:
        raise credentials_exception

    user_id_raw = payload.get("sub")
    if not user_id_raw:
        raise credentials_exception

    try:
        user_id = int(user_id_raw)
    except ValueError:
        raise credentials_exception

    with get_db() as conn:
        user = query_one(conn, "SELECT id, name, email, created_at FROM users WHERE id = ?", (user_id,))
        if not user:
            raise credentials_exception
        return user


def get_optional_current_user(
    auth: HTTPAuthorizationCredentials | None = Depends(security),
) -> dict | None:
    """
    FastAPI dependency for endpoints that support both guest and authenticated users.
    Returns User dict if valid bearer token is present, otherwise returns None.
    """
    if not auth or not auth.credentials:
        return None

    payload = decode_access_token(auth.credentials)
    if not payload:
        return None

    user_id_raw = payload.get("sub")
    if not user_id_raw:
        return None

    try:
        user_id = int(user_id_raw)
    except ValueError:
        return None

    with get_db() as conn:
        return query_one(conn, "SELECT id, name, email, created_at FROM users WHERE id = ?", (user_id,))
