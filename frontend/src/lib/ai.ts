import { request, USE_MOCK, wait } from "./api";
import { mockPredict, mockRecommendations } from "./mock";
import type { AIChatRequest, AIChatResponse, AIPrediction, AIRecommendation, AIRequest } from "@/types/ai";
import type { MeetingRequest, MeetingResult } from "@/types/meeting";
import { getAccessToken } from "@/lib/account";

export async function predictCarbon(body: AIRequest, accessToken?: string | null): Promise<AIPrediction> {
  if (USE_MOCK) {
    await wait(600);
    return mockPredict(body);
  }
  return request("/api/ai/predict", {
    method: "POST",
    body: JSON.stringify(body),
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}

export async function askAboutPrediction(body: AIChatRequest, accessToken: string): Promise<AIChatResponse> {
  return request("/api/ai/chat", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}

export async function planMeeting(body: MeetingRequest, accessToken?: string): Promise<MeetingResult> {
  return request("/api/meeting", {
    method: "POST",
    body: JSON.stringify(body),
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });
}

export async function getRecommendations(): Promise<AIRecommendation[]> {
  if (USE_MOCK) {
    await wait();
    return mockRecommendations;
  }
  const accessToken = await getAccessToken();
  if (!accessToken) throw new Error("Sign in to view recommendations.");
  return request("/api/ai/recommendations", { headers: { Authorization: `Bearer ${accessToken}` } });
}