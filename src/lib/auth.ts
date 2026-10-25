import { hash, verify } from "@node-rs/argon2";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { Role } from "@prisma/client";

const ARGON2_CONFIG = {
  memoryCost: 65536, // 64 MB
  timeCost: 3,       // 3 iterations
  parallelism: 4,    // 4 threads
};

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "cassara-tech-da-com-carinho-security-token-key-2026-argon2id-prod-secret"
);

const SESSION_COOKIE_NAME = "erp_session";

export interface SessionPayload {
  userId: string;
  email: string;
  name: string;
  role: Role;
}

/**
 * Cria hash seguro de senha utilizando Argon2id conforme recomendação OWASP
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, ARGON2_CONFIG);
}

/**
 * Verifica se a senha corresponde ao hash Argon2id
 */
export async function verifyPassword(hashString: string, password: string): Promise<boolean> {
  try {
    return await verify(hashString, password);
  } catch {
    return false;
  }
}

/**
 * Gera um token de sessão assinado (JWT seguro)
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET_KEY);
}

/**
 * Valida o token e decodifica a sessão
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET_KEY);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/**
 * Salva a sessão em Cookie HTTP-only seguro
 */
export async function setSessionCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 dias
  });
}

/**
 * Remove o Cookie de sessão (Logout)
 */
export async function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Retorna os dados do usuário autenticado no servidor
 */
export async function getCurrentUser() {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);

    if (!sessionCookie?.value) {
      return null;
    }

    const payload = await verifySessionToken(sessionCookie.value);
    if (!payload?.userId) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Erro ao recuperar sessão atual:", error);
    return null;
  }
}
