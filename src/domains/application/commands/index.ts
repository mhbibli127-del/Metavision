/**
 * Application commands — CQRS write side (scaffold).
 * Migrate domain mutations from src/lib/db/* incrementally.
 */
export type CommandResult<T = unknown> = { ok: true; data: T } | { ok: false; error: string };

export async function dispatchCommand(_name: string, _payload: unknown): Promise<CommandResult> {
  return { ok: false, error: "Command bus not wired — use lib/db handlers" };
}
