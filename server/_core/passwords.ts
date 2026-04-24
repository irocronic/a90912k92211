import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;
const TEMP_PASSWORD_BYTES = 9;

export function validatePasswordStrength(password: string) {
  const trimmed = password.trim();
  if (trimmed.length < 8) {
    throw new Error("Şifre en az 8 karakter olmalıdır.");
  }
  if (trimmed.length > 128) {
    throw new Error("Şifre en fazla 128 karakter olabilir.");
  }
  return trimmed;
}

export function generateTemporaryPassword(): string {
  return randomBytes(TEMP_PASSWORD_BYTES)
    .toString("base64url")
    .slice(0, 12)
    .replace(/[-_]/g, "A");
}

export async function hashPassword(password: string): Promise<string> {
  const normalizedPassword = validatePasswordStrength(password);
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = scryptSync(normalizedPassword, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });

  return [
    "scrypt",
    String(SCRYPT_N),
    String(SCRYPT_R),
    String(SCRYPT_P),
    salt.toString("base64url"),
    derivedKey.toString("base64url"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  if (!storedHash) return false;

  const [algorithm, rawN, rawR, rawP, saltBase64, hashBase64] = storedHash.split("$");
  if (
    algorithm !== "scrypt" ||
    !rawN ||
    !rawR ||
    !rawP ||
    !saltBase64 ||
    !hashBase64
  ) {
    return false;
  }

  const salt = Buffer.from(saltBase64, "base64url");
  const expectedHash = Buffer.from(hashBase64, "base64url");
  const derivedKey = scryptSync(password, salt, expectedHash.length, {
    N: Number(rawN),
    r: Number(rawR),
    p: Number(rawP),
  });

  if (derivedKey.length !== expectedHash.length) return false;
  return timingSafeEqual(derivedKey, expectedHash);
}
