from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Change this line
DATABASE_URL = "postgresql+asyncpg://postgres:ucs%401055%40uC@localhost:5432/taskflowai"

# Create Async Engine
engine = create_async_engine(DATABASE_URL, echo=True)

# Async Session
AsyncSessionLocal = sessionmaker(
    autocommit=False, autoflush=False, bind=engine, class_=AsyncSession
)

Base = declarative_base()

# Dependency to Get DB Session
async def get_db():
    async with AsyncSessionLocal() as session:
        yield session
