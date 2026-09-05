export type ActionResponse = 
  | { ok: true } 
  | { ok: false; error: string }
  | { ok: false; error: 'QUALITY_GATE_REQUIRED'; qualityStandards: any[]; category: string }
export type CreateWbsResult = { ok: true; id: string } | { ok: false; error: string }
