import React from "react";
import { Gantry } from "../types";
import { MapPin, Users, Coins, Gauge } from "lucide-react";

interface GantryCardProps {
  key?: string | number;
  gantry: Gantry;
  onUpdateDensity: (gantryId: string, density: "low" | "medium" | "high" | "peak") => void;
}

export default function GantryCard({ gantry, onUpdateDensity }: GantryCardProps) {
  const densityColors = {
    low: { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/20" },
    medium: { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/20" },
    high: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
    peak: { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/20" }
  };

  const selectedColor = densityColors[gantry.currentDensity];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex flex-col justify-between transition-all hover:border-slate-700" id={`gantry-card-${gantry.id}`}>
      {/* Header Info */}
      <div className="p-5 border-b border-slate-800">
        <div className="flex items-start justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-500 uppercase font-medium bg-slate-850 px-2 py-0.5 rounded border border-slate-750">
              {gantry.id.toUpperCase()}
            </span>
            <h3 className="text-base font-semibold text-slate-100 mt-2 block tracking-tight">{gantry.name}</h3>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 font-mono block">Dynamic Fee Rate</span>
            <span className="text-2xl font-bold text-slate-100 block font-mono">
              {gantry.pricingMultiplier.toFixed(2)}x
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
          <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
          <span className="truncate">{gantry.location}</span>
        </div>
      </div>

      {/* Controller Area */}
      <div className="p-4 bg-slate-950/40 border-b border-slate-800">
        <label className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-medium">
          Set Simulated Traffic Density
        </label>
        <div className="grid grid-cols-4 gap-1.5" id={`density-selectors-${gantry.id}`}>
          {(["low", "medium", "high", "peak"] as const).map((density) => {
            const isActive = gantry.currentDensity === density;
            const btnColor = densityColors[density];
            return (
              <button
                key={density}
                onClick={() => onUpdateDensity(gantry.id, density)}
                className={`text-[10px] font-mono uppercase py-1.5 text-center font-medium rounded border transition-all ${
                  isActive
                    ? `${btnColor.bg} ${btnColor.border} ${btnColor.text}`
                    : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-850"
                }`}
                id={`btn-density-${gantry.id}-${density}`}
              >
                {density}
              </button>
            );
          })}
        </div>
      </div>

      {/* Internal specifications */}
      <div className="p-5 grid grid-cols-2 gap-4 text-xs font-mono" id={`density-stats-${gantry.id}`}>
        {/* Speed Limit & Lanes */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Gauge className="w-3.5 h-3.5 text-slate-500" />
            <span>Speed Limit:</span>
            <span className="text-slate-200 font-semibold">{gantry.baseSpeedLimit} mph</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-400">
            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
            <span>Active Lanes:</span>
            <span className="text-slate-200">{gantry.activeLanes} Lanes</span>
          </div>
        </div>

        {/* Totals cumulative */}
        <div className="space-y-2 text-right">
          <div className="flex items-center justify-end gap-1.5 text-slate-400">
            <span>Vehicles:</span>
            <span className="text-slate-200 font-semibold">{gantry.totalVehicles.toLocaleString()}</span>
          </div>
          <div className="flex items-center justify-end gap-1.5 text-slate-400">
            <span>Revenue:</span>
            <span className="text-emerald-400 font-semibold">${gantry.revenueCollected.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
