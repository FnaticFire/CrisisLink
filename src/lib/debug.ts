// ============================================================
// CrisisLink — Debug / Production Mode Toggle
// Set DEBUG = false for clean hackathon demo
// ============================================================

export const DEBUG = false;

export type ServiceStatus = 'ACTIVE' | 'FAILED' | 'PENDING';

export interface DebugState {
  gps: ServiceStatus;
  ai: ServiceStatus;
  apis: ServiceStatus;
  alertsThisSession: number;
  aiCallsThisSession: number;
}

// Session-scoped counters (reset on page reload)
let _state: DebugState = {
  gps: 'PENDING',
  ai: 'PENDING',
  apis: 'PENDING',
  alertsThisSession: 0,
  aiCallsThisSession: 0,
};

const _listeners: Set<() => void> = new Set();

export function getDebugState(): DebugState {
  return { ..._state };
}

export function setDebugField(field: Partial<DebugState>) {
  _state = { ..._state, ...field };
  _listeners.forEach((fn) => fn());
}

export function subscribeDebug(fn: () => void) {
  _listeners.add(fn);
  return () => _listeners.delete(fn);
}

// Rate limits
export const MAX_ALERTS_PER_SESSION = 3;
export const MAX_AI_CALLS_PER_SESSION = 10;

export function canTriggerAlert(): boolean {
  return _state.alertsThisSession < MAX_ALERTS_PER_SESSION;
}

export function canCallAI(): boolean {
  return _state.aiCallsThisSession < MAX_AI_CALLS_PER_SESSION;
}

export function incrementAlertCount() {
  _state.alertsThisSession += 1;
  _listeners.forEach((fn) => fn());
}

export function incrementAICount() {
  _state.aiCallsThisSession += 1;
  _listeners.forEach((fn) => fn());
}

export function debugLog(tag: string, ...args: any[]) {
  if (DEBUG) {
    console.log(`[CrisisLink:${tag}]`, ...args);
  }
}

export function debugError(tag: string, ...args: any[]) {
  console.error(`[CrisisLink:${tag}]`, ...args);
}
