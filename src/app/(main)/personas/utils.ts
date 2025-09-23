const TIKTOK_USERNAME_REGEX = /@?([a-zA-Z0-9_\.]{2,24})/;

export function extractUsername(input: string): string | null {
  if (!input) return null;

  const trimmed = input.trim();

  try {
    const url = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const pathnameMatch = url.pathname.match(TIKTOK_USERNAME_REGEX);
    if (pathnameMatch?.[1]) {
      return pathnameMatch[1];
    }
  } catch (error) {
    // Ignore URL parsing errors; fall back to regex below
  }

  const match = trimmed.match(TIKTOK_USERNAME_REGEX);
  return match?.[1] ?? null;
}
