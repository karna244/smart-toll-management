import React, { useState } from "react";
import { Gantry, VehicleProfile } from "../types";
import { Play, Sparkles, AlertCircle, Car, ShieldCheck } from "lucide-react";

interface VehicleSimulatorProps {
  gantries: Gantry[];
  onTriggerTransit: (gantryId: string, profile: VehicleProfile) => Promise<void>;
  isProcessing: boolean;
}

const PRESETS: { name: string; description: string; profile: VehicleProfile }[] = [
  {
    name: "Classic Family Commuter",
    description: "Standard compliant SUV crossing to work.",
    profile: {
      licensePlate: "COMMUTE-1",
      vehicleModel: "Silver Toyota RAV4 Hybrid",
      axles: 2,
      weightLbs: 3750,
      speedMph: 63,
      registeredTo: "Patricia K. (Civilian Registry)"
    }
  },
  {
    name: "Speeding Sports Car",
    description: "Personal Ferrari flying past speed limit triggers dynamic penalty metrics.",
    profile: {
      licensePlate: "FAST-F88",
      vehicleModel: "Red Ferrari F8 Tributo",
      axles: 2,
      weightLbs: 3180,
      speedMph: 88,
      registeredTo: "Salvatore V. (Personal Registry)"
    }
  },
  {
    name: "Toll Evasion Transponder Hack (Class Spoofing)",
    description: "Heavy Freight Cargo tries to register as sedan Class 2 to cheat fees.",
    profile: {
      licensePlate: "SPOOF-C01",
      vehicleModel: "High Capacity Flatbed Commercial Truck",
      axles: 3,
      weightLbs: 16200,
      speedMph: 55,
      registeredTo: "Dishonest Logistics Corp (RFID tagged as: Honda Civic Class 2)"
    }
  },
  {
    name: "Stolen Luxury Flag Alert",
    description: "Active DMV Wanted database listing of reported stolen cargo.",
    profile: {
      licensePlate: "ALERT-777",
      vehicleModel: "Black Cadillac Escalade",
      axles: 2,
      weightLbs: 5850,
      speedMph: 72,
      registeredTo: "Reported Stolen (National Crime DB Flag #99X)"
    }
  },
  {
    name: "Active Paramedic Responder",
    description: "Siren-on Ambulance bypasses basic toll assessment regulations.",
    profile: {
      licensePlate: "MED-911",
      vehicleModel: "Chevy Express Ambulance Unit 14",
      axles: 2,
      weightLbs: 8900,
      speedMph: 76,
      registeredTo: "State Fire & Rescue Emergency Services"
    }
  },
  {
    name: "Chronic Outstanding Violator",
    description: "License plate matched to unpaid transponder debts.",
    profile: {
      licensePlate: "PAY-LATER",
      vehicleModel: "Dirty Honda Accord",
      axles: 2,
      weightLbs: 3200,
      speedMph: 62,
      registeredTo: "Toll Evasion Violations Registry (Outstanding Ref: $2540.50)"
    }
  }
];

