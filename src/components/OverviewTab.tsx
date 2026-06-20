/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef } from "react";
import { Chart } from "chart.js/auto";
import { Trees, Car, ArrowRight, Gauge, Activity } from "lucide-react";
import { CalculationBreakdown } from "../types";

interface OverviewTabProps {
  totalAnnualTons: number;
  breakdown: CalculationBreakdown;
  equivalenceKmField: number;
  equivalenceTreesField: number;
  apiProcessTime: string;
  clientCalcTime: number;
  userName: string;
}

export default function OverviewTab({
  totalAnnualTons,
  breakdown,
  equivalenceKmField,
  equivalenceTreesField,
  apiProcessTime,
  clientCalcTime,
  userName
}: OverviewTabProps) {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  useEffect(() => {
    if (!chartRef.current) return;

    const labels = ["Your Footprint", "India Average", "World Average", "Paris Target"];
    const datasetData = [
      totalAnnualTons,
      1.9, // India Average
      4.8, // World Average
      2.0  // Paris Agreement Sustainable Limit
    ];

    if (chartInstance.current) {
      // EXTREMELY EFFICIENT: Update in place, do not destroy and recreate!
      chartInstance.current.data.datasets[0].data = datasetData;
      
      // Update color representation based on sustainable limit
      const barColors = [
        totalAnnualTons <= 2.0 ? "rgba(16, 185, 129, 0.85)" : "rgba(239, 68, 68, 0.85)", // user (emerald vs red)
        "rgba(59, 130, 246, 0.6)", // India
        "rgba(107, 114, 128, 0.6)", // World
        "rgba(16, 185, 129, 0.4)"  // Paris limit
      ];
      chartInstance.current.data.datasets[0].backgroundColor = barColors;
      
      chartInstance.current.update();
    } else {
      // Lazy chart initialization
      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        chartInstance.current = new Chart(ctx, {
          type: "bar",
          data: {
            labels,
            datasets: [
              {
                label: "Annual CO2 Emissions (Metric Tons)",
                data: datasetData,
                backgroundColor: [
                  totalAnnualTons <= 2.0 ? "rgba(16, 185, 129, 0.85)" : "rgba(239, 68, 68, 0.85)",
                  "rgba(59, 130, 246, 0.6)",
                  "rgba(107, 114, 128, 0.6)",
                  "rgba(16, 185, 129, 0.4)"
                ],
                borderColor: [
                  totalAnnualTons <= 2.0 ? "#10b981" : "#ef4444",
                  "#3b82f6",
                  "#6b7280",
                  "#10b981"
                ],
                borderWidth: 1.5,
                borderRadius: 8,
                barThickness: 36
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                display: false
              },
              tooltip: {
                callbacks: {
                  label: function (context) {
                    return `${context.parsed.y.toFixed(2)} Metric Tons CO2e`;
                  }
                }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                grid: {
                  color: "rgba(226, 232, 240, 0.6)"
                },
                title: {
                  display: true,
                  text: "Tons of CO2e / Year",
                  font: {
                    family: "Inter",
                    weight: "normal"
                  }
                }
              },
              x: {
                grid: {
                  display: false
                }
              }
            }
          }
        });
      }
    }

    return () => {
      // Cleanup chart only on unmount
    };
  }, [totalAnnualTons]);

  // Clean unmount helper
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };
  }, []);

  const getComparisonMessage = () => {
    if (totalAnnualTons <= 2.0) {
      return {
        style: "bg-emerald-50 text-emerald-800 border-emerald-100",
        heading: "Sustainable Footprint Hero!",
        body: `Splendid job${userName ? `, ${userName}` : ""}! Your annual emission footprint is within the Paris Agreement's 2.0-ton limit, helping combat long-term global warming.`
      };
    } else if (totalAnnualTons <= 4.8) {
      return {
        style: "bg-amber-50 text-amber-800 border-amber-100",
        heading: "Moderate Carbon Footprint",
        body: `You are below the average global citizen average, but exceed the Paris Agreement heating goals. Check out the "Simple Actions" and "Personalized Insights" tabs to find quick opportunities to save.`
      };
    } else {
      return {
        style: "bg-rose-50 text-rose-800 border-rose-100",
        heading: "Action Required: Above World Average",
        body: "Your carbon output exceeds the average world citizen. Commencing minor changes—such as high-efficiency energy options or green commuting—will yield massive combined reductions."
      };
    }
  };

  const comp = getComparisonMessage();

  // Dynamic dominant category calculation for personalized premium callouts
  const categories = Object.keys(breakdown) as Array<keyof typeof breakdown>;
  let maxCat: keyof typeof breakdown = "transport";
  let maxVal = 0;
  categories.forEach(cat => {
    if (breakdown[cat] > maxVal) {
      maxVal = breakdown[cat];
      maxCat = cat;
    }
  });

  const catNames: Record<string, string> = {
    transport: "Transportation",
    home_energy: "Home Energy",
    food: "Diet and Food Choices",
    flights: "Aviation Flights"
  };

  const catAdvice: Record<string, string> = {
    transport: "It accounts for a substantial share of your footprint—the highest-leverage place to focus your daily reduction.",
    home_energy: "Powering down vampire standby drains and adjusting cooling temps holds massive low-maintenance savings.",
    food: "Shifting to plant-based days or reducing plate waste is an extremely effective low-effort habit.",
    flights: "Flight takeoffs are highly intensive. Selecting direct legs or reducing flights triggers substantial drops."
  };

  const dominantCategoryName = catNames[maxCat] || "Transportation";
  const dominantAdvice = catAdvice[maxCat] || "Identify high-leverage opportunities to speed up your path to carbon neutrality.";
  const dominantPerc = totalAnnualTons > 0 ? ((breakdown[maxCat] / totalAnnualTons) * 100).toFixed(0) : "0";

  // Dynamic status badges values
  const foodImpact = breakdown.food < 1.0 ? "Low Impact" : breakdown.food < 2.0 ? "Moderate" : "High Impact";
  const foodSub = breakdown.food < 1.0 ? "Mostly plant-based" : "Meat-inclusive diet";
  const energyGrade = breakdown.home_energy < 1.5 ? "A+" : breakdown.home_energy < 2.5 ? "B-" : "C";
  const energySub = breakdown.home_energy < 1.5 ? "High efficiency" : "Grid dependency high";
  const transportRank = breakdown.transport < 1.0 ? "Top 5%" : breakdown.transport < 2.0 ? "Top 15%" : "Top 40%";
  const transportSub = breakdown.transport < 1.0 ? "Low daily cost" : "Daily commute cost";

  return (
    <div className="space-y-8 animate-fade-in" id="overview-tab-content">
      {/* Intro message & Personal Comparison Box */}
      <div className={`border rounded-xl p-6 transition-all duration-300 shadow-sm ${comp.style}`}>
        <h3 className="font-display text-lg font-bold mb-2 flex items-center gap-2">
          <Activity className="h-5 w-5 animate-pulse" />
          {comp.heading}
        </h3>
        <p className="text-sm opacity-95 leading-relaxed font-medium">{comp.body}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Current Footprint Metrics & High-impact highlight box (Span 4) */}
        <div className="lg:col-span-4 flex flex-col space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col justify-between" id="user-total-metric">
            <div>
              <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Current Footprint</h2>
              <div className="flex items-baseline space-x-2">
                <span className="text-6xl font-bold text-slate-950 tracking-tighter">{totalAnnualTons.toFixed(2)}</span>
                <span className="text-lg text-slate-400 font-medium">t CO₂e / yr</span>
              </div>
              <p className="text-sm text-slate-650 mt-4 leading-relaxed font-medium">
                That's equivalent to driving <span className="font-bold text-slate-900">{equivalenceKmField.toLocaleString()} km</span> in a standard passenger sedan.
              </p>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-slate-500">Emission Offsets Reclaimed</span>
                <span className="text-xs font-bold text-emerald-600 font-mono">-{equivalenceTreesField} Trees</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-emerald-500 h-1.5 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min(100, (equivalenceTreesField / 300) * 100)}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Personalized Insight dark block */}
          <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md border border-slate-800 flex flex-col justify-between" id="dominant-dynamic-insight">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Personalized Carbon Insight</h3>
              </div>
              <h4 className="text-lg font-bold leading-tight mb-2 text-white">
                {dominantCategoryName} is your largest emission source
              </h4>
              <p className="text-slate-400 text-sm leading-relaxed mb-4">
                It accounts for {dominantPerc}% of your total lifestyle footprint. {dominantAdvice}
              </p>
            </div>
            <div className="pt-2">
              <span className="inline-flex items-center text-xs font-bold text-emerald-400 font-sans tracking-wide">
                Active Carbon Tuning Ready 🚀
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: Global Comparisons & Live Badges (Span 8) */}
        <div className="lg:col-span-8 flex flex-col space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex-1 flex flex-col justify-between" id="benchmark-chart-card">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Global & Local Comparisons</h2>
                  <p className="text-xs text-slate-500 mt-0.5">How your carbon output matches national goals and planetary limits.</p>
                </div>
                <div className="hidden sm:flex space-x-4 text-[10px] font-mono uppercase font-bold tracking-wider">
                  <span className="flex items-center"><span className="w-2.5 h-2.5 bg-emerald-500 rounded-full mr-1.5"></span>You</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 bg-blue-500 rounded-full mr-1.5"></span>India Avg</span>
                  <span className="flex items-center"><span className="w-2.5 h-2.5 bg-slate-400 rounded-full mr-1.5"></span>World Avg</span>
                </div>
              </div>

              <div className="relative h-64 w-full" role="img" aria-label="Comparison chart of your annual footprint versus carbon benchmarks.">
                <canvas ref={chartRef} className="w-full h-full"></canvas>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-100">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-150">
                <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Food Source</p>
                <p className="text-base font-bold text-slate-900 leading-tight">{foodImpact}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 italic">{foodSub}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-150">
                <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Energy Grade</p>
                <p className={`text-base font-bold leading-tight ${energyGrade.startsWith("A") ? "text-emerald-600" : "text-amber-600"}`}>{energyGrade}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 italic">{energySub}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-150">
                <p className="text-[9px] uppercase font-bold text-slate-400 mb-1">Transport Rank</p>
                <p className="text-base font-bold text-blue-600 leading-tight">{transportRank}</p>
                <p className="text-[10px] text-slate-500 mt-0.5 italic">{transportSub}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Facts grid to answer "Understand" */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6" id="overview-facts-grid">
        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
          <span className="font-mono text-xs text-slate-400 uppercase tracking-widest block">INDIA BASELINE</span>
          <p className="text-2xl font-bold font-display text-slate-800 mt-1">1.9 Tons</p>
          <span className="text-xs text-slate-500 mt-1 block">Per-capita average emissions in India. Large population shares maintain a low transportation average.</span>
        </div>
        <div className="p-5 border border-slate-200 rounded-xl bg-slate-50/50">
          <span className="font-mono text-xs text-slate-400 uppercase tracking-widest block">WORLD AVERAGE</span>
          <p className="text-2xl font-bold font-display text-slate-800 mt-1">4.8 Tons</p>
          <span className="text-xs text-slate-500 mt-1 block">Global mean carbon emissions per resident annually. Highly industrialized regions average above 10 tons.</span>
        </div>
        <div className="p-5 border border-slate-200 rounded-xl bg-emerald-50/10 text-emerald-850 border-emerald-500/20 bg-emerald-500/[0.04]">
          <span className="font-mono text-xs text-emerald-600 uppercase tracking-widest block font-bold">PARIS TARGET</span>
          <p className="text-2xl font-bold font-display text-emerald-700 mt-1">2.0 Tons</p>
          <span className="text-xs text-emerald-700/80 mt-1 block">Calculated maximum safe annual threshold per person by 2030 to prevent global heating exceeding 1.5°C.</span>
        </div>
      </div>
    </div>
  );
}
