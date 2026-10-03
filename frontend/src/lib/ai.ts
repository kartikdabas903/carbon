import { request, USE_MOCK, wait } from "./api";
import { mockPredict, mockRecommendations } from "./mock";
import type { AIPrediction, AIRecommendation, AIRequest } from "@/types/ai";

export async function predictCarbon(body: AIRequest): Promise<AIPrediction> {
  if (USE_MOCK) {
    await wait(600);
    return mockPredict(body);
  }
  return request("/api/ai/predict", { method: "POST", body: JSON.stringify(body) });
}

export async function getRecommendations(): Promise<AIRecommendation[]> {
  if (USE_MOCK) {
    await wait();
    return mockRecommendations;
  }
  return request("/api/ai/recommendations");
}