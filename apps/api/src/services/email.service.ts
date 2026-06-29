import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import { config } from '../config';

// ─── Email Templates ─────────────────────────────────────────

function baseTemplate(content: string, previewText: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>VOPayX</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0A0A0A; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #FFFFFF; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .logo { text-align: center; margin-bottom: 32px; }
    .logo-text { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #3B82F6, #60A5FA); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
    .card { background: #1A1A1A; border: 1px solid #2A2A2A; border-radius: 16px; padding: 40px; }
    .card h1 { font-size: 24px; font-weight: 700; margin-bottom: 16px; }
    .card p { color: #B3B3B3; font-size: 15px; line-height: 1.6; margin-bottom: 16px; }
    .otp-box { background: #222; border: 1px solid #3B82F6; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0; }
    .otp-code { font-size: 42px; font-weight: 900; letter-spacing: 8px; color: #3B82F6; font-family: monospace; }
    .btn { display: inline-block; background: linear-gradient(135deg, #2563EB, #3B82F6); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-size: 15px; font-weight: 600; margin: 16px 0; }
    .divider { border: none; border-top: 1px solid #2A2A2A; margin: 24px 0; }
    .footer { text-align: center; margin-top: 32px; color: #555; font-size: 12px; line-height: 1.8; }
    .footer a { color: #3B82F6; text-decoration: none; }
  </style>
</head>
<body>
  <div style="display:none;font-size:1px;max-height:0;overflow:hidden;">${previewText}</div>
  <div class="wrapper">
    <div class="logo">
      <div class="logo-text">VOPayX</div>
      <p style="color:#555;font-size:12px;margin-top:4px;">Global Payments Without Borders</p>
    </div>
    <div class="card">
      ${content}
    </div>
    <div class="footer">
      <p>Powered by AyoHost · <a href="https://vopay.com">vopay.com</a></p>
      <p style="margin-top:8px;">© ${new Date().getFullYear()} VOPayX. All rights reserved.</p>
      <p style="margin-top:8px;">If you did not request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>`;
}

const templates = {
  verificationOtp: (firstName: string, otp: string) => ({
    subject: `${otp} is your VOPayX verification code`,
    html: baseTemplate(`
      <h1>Verify your email 📧</h1>
      <p>Hi ${firstName}, welcome to VOPayX! Use this one-time code to verify your email address:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
        <p style="margin-top:12px;font-size:13px;color:#555;">Valid for 10 minutes. Do not share this code with anyone.</p>
      </div>
      <p>Once verified, you'll have full access to your VOPayX wallet.</p>
    `, `Your VOPayX verification code is ${otp}`),
  }),

  passwordReset: (firstName: string, resetToken: string) => {
    const url = `${config.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    return {
      subject: 'Reset your VOPayX password',
      html: baseTemplate(`
        <h1>Reset your password 🔐</h1>
        <p>Hi ${firstName}, we received a request to reset your password. Click the button below to create a new one:</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${url}" class="btn">Reset Password</a>
        </div>
        <p>Or paste this link in your browser:</p>
        <p style="word-break:break-all;color:#3B82F6;font-size:13px;">${url}</p>
        <hr class="divider" />
        <p style="font-size:13px;color:#555;">This link expires in 1 hour. If you didn't request a password reset, please ignore this email and your password will remain unchanged.</p>
      `, 'Reset your VOPayX password'),
    };
  },

  transferReceived: (firstName: string, amount: string, currency: string, senderName: string) => ({
    subject: `You received ${currency} ${amount} on VOPayX`,
    html: baseTemplate(`
      <h1>Money received! 💸</h1>
      <p>Hi ${firstName}, great news — you have received a payment.</p>
      <div class="otp-box">
        <p style="color:#B3B3B3;font-size:13px;margin-bottom:4px;">Amount Received</p>
        <div style="font-size:36px;font-weight:800;color:#10B981;">${currency} ${amount}</div>
        <p style="color:#B3B3B3;font-size:13px;margin-top:8px;">From: ${senderName}</p>
      </div>
      <p>Your wallet has been credited. Log in to view your updated balance and transaction history.</p>
    `, `You received ${currency} ${amount} from ${senderName}`),
  }),

  depositConfirmed: (firstName: string, amount: string, currency: string) => ({
    subject: `Deposit confirmed — ${currency} ${amount}`,
    html: baseTemplate(`
      <h1>Deposit successful! ✅</h1>
      <p>Hi ${firstName}, your deposit has been confirmed and your wallet has been credited.</p>
      <div class="otp-box">
        <p style="color:#B3B3B3;font-size:13px;margin-bottom:4px;">Amount Deposited</p>
        <div style="font-size:36px;font-weight:800;color:#10B981;">${currency} ${amount}</div>
      </div>
      <p>Your funds are now available for transfers, payments, and withdrawals.</p>
    `, `${currency} ${amount} has been added to your wallet`),
  }),

  withdrawalProcessing: (firstName: string, amount: string, currency: string, bankName: string) => ({
    subject: `Withdrawal processing — ${currency} ${amount}`,
    html: baseTemplate(`
      <h1>Withdrawal in progress ⏳</h1>
      <p>Hi ${firstName}, your withdrawal request is being processed.</p>
      <div class="otp-box">
        <p style="color:#B3B3B3;font-size:13px;margin-bottom:4px;">Amount</p>
        <div style="font-size:36px;font-weight:800;color:#F59E0B;">${currency} ${amount}</div>
        <p style="color:#B3B3B3;font-size:13px;margin-top:8px;">To: ${bankName}</p>
      </div>
      <p>Bank transfers typically arrive within 1-2 business hours. You'll receive a confirmation once the transfer is complete.</p>
    `, `Your withdrawal of ${currency} ${amount} is being processed`),
  }),
};

// ─── Resend Client ───────────────────────────────────────────
let resendClient: Resend | null = null;
if (config.RESEND_API_KEY) {
  resendClient = new Resend(config.RESEND_API_KEY);
}

// ─── Brevo SMTP Client ───────────────────────────────────────
let brevoTransport: nodemailer.Transporter | null = null;
if (config.BREVO_SMTP_HOST && config.BREVO_SMTP_USER && config.BREVO_SMTP_PASS) {
  brevoTransport = nodemailer.createTransport({
    host: config.BREVO_SMTP_HOST,
    port: config.BREVO_SMTP_PORT ?? 587,
    secure: false,
    auth: {
      user: config.BREVO_SMTP_USER,
      pass: config.BREVO_SMTP_PASS,
    },
  });
}

// ─── Send Email ───────────────────────────────────────────────
async function sendEmail(to: string, subject: string, html: string) {
  const from = `${config.EMAIL_FROM_NAME} <${config.EMAIL_FROM}>`;

  if (config.NODE_ENV === 'development' && !resendClient && !brevoTransport) {
    // Dev fallback: log to console
    console.log('\n📧 ─── EMAIL ────────────────────────────────────');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log('─────────────────────────────────────────────────\n');
    return;
  }

  if (config.EMAIL_PROVIDER === 'resend' && resendClient) {
    await resendClient.emails.send({ from, to, subject, html });
  } else if (brevoTransport) {
    await brevoTransport.sendMail({ from, to, subject, html });
  }
}

// ─── Email Service API ────────────────────────────────────────
export const emailService = {
  async sendVerificationOtp(email: string, firstName: string, otp: string) {
    const { subject, html } = templates.verificationOtp(firstName, otp);
    await sendEmail(email, subject, html);
  },

  async sendPasswordReset(email: string, firstName: string, token: string) {
    const { subject, html } = templates.passwordReset(firstName, token);
    await sendEmail(email, subject, html);
  },

  async sendTransferReceived(email: string, firstName: string, amount: string, currency: string, senderName: string) {
    const { subject, html } = templates.transferReceived(firstName, amount, currency, senderName);
    await sendEmail(email, subject, html);
  },

  async sendDepositConfirmed(email: string, firstName: string, amount: string, currency: string) {
    const { subject, html } = templates.depositConfirmed(firstName, amount, currency);
    await sendEmail(email, subject, html);
  },

  async sendWithdrawalProcessing(email: string, firstName: string, amount: string, currency: string, bankName: string) {
    const { subject, html } = templates.withdrawalProcessing(firstName, amount, currency, bankName);
    await sendEmail(email, subject, html);
  },
};
