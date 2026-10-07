import type { TravelMap } from "./ai";

export interface Attendee {
  city: string;
  count: number;
}

export interface MeetingRequest {
  attendees: Attendee[];
  nights: number;
  candidates: string[]; // empty: the AI suggests venues
  plannedCity?: string;
}

export interface MeetingLeg {
  fromCity: string;
  people: number;
  mode: string;
  kg: number; // return trip for the whole group
  hours: number | null; // one way, door to door
  source?: string;
}

export interface MeetingCandidate {
  city: string;
  totalKg: number;
  travelKg: number;
  hotelKg: number;
  maxHours: number | null;
  recommended: boolean;
  isPlanned: boolean;
  legs: MeetingLeg[];
}

export interface MeetingResult {
  candidates: MeetingCandidate[]; // lowest total first
  assumptions: string[];
  savingVsPlannedKg: number | null;
  map?: TravelMap | null;
}
