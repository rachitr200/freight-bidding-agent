Freight Bidding Agent

AI-powered Freight Bidding Agent built using LangGraph, OpenAI GPT-4o-mini, FastAPI, and Python. The system automates freight quote generation, carrier evaluation, risk analysis, and carrier selection using an AI-driven multi-agent workflow.

Live Demo

Frontend:
https://rachitr200.github.io/freight-bidding-agent/

Backend API:
https://freight-bidding-agent.onrender.com

API Documentation:
https://freight-bidding-agent.onrender.com/docs

⸻

Project Overview

Freight brokers often spend significant time manually contacting carriers, comparing rates, evaluating delivery timelines, assessing carrier reliability, and calculating margins before generating customer quotes.

This project automates that workflow using a multi-step AI agent architecture that:

* Validates shipment requests
* Collects and evaluates carrier quotes
* Performs AI-driven quote analysis
* Scores carriers based on multiple criteria
* Applies business rules and markup calculations
* Generates structured recommendations with confidence scores
* Flags potential risks before quote generation

The result is a consistent, explainable, and production-style freight quoting workflow that reduces manual effort and accelerates decision-making.

⸻

Key Features

* AI-powered carrier recommendation
* LangGraph workflow orchestration
* Confidence scoring
* Risk detection and flagging
* Structured JSON outputs
* FastAPI backend
* Pydantic validation
* Health monitoring endpoint
* Error handling and fallback logic
* Audit trail generation
* Production-style deployment

⸻

Tech Stack

AI & Backend

* Python 3.11+
* OpenAI GPT-4o-mini
* LangGraph
* FastAPI
* Pydantic
* python-dotenv

Deployment

* Render (Backend API Hosting)
* GitHub Pages (Frontend Hosting)
* GitHub Actions
* Docker

⸻

Architecture

The agent follows a multi-step workflow:

1. Shipment Validation

Validates required shipment details using Pydantic schemas.

2. Carrier Discovery

Retrieves available carriers based on shipment constraints.

3. Quote Collection

Collects quotes from multiple carriers.

4. Carrier Evaluation

Evaluates carriers using:

* Price
* Reliability
* Transit Time
* Availability
* Risk Factors

5. AI Analysis

OpenAI GPT-4o-mini analyzes valid carrier options and generates:

* Recommended carrier
* Natural language reasoning
* Risk assessment
* Confidence score

6. Quote Generation

Applies markup rules and produces the final customer quote.

⸻

Mock Carriers

Carrier	Profile
Purolator Freight	Reliable national carrier
Day & Ross	Competitive cross-country shipping
Canpar Transport	Budget-focused carrier
XTL Transport	Premium freight services
GFL Logistics	Simulated timeout/failure scenario

⸻

Business Rules

* Standard customer markup: 10%
* Preferred customer markup: 5%
* Quotes expire after 24 hours
* Urgency adjustments:
    * 1 Day = Critical (+30%)
    * 2 Days = Urgent (+15%)
    * 3+ Days = Standard
* Fallback to lowest-cost valid carrier if AI analysis fails

⸻

Example Output

The system returns:

* Selected carrier
* Base rate
* Markup percentage
* Final quoted price
* Transit time
* Confidence score
* Risk flags
* AI reasoning
* Quote expiration timestamp
* Audit trail
* Invalid carrier explanations

⸻

Getting Started

1. Clone Repository

git clone https://github.com/rachitr200/freight-bidding-agent.git
cd freight-bidding-agent

2. Create Virtual Environment

python3.11 -m venv .venv
source .venv/bin/activate

3. Install Dependencies

pip install -r requirements.txt

4. Configure Environment

cp .env.example .env

Add your OpenAI API key:

OPENAI_API_KEY=your_api_key_here

5. Run Demo

python -m src.demo

6. Run API Server

uvicorn src.server:app --reload --port 8000

⸻

API Usage

Health Check

curl https://freight-bidding-agent.onrender.com/api/health

Generate Quote

curl -X POST https://freight-bidding-agent.onrender.com/api/quote \
-H "Content-Type: application/json" \
-d @examples/sample_request.json

⸻

Deployment

Frontend

Hosted on GitHub Pages:

https://rachitr200.github.io/freight-bidding-agent/

Backend

Hosted on Render:

https://freight-bidding-agent.onrender.com

API Documentation

Swagger UI:

https://freight-bidding-agent.onrender.com/docs

⸻

Production-Oriented Features

* Structured JSON responses
* Validation layers using Pydantic
* Confidence scoring
* Risk flag generation
* Fallback logic
* API health checks
* Error handling
* Deployment-ready architecture
* Modular LangGraph orchestration

⸻

Future Enhancements

* Real carrier API integrations
* Dynamic pricing optimization
* Historical shipment analytics
* Human-in-the-loop approvals
* Multi-region carrier selection
* Dashboard and monitoring integration
* Cost prediction models

⸻

Author

Rachit Raj

LinkedIn:
https://www.linkedin.com/in/rachit-r-6b62bb92/

GitHub:
https://github.com/rachitr200