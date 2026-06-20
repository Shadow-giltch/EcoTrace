/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CalculationBreakdown, InsightItem } from "../src/types";
import { EMISSION_FACTORS } from "./emissions";

/**
 * Generates personalized, data-derived insights based on emission breakdown.
 * This directly avoids generic static text in favor of real custom logic.
 */
export function generateInsights(breakdown: CalculationBreakdown, total: number): InsightItem[] {
  const insights: InsightItem[] = [];

  // Identify leading emission source
  const categories = Object.keys(breakdown) as Array<keyof CalculationBreakdown>;
  let dominantCategory = categories[0];
  let maxVal = breakdown[categories[0]];

  for (const cat of categories) {
    if (breakdown[cat] > maxVal) {
      maxVal = breakdown[cat];
      dominantCategory = cat;
    }
  }

  const share = total > 0 ? maxVal / total : 0;
  const prettyCatName = dominantCategory.replace("_", " ");

  // 1. Dominant category warning
  if (share > 0.35 && total > 0) {
    insights.push({
      type: "dominant_category",
      title: `${prettyCatName.charAt(0).toUpperCase() + prettyCatName.slice(1)} is your main emission source`,
      detail: `It accounts for ${(share * 100).toFixed(0)}% of your total footprint (${maxVal.toFixed(1)} tons CO₂e). Concentrating your emission reduction efforts here will provide the highest leverage for your lifestyle.`
    });
  }

  // 2. Performance compared to World & Paris Agreement targets
  if (total > EMISSION_FACTORS.WORLD_AVG_ANNUAL) {
    const excess = total - EMISSION_FACTORS.WORLD_AVG_ANNUAL;
    insights.push({
      type: "above_average_world",
      title: `Footprint is ${excess.toFixed(1)}t above world average`,
      detail: `Your annual footprint of ${total.toFixed(1)} tons is higher than the global per capita average of ${EMISSION_FACTORS.WORLD_AVG_ANNUAL} tons. Swapping 2 high-impact habits can close this gap.`
    });
  } else if (total > EMISSION_FACTORS.PARIS_AGREEMENT_TARGET) {
    const gap = total - EMISSION_FACTORS.PARIS_AGREEMENT_TARGET;
    insights.push({
      type: "above_target_paris",
      title: `${gap.toFixed(1)}t remaining to reach critical Paris 2.0t Target`,
      detail: `You are close to the sustainable 2.0-ton global heating threshold goal. Making direct cuts to luxury flight travel or fuel-inefficient transport can put you in the green zone.`
    });
  } else {
    insights.push({
      type: "sustainable_hero",
      title: "Excellent carbon budget (Sustainable Zone)",
      detail: `Your carbon footprint is ${total.toFixed(1)} tons, meeting the Paris Agreement target of 2.0 tons. You are contributing to keeping global warming under 1.5°C!`
    });
  }

  // 3. Category-specific targeted insights
  if (dominantCategory === "transport" && breakdown.transport > 1.5) {
    insights.push({
      type: "transport_tip",
      title: "Optimize physical commute",
      detail: "Carpooling one day a week or walking journeys under 2 km can reduce your transport footprint by over 300 kg CO2 annually."
    });
  } else if (dominantCategory === "home_energy" && breakdown.home_energy > 2.0) {
    insights.push({
      type: "energy_tip",
      title: "Improve home appliance efficiency",
      detail: "Every degree of AC usage adjusted upwards by 1°C saves ~6% on cooling power. Consider switching energy-hog items to certified high-star-efficiency models."
    });
  } else if (dominantCategory === "food" && breakdown.food > 1.2) {
    insights.push({
      type: "diet_tip",
      title: "Introduce green-protein days",
      detail: "Substituting beef or lamb meals with plant-based lentil or tofu alternatives just twice a week slashes food emissions substantially."
    });
  } else if (dominantCategory === "flights" && breakdown.flights > 1.5) {
    insights.push({
      type: "flights_tip",
      title: "Consider regional high-speed rail",
      detail: "A single short flight emits the same CO2 as a year of train travel. Try substituting short domestic flights with electric rail or video conferencing."
    });
  }

  // Return generated array (handle typescript safety explicitly)
  return insights;
}
