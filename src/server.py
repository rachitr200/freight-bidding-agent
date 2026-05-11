import os
from dotenv import load_dotenv
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.routes.quote_routes import router

load_dotenv()

app = FastAPI(
    title="AMZ Prep — Freight Bidding Agent MVP",
    description="LangGraph + OpenAI freight quoting agent",
    version="1.0.0",
)

# Allow the Live Server frontend to talk to the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    uvicorn.run("src.server:app", host="0.0.0.0",
    port=int(os.getenv("PORT", 8000)), reload=True)