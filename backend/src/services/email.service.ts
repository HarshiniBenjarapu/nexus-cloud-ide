import axios from 'axios';

const RESEND_API_URL = 'https://api.resend.com/emails';

const sendEmail = async (
  to: string,
  subject: string,
  html: string
): Promise<void> => {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.warn(`[Email Service] RESEND_API_KEY or EMAIL_FROM not configured. Skipping email to ${to}. Subject: ${subject}`);
    return;
  }

  try {
    await axios.post(
      RESEND_API_URL,
      {
        from,
        to: [to],
        subject,
        html,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error: any) {
    console.warn(`[Email Service] Failed to send email to ${to}: ${error.response?.data?.message || error.message}`);
  }
};

export const sendVerificationEmail = async (
  email: string,
  fullName: string,
  verificationUrl: string
): Promise<void> => {
  await sendEmail(
    email,
    'Verify your Nexus Cloud IDE email',
    `
      <h2>Welcome to Nexus Cloud IDE, ${fullName}!</h2>
      <p>Please verify your email address to activate your account.</p>
      <p>
        <a href="${verificationUrl}">
          Verify Email
        </a>
      </p>
      <p>This verification link expires in 24 hours.</p>
    `
  );
};

export const sendPasswordResetEmail = async (
  email: string,
  fullName: string,
  resetUrl: string
): Promise<void> => {
  await sendEmail(
    email,
    'Reset your Nexus Cloud IDE password',
    `
      <h2>Password Reset</h2>
      <p>Hi ${fullName},</p>
      <p>We received a request to reset your Nexus Cloud IDE password.</p>
      <p>
        <a href="${resetUrl}">
          Reset Password
        </a>
      </p>
      <p>This link expires in 1 hour.</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    `
  );
};
