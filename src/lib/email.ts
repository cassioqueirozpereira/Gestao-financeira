/**
 * Serviço de E-mail Transacional de Custo Zero (Resend)
 * 
 * Permite envio de até 3.000 e-mails/mês gratuitamente através da API REST do Resend.
 * Não requer instalação de pacotes pesados; utiliza a API nativa fetch.
 */

interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
  simulated?: boolean;
}

const DEFAULT_FROM = process.env.EMAIL_FROM || "D.A. & CassaraTech <onboarding@resend.dev>";

/**
 * Envia um e-mail transacional via Resend API
 */
export async function sendEmail({
  to,
  subject,
  html,
  from = DEFAULT_FROM,
}: SendEmailParams): Promise<EmailResult> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.warn(
      `[Email Transacional] RESEND_API_KEY não configurada. E-mail simulado para ${to}: "${subject}"`
    );
    return {
      success: true,
      simulated: true,
      id: `simulated-${Date.now()}`,
    };
  }

  try {
    const recipients = Array.isArray(to) ? to : [to];

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Email Transacional] Erro retornado pela API Resend:", data);
      return { success: false, error: data.message || "Falha no envio de e-mail" };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error("[Email Transacional] Exceção ao enviar e-mail:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Template e envio de Recibo de Pedido de Velas & Resinas
 */
export async function sendOrderConfirmationEmail({
  to,
  customerName,
  orderNumber,
  items,
  totalAmount,
  paymentMethod,
}: {
  to: string;
  customerName: string;
  orderNumber: string;
  items: { name: string; quantity: number; unitPrice: number; totalPrice: number }[];
  totalAmount: number;
  paymentMethod: string;
}) {
  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const itemsRows = items
    .map(
      (it) => `
      <tr>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px;">${it.quantity}x ${it.name}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right;">${formatBRL(it.unitPrice)}</td>
        <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: right; font-weight: bold;">${formatBRL(it.totalPrice)}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #881337, #4c0519); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: -0.5px;">D.A. Com Carinho</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Comprovante de Compra & Pedido Confirmado</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #1e293b; margin-top: 0;">Olá, <strong>${customerName}</strong>!</p>
        <p style="font-size: 13px; color: #475569;">Seu pedido <strong>${orderNumber}</strong> foi registrado com sucesso em nosso sistema.</p>

        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden;">
          <thead>
            <tr style="background: #f1f5f9; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748b;">
              <th style="padding: 8px 12px;">Produto</th>
              <th style="padding: 8px 12px; text-align: right;">Unitário</th>
              <th style="padding: 8px 12px; text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="2" style="padding: 12px; text-align: right; font-weight: bold; font-size: 14px; color: #0f172a;">Total:</td>
              <td style="padding: 12px; text-align: right; font-weight: 900; font-size: 16px; color: #e11d48;">${formatBRL(totalAmount)}</td>
            </tr>
          </tfoot>
        </table>

        <div style="background: #fdf2f8; border-left: 4px solid #e11d48; padding: 12px; border-radius: 4px; font-size: 12px; color: #9f1239;">
          <strong>Forma de Pagamento:</strong> ${paymentMethod}<br/>
          Seu título a vencer já está registrado no nosso setor financeiro.
        </div>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          D.A. Com Carinho — Velas Aromáticas & Resinas Decorativas
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Pedido Confirmado #${orderNumber} — D.A. Com Carinho`,
    html,
  });
}

/**
 * Template e envio de Alerta de Mensalidade Recorrente
 */
export async function sendMonthlyFeeNoticeEmail({
  to,
  customerName,
  competence,
  amount,
  dueDate,
  paymentType,
}: {
  to: string;
  customerName: string;
  competence: string;
  amount: number;
  dueDate: Date | string;
  paymentType: string;
}) {
  const formatBRL = (val: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(val);

  const dueDateFormatted = new Date(dueDate).toLocaleDateString("pt-BR");

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background: linear-gradient(135deg, #1e1b4b, #312e81); padding: 24px; text-align: center; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 800;">CassaraTech Gestão & Tecnologia</h1>
        <p style="margin: 4px 0 0 0; font-size: 12px; opacity: 0.9;">Aviso de Fatura / Mensalidade</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 14px; color: #1e293b; margin-top: 0;">Prezado(a) <strong>${customerName}</strong>,</p>
        <p style="font-size: 13px; color: #475569;">Informamos que a fatura referente à competência <strong>${competence}</strong> já foi emitida.</p>

        <div style="background: #eef2ff; border: 1px solid #c7d2fe; padding: 16px; border-radius: 8px; margin: 20px 0;">
          <div style="font-size: 12px; color: #4338ca; font-weight: bold; text-transform: uppercase;">Resumo da Cobrança:</div>
          <div style="font-size: 24px; font-weight: 900; color: #3730a3; margin: 8px 0;">${formatBRL(amount)}</div>
          <div style="font-size: 12px; color: #4b5563;">
            <strong>Data de Vencimento:</strong> ${dueDateFormatted}<br/>
            <strong>Forma de Pagamento:</strong> ${paymentType}
          </div>
        </div>

        <p style="font-size: 12px; color: #64748b;">
          Caso já tenha efetuado o pagamento via PIX ou Boleto, desconsidere esta mensagem.
        </p>

        <p style="font-size: 12px; color: #94a3b8; text-align: center; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          Departamento Financeiro — CassaraTech
        </p>
      </div>
    </div>
  `;

  return sendEmail({
    to,
    subject: `Fatura de Mensalidade ${competence} — CassaraTech`,
    html,
  });
}
