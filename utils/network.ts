/**
 * Lightweight network checker — no external dependencies.
 * Uses a HEAD request to a reliable endpoint with a short timeout.
 * Returns true if internet is reachable, false otherwise.
 */
export async function isInternetReachable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch('https://dns.google/generate_204', {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timeout);
    return res.status === 204 || res.ok;
  } catch {
    return false;
  }
}
