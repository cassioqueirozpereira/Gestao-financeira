import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Busca usuário ativo no banco
    const user = await db.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou conta inativa." },
        { status: 401 }
      );
    }

    // Validação com Argon2id
    const isPasswordValid = await verifyPassword(user.passwordHash, password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Credenciais inválidas ou conta inativa." },
        { status: 401 }
      );
    }

    // Gera token JWT de sessão
    const sessionToken = await createSessionToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    // Registra sessão no banco e atualiza último login
    const ipAddress = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Desconhecido";

    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() },
      }),
      db.session.create({
        data: {
          userId: user.id,
          token: sessionToken,
          ipAddress,
          userAgent,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 dias
        },
      }),
    ]);

    // Registra auditoria
    await logAudit({
      userId: user.id,
      action: "STATUS_CHANGE",
      entity: "UserSession",
      entityId: user.id,
      ipAddress,
      description: `Login autenticado com sucesso via Argon2id (${user.email})`,
    });

    // Configura o cookie HTTP-only
    await setSessionCookie(sessionToken);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Erro no endpoint de login:", error);
    return NextResponse.json(
      { error: "Erro interno no servidor ao processar autenticação." },
      { status: 500 }
    );
  }
}
