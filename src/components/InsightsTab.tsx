/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AlertTriangle, Lightbulb, Compass, Award, ExternalLink } from "lucide-react";
import { InsightItem } from "../types";

interface InsightsTabProps {
  insights: InsightItem[];
  loading: boolean;
  totalAnnualTons: number;
}

export default function InsightsTab({ insights, loading, totalAnnualTons }: InsightsTabProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4" id="insights-loading">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500"></div>
        <p className="text-sm font-mono text-slate-500">Querying server for customized calculations insights...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="insights-tab-content">
      {/* Educational segment */}
      <div className="card-eco bg-emerald-50/10 border-emerald-500/10 flex flex-col md:flex-row gap-6 p-6 items-start">
        <div className="bg-emerald-100 text-emerald-800 p-3.5 rounded-2xl flex-shrink-0">
          <Compass className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-bold text-slate-900">Your Action Compass</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            These guidelines are derived from your active transport meters, dietary schedules, plane journeys, and home electricity volumes. Focus on resolving the major warning category first to maximize your conservation impacts.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between px-1">
          <h4 className="font-display font-bold text-slate-800">Direct Live Tailored Advice</h4>
          <span className="text-xs text-slate-400 font-mono">Analyzed on demand</span>
        </div>

        {insights.length === 0 ? (
          <div className="p-8 border-2 border-dashed border-slate-200 rounded-2xl text-center text-slate-500">
            <Lightbulb className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium">Please enter some usage details on the Calculator tab first to generate your initial dashboard recommendations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="insights-list-grid">
            {insights.map((ins, index) => {
              const isDominant = ins.type === "dominant_category";
              const isExcess = ins.type.startsWith("above_");
              const isSustainable = ins.type === "sustainable_hero";

              let themeClasses = "bg-white border-slate-100";
              let iconElement = <Lightbulb className="h-5 w-5 text-emerald-600" />;

              if (isDominant || isExcess) {
                themeClasses = "bg-rose-50/20 border-rose-500/15";
                iconElement = <AlertTriangle className="h-5 w-5 text-rose-600" />;
              } else if (isSustainable) {
                themeClasses = "bg-emerald-50/20 border-emerald-500/15";
                iconElement = <Award className="h-5 w-5 text-emerald-600 animate-bounce" />;
              }

              return (
                <div
                  key={index}
                  className={`border rounded-2xl p-6 flex items-start space-x-4 transition-all duration-200 hover:shadow-sm ${themeClasses}`}
                >
                  <div className={`p-2.5 rounded-xl flex-shrink-0 ${
                    isDominant || isExcess ? "bg-rose-100" : "bg-emerald-100"
                  }`}>
                    {iconElement}
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] uppercase font-mono tracking-widest text-slate-400 font-semibold block">
                      {ins.type.replace("_", " ").toUpperCase()}
                    </span>
                    <h5 className="font-semibold text-slate-900 text-sm leading-snug">
                      {ins.title}
                    </h5>
                    <p className="text-xs text-slate-500 leading-normal">
                      {ins.detail}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Helpful climate targets link */}
      <div className="border border-slate-200/60 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white" id="insights-carbon-disclosing">
        <div className="space-y-0.5">
          <p className="text-xs text-slate-400 font-mono">CONSERVATION INSIGHT BASELINE REFERENCES</p>
          <p className="text-sm text-slate-700 font-medium">Learn more about the United Nations Carbon Budgets & global temperature averages.</p>
        </div>
        <a
          href="https://www.unep.org/emissions-gap-report-2023"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center text-xs font-semibold text-emerald-600 hover:underline flex-shrink-0"
        >
          View UNEP Report <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
        </a>
      </div>
    </div>
  );
}
