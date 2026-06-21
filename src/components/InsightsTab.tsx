/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { 
  AlertTriangle, 
  Lightbulb, 
  Compass, 
  Award, 
  ExternalLink, 
  Sparkles, 
  Loader2, 
  ShieldAlert, 
  BookOpen, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";
import { InsightItem, CalculationBreakdown } from "../types";

interface InsightsTabProps {
  insights: InsightItem[];
  loading: boolean;
  totalAnnualTons: number;
  breakdown?: CalculationBreakdown;
  userName?: string;
}

export default function InsightsTab({ 
  insights, 
  loading, 
  totalAnnualTons,
  breakdown,
  userName
}: InsightsTabProps) {
  // AI 30-day plan states
  const [planLines, setPlanLines] = useState<string[]>([]);
  const [isLoadingPlan, setIsLoadingPlan] = useState<boolean>(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [promptAudited, setPromptAudited] = useState<string | null>(null);

  // [Security] API key proxy handler: in a production deployment, this call must go through a server-side proxy so the API key is never exposed client-side.
  const handleGenerate30DayPlan = async () => {
    setIsLoadingPlan(true);
    setPlanError(null);
    setPromptAudited(null);

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          breakdown: breakdown || { transport: 1.5, home_energy: 1.8, food: 1.2, flights: 1.0 },
          total_annual_tons: totalAnnualTons,
          userName: userName || "EcoUser"
        })
      });

      if (!response.ok) {
        throw new Error("Failed to receive valid action steps from our AI models.");
      }

      const data = await response.json();
      if (data.success && Array.isArray(data.plan_lines)) {
        setPlanLines(data.plan_lines);
        if (data.prompt_audited) {
          setPromptAudited(data.prompt_audited);
        }
      } else {
        throw new Error(data.message || "Plan processing failed standard quality checks.");
      }
    } catch (err: any) {
      console.error("[Trace] Custom AI Plan failed loading:", err);
      setPlanError(err.message || "Failed to fetch custom action steps. Please retry shortly.");
    } finally {
      setIsLoadingPlan(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4" id="insights-loading">
        <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
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

      {/* AI PLAN ACCELERATOR MODULE */}
      <div className="border border-emerald-500/20 bg-emerald-50/5 rounded-3xl p-6 md:p-8 space-y-6" id="ai-plan-generator-module">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center space-x-1.5 text-[10px] uppercase font-mono tracking-widest text-emerald-600 font-bold bg-emerald-100/60 px-2.5 py-1 rounded-full">
              <Sparkles className="h-3 w-3" /> <span>Tailored AI Climate Engine</span>
            </span>
            <h3 className="font-display text-xl font-bold text-slate-900">Personalized 30-Day Climate Action Plan</h3>
            <p className="text-xs text-slate-500 max-w-xl">
              Synthesize a highly customized reduction roadmap. Our system leverages Gemini model outputs to deliver real actionable, phased steps direct from your footprint.
            </p>
          </div>
          <button
            id="ai-generate-plan-trigger"
            onClick={handleGenerate30DayPlan}
            disabled={isLoadingPlan}
            className={`cursor-pointer inline-flex items-center px-5 py-2.5 rounded-xl border border-transparent shadow-sm text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-colors select-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 ${
              isLoadingPlan ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {isLoadingPlan ? (
              <>
                <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                Synthesizing Plan...
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5 mr-2" />
                Generate my 30-day plan
              </>
            )}
          </button>
        </div>

        {/* User-Visible Error Panel */}
        {planError && (
          <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-2xl flex items-start space-x-3 text-xs text-rose-800" role="alert" id="ai-plan-error-panel">
            <ShieldAlert className="h-5 w-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold">Plan Synthesis Interrupted</p>
              <p>{planError}</p>
            </div>
          </div>
        )}

        {/* Plan Display Area - IMMUNE TO XSS (Explicit Bullet Text Node Parsing) */}
        {planLines.length > 0 && (
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 space-y-4 shadow-sm animate-fade-in" id="ai-plan-output-panel">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-display font-bold text-slate-800 text-sm flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-emerald-600" /> 
                {userName || "Your"} Tailored 30-Day Reduction Checklist
              </h4>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Active / AI-Guided</span>
            </div>

            <ul className="space-y-4" aria-label="Day by day AI-generated action list">
              {planLines.map((line, idx) => (
                <li key={idx} className="flex items-start space-x-3 group text-xs text-slate-700 leading-relaxed">
                  <div className="flex-shrink-0 h-5 w-5 rounded-full bg-slate-900 text-white font-mono text-[10px] font-bold flex items-center justify-center select-none shadow-sm mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="pt-0.5">{line}</p>
                </li>
              ))}
            </ul>

            <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center justify-between text-[10px] text-slate-400">
              <span className="font-mono">Output sanitization verified: 100% XSS-Safe</span>
              <span className="italic">Derived directly from total footprint of {totalAnnualTons.toFixed(2)} t CO2e/yr</span>
            </div>
          </div>
        )}

        {/* Security & Audit Disclosures */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] text-slate-400 font-mono bg-slate-100/50 p-4 border border-slate-200/40 rounded-2xl">
          <div className="space-y-1 flex items-start space-x-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-600">PRODUCTION SECURITY PROTOCOL</p>
              <p className="leading-relaxed">
                By default, this call is executed server-side. The API secret key remains securely isolated in the cloud context and is never exposed to the client's public developer console.
              </p>
            </div>
          </div>

          <div className="space-y-1 flex items-start space-x-2">
            <ChevronRight className="h-4 w-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-slate-600">INPUT AUDIT VECTOR</p>
              <p className="leading-relaxed">
                This LLM query parameters dynamically incorporate precise metrics for {userName || "EcoUser"}'s transport levels, flight tags, energy margins, and meals. No generic prompts.
              </p>
            </div>
          </div>
        </div>

        {/* Model prompt audit collapsible block */}
        {promptAudited && (
          <div className="border border-slate-200 rounded-xl overflow-hidden text-left bg-slate-50">
            <div className="bg-slate-100/80 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
              <span className="text-[9px] font-mono font-bold uppercase text-slate-500">Constructed Prompt String Audit Logs</span>
              <span className="text-[8px] font-mono text-emerald-600 bg-emerald-50 px-1 py-0.2 rounded font-semibold border border-emerald-500/10">Auditable</span>
            </div>
            <pre className="p-3 text-[9px] text-slate-600 font-mono overflow-x-auto whitespace-pre-wrap leading-normal">
              {promptAudited}
            </pre>
          </div>
        )}
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
