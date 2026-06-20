/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalculationInput, CalculationResult } from "../src/types";

export const EMISSION_FACTORS = {
  // Transport: Gasoline emission factor is ~2.31 kg CO2/L. 
  // We compute: (km_daily * days_week * 52) / fuel_efficiency * 2.31
  GASOLINE_CO2_PER_LITER: 2.31, 

  // Home Energy
  ELECTRICITY_CO2_PER_KWH: 0.82, // in kg
  LPG_CO2_PER_KG: 3.0, // in kg

  // Diet
  MEAT_CO2_PER_MEAL: 2.5, // in kg
  DAIRY_CO2_PER_SERVING: 0.4, // in kg

  // Flights
  SHORT_FLIGHT_CO2: 150, // in kg per flight
  LONG_FLIGHT_CO2: 800, // in kg per flight

  // Comparison baselines (Annual tons of CO2 per capita)
  INDIA_AVG_ANNUAL: 1.9,
  WORLD_AVG_ANNUAL: 4.8,
  PARIS_AGREEMENT_TARGET: 2.0,
  USA_AVG_ANNUAL: 14.5
};

/**
 * Calculates carbon footprint based on inputs and returns breakdown and equivalent stats.
 * All factors are kept modular and O(1) complexity.
 */
export function calculateCarbonFootprint(input: CalculationInput): CalculationResult {
  // 1. Transportation footprint (Annual kg CO2)
  const annualKm = input.transport_km_daily * input.transport_days_week * 52;
  const litersFuel = input.fuel_efficiency > 0 ? annualKm / input.fuel_efficiency : 0;
  const transportKg = litersFuel * EMISSION_FACTORS.GASOLINE_CO2_PER_LITER;

  // 2. Home Energy (Annual kg CO2 as we receive monthly inputs)
  const electricityKg = input.electricity_kwh_month * 12 * EMISSION_FACTORS.ELECTRICITY_CO2_PER_KWH;
  const lpgKg = input.lpg_kg_month * 12 * EMISSION_FACTORS.LPG_CO2_PER_KG;
  const energyKg = electricityKg + lpgKg;

  // 3. Diet (Annual kg CO2 as we receive weekly and daily inputs)
  const meatKg = input.meat_meals_week * 52 * EMISSION_FACTORS.MEAT_CO2_PER_MEAL;
  const dairyKg = input.dairy_servings_day * 365 * EMISSION_FACTORS.DAIRY_CO2_PER_SERVING;
  const foodKg = meatKg + dairyKg;

  // 4. Flights (Annual kg CO2)
  const shortFlightKg = input.short_flights_year * EMISSION_FACTORS.SHORT_FLIGHT_CO2;
  const longFlightKg = input.long_flights_year * EMISSION_FACTORS.LONG_FLIGHT_CO2;
  const flightsKg = shortFlightKg + longFlightKg;

  // Totals in metric tons
  const totalKg = transportKg + energyKg + foodKg + flightsKg;
  const totalTons = totalKg / 1000;

  // Equivalence metrics
  // Driving equivalence: Avg gasoline car emits ~0.12 kg CO2 per km
  const co2PerKmGasolineCar = 0.12; 
  const equivalenceKm = totalKg / co2PerKmGasolineCar;

  // Tree offset equivalence: 1 mature tree absorbs ~22 kg CO2 per year
  const treeAbsorbtionKgPerYear = 22;
  const equivalenceTrees = totalKg / treeAbsorbtionKgPerYear;

  return {
    breakdown: {
      transport: parseFloat((transportKg / 1000).toFixed(3)),
      home_energy: parseFloat((energyKg / 1000).toFixed(3)),
      food: parseFloat((foodKg / 1000).toFixed(3)),
      flights: parseFloat((flightsKg / 1000).toFixed(3)),
    },
    total_annual_tons: parseFloat(totalTons.toFixed(3)),
    equivalence_km_driven: Math.round(equivalenceKm),
    equivalence_trees_planted: Math.round(equivalenceTrees)
  };
}
