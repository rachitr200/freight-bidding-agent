# AMZ Prep — Freight Bidding Agent MVP

A Python + LangGraph + OpenAI project that turns a freight request into an 
AI-reasoned structured quote in seconds.

## Tech stack
- Python 3.11+
- LangGraph for workflow orchestration
- OpenAI (gpt-4o-mini) for carrier quote analysis
- FastAPI for the REST API
- Pydantic for validation

## Quick start

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Add your OpenAI API key to .env
python -m src.demo
```

## Run the API
```bash
uvicorn src.server:app --reload --port 8000
```

## API endpoints
- GET  /api/health
- POST /api/quote
