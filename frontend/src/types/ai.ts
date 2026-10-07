import type { ActivityCategory } from "./carbon";

export interface AIRequest {
  prompt: string;
  conversationContext?: string;
  category?: ActivityCategory;
  quantity?: number;
  unit?: string;
  plannedAt?: string;
  distanceKm?: number;
}

export interface TripOption {
  title: string;
  kg: number;
  hours: number | null; // door to door
  note: string;
  recommended: boolean;
  isPlan: boolean;
  cost?: number | null;
  source?: string; // e.g. "Factor: UK DESNZ 2024 · Distance: OpenRouteService"
}

export interface MapPoint {
  name: string;
  lat: number;
  lon: number;
  kind: "origin" | "destination" | "airport" | "venue";
  detail: string;
  highlight: "best" | "plan" | "other";
}

export interface MapRoute {
  label: string;
  mode: "road" | "rail" | "flight" | "other";
  coords: [number, number][]; // [lat, lon]; flights are drawn as arcs between the two ends
  highlight: "best" | "plan" | "other";
  approximate: boolean; // straight line, not the real track
  options: TripOption[];
  detail: string;
}

export interface TravelMap {
  points: MapPoint[];
  routes: MapRoute[];
  attribution: string[];
}

/** Real grid intensity over the last 24 h (Electricity Maps). */
export interface LiveGrid {
  zone: string;
  nowG: number;
  cleanestHour: string;
  cleanestG: number;
  dirtiestHour: string;
  dirtiestG: number;
  timezone: string;
  source: string;
}

export interface AIFactor {
  name: string;
  impact: number; // signed share of prediction, -1..1
}

export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  savingsKg: number;
  effort: "low" | "medium" | "high";
  category: ActivityCategory;
  cost?: number | null; // rough money cost of this option, in the prediction's currency
}

export interface AIPrediction {
  predictedKg: number;
  confidence: number; // 0..1
  category: ActivityCategory;
  explanation: string;
  factors: AIFactor[];
  recommendations: AIRecommendation[];
  tripLabel?: string | null;
  tripOptions?: TripOption[];
  scopes?: ScopeSplit;
  breakdown?: BreakdownLine[];
  missingInfo?: string[];
  costEstimate?: number | null;
  currency?: string | null;
  timingTip?: string | null;
  liveGrid?: LiveGrid | null;
  map?: TravelMap | null;
  region?: string | null;
}

export interface AIChatRequest {
  question: string;
  prediction: AIPrediction;
  conversationContext?: string;
}

export interface AIChatResponse {
  intent: "answer" | "revise";
  answer: string;
  revisionPrompt?: string | null;
}

/** One line the estimate counted, e.g. "Cement, OPC: 40,000 kg". */
export interface BreakdownLine {
  label: string;
  quantity: number;
  unit: string;
  kg: number;
  scope: 1 | 2 | 3;
  note: string;
  source?: string;
}

/** GHG Protocol split: 1 = fuel burned directly, 2 = purchased electricity, 3 = value chain. */
export interface ScopeSplit {
  scope1: number;
  scope2: number;
  scope3: number;
}