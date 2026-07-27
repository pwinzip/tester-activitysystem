import nodemailer from "nodemailer";
import { env, isProduction } from "@/server/lib/env";
import { logger } from "@/server/lib/logger";

function otpEmailBody(otp: string) {
  return {
    subject: "SciDI Activity — Email Verification Code",
    text: `Your verification code is ${otp}. It expires in ${env.OTP_EXPIRES_MINUTES} minutes.`,
    html: `<p>Your verification code is <strong style="font-size:20px;letter-spacing:3px">${otp}</strong>.</p><p>It expires in ${env.OTP_EXPIRES_MINUTES} minutes.</p>`,
  };
}

let transporter: nodemailer.Transporter | null = null;
function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

/**
 * Sends the email-verification OTP. The `console` provider prints the code to
 * the server console for local development only — production must use SMTP,
 * and plaintext OTP is never logged in production (spec v2 §21.2, §35).
 */
export async function sendOtpEmail(to: string, otp: string): Promise<void> {
  const body = otpEmailBody(otp);

  if (env.MAIL_PROVIDER === "console") {
    if (isProduction) {
      // Guard: console provider must not be used in production.
      throw new Error("MAIL_PROVIDER=console is not allowed in production");
    }
    // Dev convenience: visible so testers can grab the code.
    console.log(`\n[mail:console] OTP for ${to}: ${otp}\n`);
    return;
  }

  await getTransporter().sendMail({
    from: env.SMTP_FROM,
    to,
    subject: body.subject,
    text: body.text,
    html: body.html,
  });
  logger.info("otp_email_sent", { to });
}
