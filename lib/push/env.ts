export class MissingPushEnvError extends Error {
  constructor() {
    super("푸쉬 알림 환경 변수가 없습니다. NEXT_PUBLIC_VAPID_PUBLIC_KEY와 VAPID_PRIVATE_KEY를 설정하세요.");
    this.name = "MissingPushEnvError";
  }
}

export function getVapidPublicKey() {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? "";
}

export function hasPushEnv() {
  return Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
}

export function getPushEnv() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) throw new MissingPushEnvError();

  return {
    publicKey,
    privateKey,
    subject: process.env.VAPID_SUBJECT || "mailto:admin@example.com"
  };
}