export default function VehicleSimulator({ gantries, onTriggerTransit, isProcessing }: VehicleSimulatorProps) {
  const [selectedGantryId, setSelectedGantryId] = useState(gantries[0]?.id || "");
  const [formData, setFormData] = useState<VehicleProfile>({
    licensePlate: "COMMUTE-1",
    vehicleModel: "Silver Toyota RAV4 Hybrid",
    axles: 2,
    weightLbs: 3750,
    speedMph: 63,
    registeredTo: "Patricia K. (Civilian Registry)"
  });

  const handleApplyPreset = (preset: typeof PRESETS[0]) => {
    setFormData({ ...preset.profile });
  };

  const handleInputChange = (field: keyof VehicleProfile, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGantryId) return;
    onTriggerTransit(selectedGantryId, formData);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm" id="vehicle-simulator-container">
      <div className="flex items-center gap-2 pb-4 mb-4 border-b border-slate-800">
        <div className="bg-indigo-500/10 p-1.5 rounded-lg text-indigo-400">
          <Car className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-100">Simulate Vehicle Transit</h2>
          <p className="text-xs text-slate-400">Generate virtual transits audited in real-time by the Gemini Highway Guard.</p>
        </div>
      </div>

      {/* Preset Quick Selectors */}
      <div className="mb-5 overflow-hidden">
        <label className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-medium">
          Select Scenarios Block
        </label>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2" id="scenarios-grid">
          {PRESETS.map((preset, idx) => {
            const isCurrentlySelected = formData.licensePlate === preset.profile.licensePlate;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className={`text-left p-2.5 rounded-lg border text-xs transition-all relative ${
                  isCurrentlySelected
                    ? "bg-slate-850 border-indigo-500/50 text-slate-200"
                    : "bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-300"
                }`}
                id={`preset-btn-${idx}`}
              >
                <div className="font-semibold truncate pr-3">{preset.name}</div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{preset.description}</div>
                {isCurrentlySelected && (
                  <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono" id="simulation-config-form">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target Plaza Selector */}
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1 font-semibold">Toll Plaza Intersection</label>
            <select
              value={selectedGantryId}
              onChange={(e) => setSelectedGantryId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              id="selected-gantry-select"
            >
              {gantries.map(gt => (
                <option key={gt.id} value={gt.id}>{gt.name} (Cur. {gt.pricingMultiplier}x)</option>
              ))}
            </select>
          </div>

          {/* License Plate String */}
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1 font-semibold">License Plate Number</label>
            <input
              type="text"
              value={formData.licensePlate}
              onChange={(e) => handleInputChange("licensePlate", e.target.value.toUpperCase())}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded px-3 py-2 font-bold tracking-wider focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="E.g., FAST-F88"
              id="input-license-plate"
              required
            />
          </div>

          {/* Vehicle physical model */}
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1 font-semibold">Physical Vehicle Model</label>
            <input
              type="text"
              value={formData.vehicleModel}
              onChange={(e) => handleInputChange("vehicleModel", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Silver Tesla Model Y"
              id="input-vehicle-model"
              required
            />
          </div>

          {/* Axles count */}
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1 font-semibold">Axle Count (Wheel Sets)</label>
            <input
              type="number"
              min={2}
              max={8}
              value={formData.axles}
              onChange={(e) => handleInputChange("axles", parseInt(e.target.value) || 2)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="input-vehicle-axles"
              required
            />
          </div>

          {/* Weight in lbs */}
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1 font-semibold">Recorded Physical Weight (lbs)</label>
            <input
              type="number"
              min={100}
              max={120000}
              value={formData.weightLbs}
              onChange={(e) => handleInputChange("weightLbs", parseInt(e.target.value) || 3000)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="input-vehicle-weight"
              required
            />
          </div>

          {/* Transit speed in mph */}
          <div>
            <label className="text-[10px] uppercase text-slate-400 block mb-1 font-semibold">Recorded Speed (mph)</label>
            <input
              type="number"
              min={1}
              max={150}
              value={formData.speedMph}
              onChange={(e) => handleInputChange("speedMph", parseInt(e.target.value) || 60)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="input-vehicle-speed"
              required
            />
          </div>

          {/* Transponder RFID match / Registered Owner */}
          <div className="md:col-span-2">
            <label className="text-[10px] uppercase text-slate-400 block mb-1 font-semibold">DMV Transponder Registered Owner / Account Details</label>
            <input
              type="text"
              value={formData.registeredTo}
              onChange={(e) => handleInputChange("registeredTo", e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Company FLEET or Personal Registrate Reference"
              id="input-vehicle-registry"
              required
            />
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          disabled={isProcessing}
          className={`w-full py-3 px-4 font-semibold text-sm rounded-lg flex items-center justify-center gap-2 transition-all ${
            isProcessing
              ? "bg-indigo-600/50 text-slate-300 cursor-not-allowed cursor-wait"
              : "bg-indigo-500 hover:bg-indigo-600 text-slate-100 shadow-md shadow-indigo-500/10 active:scale-[0.99]"
          }`}
          id="simulate-submit-button"
        >
          {isProcessing ? (
            <>
              <div className="w-4 h-4 border-2 border-slate-200 border-t-transparent rounded-full animate-spin"></div>
              <span>Gemini Guard Auditing Vehicle Compliance...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Simulate Overhead Gate Transit</span>
              <Play className="w-3 h-3 ml-1 fill-current" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
