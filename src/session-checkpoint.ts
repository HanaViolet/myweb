export type Checkpoint = {
  version: 1;
  at: number;
  path: string;
  uid: string;
  mode: 'archive' | 'detail';
  tab: 'overview' | 'notes' | 'history';
  scroll: number;
};
export const CHECKPOINT_KEY = 'sakura-update-checkpoint';
export function parseCheckpoint(raw: string | null, path: string, now = Date.now()): Checkpoint | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    if (!value || value.version !== 1 || value.path !== path || typeof value.uid !== 'string' ||
      !Number.isFinite(value.at) || now - value.at > 600_000 || value.at > now ||
      !['archive', 'detail'].includes(value.mode) || !['overview', 'notes', 'history'].includes(value.tab) ||
      !Number.isFinite(value.scroll) || value.scroll < 0) return null;
    return value;
  } catch { return null; }
}
