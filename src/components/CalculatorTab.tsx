/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { Car, Lightbulb, Utensils, Plane, User, CheckCircle2 } from "lucide-react";
import { CalculationInput } from "../types";

interface CalculatorTabProps {
  initialValues: CalculationInput;
  userName: string;
  onValuesChangeDebounced: (values: CalculationInput & { user_name?: string }) => void;
}

export default function CalculatorTab({
  initialValues,
  userName,
  onValuesChangeDebounced
}: CalculatorTabProps) {
  // Local state for instantaneous slider drag performance
  const [localValues, setLocalValues] = useState<CalculationInput>(initialValues);
  const [localName, setLocalName] = useState<string>(userName);
  const [isSaved, setIsSaved] = useState(false);

  // Maintain a ref to the latest callback to avoid cycle triggers
  const callbackRef = useRef(onValuesChangeDebounced);
  useEffect(() => {
    callbackRef.current = onValuesChangeDebounced;
  }, [onValuesChangeDebounced]);

  // Debounced parent trigger whenever localValues change
  useEffect(() => {
    const handler = setTimeout(() => {
      callbackRef.current({ ...localValues, user_name: localName });
    }, 280); // Strict debounce range 250-300ms!

    return () => clearTimeout(handler);
  }, [localValues, localName]);

  const handleSliderChange = (field: keyof CalculationInput, val: number) => {
    setLocalValues(prev => ({
      ...prev,
      [field]: val
    }));
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalName(e.target.value);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  return (
    <div className="space-y-8" id="calculator-tab-content">
      {/* Profiler header */}
      <div className="card-eco bg-slate-50 border-slate-200/60 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-100 text-emerald-800 p-2.5 rounded-xl">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-display font-bold text-slate-800">Your Eco Profile Name</h4>
            <p className="text-xs text-slate-500">Your profile name enables you to rank on the Community Leaderboard.</p>
          </div>
        </div>
        <div className="relative flex items-center max-w-xs w-full">
          <input
            id="user-profile-name-input"
            type="text"
            placeholder="Aarav Sharma"
            value={localName}
            onChange={handleNameChange}
            maxLength={25}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-medium text-slate-700"
            aria-label="Enter your profile display name for the leaderboard"
          />
          {isSaved && (
            <span className="absolute right-3 flex items-center text-emerald-600 text-[10px] font-mono font-medium animate-fade-in" aria-live="polite">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Auto-saved
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Section A: Transport Commuting */}
        <section className="card-eco space-y-6" aria-labelledby="heading-transport">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
              <Car className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 id="heading-transport" className="font-display font-bold text-lg text-slate-900">Transportation Footprint</h3>
          </div>

          {/* Daily Km commuting */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <label htmlFor="input-transport-km" className="text-slate-700">Daily Commute Distance</label>
              <span className="font-mono text-blue-600 font-bold">{localValues.transport_km_daily} km</span>
            </div>
            <input
              id="input-transport-km"
              type="range"
              min="0"
              max="500"
              step="5"
              value={localValues.transport_km_daily}
              onChange={(e) => handleSliderChange("transport_km_daily", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[10px] text-slate-400 block font-mono">Range: 0 - 500 km per day</span>
          </div>

          {/* Days week */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <label htmlFor="input-transport-days" className="text-slate-700">Days Travelled Per Week</label>
              <span className="font-mono text-blue-600 font-bold">{localValues.transport_days_week} days</span>
            </div>
            <input
              id="input-transport-days"
              type="range"
              min="0"
              max="7"
              step="1"
              value={localValues.transport_days_week}
              onChange={(e) => handleSliderChange("transport_days_week", parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[10px] text-slate-400 block font-mono">Range: 0 - 7 days weekly</span>
          </div>

          {/* Fuel efficiency */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <label htmlFor="input-fuel-eff" className="text-slate-700">Vehicle Fuel Efficiency</label>
              <span className="font-mono text-blue-600 font-bold">{localValues.fuel_efficiency} km/L</span>
            </div>
            <input
              id="input-fuel-eff"
              type="range"
              min="4"
              max="25"
              step="0.5"
              value={localValues.fuel_efficiency}
              onChange={(e) => handleSliderChange("fuel_efficiency", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <span className="text-[10px] text-slate-400 block font-mono">Range: 4 - 25 kilometers per liter</span>
          </div>
        </section>

        {/* Section B: Home Electricity/LPG Energy */}
        <section className="card-eco space-y-6" aria-labelledby="heading-energy">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="bg-amber-50 text-amber-600 p-2 rounded-lg">
              <Lightbulb className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 id="heading-energy" className="font-display font-bold text-lg text-slate-900">Residential Energy</h3>
          </div>

          {/* Monthly Electricity kWh */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <label htmlFor="input-electricity" className="text-slate-700">Monthly Power Usage</label>
              <span className="font-mono text-amber-600 font-bold">{localValues.electricity_kwh_month} kWh</span>
            </div>
            <input
              id="input-electricity"
              type="range"
              min="0"
              max="2000"
              step="10"
              value={localValues.electricity_kwh_month}
              onChange={(e) => handleSliderChange("electricity_kwh_month", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-[10px] text-slate-400 block font-mono">Range: 0 - 2000 kilowatt-hours</span>
          </div>

          {/* Monthly Cylinder LPG */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <label htmlFor="input-lpg" className="text-slate-700">Monthly Cooking LPG usage</label>
              <span className="font-mono text-amber-600 font-bold">{localValues.lpg_kg_month} kg</span>
            </div>
            <input
              id="input-lpg"
              type="range"
              min="0"
              max="100"
              step="1"
              value={localValues.lpg_kg_month}
              onChange={(e) => handleSliderChange("lpg_kg_month", parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <span className="text-[10px] text-slate-400 block font-mono">Range: 0 - 100 kilograms</span>
          </div>
        </section>

        {/* Section C: Food/Dairy Diet */}
        <section className="card-eco space-y-6" aria-labelledby="heading-diet">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="bg-emerald-50 text-emerald-600 p-2 rounded-lg">
              <Utensils className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 id="heading-diet" className="font-display font-bold text-lg text-slate-900">Dietary Profile</h3>
          </div>

          {/* Weekly Meat Meals */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <label htmlFor="input-meat" className="text-slate-700">Meat-Based Meals</label>
              <span className="font-mono text-emerald-600 font-bold">{localValues.meat_meals_week} meals/week</span>
            </div>
            <input
              id="input-meat"
              type="range"
              min="0"
              max="21"
              step="1"
              value={localValues.meat_meals_week}
              onChange={(e) => handleSliderChange("meat_meals_week", parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <span className="text-[10px] text-slate-400 block font-mono">Range: 0 - 21 meat meals per week</span>
          </div>

          {/* Daily Dairy Servings */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <label htmlFor="input-dairy" className="text-slate-700">Daily Dairy Servings</label>
              <span className="font-mono text-emerald-600 font-bold">{localValues.dairy_servings_day} servings/day</span>
            </div>
            <input
              id="input-dairy"
              type="range"
              min="0"
              max="10"
              step="1"
              value={localValues.dairy_servings_day}
              onChange={(e) => handleSliderChange("dairy_servings_day", parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <span className="text-[10px] text-slate-400 block font-mono">Range: 0 - 10 daily glasses / servings</span>
          </div>
        </section>

        {/* Section D: Flights */}
        <section className="card-eco space-y-6" aria-labelledby="heading-flights">
          <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
            <div className="bg-purple-50 text-purple-600 p-2 rounded-lg">
              <Plane className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 id="heading-flights" className="font-display font-bold text-lg text-slate-900">Aviation & Flights</h3>
          </div>

          {/* Short Flights Year */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <label htmlFor="input-short-flights" className="text-slate-700">Short Flights (&lt;3 hrs)</label>
              <span className="font-mono text-purple-600 font-bold">{localValues.short_flights_year} flights/year</span>
            </div>
            <input
              id="input-short-flights"
              type="range"
              min="0"
              max="50"
              step="1"
              value={localValues.short_flights_year}
              onChange={(e) => handleSliderChange("short_flights_year", parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <span className="text-[10px] text-slate-400 block font-mono">Range: 0 - 50 flights each year</span>
          </div>

          {/* Long Flights Year */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium">
              <label htmlFor="input-long-flights" className="text-slate-700">Long Flights (&gt;3 hrs)</label>
              <span className="font-mono text-purple-600 font-bold">{localValues.long_flights_year} flights/year</span>
            </div>
            <input
              id="input-long-flights"
              type="range"
              min="0"
              max="20"
              step="1"
              value={localValues.long_flights_year}
              onChange={(e) => handleSliderChange("long_flights_year", parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            />
            <span className="text-[10px] text-slate-400 block font-mono">Range: 0 - 20 flights each year</span>
          </div>
        </section>
      </div>

      <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
        <span>* Sliders are dynamically debounced to prevent rendering hiccups and throttling.</span>
        <span className="font-semibold text-emerald-600">Calculated on exit</span>
      </div>
    </div>
  );
}
