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
}

export interface CarbonResultData {
  category: ActivityCategory;
  emissionsKg: number;
  baselineKg?: number;
  createdAt: string;
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