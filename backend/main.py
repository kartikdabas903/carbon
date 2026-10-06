import os
from dotenv import load_dotenv
load_dotenv()
import json
import uuid
from datetime import datetime
from typing import List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError
from models import (
    CarbonInputData, CarbonResultData, DashboardData, BreakdownItem, TrendPoint,
    AIRequest, AIPrediction, AIFactor, AIRecommendation, ActivityCategory, EffortLevel
)

# Optional LLM integration
try:
    from openai import OpenAI
    # Groq provides an OpenAI-compatible endpoint
    client = OpenAI(
        base_url="https://api.groq.com/openai/v1",
        api_key=os.getenv("GROQ_API_KEY"),
        timeout=5.0
    )
except ImportError:
    client = None
except Exception:
    client = None

app = FastAPI(title="Carbon Footprint Tracker API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------
# 1. Calculate API
# -----------------
@app.post("/api/calculate", response_model=CarbonResultData)
def calculate_carbon(data: CarbonInputData):
    # Basic mockup of emission factors for hackathon
    # factors represent kg CO2 per unit
    factors = {
        ActivityCategory.transport: {"km": 0.12, "mile": 0.19, "miles": 0.19},
        ActivityCategory.building: {"kwh": 0.4, "sqft": 1.2},
        ActivityCategory.electricity: {"kwh": 0.4, "mwh": 400},
        ActivityCategory.equipment: {"item": 50, "device": 35},
        ActivityCategory.resources: {"kg": 2.5, "liter": 2.1, "gallon": 8.0}
    }
    
    category_factors = factors.get(data.category, {})
    unit_lower = data.unit.lower()
    
    if unit_lower in category_factors:
        emissions = data.amount * category_factors[unit_lower]
    else:
        # Fallback generic factor
        emissions = data.amount * 1.5

    return CarbonResultData(
        category=data.category,
        emissionsKg=round(emissions, 2),
        baselineKg=round(emissions * 1.2, 2), # Show a 20% higher baseline for demo purposes
        createdAt=datetime.utcnow().isoformat() + "Z"
    )

# -----------------
# 2. Dashboard API
# -----------------
@app.get("/api/dashboard", response_model=DashboardData)
def get_dashboard():
    # Return mock data for the hackathon dashboard
    return DashboardData(
        totalKg=1450.5,
        avoidedKg=320.0,
        breakdown=[
            BreakdownItem(category=ActivityCategory.transport, emissionsKg=800.0),
            BreakdownItem(category=ActivityCategory.electricity, emissionsKg=450.5),
            BreakdownItem(category=ActivityCategory.equipment, emissionsKg=200.0)
        ],
        trend=[
            TrendPoint(date="2026-08-01", actualKg=300, reducedKg=20),
            TrendPoint(date="2026-09-01", actualKg=280, reducedKg=40),
            TrendPoint(date="2026-10-01", actualKg=250, reducedKg=60),
        ]
    )

# -----------------
# 3. AI Predict API
# -----------------
class CarbonEngine:
    @staticmethod
    def calculate(scenario: dict) -> float:
        # The deterministic math engine
        co2 = 0.0
        co2 += scenario.get("transport_km", 0) * 0.19      # 0.19 kg per km
        co2 += scenario.get("electricity_kwh", 0) * 0.40   # 0.40 kg per kwh
        co2 += scenario.get("food_meals", 0) * 2.50        # 2.50 kg per meal
        co2 += scenario.get("waste_kg", 0) * 1.20          # 1.20 kg per kg of waste
        return round(co2, 2)

@app.post("/api/ai/predict", response_model=AIPrediction)
def predict_carbon(req: AIRequest):
    api_key = os.getenv("GROQ_API_KEY")
    
    if api_key and client:
        prompt = f"""
        Analyze the following planned activity: "{req.prompt}"
        
        Generate exactly 3 scenarios (Scenario 1 MUST be the Baseline exact to the user's prompt. Scenarios 2 and 3 should be eco-friendly optimizations).
        Return ONLY a JSON array of objects.
        
        Format:
        [
          {{
            "scenario_name": "string",
            "transport_km": float,
            "electricity_kwh": float,
            "food_meals": float,
            "waste_kg": float,
            "description": "string (what changed?)"
          }}
        ]
        """
        try:
            response = client.chat.completions.create(
                model="qwen/qwen3.8-27b",
                messages=[
                    {"role": "system", "content": "You are an AI that strictly outputs valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ]
            )
            scenarios = json.loads(response.choices[0].message.content)
            
            # Recalculate all scenarios using our deterministic math engine
            baseline_co2 = 0
            best_co2 = float('inf')
            best_scenario = None
            
            for s in scenarios:
                co2 = CarbonEngine.calculate(s)
                s["calculated_co2"] = co2
                if s.get("scenario_name", "").lower() == "baseline" or baseline_co2 == 0:
                    baseline_co2 = co2
                
                # Optimizer: Find the lowest carbon footprint
                if co2 < best_co2:
                    best_co2 = co2
                    best_scenario = s
            
            # If the user didn't give enough info for >0 baseline, fallback safely
            if baseline_co2 == 0:
                baseline_co2 = best_co2 if best_co2 > 0 else 1.0

            reduction = baseline_co2 - best_co2
            
            return AIPrediction(
                predictedKg=best_co2,
                confidence=0.95,
                category=ActivityCategory.transport, # fallback category
                explanation=f"Baseline was {baseline_co2} kg. Optimized to {best_co2} kg by: {best_scenario.get('description', 'optimizing variables')}.",
                factors=[
                    AIFactor(name="Optimization Recalculation", impact=-(reduction/baseline_co2) if baseline_co2 > 0 else 0)
                ],
                recommendations=[
                    AIRecommendation(
                        id=str(uuid.uuid4()),
                        title="Optimal Scenario Selected",
                        description=best_scenario.get("description", "Follow the optimized plan."),
                        savingsKg=reduction,
                        effort=EffortLevel.medium,
                        category=ActivityCategory.transport
                    )
                ]
            )
        except Exception as e:
            print(f"LLM Error: {e}")
            pass

    # Fallback mock prediction if no API key or error
    return AIPrediction(
        predictedKg=2980.0,
        confidence=0.99,
        category=ActivityCategory.transport,
        explanation="Baseline: 4820 kg. Optimized: 2980 kg (38% reduction). Math handled by Carbon Engine.",
        factors=[
            AIFactor(name="Distance", impact=0.8),
            AIFactor(name="Vehicle Efficiency", impact=-0.2)
        ],
        recommendations=[
            AIRecommendation(
                id=str(uuid.uuid4()),
                title="Increase shared transportation",
                description="Shift attendees to buses instead of cars.",
                savingsKg=1100.0,
                effort=EffortLevel.medium,
                category=ActivityCategory.transport
            )
        ]
    )

# -----------------
# 4. AI Recommendations API
# -----------------
@app.get("/api/ai/recommendations", response_model=List[AIRecommendation])
def get_recommendations(category: str = None, amount: float = None):
    api_key = os.getenv("GROQ_API_KEY")
    
    if api_key and client:
        if category and amount:
            context = f"The user has a high carbon footprint in the '{category}' category, producing approximately {amount} kg of CO2."
        else:
            context = "The user wants general advice on reducing their daily carbon footprint."
            
        prompt = f"""
        {context}
        Generate exactly 2 creative, actionable eco-friendly recommendations.
        Return ONLY a JSON array of objects.
        
        Format:
        [
          {{
            "title": "string (short, catchy)",
            "description": "string (1-2 sentences)",
            "savingsKg": float (estimated kg of CO2 saved),
            "effort": "low", "medium", or "high",
            "category": "transport", "building", "electricity", "equipment", or "resources"
          }}
        ]
        """
        try:
            response = client.chat.completions.create(
                model="qwen/qwen3.8-27b",
                messages=[
                    {"role": "system", "content": "You are an AI that strictly outputs valid JSON arrays."},
                    {"role": "user", "content": prompt}
                ]
            )
            data = json.loads(response.choices[0].message.content)
            
            recs = []
            for item in data:
                # Map string effort to Enum, fallback to low
                effort_str = item.get("effort", "low").lower()
                try:
                    effort_val = EffortLevel(effort_str)
                except ValueError:
                    effort_val = EffortLevel.low
                    
                # Map string category to Enum, fallback to transport
                cat_str = item.get("category", "transport").lower()
                try:
                    cat_val = ActivityCategory(cat_str)
                except ValueError:
                    cat_val = ActivityCategory.transport

                recs.append(
                    AIRecommendation(
                        id=str(uuid.uuid4()),
                        title=item.get("title", "Eco Tip"),
                        description=item.get("description", ""),
                        savingsKg=float(item.get("savingsKg", 0.0)),
                        effort=effort_val,
                        category=cat_val
                    )
                )
            if recs:
                return recs
        except Exception as e:
            print(f"LLM Error in recommendations: {e}")
            pass

    # Fallback mock data if AI fails or no API key is present
    return [
        AIRecommendation(
            id=str(uuid.uuid4()),
            title="Switch to LED bulbs",
            description="Replacing 5 incandescent bulbs with LEDs.",
            savingsKg=150.0,
            effort=EffortLevel.low,
            category=ActivityCategory.electricity
        ),
        AIRecommendation(
            id=str(uuid.uuid4()),
            title="Carpool to work",
            description="Share a ride with a colleague 2 days a week.",
            savingsKg=400.0,
            effort=EffortLevel.medium,
            category=ActivityCategory.transport
        )
    ]
