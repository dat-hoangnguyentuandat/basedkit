import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const DEFAULT_REPOSITORY = 'dat-hoangnguyentuandat/basekit';
const DEFAULT_REF = 'main';
const CACHE_TTL_MS = 15 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 3500;

async function readJson(file, fallback = null) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function validRepository(value) {
  return /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(value);
}

export async function checkForUpdate({
  sourceRoot,
  fetchImpl = globalThis.fetch,
  force = false,
  now = Date.now(),
  cacheTtlMs = CACHE_TTL_MS,
  timeoutMs = REQUEST_TIMEOUT_MS,
} = {}) {
  const releaseFile = path.join(sourceRoot, '.basekit-release.json');
  const release = await readJson(releaseFile, {
    repository: DEFAULT_REPOSITORY,
    ref: DEFAULT_REF,
    installedCommit: null,
    version: null,
  });
  const repository = validRepository(release.repository) ? release.repository : DEFAULT_REPOSITORY;
  const ref = release.ref || DEFAULT_REF;
  const cacheFile = path.join(path.dirname(sourceRoot), '.update-cache.json');
  const cache = await readJson(cacheFile);
  if (!force && cache && cache.repository === repository && cache.ref === ref && now - cache.checkedAt < cacheTtlMs) {
    return { ...cache, release, cached: true };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(
      `https://api.github.com/repos/${repository}/commits/${encodeURIComponent(ref)}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
          'User-Agent': 'basekit-launcher',
        },
        signal: controller.signal,
      },
    );
    if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status}`);
    const data = await response.json();
    if (!/^[a-f0-9]{40}$/i.test(data.sha || '')) throw new Error('GitHub returned an invalid commit SHA');
    const result = {
      repository,
      ref,
      installedCommit: release.installedCommit || null,
      latestCommit: data.sha,
      status: release.installedCommit
        ? (release.installedCommit === data.sha ? 'current' : 'available')
        : 'unknown',
      checkedAt: now,
      error: null,
    };
    try {
      await writeFile(cacheFile, `${JSON.stringify(result, null, 2)}\n`, 'utf8');
    } catch {
      // A read-only installation should still be able to report the live result.
    }
    return { ...result, release, cached: false };
  } catch (error) {
    return {
      repository,
      ref,
      installedCommit: release.installedCommit || null,
      latestCommit: null,
      status: 'unavailable',
      checkedAt: now,
      error: error.name === 'AbortError' ? 'Update check timed out' : error.message,
      release,
      cached: false,
    };
  } finally {
    clearTimeout(timeout);
  }
}

export function updateSummary(state) {
  if (state.status === 'available') return 'A new BaseKit update is available.';
  if (state.status === 'current') return 'BaseKit is up to date.';
  if (state.status === 'unknown') return 'Reinstall BaseKit once to enable update checks.';
  return `Update check unavailable: ${state.error}`;
}
