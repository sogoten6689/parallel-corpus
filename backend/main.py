from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import SessionLocal
# from routers import api
from fastapi.middleware.cors import CORSMiddleware
from routers import rowword_api, auth_router
from init_db import create_database_if_not_exists
from crud import create_initial_users
from database import get_db
create_database_if_not_exists()

app = FastAPI(title="Parallel Corpus API", version="1.0.0")

# 👇 Add this block to allow frontend to talk to backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "*"],  # Replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Dependency inject DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# app.include_router(api.router)
app.include_router(rowword_api.router)
app.include_router(auth_router, prefix="/auth", tags=["authentication"])

# @app.on_event("startup")
# async def startup_event():
#     """Create initial users on startup"""
#     db = next(get_db())
#     try:
#         create_initial_users(db)
#     finally:
#         db.close()
