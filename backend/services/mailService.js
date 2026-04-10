const nodemailer = require('nodemailer');
const config = require('../config/config');

// Create reusable transporter object using the default SMTP transport
const transporter = config.SMTP_USER && config.SMTP_PASS ? nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: config.SMTP_PORT,
  auth: {
    user: config.SMTP_USER,
    pass: config.SMTP_PASS,
  },
}) : null;

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetUrl - The URL with the token
 */
const sendResetPasswordEmail = async (email, resetUrl) => {
  console.log(`📨 Attempting to send reset email via SMTP to: ${email}`);

  if (!transporter) {
    console.log('❌ SMTP Credentials (SMTP_USER/SMTP_PASS) are missing in config.');
    console.log(`🔗 Manual Reset URL for console: ${resetUrl}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: '"Synapse AI" <noreply@synapse-ai.com>',
      to: email,
      subject: 'Reset Your Password - Synapse AI',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4F8CFF; text-align: center;">Synapse AI</h2>
          <p>Hello,</p>
          <p>You requested a password reset. Click the button below to set a new password. This link will expire in 10 minutes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4F8CFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #666; text-align: center;">&copy; 2026 Synapse AI Orchestration Platform</p>
        </div>
      `,
    });

    console.log('✅ Reset email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Error sending reset email via SMTP:', error);
    throw error;
  }
};

module.exports = { sendResetPasswordEmail };
