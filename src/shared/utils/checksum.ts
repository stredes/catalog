/**
 * Compute a DJB2-style hash of a stringified value, returned as a base-36 string.
 * Used for backup checksums and change detection fingerprints.
 */
export function computeChecksum(value: unknown): string {
  const raw = JSON.stringify(value);
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return Math.abs(hash).toString(36);
}
