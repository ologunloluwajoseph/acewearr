/**
 * AceWears Email Service
 * 
 * In production, integrate with SendGrid, Mailgun, or AWS SES.
 * For demo, emails are logged to console.
 * 
 * Production setup (SendGrid):
 *   npm install @sendgrid/mail
 *   SENDGRID_API_KEY=SG.xxxxx
 *   FROM_EMAIL=noreply@acewears.com
 */

export type EmailTemplate = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

// ============================================================================
//  Email Templates
// ============================================================================

export function orderConfirmationEmail(params: {
  userName: string;
  orderReference: string;
  items: { title: string; size: string; quantity: number; priceCents: number }[];
  totalCents: number;
  currency: string;
  shippingAddress?: string;
  trackingUrl?: string;
}): EmailTemplate {
  const itemsHtml = params.items.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.title}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.size}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${(item.priceCents / 100).toFixed(2)}</td>
    </tr>
  `).join("");

  return {
    to: "", // set by caller
    subject: `AceWears Order Confirmed — ${params.orderReference}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff;">
        <div style="background: #0A1128; padding: 20px; text-align: center;">
          <h1 style="color: #FF9F1C; margin: 0; font-size: 28px;">AceWears</h1>
          <p style="color: #fff; margin: 5px 0 0; font-size: 12px; letter-spacing: 2px;">THREADS REIMAGINED</p>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #0A1128;">Order Confirmed!</h2>
          <p style="color: #47506B; font-size: 14px;">Hi ${params.userName},</p>
          <p style="color: #47506B; font-size: 14px;">Thank you for your order! We've received your payment and are preparing your items for shipment.</p>
          <p style="color: #47506B; font-size: 14px;"><strong>Order Reference:</strong> ${params.orderReference}</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px;">
            <thead>
              <tr style="background: #F4F5F8;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: left;">Size</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 12px 8px; text-align: right; font-weight: bold;">Total:</td>
                <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #FF9F1C;">$${(params.totalCents / 100).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>

          ${params.trackingUrl ? `<p style="text-align: center; margin: 30px 0;"><a href="${params.trackingUrl}" style="background: #FF9F1C; color: #0A1128; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 6px;">Track Your Order</a></p>` : ""}
          
          <p style="color: #47506B; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            If you have any questions, reply to this email or contact support@acewears.com<br/>
            AceWears · Threads Reimagined · www.acewears.com
          </p>
        </div>
      </div>
    `,
    text: `AceWears Order Confirmed — ${params.orderReference}\n\nHi ${params.userName},\n\nThank you for your order! Reference: ${params.orderReference}\nTotal: $${(params.totalCents / 100).toFixed(2)}\n\nTrack your order at ${params.trackingUrl || "your dashboard"}`,
  };
}

export function shippingUpdateEmail(params: {
  userName: string;
  orderReference: string;
  status: string;
  trackingNumber?: string;
  trackingUrl?: string;
}): EmailTemplate {
  return {
    to: "",
    subject: `AceWears — Order ${params.orderReference} ${params.status}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A1128; padding: 20px; text-align: center;">
          <h1 style="color: #FF9F1C; margin: 0;">AceWears</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #0A1128;">Order Update: ${params.status}</h2>
          <p style="color: #47506B;">Hi ${params.userName},</p>
          <p style="color: #47506B;">Your order <strong>${params.orderReference}</strong> has been updated to: <strong>${params.status}</strong></p>
          ${params.trackingNumber ? `<p style="color: #47506B;">Tracking Number: <strong>${params.trackingNumber}</strong></p>` : ""}
          ${params.trackingUrl ? `<p style="text-align: center; margin: 30px 0;"><a href="${params.trackingUrl}" style="background: #FF9F1C; color: #0A1128; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 6px;">Track Package</a></p>` : ""}
        </div>
      </div>
    `,
  };
}

export function passwordResetEmail(params: {
  userName: string;
  resetUrl: string;
}): EmailTemplate {
  return {
    to: "",
    subject: "AceWears — Password Reset",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A1128; padding: 20px; text-align: center;">
          <h1 style="color: #FF9F1C; margin: 0;">AceWears</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #0A1128;">Reset Your Password</h2>
          <p style="color: #47506B;">Hi ${params.userName},</p>
          <p style="color: #47506B;">We received a request to reset your AceWears password. Click the button below to set a new password:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${params.resetUrl}" style="background: #FF9F1C; color: #0A1128; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 6px;">Reset Password</a>
          </p>
          <p style="color: #47506B; font-size: 12px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
        </div>
      </div>
    `,
    text: `AceWears Password Reset\n\nHi ${params.userName},\n\nReset your password at: ${params.resetUrl}\n\nThis link expires in 1 hour.`,
  };
}

export function emailVerificationEmail(params: {
  userName: string;
  verifyUrl: string;
}): EmailTemplate {
  return {
    to: "",
    subject: "AceWears — Verify Your Email",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A1128; padding: 20px; text-align: center;">
          <h1 style="color: #FF9F1C; margin: 0;">AceWears</h1>
        </div>
        <div style="padding: 20px;">
          <h2 style="color: #0A1128;">Welcome to AceWears!</h2>
          <p style="color: #47506B;">Hi ${params.userName},</p>
          <p style="color: #47506B;">Please verify your email address to activate your account:</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${params.verifyUrl}" style="background: #008080; color: #fff; padding: 12px 30px; text-decoration: none; font-weight: bold; border-radius: 6px;">Verify Email</a>
          </p>
          <p style="color: #47506B; font-size: 12px;">This link expires in 24 hours.</p>
        </div>
      </div>
    `,
    text: `AceWears — Verify Your Email\n\nHi ${params.userName},\n\nVerify your email at: ${params.verifyUrl}\n\nThis link expires in 24 hours.`,
  };
}

// ============================================================================
//  Send Email (demo: console.log; production: SendGrid/Mailgun)
// ============================================================================
export async function sendEmail(template: EmailTemplate): Promise<boolean> {
  // In production:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // await sgMail.send({ to: template.to, from: 'noreply@acewears.com', subject: template.subject, html: template.html, text: template.text });

  // Demo mode: log to console
  console.log(`📧 EMAIL SENT:
    To: ${template.to}
    Subject: ${template.subject}
    Body: ${template.text || template.html.slice(0, 200)}...
  `);

  return true;
}

// ============================================================================
//  Token generation for password reset / email verification
// ============================================================================
export function generateToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}-${Math.random().toString(36).substring(2, 15)}`;
}
