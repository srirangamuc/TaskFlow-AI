from sqlalchemy import Column,Integer,String,ForeignKey,DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer,primary_key=True,index=True)
    name = Column(String,nullable=False)
    email = Column(String,unique=True,index=True,nullable=False)
    auth_provider = Column(String,nullable=True)
    
    google_id = Column(String,unique=True,nullable=True)
    profile_picture = Column(String,nullable=True)
    access_token = Column(String,nullable=True)
    refresh_token = Column(String,nullable=True)
    token_expiry = Column(DateTime,nullable=True)
    

class Task(Base):
    __tablename__ = "tasks"
    
    id = Column(Integer,primary_key = True,index=True)
    user_id = Column(Integer,ForeignKey("users.id"))
    title=Column(String,nullable=False)
    description = Column(String)
    status = Column(String,default="pending")
    priority = Column(String,default="medium")
    due_date = Column(DateTime,default=datetime.now(datetime.timezone.utc))
    
    user = relationship("User",back_populates="tasks")
    
User.tasks = relationship("Task",back_populates="user")