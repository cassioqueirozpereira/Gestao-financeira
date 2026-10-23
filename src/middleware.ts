import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "cassara-tech-da-com-carinho-security-token-key-2026-argon2id-prod-secret"
);

const SESSION_COOKIE_NAME = "sge_session";

// Rotas públicas que não requerem autenticação
const PUBLIC_PATHS = ["/login", "/orcamento", "/api/auth/login", "/api/orcamento"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Permite arquivos estáticos e Next internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const isPublic = PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME)?.value;

  let isValidSession = false;

  if (sessionCookie) {
    try {
      await jwtVerify(sessionCookie, SECRET_KEY);
      isValidSession = true;
    } catch {
      isValidSession = false;
    }
  }

  // Se já está autenticado e tenta acessar o login, redireciona para o dashboard
  if (pathname === "/login" && isValidSession) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Se é uma rota privada e não está autenticado, redireciona para o login
  if (!isPublic && !isValidSession) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
