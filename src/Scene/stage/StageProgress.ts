export interface StageProgress {
  completedStageIds: number[];
  coins: number;
}

export interface StageCompletion extends StageProgress {
  reward: number;
  persisted: 'server' | 'device';
  saveError?: string;
}

function getPhpBaseUrl(): string {
  return (import.meta.env.VITE_PHP_BASE_URL ?? 'http://localhost/php/アプリケーション開発/application-Hanahaku/php').replace(/\/$/, '');
}

function localProgressKey(): string {
  let userKey = 'guest';
  try {
    const user = JSON.parse(localStorage.getItem('hanahakuCurrentUser') ?? 'null') as { id?: number | string } | null;
    if (user?.id !== undefined) userKey = String(user.id);
  } catch { /* Use the guest progress slot when the saved profile is unreadable. */ }
  return `hanahakuStageProgress:${userKey}`;
}

function readLocalProgress(): StageProgress {
  try {
    const saved = JSON.parse(localStorage.getItem(localProgressKey()) ?? 'null') as Partial<StageProgress> | null;
    return {
      completedStageIds: Array.isArray(saved?.completedStageIds)
        ? saved.completedStageIds.filter((id): id is number => Number.isInteger(id)) : [],
      coins: Number.isFinite(saved?.coins) ? Math.max(0, Number(saved?.coins)) : 0,
    };
  } catch { return { completedStageIds: [], coins: 0 }; }
}

function writeLocalProgress(progress: StageProgress): void {
  try { localStorage.setItem(localProgressKey(), JSON.stringify(progress)); } catch { /* Browser storage can be disabled. */ }
}

function parseProgress(value: unknown): StageProgress {
  if (typeof value !== 'object' || value === null || !('completedStageIds' in value) || !Array.isArray(value.completedStageIds) || !('coins' in value) || typeof value.coins !== 'number') {
    throw new Error('進行状況のデータを読み取れませんでした。');
  }
  return {
    completedStageIds: value.completedStageIds.filter((id): id is number => typeof id === 'number' && Number.isInteger(id)),
    coins: Math.max(0, value.coins),
  };
}

async function request(endpoint: 'progress' | 'complete', body: Record<string, number> = {}): Promise<unknown> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(`${getPhpBaseUrl()}/stage/${endpoint}.php`, {
      method: 'POST', credentials: 'include', cache: 'no-store', signal: controller.signal,
      headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const result: unknown = await response.json();
    if (!response.ok || typeof result !== 'object' || result === null || !('ok' in result) || result.ok !== true) {
      const message = typeof result === 'object' && result !== null && 'error' in result && typeof result.error === 'string'
        ? result.error : 'ステージの進行状況を保存できませんでした。';
      throw new Error(message);
    }
    return result;
  } finally { window.clearTimeout(timeout); }
}

export async function loadStageProgress(): Promise<StageProgress> {
  try {
    const result = await request('progress');
    if (typeof result !== 'object' || result === null || !('progress' in result)) throw new Error('進行状況のデータを読み取れませんでした。');
    const progress = parseProgress(result.progress);
    writeLocalProgress(progress);
    return progress;
  } catch { return readLocalProgress(); }
}

export async function completeStage(stageId: number, fallbackReward = 100): Promise<StageCompletion> {
  try {
    const result = await request('complete', { stageId });
    if (typeof result !== 'object' || result === null || !('progress' in result) || !('reward' in result) || typeof result.reward !== 'number') {
      throw new Error('クリア結果を保存できませんでした。');
    }
    const progress = parseProgress(result.progress);
    writeLocalProgress(progress);
    return { ...progress, reward: result.reward, persisted: 'server' };
  } catch (error) {
    const progress = readLocalProgress();
    const alreadyCleared = progress.completedStageIds.includes(stageId);
    const next: StageProgress = {
      completedStageIds: alreadyCleared ? progress.completedStageIds : [...progress.completedStageIds, stageId],
      coins: progress.coins + (alreadyCleared ? 0 : fallbackReward),
    };
    writeLocalProgress(next);
    return {
      ...next,
      reward: alreadyCleared ? 0 : fallbackReward,
      persisted: 'device',
      saveError: error instanceof Error ? error.message : 'サーバーに接続できませんでした。',
    };
  }
}
