import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI SDK
// API key is handled securely server-side.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Middleware for parsing JSON
app.use(express.json());

// In-Memory Database State
interface Gantry {
  id: string;
  name: string;
  location: string;
  baseSpeedLimit: number;
  currentDensity: "low" | "medium" | "high" | "peak";
  pricingMultiplier: number;
  activeLanes: number;
  totalVehicles: number;
  revenueCollected: number;
}

interface Transaction {
  id: string;
  timestamp: string;
  gantryId: string;
  gantryName: string;
  licensePlate: string;
  vehicleModel: string;
  axles: number;
  weightLbs: number;
  speedMph: number;
  registeredTo: string;
  // AI Audited Fields
  classifiedAs: string;
  isClassMatched: boolean;
  baseToll: number;
  dynamicSurcharges: number;
  totalToll: number;
  anomalyDetected: boolean;
  auditFlag: "PASS" | "WARNING_MISMATCH" | "SECURITY_CRITICAL" | "EMERGENCY_BYPASS" | "VIOLATION_SPEED";
  narrativeReasoning: string;
  paymentStatus: "Paid" | "Pending Auto-Debit" | "Flagged for Audit" | "Exempt";
  securityAlert?: string;
}

// Default Base configuration
const DEFAULT_CLASS_RATES = {
  "Class 1 (Motorcycle)": 1.50,
  "Class 2 (Passenger Car)": 4.00,
  "Class 3 (Light Utility/SUV)": 6.00,
  "Class 4 (Heavy Commercial Truck)": 11.00,
  "Class 5 (Multi-axle Freight)": 16.00
};

