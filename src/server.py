import os
from dotenv import load_dotenv
import uvicorn
from fastapi import FastAPI
from src.routes.quote_routes import router

load_dotenv()

app = FastAPI(
    title="AMZ Prep — Freight Bidding Agent MVP",
    description="LangGraph + OpenAI freight quoting agent",
    version="1.0.0",
)
app.include_router(router)

if __name__ == "__main__":
    uvicorn.run("src.server:app", host="0.0.0.0", 
port=int(os.getenv("PORT", 8000)), reload=True)
