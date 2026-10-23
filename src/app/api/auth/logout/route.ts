import { NextResponse } from "next/server";
import { clearSessionCookie, getCurrentUser } from "@/lib/auth";
import { logAudit } from "@/lib/audit";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (user) {
      await logAudit({
        userId: user.id,
        action: "STATUS_CHANGE",
        entity: "UserSession",
        entityId: user.id,
        description: `Logout efetuado por ${user.email}`,
      });
    }

    await clearSessionCookie();
    return NextResponse.json({ success: true, message: "Sessão encerrada com sucesso." });
  } catch (error) {
    console.error("Erro no logout:", error);
    return NextResponse.json({ error: "Erro ao encerrar sessão" }, { status: 500 });
  }
}
