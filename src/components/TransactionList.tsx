import React, { useState } from "react";
import { Transaction } from "../types";
import { Search, ShieldAlert, BadgeInfo, CheckCircle, AlertTriangle, Scale, Eye, Activity, CreditCard, Clock } from "lucide-react";

interface TransactionListProps {
  transactions: Transaction[];
  onPayToll: (txId: string) => void;
  isPaying: boolean;
}

export default function TransactionList({ transactions, onPayToll, isPaying }: TransactionListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<"ALL" | "PASS" | "MISMATCH" | "SPEEDING" | "ALERT">("ALL");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  // Status badges mapping
  const auditBadges = {
    PASS: { bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", label: "PASS" },
    WARNING_MISMATCH: { bg: "bg-amber-500/10 text-amber-300 border-amber-500/20", label: "CLASS MISMATCH" },
    SECURITY_CRITICAL: { bg: "bg-rose-500/15 text-rose-400 border-rose-500/30 font-bold", label: "CRITICAL ALERT" },
    EMERGENCY_BYPASS: { bg: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20", label: "EMERGENCY BYPASS" },
    VIOLATION_SPEED: { bg: "bg-orange-500/10 text-orange-400 border-orange-500/20", label: "SPEED VIOLATION" }
  };

  // Filter & Search Logic
  const filtered = transactions.filter(tx => {
    const matchesSearch = 
      tx.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.registeredTo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.gantryName.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === "ALL") return true;
    if (filterType === "PASS") return tx.auditFlag === "PASS" || tx.auditFlag === "EMERGENCY_BYPASS";
    if (filterType === "MISMATCH") return tx.auditFlag === "WARNING_MISMATCH";
    if (filterType === "SPEEDING") return tx.auditFlag === "VIOLATION_SPEED";
    if (filterType === "ALERT") return tx.auditFlag === "SECURITY_CRITICAL";
    return true;
  });

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm" id="transaction-list-container">
      {/* List Header */}
      <div className="p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-1.5">
            <Activity className="w-5 h-5 text-indigo-400" />
            Live Audit Stream & Transits Log
          </h2>
          <p className="text-xs text-slate-400">Overhead camera transponder snapshots audited dynamically via Gemini Highway Guard.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2" id="filter-selectors">
          {(["ALL", "PASS", "MISMATCH", "SPEEDING", "ALERT"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilterType(f)}
              className={`text-[10px] font-mono px-2.5 py-1.5 rounded-md border font-medium transition-all ${
                filterType === f
                  ? "bg-slate-800 text-indigo-300 border-indigo-500/35"
                  : "bg-slate-950/40 text-slate-400 border-slate-850 hover:text-slate-350"
              }`}
            >
              {f === "MISMATCH" ? "MISMATCHES" : f === "ALERT" ? "CRITICALS" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Query Bar */}
      <div className="bg-slate-950/30 px-5 py-3 border-b border-slate-800 flex items-center gap-3">
        <Search className="w-4 h-4 text-slate-500 shrink-0" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter logs by license plate, model description, registered driver..."
          className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder-slate-500"
          id="search-input-field"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="text-[10px] text-slate-400 hover:text-slate-200 bg-slate-800 px-1.5 py-0.5 rounded"
          >
            Clear
          </button>
        )}
      </div>

      {/* Grid Table */}
      <div className="overflow-x-auto min-w-full">
        <table className="w-full text-xs text-left" id="audit-table">
          <thead>
            <tr className="bg-slate-950/40 text-[10px] font-mono uppercase tracking-wider text-slate-500 border-b border-slate-800">
              <th className="px-5 py-3">Timestamp / Plate</th>
              <th className="px-5 py-3">Gantry Plaza</th>
              <th className="px-5 py-3">Physical Stats vs DMV</th>
              <th className="px-5 py-3">Calculated Fees</th>
              <th className="px-5 py-3">Audit Flags</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-20 text-center text-slate-500">
                  <BadgeInfo className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <span>No matching toll transactions found on this segment limit.</span>
                </td>
              </tr>
            ) : (
              filtered.map((tx) => {
                const badge = auditBadges[tx.auditFlag] || auditBadges.PASS;
                return (
                  <tr key={tx.id} className="hover:bg-slate-850/30 transition-all">
                    {/* Timestamp / Plate */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] bg-slate-800 px-2 py-0.5 border border-slate-700 rounded text-amber-400 font-bold block tracking-wider">
                          {tx.licensePlate}
                        </span>
                        {tx.isClassMatched ? (
                          <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full" title="Class Verification match"></span>
                        ) : (
                          <span className="inline-block w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping" title="Unmatched Class designation"></span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1.5">
                        <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                        {new Date(tx.timestamp).toLocaleTimeString(undefined, { hour: "numeric", minute: "numeric", second: "numeric" })}
                      </div>
                    </td>

                    {/* Gantry Segment */}
                    <td className="px-5 py-4">
                      <span className="text-slate-300 font-sans block truncate max-w-[180px]">{tx.gantryName}</span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[180px] mt-0.5">{tx.registeredTo}</span>
                    </td>

                    {/* Sensor Data Summary */}
                    <td className="px-5 py-4 space-y-0.5">
                      <div className="text-slate-300 font-sans block truncate max-w-[190px]">
                        {tx.vehicleModel}
                      </div>
                      <div className="text-[10px] text-slate-500 block">
                        Speed: <span className={tx.speedMph > 70 ? "text-orange-400 font-semibold" : "text-slate-400"}>{tx.speedMph} mph</span>
                        <span className="mx-1">•</span>
                        Scale: <span className="text-slate-400">{tx.weightLbs.toLocaleString()} lbs ({tx.axles} Axles)</span>
                      </div>
                    </td>

                    {/* Costing calculation */}
                    <td className="px-5 py-4">
                      <div className="text-slate-100 font-bold">
                        ${tx.totalToll.toFixed(2)}
                      </div>
                      <div className="text-[9px] text-slate-500 mt-0.5">
                        Base: ${tx.baseToll.toFixed(1)} / Surge: ${tx.dynamicSurcharges.toFixed(1)}
                      </div>
                    </td>

                    {/* Audit Badges */}
                    <td className="px-5 py-4">
                      <span className={`text-[9px] px-2 py-0.5 rounded border ${badge.bg}`}>
                        {badge.label}
                      </span>
                      {tx.anomalyDetected && (
                        <div className="text-[8px] text-rose-400 mt-1 flex items-center gap-0.5 font-sans">
                          <AlertTriangle className="w-2.5 h-2.5 shrink-0" /> Match Check: FAILED
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Auto-Debit pay simulator */}
                        {tx.paymentStatus !== "Paid" && tx.paymentStatus !== "Exempt" && (
                          <button
                            onClick={() => onPayToll(tx.id)}
                            className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 px-2 py-1 rounded text-[10px] transition-all flex items-center gap-1"
                          >
                            <CreditCard className="w-3 h-3" />
                            PAY
                          </button>
                        )}
                        {tx.paymentStatus === "Paid" && (
                          <span className="text-[10px] text-emerald-500 font-sans">✓ Paid</span>
                        )}
                        {tx.paymentStatus === "Exempt" && (
                          <span className="text-[10px] text-indigo-400 font-sans">Exempt</span>
                        )}

                        {/* Audit Log reasoning trigger */}
                        <button
                          onClick={() => setSelectedTx(tx)}
                          className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 px-2.5 py-1 rounded text-[10px] transition-all flex items-center gap-1"
                          id={`audit-details-btn-${tx.id}`}
                        >
                          <Eye className="w-3 h-3" />
                          AUDIT REPORT
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL DETAILED AUDIT REPORT */}
      {selectedTx && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="audit-details-modal">
          <div className="bg-slate-900 border border-slate-850 rounded-2xl w-full max-w-xl shadow-2xl relative overflow-hidden">
            {/* Header branding */}
            <div className="bg-slate-950 p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-500/10 p-1.5 rounded-lg text-indigo-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">OVERHEAD SNAPSHOT AUDIT REPORT</h3>
                  <p className="text-[10px] font-mono text-indigo-400">TX REFERENCE: #{selectedTx.id}</p>
                </div>
              </div>

              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${auditBadges[selectedTx.auditFlag]?.bg || ""}`}>
                {auditBadges[selectedTx.auditFlag]?.label || "VALID"}
              </span>
            </div>

            {/* Core Snapshot parameters */}
            <div className="p-6 space-y-4 max-h-[500px] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-850 font-mono text-xs">
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Overhead Plaza Segment</span>
                  <span className="text-slate-300 font-sans block">{selectedTx.gantryName}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Owner / Account Entity</span>
                  <span className="text-slate-300 font-sans block">{selectedTx.registeredTo}</span>
                </div>
                <hr className="col-span-2 border-slate-800" />
                
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Snapshot Plate</span>
                  <span className="text-amber-400 font-bold block">{selectedTx.licensePlate}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Physical Model Detected</span>
                  <span className="text-slate-200 font-sans block">{selectedTx.vehicleModel}</span>
                </div>
                <hr className="col-span-2 border-slate-800" />

                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Sensor Weight Snap</span>
                  <span className="text-slate-300 block">{selectedTx.weightLbs.toLocaleString()} lbs</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Overhead Axles Count</span>
                  <span className="text-slate-300 block">{selectedTx.axles} Axles</span>
                </div>
                <hr className="col-span-2 border-slate-800" />

                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Toll Class Classification</span>
                  <span className="text-indigo-400 font-semibold block">{selectedTx.classifiedAs}</span>
                </div>
                <div>
                  <span className="text-slate-500 block uppercase text-[10px]">Speed Recorded</span>
                  <span className={`font-semibold block ${selectedTx.speedMph > 70 ? "text-orange-400 font-mono" : "text-slate-300"}`}>{selectedTx.speedMph} mph</span>
                </div>
              </div>

              {/* Alert Status Callout */}
              {selectedTx.securityAlert && (
                <div className="bg-rose-500/10 border border-rose-500/35 p-3 rounded-lg text-rose-300 text-xs">
                  <div className="flex gap-1.5 font-sans font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    🚨 DMV LAW ENFORCEMENT CALLOUT
                  </div>
                  <p className="text-[11px] font-mono mt-1 text-rose-450">{selectedTx.securityAlert}</p>
                </div>
              )}

              {/* Dynamic Costing Breakdown */}
              <div className="bg-slate-950/20 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
                <h4 className="text-[10px] uppercase text-slate-400 font-bold tracking-wider">Toll Pricing Calculation Model</h4>
                <div className="flex justify-between">
                  <span className="text-slate-400">Unified Base Fee Rate:</span>
                  <span className="text-slate-200 font-semibold">${selectedTx.baseToll.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dynamic Environmental Surge / Friction:</span>
                  <span className="text-slate-200 font-semibold">+${selectedTx.dynamicSurcharges.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between text-base font-bold text-slate-100">
                  <span>Gross Adjusted Toll:</span>
                  <span className="text-emerald-400">${selectedTx.totalToll.toFixed(2)}</span>
                </div>
              </div>

              {/* Gemini Narrative Auditing Reasoning */}
              <div className="space-y-1.5">
                <h4 className="text-[10px] font-mono uppercase text-slate-400 font-bold tracking-wider">Gemini Guardian Auditor Narrative</h4>
                <div className="bg-slate-950 rounded-xl border border-slate-850 p-4 font-mono text-xs leading-relaxed text-slate-300 whitespace-pre-line">
                  {selectedTx.narrativeReasoning}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-950 p-4 border-t border-slate-850 flex items-center justify-end gap-3">
              <span className="text-[10px] font-mono text-slate-500 mr-auto">Audited: {new Date(selectedTx.timestamp).toLocaleString()}</span>
              <button
                onClick={() => setSelectedTx(null)}
                className="bg-slate-800 border border-slate-700 hover:bg-slate-755 text-slate-200 rounded-lg text-xs px-4 py-2 font-mono"
                id="close-audit-modal-btn"
              >
                CLOSE REPORT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
