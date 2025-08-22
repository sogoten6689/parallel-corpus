from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from routers import master_api
from database import SessionLocal
from fastapi.middleware.cors import CORSMiddleware
from routers import rowword_api, auth_router, user_api, import_api, export_api, word_row_master_api, master_api
from routers import dicId_api
from init_db import create_database_if_not_exists
from crud import create_initial_users
from database import get_db
create_database_if_not_exists()

app = FastAPI(
    title="Parallel Corpus API",
    version="1.0.0",
)

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
app.include_router(auth_router, prefix="/auth", tags=["authentication"])
app.include_router(master_api.router,prefix="/api", tags=["master"]) # admin quan ly dữ liệu
app.include_router(user_api, tags=["users"]) # admin quan ly nguoi dung

# app.include_router(rowword_api.router, tags=["row-words"])
# app.include_router(word_row_master_api.router, tags=["word-row-master"])
# app.include_router(import_api.router, prefix="/api", tags=["import"])
# app.include_router(export_api.router, prefix="/api", tags=["export"])
# app.include_router(dicId_api.router, tags=["dicid"])

# @app.on_event("startup")
# async def startup_event():
#     """Create initial users on startup"""
#     db = next(get_db())
#     try:
#         create_initial_users(db)
#     finally:
#         db.close()
