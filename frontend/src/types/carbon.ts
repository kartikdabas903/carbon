export type ActivityCategory =
  | "transport"
  | "building"
  | "electricity"
  | "equipment"
  | "resources";

export interface Activity {
  id: ActivityCategory;
  label: string;
  unit: string;
  hint: string;
}

export interface CarbonInputData {
  category: ActivityCategory;
  amount: number;
  unit: string;
  detail?: string;
  activityType: string; // FactorInfo.key
  region?: string; // ISO country code, for electricity
}

export interface CarbonResultData {
  category: ActivityCategory;
  emissionsKg: number;
  baselineKg?: number | null;
  createdAt: string;
  label?: string;
  working?: string;
  scope?: 1 | 2 | 3;
}

/** An activity type the calculation engine knows (GET /api/factors). */
export interface FactorInfo {
  key: string;
  label: string;
  unit: string;
  category: ActivityCategory;
  kgPerUnit: number | null; // null when it depends on the electricity grid or flight length
  source: string;
  scope: 1 | 2 | 3;
}

export interface BreakdownItem {
  category: ActivityCategory;
  emissionsKg: number;
}

export interface TrendPoint {
  date: string;
  actualKg: number;
  reducedKg: number;
}

export interface DashboardData {
  totalKg: number;
  avoidedKg: number;
  breakdown: BreakdownItem[];
  trend: TrendPoint[];
}