from sqlalchemy import Column, String, Float, DateTime, JSON
from .base import Base
from datetime import datetime, timezone
import uuid

class Transaction(Base):
    __tablename__ = "finance_transactions"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    amount = Column(Float, nullable=False)
    type = Column(String, nullable=False) # income, expense
    category = Column(String)
    tags = Column(JSON, default=list)
    date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    description = Column(String, nullable=False)

class NetWorthSnapshot(Base):
    __tablename__ = "finance_net_worth"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    date = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    assets = Column(Float, default=0.0)
    liabilities = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
