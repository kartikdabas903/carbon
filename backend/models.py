from pydantic import BaseModel, Field
from typing import Optional, List, Literal
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
    amount: float = Field(gt=0)
    unit: str
    detail: Optional[str] = None
    activityType: str  # key from GET /api/factors
    region: Optional[str] = None  # ISO country code for electricity; defaults to DEFAULT_REGION

class ScopeSplit(BaseModel):
    scope1: float = 0.0  # fuel burned / gas leaked directly
    scope2: float = 0.0  # purchased electricity
    scope3: float = 0.0  # everything else in the value chain

class CarbonResultData(BaseModel):
    category: ActivityCategory
    emissionsKg: float
    baselineKg: Optional[float] = None
    createdAt: str
    label: str = ""
    working: str = ""
    scope: int = 3

class FactorInfo(BaseModel):
    key: str
    label: str
    unit: str
    category: ActivityCategory
    kgPerUnit: Optional[float] = None  # None when it depends on the electricity grid
    source: str
    scope: int

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
    distanceKm: Optional[float] = Field(default=None, gt=0)
    conversationContext: Optional[str] = Field(default=None, max_length=4000)

class HistorySyncRequest(BaseModel):
    entries: List[dict] = Field(default=[], max_length=50)

class ChoiceSyncRequest(BaseModel):
    predictionId: str = Field(min_length=1, max_length=100)
    choice: Optional[dict] = None

class GoalRequest(BaseModel):
    reductionPct: int = Field(ge=10, le=100)
    targetYear: int = Field(ge=2026, le=2050)

class BudgetRequest(BaseModel):
    monthlyBudgetKg: float = Field(gt=0, le=1000000000)

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
    cost: Optional[float] = None  # rough money cost of this option, same currency as the prediction

class TripOption(BaseModel):
    title: str
    kg: float
    hours: Optional[float] = None  # door to door
    note: str = ""
    recommended: bool = False
    isPlan: bool = False  # the travel mode the user said they'd use
    cost: Optional[float] = None
    source: str = ""


class MapPoint(BaseModel):
    name: str
    lat: float
    lon: float
    kind: str  # origin | destination | airport | venue
    detail: str = ""
    highlight: str = "other"  # best | plan | other


class MapRoute(BaseModel):
    label: str
    mode: str  # road | rail | flight | other
    coords: List[List[float]]  # [[lat, lon], ...]; flights are drawn as arcs between the two ends
    highlight: str = "other"  # best | plan | other
    approximate: bool = False  # straight line, not the real track
    options: List[TripOption] = []
    detail: str = ""


class TravelMap(BaseModel):
    points: List[MapPoint]
    routes: List[MapRoute]
    attribution: List[str] = []


class LiveGrid(BaseModel):
    zone: str
    nowG: float
    cleanestHour: str
    cleanestG: float
    dirtiestHour: str
    dirtiestG: float
    timezone: str
    source: str

class Attendee(BaseModel):
    city: str = Field(min_length=1, max_length=80)
    count: int = Field(ge=1, le=10000)

class MeetingRequest(BaseModel):
    attendees: List[Attendee] = Field(min_length=1, max_length=8)
    nights: int = Field(default=1, ge=0, le=60)
    candidates: List[str] = Field(default=[], max_length=6)  # empty: the AI suggests venues
    plannedCity: Optional[str] = None

class MeetingLeg(BaseModel):
    fromCity: str
    people: int
    mode: str
    kg: float  # return trip for the whole group
    hours: Optional[float] = None  # one way, door to door
    source: str = ""  # where the distance and factor came from

class MeetingCandidate(BaseModel):
    city: str
    totalKg: float
    travelKg: float
    hotelKg: float
    maxHours: Optional[float] = None  # longest one-way journey any group makes
    recommended: bool = False
    isPlanned: bool = False
    legs: List[MeetingLeg]

class MeetingResult(BaseModel):
    candidates: List[MeetingCandidate]  # lowest total first
    assumptions: List[str] = []
    savingVsPlannedKg: Optional[float] = None
    map: Optional["TravelMap"] = None

class BreakdownLine(BaseModel):
    label: str
    quantity: float  # total amount after multipliers, in `unit`
    unit: str
    kg: float
    scope: int
    note: str = ""
    source: str = ""  # e.g. "Factor: UK DESNZ 2024 · Distance: OpenRouteService"

class AIPrediction(BaseModel):
    predictedKg: float
    confidence: float
    category: ActivityCategory
    explanation: str
    factors: List[AIFactor]
    recommendations: List[AIRecommendation]
    tripLabel: Optional[str] = None
    tripOptions: List[TripOption] = []
    scopes: ScopeSplit = ScopeSplit()
    breakdown: List[BreakdownLine] = []  # every line counted, e.g. a construction bill of materials
    missingInfo: List[str] = []  # details that would make the estimate more accurate
    costEstimate: Optional[float] = None  # rough money cost of the plan, in `currency`
    currency: Optional[str] = None
    timingTip: Optional[str] = None  # when flexible electricity use is cleaner
    liveGrid: Optional[LiveGrid] = None  # real grid intensity for timing advice
    map: Optional[TravelMap] = None
    region: Optional[str] = None

class AIChatRequest(BaseModel):
    question: str = Field(min_length=2, max_length=1500)
    prediction: AIPrediction
    conversationContext: Optional[str] = Field(default=None, max_length=3000)

class AIChatResponse(BaseModel):
    intent: Literal["answer", "revise"]
    answer: str
    revisionPrompt: Optional[str] = None


MeetingResult.model_rebuild()
