from pydantic import BaseModel
from typing import Optional, List
from enum import Enum
from datetime import datetime

class ActivityCategory(str, Enum):
    transport = "transport"
    building = "building"
    electricity = "electricity"
    equipment = "equipment"
    resources = "resources"

class EffortLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class CarbonInputData(BaseModel):
    category: ActivityCategory
    amount: float
    unit: str
    detail: Optional[str] = None

class CarbonResultData(BaseModel):
    category: ActivityCategory
    emissionsKg: float
    baselineKg: Optional[float] = None
    createdAt: str

class BreakdownItem(BaseModel):
    category: ActivityCategory
    emissionsKg: float

class TrendPoint(BaseModel):
    date: str
    actualKg: float
    reducedKg: float

class DashboardData(BaseModel):
    totalKg: float
    avoidedKg: float
    breakdown: List[BreakdownItem]
    trend: List[TrendPoint]

class AIRequest(BaseModel):
    prompt: str
    category: Optional[ActivityCategory] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    plannedAt: Optional[str] = None

class AIFactor(BaseModel):
    name: str
    impact: float

class AIRecommendation(BaseModel):
    id: str
    title: str
    description: str
    savingsKg: float
    effort: EffortLevel
    category: ActivityCategory

class AIPrediction(BaseModel):
    predictedKg: float
    confidence: float
    category: ActivityCategory
    explanation: str
    factors: List[AIFactor]
    recommendations: List[AIRecommendation]
