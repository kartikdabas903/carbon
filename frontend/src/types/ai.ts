import type { ActivityCategory } from "./carbon";

export interface AIRequest {
  prompt: string;
  category?: ActivityCategory;
  quantity?: number;
  unit?: string;
  plannedAt?: string;
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
}

export interface AIPrediction {
  predictedKg: number;
  confidence: number; // 0..1
  category: ActivityCategory;
  explanation: string;
  factors: AIFactor[];
  recommendations: AIRecommendation[];
}