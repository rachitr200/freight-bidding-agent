# AMZ Prep - Freight Bidding Agent MVP

A Python + LangGraph + OpenAI project that turns a freight request into an AI-reasoned structured quote in seconds.

## What makes this different

Most freight quoting systems just pick the cheapest rate using if/else logic.
This agent adds a REAL LLM reasoning step. The llm_analyze_quotes node passes
all valid carrier quotes and shipment context to OpenAI, which returns:
- A recommended carrier with natural language explanation
- Risk flags (e.g. only 1 valid quote available)
- A confidence score (0.0-1.0)

## Tech stack
- Python 3.11+
- LangGraph for workflow orchestration
- OpenAI gpt-4o-mini for carrier quote analysis and reasoning
- FastAPI for the REST API
- Pydantic for validation
- python-dotenv for config

## Agent workflow
## Mock carriers

| Carrier | Profile |
|---|---|
| Purolator Freight | Reliable, strong Ontario/Quebec network |
| Day and Ross | Competitive on LTL, good cross-Canada |
| Canpar Transport | Budget option, limited cargo and weight |
| XTL Transport | Premium, excellent hazmat handling |
| GFL Logistics | Times out - simulates slow carrier API |

## Getting started

### 1. Clone the repo
```bash
git clone https://github.com/rachitr200/freight-bidding-agent.git
cd freight-bidding-agent
```

### 2. Create virtual environment
```bash
python3.11 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies
```bash
pip install -r requirements.txt
```

### 4. Set up environment
```bash
cp .env.example .env
# Add your OpenAI API key to .env
```

### 5. Run the demo
```bash
python -m src.demo
```

### 6. Run the API server
```bash
uvicorn src.server:app --reload --port 8000
```

## API usage

### Health check
```bash
curl http://localhost:8000/api/health
```

### Quote request
```bash
curl -X POST http://localhost:8000/api/quote \
  -H "Content-Type: application/json" \
  -d @examples/sample_request.json
```

## Example response includes
- Selected carrier with base rate, markup and final rate
- LLM reasoning explaining WHY this carrier was chosen
- Risk flags from LLM analysis
- Confidence score
- Quote expiry timestamp (24hr validity)
- Full audit trail of every step
- All rejected carriers with reasons

## Business rules
- Markup: 10% standard customers, 5% preferred customers
- Quotes expire 24 hours after generation
- Urgency: 1 day = critical (+30% cost), 2 days = urgent (+15%), 3+ = standard
- LLM recommendation used when available, fallback to cheapest if LLM fails
