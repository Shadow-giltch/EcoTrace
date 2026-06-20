/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Trophy, RefreshCw, Calendar, Flame, AlertCircle } from "lucide-react";
import { LeaderboardEntry } from "../types";

interface LeaderboardTabProps {
  entries: LeaderboardEntry[];
  currentUserName: string;
  loading: boolean;
  onRefresh: () => void;
}

export default function LeaderboardTab({
  entries,
  currentUserName,
  loading,
  onRefresh
}: LeaderboardTabProps) {
  return (
    <div className="space-y-8" id="leaderboard-tab-content">
      {/* Overview Card */}
      <div className="card-eco bg-indigo-50/20 border-indigo-100 flex flex-col md:flex-row gap-6 p-6 items-start">
        <div className="bg-indigo-100 text-indigo-800 p-3.5 rounded-2xl flex-shrink-0">
          <Trophy className="h-6 w-6" aria-hidden="true" />
        </div>
        <div className="space-y-1 flex-1">
          <h3 className="font-display text-lg font-bold text-slate-900">Eco-Challenge Standings</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            See how your footprint stacks against other eco-citizens in the community platform. Submit your calculation with your name, complete actions, and climb towards the planetary sustainable Paris target threshold (2.0t)!
          </p>
        </div>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex items-center text-xs font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/50 hover:bg-indigo-100/60 px-3 py-1.5 rounded-xl transition-all select-none disabled:opacity-50"
          aria-label="Refresh community leaderboard rankings"
        >
          <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Syncing..." : "Sync Standings"}
        </button>
      </div>

      <div className="card-eco p-0 overflow-hidden" id="leaderboard-table-card">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            <p className="text-sm font-mono text-slate-500">Syncing local and community rankings...</p>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-20 text-center text-slate-500 space-y-2">
            <AlertCircle className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-medium">No standings found right now.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse" role="table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs text-slate-400 font-mono tracking-wider">
                  <th className="py-4 px-6 w-16" scope="col">RANK</th>
                  <th className="py-4 px-6" scope="col">ECO CITIZEN DISPLAY NAME</th>
                  <th className="py-4 px-6 text-center" scope="col">ANNUAL RUNTIME CO₂</th>
                  <th className="py-4 px-6 text-center" scope="col">SAVINGS BONUS</th>
                  <th className="py-4 px-6" scope="col">SUBMISSION DATE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60">
                {entries.map((entry, idx) => {
                  const rank = idx + 1;
                  const isGold = rank === 1;
                  const isSilver = rank === 2;
                  const isBronze = rank === 3;
                  const isUser = entry.name.toLowerCase() === currentUserName.toLowerCase() && currentUserName.length > 0;

                  return (
                    <tr
                      key={entry.id}
                      role="row"
                      tabIndex={0}
                      className={`text-sm hover:bg-slate-50/50 transition-all select-none duration-150 outline-none focus-visible:bg-slate-50 ${
                        isUser ? "bg-emerald-50/15 font-semibold" : ""
                      }`}
                    >
                      <td className="py-4 px-6 font-mono font-medium text-slate-500">
                        {isGold ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-100 text-amber-700 text-xs font-bold ring-2 ring-amber-300/40">1</span>
                        ) : isSilver ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold ring-2 ring-slate-300/40">2</span>
                        ) : isBronze ? (
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-50 text-amber-800 text-xs font-bold ring-2 ring-amber-500/20">3</span>
                        ) : (
                          <span className="pl-1.5">{rank}</span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center space-x-2">
                          <span className="text-slate-950 font-medium">{entry.name}</span>
                          {isUser && (
                            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">YOU</span>
                          )}
                          {entry.footprint <= 2.0 && (
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-100 px-1.5 py-0.5 rounded-md font-medium">Paris sustainable</span>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`text-sm font-semibold ${entry.footprint <= 2.0 ? "text-emerald-700" : entry.footprint > 4.8 ? "text-rose-700" : "text-slate-800"}`}>
                          {entry.footprint.toFixed(1)}t
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono block">co₂e / yr</span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className="inline-flex items-center text-xs text-indigo-600 font-medium">
                          <Flame className="h-3.5 w-3.5 mr-1" /> Verified Saver
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-400 text-xs font-mono">
                        <span className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1.5 text-slate-300" />
                          {entry.date}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="p-4 bg-slate-50 border border-slate-200/40 rounded-xl text-center text-xs text-slate-400 font-mono" id="leaderboard-facts-disclosing">
        Community ranking is sorted automatically on heap node inserts. Sustainable footprints rank higher.
      </div>
    </div>
  );
}
