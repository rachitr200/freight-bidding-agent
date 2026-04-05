from pydantic import BaseModel

class AppConfig(BaseModel):
    default_markup_percent:   float = 10.0
    preferred_markup_percent: float = 5.0
    carrier_timeout_seconds:  float = 2.5
    llm_model:                str   = "gpt-4o-mini"
    quote_validity_hours:     int   = 24
