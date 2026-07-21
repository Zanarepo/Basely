export type ActionResponse<T = any> = 
  | { ok: true; data?: T }
  | { ok: false; error: string }