// Simulated State
let state = {
  weather: "sunny" as "sunny" | "rainy" | "foggy" | "snowy",
  globalSurgeEnabled: true,
  gantries: [
    {
      id: "gantry-01",
      name: "AM-01 Metroway Gantry",
      location: "North Metropolitan Expressway, Mile 14.5",
      baseSpeedLimit: 65,
      currentDensity: "high",
      pricingMultiplier: 1.75,
      activeLanes: 4,
      totalVehicles: 1240,
      revenueCollected: 8940.50
    },
    {
      id: "gantry-02",
      name: "DT-02 Skyway Suspension",
      location: "Downtown Hub Bridge, Plaza Entrance",
      baseSpeedLimit: 55,
      currentDensity: "peak",
      pricingMultiplier: 2.50,
      activeLanes: 3,
      totalVehicles: 2480,
      revenueCollected: 24650.00
    },
    {
      id: "gantry-03",
      name: "HB-03 Subsea dual-tube",
      location: "Harbor Crossing Tunnel, North Port",
      baseSpeedLimit: 50,
      currentDensity: "medium",
      pricingMultiplier: 1.25,
      activeLanes: 2,
      totalVehicles: 850,
      revenueCollected: 5125.00
    },
    {
      id: "gantry-04",
      name: "CR-04 Coastal Bypass",
      location: "Coastal Scenic Spur, Loop Mile 9",
      baseSpeedLimit: 70,
      currentDensity: "low",
      pricingMultiplier: 1.00,
      activeLanes: 2,
      totalVehicles: 410,
      revenueCollected: 1640.00
    }
  ] as Gantry[],
  transactions: [
    {
      id: "tx-init-1",
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      gantryId: "gantry-02",
      gantryName: "DT-02 Skyway Suspension",
      licensePlate: "FAST-F88",
      vehicleModel: "Ferrari F8 Tributo (Red)",
      axles: 2,
      weightLbs: 3180,
      speedMph: 84,
      registeredTo: "Salvatore V. (Personal Registry)",
      classifiedAs: "Class 2 (Passenger Car)",
      isClassMatched: true,
      baseToll: 4.00,
      dynamicSurcharges: 6.00,
      totalToll: 10.00,
      anomalyDetected: true,
      auditFlag: "VIOLATION_SPEED",
      narrativeReasoning: "• Vehicle classified perfectly as lightweight passenger model Class 2. \n• Base Toll is $4.00 multiplied by current Skyway Peak Surge (2.5x). \n• SPEED LIMIT EXCEEDED: Logged transient speed is 84 mph under a 55 mph zone. Automated safety penalty notice attached to toll invoice.",
      paymentStatus: "Paid"
    },
    {
      id: "tx-init-2",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      gantryId: "gantry-01",
      gantryName: "AM-01 Metroway Gantry",
      licensePlate: "SPOOF-C01",
      vehicleModel: "Gray Heavy Flatbed Carrier (Claiming Civic Class)",
      axles: 3,
      weightLbs: 15400,
      speedMph: 55,
      registeredTo: "TollAvoid Inc. (Registered as Honda Civic)",
      classifiedAs: "Class 3 (Light Utility/SUV)",
      isClassMatched: false,
      baseToll: 6.00,
      dynamicSurcharges: 4.50,
      totalToll: 10.50,
      anomalyDetected: true,
      auditFlag: "WARNING_MISMATCH",
      narrativeReasoning: "• CRITICAL CLASS MISMATCH: Vehicle transponder registered as flat rate Honda Civic (Class 2), but physical scales detected 15,400 lbs weight and 3 axles. \n• Re-classified correctly as Class 3 Cargo Carrier. \n• System generated active Audit Alert, updating carrier billing account for fraud review.",
      paymentStatus: "Flagged for Audit"
    },
    {
      id: "tx-init-3",
      timestamp: new Date(Date.now() - 32 * 60 * 1000).toISOString(),
      gantryId: "gantry-03",
      gantryName: "HB-03 Subsea dual-tube",
      licensePlate: "CARGO-99",
      vehicleModel: "Freightliner Multi-Axle Carrier",
      axles: 5,
      weightLbs: 58200,
      speedMph: 48,
      registeredTo: "National Logistics Fleet #99",
      classifiedAs: "Class 5 (Multi-axle Freight)",
      isClassMatched: true,
      baseToll: 16.00,
      dynamicSurcharges: 4.00,
      totalToll: 20.00,
      anomalyDetected: false,
      auditFlag: "PASS",
      narrativeReasoning: "• Legitimate class registration matched. Correctly validated as commercial Class 5. \n• Toll calculation: Base rate ($16.00) plus harbor subsea density surge (1.25x multiplier = +$4.00).\n• Speed and weight within normal parameters.",
      paymentStatus: "Pending Auto-Debit"
    },
    {
      id: "tx-init-4",
      timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
      gantryId: "gantry-02",
      gantryName: "DT-02 Skyway Suspension",
      licensePlate: "ALERT-777",
      vehicleModel: "Cadillac Escalade",
      axles: 2,
      weightLbs: 5850,
      speedMph: 53,
      registeredTo: "Reported Stolen (DMV database match #A-99B)",
      classifiedAs: "Class 2 (Passenger Car)",
      isClassMatched: true,
      baseToll: 4.00,
      dynamicSurcharges: 6.00,
      totalToll: 10.00,
      anomalyDetected: true,
      auditFlag: "SECURITY_CRITICAL",
      narrativeReasoning: "• Stolen vehicle record matched for license plate ALERT-777. \n• Transited DT-02 Skyway Bridge at 15:26 UTC heading downtown. \n• Direct GPS coordinates dispatched to State Highway Patrol. Automatic license status escalated.",
      paymentStatus: "Flagged for Audit",
      securityAlert: "ACTIVE DMV STOLEN ALERT: Local highway patrol units dispatched to Downtown Skyway egress."
    },
    {
      id: "tx-init-5",
      timestamp: new Date(Date.now() - 65 * 60 * 1000).toISOString(),
      gantryId: "gantry-04",
      gantryName: "CR-04 Coastal Bypass",
      licensePlate: "MED-911",
      vehicleModel: "Emergency Mercedes Medical Ambulance",
      axles: 2,
      weightLbs: 8840,
      speedMph: 78,
      registeredTo: "County Health Services EMT Team",
      classifiedAs: "Class 3 (Light Utility/SUV)",
      isClassMatched: true,
      baseToll: 0.00,
      dynamicSurcharges: 0.00,
      totalToll: 0.00,
      anomalyDetected: false,
      auditFlag: "EMERGENCY_BYPASS",
      narrativeReasoning: "• Standard Class-3 emergency vehicle with authorized flashers and active beacon detected. \n• Toll Road regulations define active emergency responder transits as fully exempt from base fees and surcharges.",
      paymentStatus: "Exempt"
    }
  ] as Transaction[]
};

