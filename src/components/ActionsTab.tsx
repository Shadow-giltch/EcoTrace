/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { Check, Flame, Trophy, Award, Sparkles } from "lucide-react";
import { ActionItem } from "../types";

interface ActionsTabProps {
  onActionsSaved: (kgSaved: number) => void;
}

export default function ActionsTab({ onActionsSaved }: ActionsTabProps) {
  // 10 distinct, single-day easily actionable steps ranked by impact-to-effort
  const [actions, setActions] = useState<ActionItem[]>([
    {
      id: "act-1",
      category: "Energy",
      title: "Increase air conditioning temperature by 1°C",
      impact_co2_kg: 210,
      difficulty: "easy",
      description: "Set your thermostat to 24°C or 25°C. Every degree higher cuts cooling power consumption by 6%.",
      completed: false
    },
    {
      id: "act-2",
      category: "Energy",
      title: "Power down idle screens and master switches",
      impact_co2_kg: 110,
      difficulty: "easy",
      description: "Shut off TV panels and peripheral boxes at the wall. Eliminates continuous standby vampire power draw.",
      completed: false
    },
    {
      id: "act-3",
      category: "Transport",
      title: "Verify and adjust tyre pressures on commuters",
      impact_co2_kg: 180,
      difficulty: "easy",
      description: "Maintain tyres under correct ratings. Boosts fuel mileage stats and guards motor safety.",
      completed: false
    },
    {
      id: "act-4",
      category: "Diet",
      title: "Introduce 1 dedicated green-protein day",
      impact_co2_kg: 360,
      difficulty: "easy",
      description: "Skip red meat meals for 1 full day next week. Swapping beef for lentil/plant feeds avoids topsoil processing.",
      completed: false
    },
    {
      id: "act-5",
      category: "Diet",
      title: "Eliminate avoidable daily cooking plate waste",
      impact_co2_kg: 150,
      difficulty: "easy",
      description: "Measure ingredients before cooking. Decaying municipal food waste produces massive methane releases.",
      completed: false
    },
    {
      id: "act-6",
      category: "Energy",
      title: "Run washing machines on solar ECO cycles at 30°C",
      impact_co2_kg: 90,
      difficulty: "easy",
      description: "Lower water temperature settings from 60°C to 30°C. Cold washing retains garment colors and cuts grid demand.",
      completed: false
    },
    {
      id: "act-7",
      category: "Energy",
      title: "Retrofit top 3 active bulbs to certified LED",
      impact_co2_kg: 320,
      difficulty: "easy",
      description: "Exchange intensive filament nodes for state-of-the-art power LEDs. Reduces room heating slightly.",
      completed: false
    },
    {
      id: "act-8",
      category: "Transport",
      title: "Carpool or swap 1 commute lane with public rail",
      impact_co2_kg: 680,
      difficulty: "medium",
      description: "Share fuel burns or take high-speed local electric metro systems. Substantially reduces road grids congestion.",
      completed: false
    },
    {
      id: "act-9",
      category: "Flights",
      title: "Select direct flight legs on next unavoidable trip",
      impact_co2_kg: 300,
      difficulty: "medium",
      description: "Aviation takeoffs consume substantial aviation fuel. Skipping transitions lowers total trip outputs.",
      completed: false
    },
    {
      id: "act-10",
      category: "All",
      title: "Mend clothing or source 1 article second-hand",
      impact_co2_kg: 280,
      difficulty: "medium",
      description: "Opting for durable pre-owned items prevents extensive factory fabric bleaching and shipping footprints.",
      completed: false
    }
  ]);

  // Handle toggle logic
  const toggleAction = (id: string) => {
    let newKg = 0;
    const updated = actions.map(act => {
      if (act.id === id) {
        const nextState = !act.completed;
        return { ...act, completed: nextState };
      }
      return act;
    });

    setActions(updated);

    // Sum up completed actions savings mapping to kg or similar
    const totalSaved = updated.reduce((sum, item) => sum + (item.completed ? item.impact_co2_kg : 0), 0);
    onActionsSaved(totalSaved);
  };

  // HIGH EFFICIENCY EVENT DELEGATION: Parent-level clicking listener as per CRITICAL FIX #1
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    
    // Find closest container that carries the action ID
    const cardElement = target.closest("[data-action-id]");
    if (!cardElement) return;

    // Check if the click happened inside an interactive element (excluding the whole card)
    // We can click anywhere on the card to toggle to make it extremely finger/mouse accessible!
    // But if they clicked on the native checkbox, let's let prevent duplication.
    const actionId = cardElement.getAttribute("data-action-id");
    if (actionId) {
      toggleAction(actionId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleAction(id);
    }
  };

  const completedCount = actions.filter(act => act.completed).length;
  const totalPotentialSavings = actions.reduce((acc, act) => acc + act.impact_co2_kg, 0);
  const currentSavings = actions.reduce((acc, act) => acc + (act.completed ? act.impact_co2_kg : 0), 0);
  const progressPercent = Math.round((currentSavings / totalPotentialSavings) * 100) || 0;

  return (
    <div className="space-y-8" id="actions-tab-content">
      {/* Dynamic carbon savings tracker block */}
      <div className="card-eco bg-teal-900 text-white relative overflow-hidden" id="actions-progress-header">
        <div className="absolute top-0 right-0 -tr-y-1/4 translate-x-1/6 opacity-10 pointer-events-none">
          <Sparkles className="h-64 w-64" />
        </div>
        
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="md:col-span-2 space-y-3">
            <span className="text-[10px] font-mono tracking-widest text-teal-300 uppercase font-bold block">SIMPLE DAILY COMMITS</span>
            <h3 className="font-display text-2xl font-bold">Your Action Savings Dashboard</h3>
            <p className="text-teal-100/90 text-xs max-w-xl">
              Check actions to commit to this month. Reductions are instantly accounted for in your virtual offset profile.
            </p>

            {/* Accessible Progress Indicator */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-mono font-medium text-teal-200">
                <span>Offset Goal Progress</span>
                <span>{progressPercent}% Complete ({completedCount}/10 actions)</span>
              </div>
              <div 
                className="w-full bg-teal-950/40 rounded-full h-2.5 overflow-hidden"
                role="progressbar"
                aria-valuenow={progressPercent}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="Progress bar tracking completion of carbon saving actions"
              >
                <div 
                  className="bg-emerald-400 h-full rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-teal-950/45 p-5 rounded-2xl flex flex-col justify-center items-center text-center border border-teal-800/25">
            <Award className="h-8 w-8 text-emerald-400 mb-1" />
            <span className="text-xs font-mono tracking-wider text-teal-300 uppercase">CO₂ REMOVED</span>
            <div className="flex items-baseline space-x-1 mt-1 font-display">
              <span className="text-3xl font-bold text-white transition-all duration-300">{currentSavings}</span>
              <span className="text-xs text-teal-300 font-medium">kg / year</span>
            </div>
            <p className="text-[10px] text-teal-100/75 mt-2">Potential savings out of {totalPotentialSavings} kg total.</p>
          </div>
        </div>
      </div>

      {/* Main Container leveraging High-Performance SINGLE event listener delegate */}
      <div 
        className="space-y-4" 
        onClick={handleContainerClick}
        aria-label="Actions list"
      >
        <div className="flex items-center justify-between px-1">
          <h4 className="font-display font-bold text-slate-800">10 High-Impact Individual Habits</h4>
          <span className="text-xs text-slate-400 font-mono">Sorted by leverage index</span>
        </div>

        {actions.map((act) => (
          <div
            key={act.id}
            data-action-id={act.id}
            tabIndex={0}
            onKeyDown={(e) => handleKeyDown(e, act.id)}
            role="checkbox"
            aria-checked={act.completed}
            aria-label={`${act.title}. Saves ${act.impact_co2_kg} kg annually. Difficulty: ${act.difficulty}`}
            className={`flex items-start justify-between p-5 border rounded-2xl cursor-pointer select-none transition-all duration-200 hover:border-slate-300 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${
              act.completed ? "bg-emerald-50/15 border-emerald-500/30" : "bg-white border-slate-100"
            }`}
          >
            <div className="flex items-start space-x-4">
              {/* Checkbox circle */}
              <div 
                className={`mt-1 flex-shrink-0 h-5 w-5 rounded-md border flex items-center justify-center transition-colors ${
                  act.completed ? "bg-emerald-600 border-emerald-600 text-white" : "bg-white border-slate-300"
                }`}
              >
                {act.completed && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-[10px] font-mono uppercase font-bold px-2 py-0.5 rounded-full ${
                    act.difficulty === "easy" 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-100" 
                      : "bg-blue-50 text-blue-700 border border-blue-100"
                  }`}>
                    {act.difficulty}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">&middot; {act.category}</span>
                </div>
                <h5 className={`font-semibold text-sm leading-tight ${act.completed ? "text-slate-900 line-through opacity-75" : "text-slate-900"}`}>
                  {act.title}
                </h5>
                <p className="text-xs text-slate-500 leading-normal max-w-2xl">
                  {act.description}
                </p>
              </div>
            </div>

            <div className="text-right flex-shrink-0 ml-4 font-mono">
              <span className={`text-sm font-bold block ${act.completed ? "text-emerald-600" : "text-slate-800"}`}>
                -{act.impact_co2_kg} kg
              </span>
              <span className="text-[10px] text-slate-400 font-mono block">co₂e / yr</span>
            </div>
          </div>
        ))}
      </div>

      <div className="p-4 bg-teal-50/35 border border-teal-100/50 rounded-xl flex items-start space-x-3 text-xs text-teal-800 leading-relaxed">
        <Flame className="h-5 w-5 text-teal-600 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Why this matters:</strong> According to the UNEP, individual behavioral adjustments can contribute over 20-30% of total climate emission avoidance needed globally. Small shifts trigger grid-level changes!
        </p>
      </div>
    </div>
  );
}
