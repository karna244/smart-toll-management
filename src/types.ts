export interface Gantry {
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

export type AuditFlag = 
  | "PASS" 
  | "WARNING_MISMATCH" 
  | "SECURITY_CRITICAL" 
  | "EMERGENCY_BYPASS" 
  | "VIOLATION_SPEED";

export interface Transaction {
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
  classifiedAs: string;
  isClassMatched: boolean;
  baseToll: number;
  dynamicSurcharges: number;
  totalToll: number;
  anomalyDetected: boolean;
  auditFlag: AuditFlag;
  narrativeReasoning: string;
  paymentStatus: "Paid" | "Pending Auto-Debit" | "Flagged for Audit" | "Exempt";
  securityAlert?: string;
}

export interface ClassRates {
  [key: string]: number;
}

export interface TollState {
  weather: "sunny" | "rainy" | "foggy" | "snowy";
  globalSurgeEnabled: boolean;
  gantries: Gantry[];
  transactions: Transaction[];
  classRates: ClassRates;
}

export interface VehicleProfile {
  licensePlate: string;
  vehicleModel: string;
  axles: number;
  weightLbs: number;
  speedMph: number;
  registeredTo: string;
}
