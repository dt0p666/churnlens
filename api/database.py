import os
from datetime import datetime, timezone
from sqlalchemy import create_engine, Column, Integer, Float, String, DateTime, Text
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./churnlens.db")

# For SQLite, check_same_thread=False is needed for multi-threaded FastAPI workers
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class PredictionAuditLog(Base):
    __tablename__ = "prediction_audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    request_id = Column(String(64), index=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    model_version = Column(String(32))
    churn_probability = Column(Float)
    churn_prediction = Column(Integer)
    risk_tier = Column(String(16))
    decision_threshold = Column(Float)
    features_json = Column(Text)

def init_db():
    Base.metadata.create_all(bind=engine)

# Auto-initialize SQLite tables on load
init_db()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
