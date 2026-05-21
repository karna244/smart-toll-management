import React, { useState, useEffect } from "react";
import { Gantry, Transaction, ClassRates, TollState, VehicleProfile } from "./types";
import StatsSummary from "./components/StatsSummary";
import GantryCard from "./components/GantryCard";
import VehicleSimulator from "./components/VehicleSimulator";
import TransactionList from "./components/TransactionList";
import AiAdvisor from "./components/AiAdvisor";
import { Gauge, ShieldCheck, HelpCircle, Activity, Scale, Sparkles, Server, Zap, Compass, RefreshCw } from "lucide-react";

export default function App() {
  const [state, setState] = useState<TollState | null>(null);
  const [loading, setLoading] = useState(true);
  const [isResetting, setIsResetting] = useState(false);
  const [isProcessingTransit, setIsProcessingTransit] = useState(false);
  const [isPaying, setIsPaying] = useState(false);
  const [advisorRefreshTrigger, setAdvisorRefreshTrigger] = useState(0);

  // Fetch initial toll road state
  const fetchState = async () => {
    try {
      const res = await fetch("/api/toll-state");
      const data = await res.json();
      setState(data);
    } catch (err) {
      console.error("Error fetching toll network state:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchState();
  }, []);

  // Update Global environmental variables
  const handleUpdateSettings = async (weather: "sunny" | "rainy" | "foggy" | "snowy", globalSurgeEnabled: boolean) => {
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weather, globalSurgeEnabled })
      });
      const data = await res.json();
      if (data.success) {
        setState(prev => prev ? {
          ...prev,
          weather: data.weather,
          globalSurgeEnabled: data.globalSurgeEnabled,
          gantries: data.gantries
        } : null);
        // Automatically nudge advisor to trigger recommendations on next schedule
        setAdvisorRefreshTrigger(p => p + 1);
      }
    } catch (err) {
      console.error("Error updating system settings:", err);
    }
  };

  // Update density profile on specific plaza
  const handleUpdateDensity = async (gantryId: string, density: "low" | "medium" | "high" | "peak") => {
    try {
      const res = await fetch("/api/gantry/density", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gantryId, density })
      });
      const data = await res.json();
      if (data.success) {
        setState(prev => prev ? {
          ...prev,
          gantries: data.gantries
        } : null);
        setAdvisorRefreshTrigger(p => p + 1);
      }
    } catch (err) {
      console.error("Error updating plaza density:", err);
    }
  };

  // Submit virtual simulated overhead camera transit for security audits
  const handleTriggerTransit = async (gantryId: string, profile: VehicleProfile) => {
    setIsProcessingTransit(true);
    try {
      const res = await fetch("/api/simulate-transit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gantryId, vehicleProfile: profile })
      });
      const data = await res.json();
      if (data.success) {
        // Redraw table
        setState(prev => {
          if (!prev) return null;
          // Append transaction to first position
          const updatedTxs = [data.transaction, ...prev.transactions];
          return {
            ...prev,
            gantries: data.gantries,
            transactions: updatedTxs
          };
        });
        setAdvisorRefreshTrigger(p => p + 1);
      }
    } catch (err) {
      console.error("Error generating simulated transit:", err);
    } finally {
      setIsProcessingTransit(false);
    }
  };

  // Simulate remote debit clearance on flagged transactions
  const handlePayToll = async (txId: string) => {
    setIsPaying(true);
    try {
      const res = await fetch("/api/pay-toll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txId })
      });
      const data = await res.json();
      if (data.success) {
        setState(prev => prev ? {
          ...prev,
          transactions: data.transactions
        } : null);
      }
    } catch (err) {
      console.error("Error simulating payment settlement:", err);
    } finally {
      setIsPaying(false);
    }
  };

  // Reset parameters back to clean baseline
  const handleResetSystem = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/reset", { method: "POST" });
      const data = await res.json();
      setState(data);
      setAdvisorRefreshTrigger(p => p + 1);
    } catch (err) {
      console.error("Error resetting system parameters:", err);
    } finally {
      setIsResetting(false);
    }
  };

  if (loading || !state) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-center p-6 gap-3" id="app-loading-screen">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        <h2 className="text-sm font-mono text-indigo-400 uppercase tracking-widest font-semibold">Initiating Highway 101 Smart Tollway Core...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" id="app-root-container">
      {/* Dynamic Security Notice Banner */}
      {state.transactions.some(t => t.auditFlag === "SECURITY_CRITICAL" && t.paymentStatus === "Flagged for Audit") && (
        <div className="bg-rose-900/80 border-b border-rose-800 text-rose-100 px-4 py-2.5 text-xs font-mono text-center flex items-center justify-center gap-2 animate-pulse" id="security-critical-banner">
          <span className="bg-rose-600 px-2 py-0.5 rounded font-bold">EMERGENCY PROTOCOL</span>
          <span>Stolen vehicle license plate or audit violation flagged. State Patrol Highway intercept operations dispatched!</span>
        </div>
      )}

      {/* Main Top Header Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/90 z-20 sticky top-0 backdrop-blur-md" id="main-header">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="bg-indigo-600/10 p-2 rounded-xl text-indigo-400 border border-indigo-500/10">
              <Compass className="w-5 h-5 text-indigo-400 fill-indigo-400/10" />
            </div>
            <div>
              <span className="text-[9px] font-mono font-bold tracking-widest text-indigo-450 block uppercase">Highway 101 Corridor</span>
              <h1 className="text-base font-bold text-slate-100 tracking-tight" id="app-title-name">Smart Toll Management</h1>
            </div>
          </div>

          <div className="flex items-center gap-4 font-mono text-xs">
            <div className="hidden sm:flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-400">
              <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              <span>OVERHEAD GANTRIES: ONLINE</span>
            </div>
            
            <button
              onClick={handleResetSystem}
              disabled={isResetting}
              className="bg-slate-900 hover:bg-slate-800 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-200 text-xs transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              Reset System
            </button>
          </div>
        </div>
      </header>

      {/* Primary Dashboard Content Layout Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6" id="dashboard-content">
        {/* Core Quick stats controllers (Atmospheric inputs + Volume indicators) */}
        <StatsSummary
          weather={state.weather}
          globalSurgeEnabled={state.globalSurgeEnabled}
          gantries={state.gantries}
          transactions={state.transactions}
          onUpdateSettings={handleUpdateSettings}
          onReset={handleResetSystem}
          isResetting={isResetting}
        />

        {/* Toll pricing rates reference index block */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl px-5 py-3.5 flex flex-wrap items-center justify-between gap-4" id="reference-pricing-block">
          <div className="flex items-center gap-2 text-xs">
            <Scale className="w-4 h-4 text-slate-450" />
            <span className="text-slate-400 font-mono text-[11px] uppercase tracking-wider font-semibold">Toll pricing reference baseline:</span>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-300">
            {Object.entries(state.classRates).map(([className, rate]) => (
              <div key={className} className="bg-slate-950/60 border border-slate-850 px-2.5 py-1 rounded">
                <span className="text-slate-500 font-sans mr-1">{className.split(" ")[1]}:</span>
                <span className="text-indigo-400 font-semibold">${Number(rate).toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bento Grid: Gantries and simulator controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="bento-grid-upper">
          {/* Active plazas segment displays */}
          <div className="lg:col-span-2 space-y-4" id="gantries-segment-box">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-100 font-mono uppercase tracking-wider">Overhead Plaza Segments</h2>
                <p className="text-[11px] text-slate-500">Configure simulated density to alter live pricing algorithms.</p>
              </div>
              <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-indigo-450" /> Live Dynamic Pricing Active
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="gantries-grid-container">
              {state.gantries.map((gantry) => (
                <GantryCard
                  key={gantry.id}
                  gantry={gantry}
                  onUpdateDensity={(gantryId, density) => { handleUpdateDensity(gantryId, density); }}
                />
              ))}
            </div>
          </div>

          {/* AI Advisor co-pilot pane */}
          <div className="space-y-4" id="ai-advisor-panel">
            <AiAdvisor
              weather={state.weather}
              globalSurgeEnabled={state.globalSurgeEnabled}
              onRefreshTrigger={advisorRefreshTrigger}
            />
          </div>
        </div>

        {/* Lower row: Transit Generator Simulation Panel + Live table snap */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6" id="bento-grid-lower">
          {/* Simulator control form */}
          <div className="xl:col-span-1" id="vehicle-generator-pane">
            <VehicleSimulator
              gantries={state.gantries}
              onTriggerTransit={handleTriggerTransit}
              isProcessing={isProcessingTransit}
            />
          </div>

          {/* Transaction database table snapshot logs */}
          <div className="xl:col-span-2" id="transaction-log-pane">
            <TransactionList
              transactions={state.transactions}
              onPayToll={handlePayToll}
              isPaying={isPaying}
            />
          </div>
        </div>
      </main>

      {/* Professional compliance system footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-xs text-slate-500 font-mono mt-12" id="system-footer">
        <div className="max-w-7xl mx-auto px-4 lg:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-500" />
            <span>Highway 101 Smart Expressway Network System • High-Contrast Slate Theme</span>
          </div>
          <div className="text-right">
            <span>Powered by @google/genai & Gemini-3.5-flash AI Auditor Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
