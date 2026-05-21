import React from "react";
import { Gantry, Transaction } from "../types";
import { Coins, Car, ShieldAlert, Sun, CloudRain, CloudSnow, Wind, RefreshCw, Zap } from "lucide-react";

interface StatsSummaryProps {
  weather: "sunny" | "rainy" | "foggy" | "snowy";
  globalSurgeEnabled: boolean;
  gantries: Gantry[];
  transactions: Transaction[];
  onUpdateSettings: (weather: "sunny" | "rainy" | "foggy" | "snowy", globalSurgeEnabled: boolean) => void;
  onReset: () => void;
  isResetting: boolean;
}

export default function StatsSummary({
  weather,
  globalSurgeEnabled,
  gantries,
  transactions,
  onUpdateSettings,
  onReset,
  isResetting
}: StatsSummaryProps) {
  const totalRevenue = gantries.reduce((sum, g) => sum + g.revenueCollected, 0);
  const totalVehicles = gantries.reduce((sum, g) => sum + g.totalVehicles, 0);
  
  const anomaliesCount = transactions.filter(t => t.anomalyDetected).length;
  const anomalyRate = transactions.length > 0 ? (anomaliesCount / transactions.length) * 100 : 0;

  const weatherIcons = {
    sunny: <Sun className="w-5 h-5 text-amber-500" id="icon-weather-sunny" />,
    rainy: <CloudRain className="w-5 h-5 text-blue-500" id="icon-weather-rainy" />,
    foggy: <Wind className="w-5 h-5 text-slate-400" id="icon-weather-foggy" />,
    snowy: <CloudSnow className="w-5 h-5 text-sky-400" id="icon-weather-snowy" />
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6" id="stats-summary-container">
      {/* Total Revenue */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden" id="stat-revenue">
        <div className="absolute top-4 right-4 bg-emerald-500/10 p-2 rounded-lg">
          <Coins className="w-5 h-5 text-emerald-500" />
        </div>
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Toll Revenue</p>
        <p className="text-3xl font-semibold text-slate-100 mt-2">
          ${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span className="text-emerald-500 font-medium">Live audits active</span>
          <span>across all active lanes</span>
        </div>
      </div>

      {/* Traffic volume */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden" id="stat-volume">
        <div className="absolute top-4 right-4 bg-indigo-500/10 p-2 rounded-lg">
          <Car className="w-5 h-5 text-indigo-400" />
        </div>
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Total Vehicle Volume</p>
        <p className="text-3xl font-semibold text-slate-100 mt-2">{totalVehicles.toLocaleString()}</p>
        <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
          <span>Average rate:</span>
          <span className="font-mono text-indigo-400">{(totalVehicles / 24).toFixed(1)} transits / hour</span>
        </div>
      </div>

      {/* Anomaly Fraud Rate */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm relative overflow-hidden" id="stat-anomalies">
        <div className="absolute top-4 right-4 bg-rose-500/10 p-2 rounded-lg">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
        </div>
        <p className="text-xs font-mono uppercase tracking-wider text-slate-400">Security & Sizing Audits</p>
        <p className="text-3xl font-semibold text-slate-100 mt-2">
          {anomalyRate.toFixed(1)}%
        </p>
        <div className="mt-2 flex items-center gap-1 text-xs text-rose-400 font-medium">
          <span>{anomaliesCount} flagged compliance issues</span>
        </div>
      </div>

      {/* Ambient System Controllers */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col justify-between" id="stat-controllers">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">Global Environment</span>
          <button
            onClick={onReset}
            disabled={isResetting}
            className="text-xs bg-slate-800 hover:bg-slate-750 text-slate-300 font-mono px-2 py-1 rounded border border-slate-700 flex items-center gap-1 transition-all"
            id="reset-simulation-btn"
          >
            <RefreshCw className={`w-3 h-3 ${isResetting ? 'animate-spin' : ''}`} />
            RESET
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2" id="environment-switches">
          {/* Weather Selector */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Overlay Weather</label>
            <div className="relative">
              <select
                value={weather}
                onChange={(e) => onUpdateSettings(e.target.value as any, globalSurgeEnabled)}
                className="w-full text-xs bg-slate-800 border border-slate-705 text-slate-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer appearance-none pr-8"
                id="weather-select"
              >
                <option value="sunny">Sunny (1.0x)</option>
                <option value="rainy">Rainy (1.15x)</option>
                <option value="foggy">Foggy (1.25x)</option>
                <option value="snowy">Snowy (1.40x)</option>
              </select>
              <div className="absolute right-2 top-2 pointer-events-none">
                {weatherIcons[weather]}
              </div>
            </div>
          </div>

          {/* Surge Toggle */}
          <div>
            <label className="text-[10px] font-mono uppercase text-slate-400 block mb-1">Dynamic Surge</label>
            <button
              onClick={() => onUpdateSettings(weather, !globalSurgeEnabled)}
              className={`w-full text-xs font-medium px-2 py-1.5 rounded border transition-all flex items-center justify-center gap-1 ${
                globalSurgeEnabled
                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-300"
                  : "bg-slate-800 border-slate-705 text-slate-400"
              }`}
              id="surge-multiplier-toggle"
            >
              <Zap className={`w-3.5 h-3.5 ${globalSurgeEnabled ? "fill-indigo-400/20 text-indigo-300" : ""}`} />
              {globalSurgeEnabled ? "ACTIVE SURGE" : "FLAT RATES"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
