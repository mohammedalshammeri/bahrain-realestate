const API_URL = process.env.EXPO_PUBLIC_API_URL;

const getApiOrigin = () => {
  if (!API_URL) return undefined;
  try {
    return new URL(API_URL).origin;
  } catch {
    // Fallback for environments where URL parsing might fail
    return API_URL.replace(/\/$/, '').replace(/\/api\/?$/, '');
  }
};

export const toAbsoluteUrl = (url?: string | null) => {
  if (!url) return undefined;

  // Important: API_URL might include a path like "/api".
  // Static assets like "/uploads/..." are typically served from the origin (no "/api").
  const origin = getApiOrigin();
  if (!origin) return url;

  try {
    // Handle absolute URLs
    const isAbsolute = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url);
    if (isAbsolute) {
      const parsed = new URL(url);
      
      // Replace localhost and other test hosts with the actual API origin
      const localhostHosts = new Set(['localhost', '127.0.0.1', '0.0.0.0', '10.0.2.2']);
      if (localhostHosts.has(parsed.hostname)) {
        const originUrl = new URL(origin);
        parsed.protocol = originUrl.protocol;
        parsed.hostname = originUrl.hostname;
        parsed.port = originUrl.port;
      }
      return parsed.toString();
    }

    // Handle relative URLs
    const parsed = new URL(url, origin);
    return parsed.toString();
  } catch {
    // Fallback string concat logic
    if (/^https?:\/\//i.test(url)) {
      // Replace localhost in absolute URLs
      return url.replace(/^https?:\/\/localhost:\d+/, origin)
                .replace(/^https?:\/\/127\.0\.0\.1:\d+/, origin)
                .replace(/^https?:\/\/0\.0\.0\.0:\d+/, origin)
                .replace(/^https?:\/\/10\.0\.2\.2:\d+/, origin);
    }
    if (url.startsWith('/')) return `${origin}${url}`;
    return `${origin}/${url}`;
  }
};
