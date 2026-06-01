export class MissingSupabaseEnvError extends Error {
  constructor() {
    super("Supabase 환경 변수가 없습니다. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY를 설정하세요.");
    this.name = "MissingSupabaseEnvError";
  }
}

export class MissingSupabaseServiceRoleEnvError extends Error {
  constructor() {
    super("Supabase service role 환경 변수가 없습니다. SUPABASE_SERVICE_ROLE_KEY를 서버 환경에만 설정하세요.");
    this.name = "MissingSupabaseServiceRoleEnvError";
  }
}

export class MissingIngestionEnvError extends Error {
  constructor() {
    super("LLM ingestion 환경 변수가 없습니다. INGESTION_API_TOKEN과 INGESTION_OWNER_ID를 서버 환경에 설정하세요.");
    this.name = "MissingIngestionEnvError";
  }
}

export class MissingWebPushEnvError extends Error {
  constructor() {
    super("Web Push 환경 변수가 없습니다. NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY와 WEB_PUSH_VAPID_PRIVATE_KEY를 설정하세요.");
    this.name = "MissingWebPushEnvError";
  }
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new MissingSupabaseEnvError();
  }

  return { url, publishableKey };
}

export function getSupabaseServiceRoleEnv() {
  const { url } = getSupabaseEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new MissingSupabaseServiceRoleEnvError();
  }

  return { url, serviceRoleKey };
}

export function getIngestionEnv() {
  const apiToken = process.env.INGESTION_API_TOKEN;
  const ownerId = process.env.INGESTION_OWNER_ID;

  if (!apiToken || !ownerId) {
    throw new MissingIngestionEnvError();
  }

  return { apiToken, ownerId };
}

export function getWebPushEnv() {
  const publicKey = process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY;
  const privateKey = process.env.WEB_PUSH_VAPID_PRIVATE_KEY;
  const subject = process.env.WEB_PUSH_VAPID_SUBJECT || process.env.NEXT_PUBLIC_SITE_URL || "mailto:admin@example.local";

  if (!publicKey || !privateKey) {
    throw new MissingWebPushEnvError();
  }

  return { publicKey, privateKey, subject };
}

export function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
}

export function hasIngestionEnv() {
  return Boolean(process.env.INGESTION_API_TOKEN && process.env.INGESTION_OWNER_ID);
}

export function hasWebPushPublicEnv() {
  return Boolean(process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY);
}
