import type { ActivityCategory, CarbonInputData, CarbonResultData, DashboardData } from "@/types/carbon";
import type { AIPrediction, AIRecommendation, AIRequest } from "@/types/ai";

const FACTORS: Record<ActivityCategory, number> = {
  transport: 0.17, // kg CO2e per km
  building: 2.1, // per hour
  electricity: 0.82, // per kWh
  equipment: 3.4, // per hour
  resources: 0.9, // per kg
};

export const mockCalculate = (d: CarbonInputData): CarbonResultData => {
  const e = d.amount * FACTORS[d.category];
  return { category: d.category, emissionsKg: e, baselineKg: e * 1.15, createdAt: new Date().toISOString() };
};

export const mockDashboard: DashboardData = {
  totalKg: 4820,
  avoidedKg: 1260,
  breakdown: [
    { category: "transport", emissionsKg: 1850 },
    { category: "electricity", emissionsKg: 1400 },
    { category: "building", emissionsKg: 820 },
    { category: "equipment", emissionsKg: 510 },
    { category: "resources", emissionsKg: 240 },
  ],
  trend: [
    { date: "Jan", actualKg: 900, reducedKg: 900 },
    { date: "Feb", actualKg: 880, reducedKg: 810 },
    { date: "Mar", actualKg: 940, reducedKg: 780 },
    { date: "Apr", actualKg: 910, reducedKg: 690 },
    { date: "May", actualKg: 930, reducedKg: 650 },
    { date: "Jun", actualKg: 900, reducedKg: 600 },
  ],
};

export const mockRecommendations: AIRecommendation[] = [
  { id: "r1", title: "Carpool site visits", description: "Combine trips into shared vehicles when 3+ staff travel to the same place.", savingsKg: 320, effort: "low", category: "transport" },
  { id: "r2", title: "Shift heavy loads off-peak", description: "Run equipment and charging outside 6–10 pm when grid intensity is highest.", savingsKg: 210, effort: "medium", category: "electricity" },
  { id: "r3", title: "Consolidate floor usage", description: "Cluster occupied hours on fewer floors and set back HVAC on the rest.", savingsKg: 180, effort: "medium", category: "building" },
  { id: "r4", title: "Schedule equipment runtime", description: "Auto-shutdown idle machinery after 15 minutes.", savingsKg: 95, effort: "low", category: "equipment" },
];

export const mockPredict = (req: AIRequest): AIPrediction => {
  const p = req.prompt.toLowerCase();
  const category: ActivityCategory = /drive|car|km|trip|travel|commute|van/.test(p)
    ? "transport"
    : /kwh|electric|power|grid/.test(p)
    ? "electricity"
    : /machine|equipment|generator|device/.test(p)
    ? "equipment"
    : /office|building|hvac|floor|room/.test(p)
    ? "building"
    : "resources";
  const num = Number(p.match(/(\d+(\.\d+)?)\s*(km|kwh|hours?|hrs?|kg)/)?.[1] ?? 40);
  const predictedKg = num * FACTORS[category] * 1.1;
  return {
    predictedKg,
    confidence: 0.82,
    category,
    explanation: `Based on the described ${category} activity, the model estimates emissions from the quantity involved and typical emission factors, adjusted for timing and load.`,
    factors: [
      { name: "Activity quantity", impact: 0.62 },
      { name: "Grid / fuel intensity", impact: 0.21 },
      { name: "Peak-time timing", impact: 0.12 },
      { name: "Shared usage", impact: -0.18 },
    ],
    recommendations: mockRecommendations.filter((r) => r.category === category).concat(mockRecommendations.filter((r) => r.category !== category)).slice(0, 3),
  };
};