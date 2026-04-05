from __future__ import annotations
from typing import Literal, Optional
from pydantic import BaseModel, Field, field_validator

CargoType    = Literal["general", "fragile", "hazardous", 
"temperature_controlled"]
CustomerTier = Literal["standard", "preferred"]
UrgencyLevel = Literal["standard", "urgent", "critical"]

class FreightRequest(BaseModel):
    origin:        str   = Field(min_length=2)
    destination:   str   = Field(min_length=2)
    weight_kg:     float = Field(gt=0)
    cargo_type:    CargoType
    timeline_days: int   = Field(gt=0, le=30)
    customer_tier: CustomerTier = "standard"
    currency:      str   = "CAD"
    notes:         Optional[str] = None

    @field_validator("currency")
    @classmethod
    def upper_currency(cls, v: str) -> str:
        return v.upper()

class NormalizedFreightRequest(FreightRequest):
    request_id:    str
    lane:          str
    is_domestic:   bool
    urgency_level: UrgencyLevel

class CarrierQuote(BaseModel):
    carrier:                str
    base_rate:              float
    currency:               str
    estimated_transit_days: int
    valid:                  bool
    reliability_score:      float
    reason:                 Optional[str] = None

class InvalidQuote(BaseModel):
    carrier: str
    reason:  str

class LLMAnalysis(BaseModel):
    recommended_carrier: str
    reasoning:           str
    risk_flags:          list[str]
    confidence:          float

class FinalQuote(BaseModel):
    request_id:             str
    selected_carrier:       str
    base_rate:              float
    markup_percent:         float
    final_rate:             float
    currency:               str
    estimated_transit_days: int
    quote_expires_at:       str
    llm_reasoning:          str
    risk_flags:             list[str]
    confidence:             float
