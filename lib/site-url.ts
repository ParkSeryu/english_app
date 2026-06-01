import { safeSameOriginRedirectPath } from "@/lib/safe-redirect";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::1"]);
const NORMALIZED_LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "0.0.0.0", "::", "::1"]);

type HeaderReader = Pick<Headers, "get">;
type SiteUrlEnv = { [key: string]: string | undefined };

function originFromUrl(value: string | undefined, addHttps = false) {
  const rawValue = value?.trim();
  if (!rawValue) return null;
  const normalizedValue = addHttps && !/^https?:\/\//i.test(rawValue) ? `https://${rawValue}` : rawValue;

  try {
    const url = new URL(normalizedValue);
    return url.origin;
  } catch {
    return null;
  }
}

function isLocalOrigin(origin: string) {
  try {
    return LOCAL_HOSTNAMES.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function isNormalizableLocalOrigin(origin: string) {
  try {
    return NORMALIZED_LOCAL_HOSTNAMES.has(new URL(origin).hostname);
  } catch {
    return false;
  }
}

function normalizeLocalOrigin(origin: string) {
  if (!isNormalizableLocalOrigin(origin)) return origin;

  const url = new URL(origin);
  url.hostname = "localhost";
  return url.origin;
}

function firstUsableLocalOrigin(...origins: Array<string | null>) {
  for (const origin of origins) {
    if (origin && isLocalOrigin(origin)) return normalizeLocalOrigin(origin);
  }

  return null;
}

function isVercelGeneratedOrigin(origin: string) {
  try {
    return new URL(origin).hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

function originFromForwardedHeaders(headers: HeaderReader) {
  const forwardedHost = headers.get("x-forwarded-host") ?? headers.get("host");
  if (!forwardedHost) return null;
  const forwardedProto = headers.get("x-forwarded-proto") ?? (forwardedHost.includes("localhost") ? "http" : "https");
  const firstHost = forwardedHost.split(",")[0]?.trim();
  const firstProto = forwardedProto.split(",")[0]?.trim() || "https";
  return originFromUrl(`${firstProto}://${firstHost}`);
}

export function resolveAppOrigin(headers: HeaderReader, env: SiteUrlEnv = process.env) {
  const configuredOrigin = originFromUrl(env.NEXT_PUBLIC_SITE_URL) ?? originFromUrl(env.SITE_URL);
  if (configuredOrigin && !isLocalOrigin(configuredOrigin)) return configuredOrigin;

  const requestOrigin = originFromUrl(headers.get("origin") ?? undefined);
  const forwardedOrigin = originFromForwardedHeaders(headers);
  if (forwardedOrigin && !isLocalOrigin(forwardedOrigin)) {
    if (requestOrigin && !isLocalOrigin(requestOrigin) && isVercelGeneratedOrigin(forwardedOrigin) && !isVercelGeneratedOrigin(requestOrigin)) {
      return requestOrigin;
    }
    return forwardedOrigin;
  }

  if (requestOrigin && !isLocalOrigin(requestOrigin)) return requestOrigin;

  const vercelOrigin = originFromUrl(env.VERCEL_PROJECT_PRODUCTION_URL, true) ?? originFromUrl(env.VERCEL_URL, true);
  if (vercelOrigin && !isLocalOrigin(vercelOrigin)) return vercelOrigin;

  return firstUsableLocalOrigin(requestOrigin, forwardedOrigin, configuredOrigin) ?? "http://localhost:3000";
}

export function passwordResetRedirectUrl(headers: HeaderReader, env: SiteUrlEnv = process.env) {
  return new URL("/auth/update-password", resolveAppOrigin(headers, env)).toString();
}

export function authCallbackRedirectUrl(headers: HeaderReader, next = "/", env: SiteUrlEnv = process.env) {
  const origin = resolveAppOrigin(headers, env);
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", safeSameOriginRedirectPath(next, origin));
  return callbackUrl.toString();
}
