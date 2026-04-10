const { Resend } = require('resend');
const config = require('../config/config');

const resend = config.RESEND_API_KEY ? new Resend(config.RESEND_API_KEY) : null;

/**
 * Send password reset email
 * @param {string} email - Recipient email
 * @param {string} resetUrl - The URL with the token
 */
const sendResetPasswordEmail = async (email, resetUrl) => {
  if (!resend) {
    console.log('⚠️ RESEND_API_KEY not found. Logging reset URL to console instead:');
    console.log(`🔗 RESET URL: ${resetUrl}`);
    return;
  }

  try {
    const data = await resend.emails.send({
      from: 'Synapse AI <onboarding@resend.dev>', // You can update this once you verify a domain
      to: [email],
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

    console.log('✅ Reset email sent successfully:', data.id);
    return data;
  } catch (error) {
    console.error('❌ Error sending reset email:', error);
    throw error;
  }
};

module.exports = { sendResetPasswordEmail };
