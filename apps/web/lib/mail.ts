import nodemailer from "nodemailer";

export type ContactMailInput = {
  to: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
};

export function isSmtpReady() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);
}

export async function sendContactMail(input: ContactMailInput) {
  if (!isSmtpReady()) {
    throw new Error("SMTP_NOT_CONFIGURED");
  }

  const port = Number(process.env.SMTP_PORT || "587");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
  });

  const siteName = process.env.NEXT_PUBLIC_APP_NAME || "CMS";
  const text = [
    `Liên hệ mới từ website ${siteName}`,
    "",
    `Họ tên: ${input.name}`,
    `Email: ${input.email}`,
    input.phone ? `Điện thoại: ${input.phone}` : null,
    `Chủ đề: ${input.subject}`,
    "",
    "Nội dung:",
    input.message,
  ]
    .filter(Boolean)
    .join("\n");

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: input.to,
    replyTo: input.email,
    subject: `[Liên hệ] ${input.subject}`,
    text,
  });
}
