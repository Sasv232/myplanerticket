import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn("SMTP not configured, email not sent:", subject);
      return false;
    }

    await transporter.sendMail({
      from: `"MyPlanerTicket" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}

export function priceAlertEmail(trainNumber: string, route: string, price: number, currency: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fafafa; padding: 20px; }
        .card { background: #141414; border: 1px solid #262626; border-radius: 12px; padding: 24px; max-width: 480px; margin: 0 auto; }
        .title { font-size: 20px; font-weight: bold; margin-bottom: 16px; }
        .price { font-size: 32px; font-weight: bold; color: #3b82f6; margin: 16px 0; }
        .detail { color: #a3a3a3; font-size: 14px; margin: 8px 0; }
        .btn { display: inline-block; background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 500; margin-top: 16px; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="title">🚂 Найден билет!</div>
        <div class="detail">Поезд: <strong>${trainNumber}</strong></div>
        <div class="detail">Маршрут: ${route}</div>
        <div class="price">${price.toLocaleString("ru-RU")} ${currency}</div>
        <div class="detail">Успейте купить билет!</div>
        <a href="https://www.rzd.ru" class="btn">Перейти к покупке</a>
      </div>
    </body>
    </html>
  `;
}

export function taskReminderEmail(title: string, dueDate: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #fafafa; padding: 20px; }
        .card { background: #141414; border: 1px solid #262626; border-radius: 12px; padding: 24px; max-width: 480px; margin: 0 auto; }
        .title { font-size: 20px; font-weight: bold; margin-bottom: 16px; }
        .detail { color: #a3a3a3; font-size: 14px; margin: 8px 0; }
        .highlight { color: #f59e0b; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="title">⏰ Напоминание о задаче</div>
        <div class="detail">Задача: <strong>${title}</strong></div>
        <div class="detail">Дедлайн: <span class="highlight">${dueDate}</span></div>
        <div class="detail">Не забудьте выполнить!</div>
      </div>
    </body>
    </html>
  `;
}
