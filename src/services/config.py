import os
from dotenv import load_dotenv
from src.types.config import AppConfig

load_dotenv()

def get_config() -> AppConfig:
    return AppConfig(
        default_markup_percent   = 
float(os.getenv("DEFAULT_MARKUP_PERCENT",  10)),
        preferred_markup_percent = 
float(os.getenv("PREFERRED_MARKUP_PERCENT", 5)),
        carrier_timeout_seconds  = 
float(os.getenv("CARRIER_TIMEOUT_SECONDS", 2.5)),
        llm_model                = os.getenv("LLM_MODEL", "gpt-4o-mini"),
        quote_validity_hours     = int(os.getenv("QUOTE_VALIDITY_HOURS", 
24)),
    )
