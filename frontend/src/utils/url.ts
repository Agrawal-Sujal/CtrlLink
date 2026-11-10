/**
 * URL utility functions for handling short links, redirect base URLs, and path formatting.
 */

/**
 * Returns the configured base URL for short link redirection.
 * Priority:
 * 1. REDIRECT_VITE_API_BASE_URL (configured in .env / docker-compose)
 * 2. VITE_REDIRECT_API_BASE_URL (alternative standard Vite prefix)
 * 3. VITE_API_BASE_URL (fallback to API base URL)
 * 4. http://localhost:8080 (local dev fallback)
 */
export const getRedirectBaseUrl = (): string => {
  const envUrl =
    import.meta.env.REDIRECT_VITE_API_BASE_URL ||
    import.meta.env.VITE_REDIRECT_API_BASE_URL ||
    import.meta.env.VITE_API_BASE_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  return 'http://localhost:8080';
};

/**
 * Strips leading slashes and `/r/` prefixes from a path or short ID.
 */
export const getDisplayPath = (pathOrShortId?: string): string => {
  if (!pathOrShortId) return '';
  return pathOrShortId
    .trim()
    .replace(/^\/+/, '')
    .replace(/^r\/+/, '')
    .replace(/^\/+/, '');
};

/**
 * Constructs a full short URL ready for sharing or copying.
 * Output format: `${REDIRECT_VITE_API_BASE_URL}/${cleanPath}`
 */
export const buildShortUrl = (pathOrShortId?: string): string => {
  const baseUrl = getRedirectBaseUrl();
  const clean = getDisplayPath(pathOrShortId);
  return clean ? `${baseUrl}/${clean}` : baseUrl;
};
