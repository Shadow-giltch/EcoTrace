/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface CalculationInput {
  transport_km_daily: number;
  transport_days_week: number;
  fuel_efficiency: number;
  electricity_kwh_month: number;
  lpg_kg_month: number;
  meat_meals_week: number;
  dairy_servings_day: number;
  short_flights_year: number;
  long_flights_year: number;
  user_name?: string;
}

export interface CalculationBreakdown {
  transport: number;
  home_energy: number;
  food: number;
  flights: number;
}

export interface CalculationResult {
  breakdown: CalculationBreakdown;
  total_annual_tons: number;
  equivalence_km_driven: number;
  equivalence_trees_planted: number;
}

export interface InsightItem {
  type: string;
  title: string;
  detail: string;
}

export interface InsightsResult {
  insights: InsightItem[];
}

export interface TipItem {
  id: string;
  title: string;
  description: string;
  impact_kg: number;
}

export interface ActionItem {
  id: string;
  category: string;
  title: string;
  impact_co2_kg: number;
  difficulty: "easy" | "medium" | "hard";
  description: string;
  completed: boolean;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  footprint: number; // in tons
  date: string;
  actions_completed: number;
}