// Calculate pricing multipliers helper
function recalculateMultipliers() {
  const densityFactors = { low: 1.0, medium: 1.25, high: 1.75, peak: 2.50 };
  const weatherFactors = { sunny: 1.0, rainy: 1.15, foggy: 1.25, snowy: 1.40 };

  state.gantries = state.gantries.map(gt => {
    let rawMult = densityFactors[gt.currentDensity] || 1.0;
    if (state.globalSurgeEnabled) {
      const weatherMult = weatherFactors[state.weather] || 1.0;
      rawMult = rawMult * weatherMult;
    }
    // Round to two decimals
    return {
      ...gt,
      pricingMultiplier: Math.round(rawMult * 100) / 100
    };
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// 1. Get system state & configuration
app.get("/api/toll-state", (req, res) => {
  res.json({
    weather: state.weather,
    globalSurgeEnabled: state.globalSurgeEnabled,
    gantries: state.gantries,
    transactions: state.transactions,
    classRates: DEFAULT_CLASS_RATES
  });
});

// 2. Update environmental and pricing multipliers
app.post("/api/settings", (req, res) => {
  const { weather, globalSurgeEnabled } = req.body;
  if (weather) {
    state.weather = weather;
  }
  if (typeof globalSurgeEnabled === "boolean") {
    state.globalSurgeEnabled = globalSurgeEnabled;
  }
  recalculateMultipliers();
  res.json({ success: true, weather: state.weather, globalSurgeEnabled: state.globalSurgeEnabled, gantries: state.gantries });
});

// 3. Update single gantry simulated density
app.post("/api/gantry/density", (req, res) => {
  const { gantryId, density } = req.body;
  const gantry = state.gantries.find(g => g.id === gantryId);
  if (!gantry) {
    return res.status(404).json({ error: "Gantry not found." });
  }
  if (["low", "medium", "high", "peak"].includes(density)) {
    gantry.currentDensity = density as any;
  }
  recalculateMultipliers();
  res.json({ success: true, gantries: state.gantries });
});

// 4. Simulate payment of a toll
app.post("/api/pay-toll", (req, res) => {
  const { txId } = req.body;
  const tx = state.transactions.find(t => t.id === txId);
  if (!tx) {
    return res.status(404).json({ error: "Transaction not found." });
  }
  tx.paymentStatus = "Paid";
  res.json({ success: true, transactions: state.transactions });
});

// 5. Reset mock state
app.post("/api/reset", (req, res) => {
  state.weather = "sunny";
  state.globalSurgeEnabled = true;
  state.gantries = [
    {
      id: "gantry-01",
      name: "AM-01 Metroway Gantry",
      location: "North Metropolitan Expressway, Mile 14.5",
      baseSpeedLimit: 65,
      currentDensity: "high",
      pricingMultiplier: 1.75,
      activeLanes: 4,
      totalVehicles: 1240,
      revenueCollected: 8940.50
    },
    {
      id: "gantry-02",
      name: "DT-02 Skyway Suspension",
      location: "Downtown Hub Bridge, Plaza Entrance",
      baseSpeedLimit: 55,
      currentDensity: "peak",
      pricingMultiplier: 2.50,
      activeLanes: 3,
      totalVehicles: 2480,
      revenueCollected: 24650.00
    },
    {
      id: "gantry-03",
      name: "HB-03 Subsea dual-tube",
      location: "Harbor Crossing Tunnel, North Port",
      baseSpeedLimit: 50,
      currentDensity: "medium",
      pricingMultiplier: 1.25,
      activeLanes: 2,
      totalVehicles: 850,
      revenueCollected: 5125.00
    },
    {
      id: "gantry-04",
      name: "CR-04 Coastal Bypass",
      location: "Coastal Scenic Spur, Loop Mile 9",
      baseSpeedLimit: 70,
      currentDensity: "low",
      pricingMultiplier: 1.00,
      activeLanes: 2,
      totalVehicles: 410,
      revenueCollected: 1640.00
    }
  ];
  state.transactions = [
    {
      id: "tx-init-1",
      timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
      gantryId: "gantry-02",
      gantryName: "DT-02 Skyway Suspension",
      licensePlate: "FAST-F88",
      vehicleModel: "Ferrari F8 Tributo (Red)",
      axles: 2,
      weightLbs: 3180,
      speedMph: 84,
      registeredTo: "Salvatore V. (Personal Registry)",
      classifiedAs: "Class 2 (Passenger Car)",
      isClassMatched: true,
      baseToll: 4.00,
      dynamicSurcharges: 6.00,
      totalToll: 10.00,
      anomalyDetected: true,
      auditFlag: "VIOLATION_SPEED",
      narrativeReasoning: "• Vehicle classified perfectly as lightweight passenger model Class 2. \n• Base Toll is $4.00 multiplied by current Skyway Peak Surge (2.5x). \n• SPEED LIMIT EXCEEDED: Logged transient speed is 84 mph under a 55 mph zone. Automated safety penalty notice attached to toll invoice.",
      paymentStatus: "Paid"
    },
    {
      id: "tx-init-2",
      timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      gantryId: "gantry-01",
      gantryName: "AM-01 Metroway Gantry",
      licensePlate: "SPOOF-C01",
      vehicleModel: "Gray Heavy Flatbed Carrier (Claiming Civic Class)",
      axles: 3,
      weightLbs: 15400,
      speedMph: 55,
      registeredTo: "TollAvoid Inc. (Registered as Honda Civic)",
      classifiedAs: "Class 3 (Light Utility/SUV)",
      isClassMatched: false,
      baseToll: 6.00,
      dynamicSurcharges: 4.50,
      totalToll: 10.50,
      anomalyDetected: true,
      auditFlag: "WARNING_MISMATCH",
      narrativeReasoning: "• CRITICAL CLASS MISMATCH: Vehicle transponder registered as flat rate Honda Civic (Class 2), but physical scales detected 15,400 lbs weight and 3 axles. \n• Re-classified correctly as Class 3 Cargo Carrier. \n• System generated active Audit Alert, updating carrier billing account for fraud review.",
      paymentStatus: "Flagged for Audit"
    }
  ];
  recalculateMultipliers();
  res.json({ success: true, ...state, classRates: DEFAULT_CLASS_RATES });
});

// 6. Gemini-powered dynamic toll transaction auditing and plate processing
app.post("/api/simulate-transit", async (req, res) => {
  const { gantryId, vehicleProfile } = req.body;
  
  const gantry = state.gantries.find(g => g.id === gantryId);
  if (!gantry) {
    return res.status(404).json({ error: "Gantry target not specified." });
  }

  // Extract simulated attributes based on chosen profiles
  const licensePlate = vehicleProfile.licensePlate || "RAND-123";
  const vehicleModel = vehicleProfile.vehicleModel || "Compact sedan";
  const axles = vehicleProfile.axles || 2;
  const weightLbs = vehicleProfile.weightLbs || 3100;
  const speedMph = vehicleProfile.speedMph || 62;
  const registeredTo = vehicleProfile.registeredTo || "Standard Registrant";

  console.log(`Auditing transit for ${licensePlate} (${vehicleModel}) at ${gantry.name}`);

  // Construct context package for the Gemini Prompt
  const dynamicMultiplier = gantry.pricingMultiplier;
  const systemWeather = state.weather;
  const speedLimit = gantry.baseSpeedLimit;

  // Let's create an elegant audit evaluation request utilizing gemini-3.5-flash
  try {
    const prompt = `
      You are the core AI supervisor engine of a state-of-the-art Smart Toll Highway Network.
      Analyze the physical sensor logs, DMV registration records, and expressway conditions to determine the appropriate vehicle toll rate, verify legal class classification compliance, detect speeds or weight violations, and spot security flags.

      [Expressway Conditions]
      - Gantry Station Name: ${gantry.name} (Location: ${gantry.location})
      - Commute Traffic Density: ${gantry.currentDensity} (Calculated pricing surge multiplier: ${dynamicMultiplier}x)
      - Current Weather: ${systemWeather} (Generates high friction penalty offsets if wet/snow)
      - Speed Limit: ${speedLimit} mph

      [Sensor Detection Logs]
      - License Plate: "${licensePlate}"
      - Physical Vehicle Shape/Model: "${vehicleModel}"
      - Physical Axles: ${axles}
      - Physical Weight scale response: ${weightLbs} lbs
      - Recorded speed overhead: ${speedMph} mph

      [DMV Transponder Registry Record]
      - Owner Name / Fleet Registration: "${registeredTo}"

      [Legal Reference Toll Rate Sheet (Class base prices)]:
      - Class 1 (Motorcycle): $1.50
      - Class 2 (Passenger Car): $4.00
      - Class 3 (Light Utility/SUV): $6.00
      - Class 4 (Heavy Commercial Truck): $11.00
      - Class 5 (Multi-axle Freight): $16.00

      [DMV Alerts Database Lookup]
      - Plated license "ALERT-777" is reported actively STOLEN. Generate a severe safety emergency alarm immediately!
      - Plated license "PAY-LATER" is registered to an outstanding system violator with unpaid transponder toll debts of $2,500. Flag for mandatory manual audit review.
      - Plated license begins or ends with "MED" or "COP" represents official state responders. Classify them, but set 'totalToll' and 'baseToll' directly to 0.00 and flag 'EMERGENCY_BYPASS'.
      - Plate starting with "SPOOF" contains structural Class Mismatch cheating (vehicle is physically a heavy class but transponder registers as class 2 sedan to dodge payments). Mark isClassMatched: false, alert system.

      [Task Instructions]
      Perform compliance check:
      - Class designation verification: Check if weight and axle configuration complies with standard class norms.
      - Safe commuter check: Evaluate speed. If speedMph is > speedLimit + 5, trigger warning.
      - Dynamic Toll calculation formula: (Base Price of correct certified class) * Dynamic Multiplier Surge. Show standard formulas.
      Provide the structured assessment in the requested JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the Smart Toll Highway AI Auditor. Return high-integrity, completely realistic structured data validating toll pricing with absolute compliance auditing precision.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            classifiedAs: {
              type: Type.STRING,
              description: "E.g. 'Class 2 (Passenger Car)' or appropriate Class 1-5"
            },
            isClassMatched: {
              type: Type.BOOLEAN,
              description: "False if transponder data registered model differs physically from heavy logs, or if license flag 'SPOOF' is tracked. Else true."
            },
            baseToll: {
              type: Type.NUMBER,
              description: "Rate of the verified class from reference sheet."
            },
            dynamicSurcharges: {
              type: Type.NUMBER,
              description: "Calculated surge amount (Base Price * (multiplier - 1)) plus weather friction offset if weather rain/snow"
            },
            totalToll: {
              type: Type.NUMBER,
              description: "Final sum toll amount in USD. 0 for emergency vehicles."
            },
            anomalyDetected: {
              type: Type.BOOLEAN,
              description: "True if ticket warrants security flag, spoof flag, speed penalty (> speedLimit + 10), or DMV alert."
            },
            auditFlag: {
              type: Type.STRING,
              description: "One of: PASS, WARNING_MISMATCH, SECURITY_CRITICAL, EMERGENCY_BYPASS, VIOLATION_SPEED"
            },
            narrativeReasoning: {
              type: Type.STRING,
              description: "Summarized audit log explanation using bullet points. Explain pricing breakups and safe driver score."
            },
            securityAlert: {
              type: Type.STRING,
              description: "Alert details if outstanding violator or active stolen vehicle pattern triggered, or empty string."
            }
          },
          required: [
            "classifiedAs",
            "isClassMatched",
            "baseToll",
            "dynamicSurcharges",
            "totalToll",
            "anomalyDetected",
            "auditFlag",
            "narrativeReasoning"
          ]
        }
      }
    });

    const resultText = response.text.trim();
    const parsedAudit = JSON.parse(resultText);

    // Formulate a new transaction object
    const newTx: Transaction = {
      id: "tx-" + Math.floor(100000 + Math.random() * 900000),
      timestamp: new Date().toISOString(),
      gantryId,
      gantryName: gantry.name,
      licensePlate,
      vehicleModel,
      axles,
      weightLbs,
      speedMph,
      registeredTo,
      classifiedAs: parsedAudit.classifiedAs,
      isClassMatched: parsedAudit.isClassMatched,
      baseToll: Number(parsedAudit.baseToll.toFixed(2)),
      dynamicSurcharges: Number(parsedAudit.dynamicSurcharges.toFixed(2)),
      totalToll: Number(parsedAudit.totalToll.toFixed(2)),
      anomalyDetected: parsedAudit.anomalyDetected,
      auditFlag: parsedAudit.auditFlag || "PASS",
      narrativeReasoning: parsedAudit.narrativeReasoning,
      paymentStatus: parsedAudit.auditFlag === "SECURITY_CRITICAL" || parsedAudit.auditFlag === "WARNING_MISMATCH"
        ? "Flagged for Audit"
        : parsedAudit.auditFlag === "EMERGENCY_BYPASS" ? "Exempt" : "Pending Auto-Debit",
      securityAlert: parsedAudit.securityAlert
    };

    // Update state stats
    state.transactions.unshift(newTx);
    gantry.totalVehicles += 1;
    gantry.revenueCollected += newTx.totalToll;

    res.json({ success: true, transaction: newTx, gantries: state.gantries });
  } catch (error) {
    console.error("Gemini AI API failure:", error);
    // Fallback static processing to ensure robust system operation
    const baseToll = DEFAULT_CLASS_RATES["Class 2 (Passenger Car)"];
    const dynamicSurcharges = baseToll * (dynamicMultiplier - 1);
    const totalToll = baseToll + dynamicSurcharges;

    const fallbackTx: Transaction = {
      id: "tx-fallback-" + Date.now(),
      timestamp: new Date().toISOString(),
      gantryId,
      gantryName: gantry.name,
      licensePlate,
      vehicleModel,
      axles,
      weightLbs,
      speedMph,
      registeredTo,
      classifiedAs: "Class 2 (Passenger Car)",
      isClassMatched: true,
      baseToll,
      dynamicSurcharges,
      totalToll,
      anomalyDetected: speedMph > gantry.baseSpeedLimit,
      auditFlag: speedMph > gantry.baseSpeedLimit ? "VIOLATION_SPEED" : "PASS",
      narrativeReasoning: "• Toll calculation routed to Local Core System (Fallback Mode). \n• dynamic surges configured at " + dynamicMultiplier + "x multiplier. \n• No DMV anomaly flag checked.",
      paymentStatus: "Pending Auto-Debit"
    };

    state.transactions.unshift(fallbackTx);
    gantry.totalVehicles += 1;
    gantry.revenueCollected += fallbackTx.totalToll;

    res.json({ success: true, transaction: fallbackTx, gantries: state.gantries, warning: "Fell back to standard algorithm due to API limit or configuration." });
  }
});

// 7. Dynamic pricing optimization audit recommendations (AI Advisor)
app.post("/api/ai-advisor", async (req, res) => {
  const systemStateString = JSON.stringify({
    weather: state.weather,
    gantries: state.gantries,
    totalRevenue: state.gantries.reduce((acc, g) => acc + g.revenueCollected, 0),
    totalVehicles: state.gantries.reduce((acc, g) => acc + g.totalVehicles, 0),
    recentAnomalies: state.transactions.filter(t => t.anomalyDetected).slice(0, 5)
  });

  try {
    const prompt = `
      You are the Principal AI Network Advisor for our Smart Toll system of Highway 101 Commute.
      Review our dynamic parameters, revenue streams, and congestion bottle-necks listed below:

      [Live Toll Network State]
      ${systemStateString}

      Generatively formulate a highly executive summary advisory (in concise, markdown format) outlining:
      1. **Congestion hotspots & Dynamic Pricing multi-tier recommendation**: Evaluate which plaza is over-burdened and define recommended dynamic multiplier shifts.
      2. **Weather Safety Advisory**: High friction speed limit overrides based on environmental status: Weather condition inside system is "${state.weather}".
      3. **Strategic revenue & compliance audit audit summaries**: Highlighting vehicle discrepancies or security risks seen in anomalous tags.
      4. **Smart Lane Actions**: Concrete suggestions (e.g. open/close specific express lanes, enforce speed mitigation cameras, or dispatch enforcement patrol).

      Be crisp, actionable, bold, and modern, using professional transit analyst style.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are the chief Smart Highway Advisor, writing technical transit intelligence briefings.",
      }
    });

    res.json({ success: true, advice: response.text });
  } catch (error) {
    console.error("Advisory API failure:", error);
    res.json({
      success: false,
      advice: `### System Transit Bulletin
      
*AI Transit recommendation engine is currently standardizing queues. Summary metrics indicate successful commuter balancing across all express tunnels.*
* **Congestion Multiplier Target**: Hold Skyway Bridge pricing at 2.50x to encourage bypass lane routing.
* **Friction Safety Caution**: Active weather overrides applied. Drive safely.`
    });
  }
});

// ----------------------------------------------------
// DEVELOPMENT & PRODUCTION SERVING PIPELINE
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    // Vite middleware for lightning-fast preview reloading
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve production bundle
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Smart Toll Road Express backend hot-started on http://localhost:${PORT}`);
  });
}

startServer();
