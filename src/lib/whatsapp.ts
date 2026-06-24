import { formatWhatsAppPhone } from "@/lib/auth";

type WhatsAppSendResult = {
  sid?: string;
  demo?: boolean;
};

export function isWhatsAppConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_WHATSAPP_FROM,
  );
}

export async function sendWhatsAppOtp(phone: string, otp: string): Promise<WhatsAppSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;

  const to = formatWhatsAppPhone(phone);
  const body = `Metavision: Doğrulama kodunuz ${otp}. Kod 5 dəqiqə etibarlıdır.`;

  if (!accountSid || !authToken || !from) {
    if (process.env.NODE_ENV === "development") {
      console.warn(
        `[WhatsApp demo] Twilio konfiqurasiya olunmayıb. Kod yalnız ekranda göstərilir: ${otp} → ${to}`,
      );
      return { demo: true };
    }
    throw new Error(
      "WhatsApp API konfiqurasiya edilməyib. .env.local faylına TWILIO_* dəyişənlərini əlavə edin.",
    );
  }

  const fromAddress = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
  const toAddress = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;

  const params = new URLSearchParams({
    From: fromAddress,
    To: toAddress,
    Body: body,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );

  if (!response.ok) {
    const detail = await response.text();
    console.error("[WhatsApp] Twilio xətası:", detail);
    throw new Error(
      "WhatsApp mesajı göndərilmədi. Twilio sandbox-da nömrənizi qoşduğunuzdan əmin olun.",
    );
  }

  const data = (await response.json()) as { sid?: string };
  return { sid: data.sid };
}

export async function sendWhatsAppMessage(phone: string, body: string): Promise<WhatsAppSendResult> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  const to = formatWhatsAppPhone(phone);

  if (!accountSid || !authToken || !from) {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[WhatsApp demo] ${body} → ${to}`);
      return { demo: true };
    }
    throw new Error("WhatsApp API konfiqurasiya edilməyib.");
  }

  const fromAddress = from.startsWith("whatsapp:") ? from : `whatsapp:${from}`;
  const toAddress = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
  const params = new URLSearchParams({ From: fromAddress, To: toAddress, Body: body });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    },
  );

  if (!response.ok) throw new Error("WhatsApp mesajı göndərilmədi.");
  const data = (await response.json()) as { sid?: string };
  return { sid: data.sid };
}
