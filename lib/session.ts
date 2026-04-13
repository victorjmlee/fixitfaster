/** Unified session state — persisted in sessionStorage, seeded from URL params. */

const SESSION_KEY = "fixitfaster-session";

export type SessionState = {
  participantName?: string;
  codespaceId?: string;
  launched?: boolean;
  launchedAt?: number;
};

export function getSession(): SessionState {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function updateSession(patch: Partial<SessionState>): SessionState {
  const current = getSession();
  const next = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    if (v != null && v !== "") {
      (next as Record<string, unknown>)[k] = v;
    }
  }
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

/** Seed session from URL search params. Returns merged state. */
export function seedFromParams(params: URLSearchParams): SessionState {
  const patch: Partial<SessionState> = {};
  const name = params.get("participantName")?.trim();
  const cs = params.get("codespace")?.trim();
  if (name) patch.participantName = name;
  if (cs && cs !== "true") patch.codespaceId = cs;
  return updateSession(patch);
}
