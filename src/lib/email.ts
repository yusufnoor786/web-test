export interface EmailReceiptProps {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  total: number;
  items: Array<{ title: string; price: number }>;
  downloadLinks: Array<{ title: string; downloadUrl: string }>;
}

/**
 * Renders an editorial HTML receipt template for transactional emails.
 */
export function renderEmailReceiptHtml(props: EmailReceiptProps): string {
  const itemsHtml = props.items
    .map(
      (it) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #E5E2DA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #121417;">
          ${it.title}
        </td>
        <td style="padding: 12px 0; border-bottom: 1px solid #E5E2DA; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 14px; color: #121417; text-align: right; font-weight: 600;">
          ₹${it.price}
        </td>
      </tr>`
    )
    .join('');

  const downloadsHtml = props.downloadLinks
    .map(
      (dl) => `
      <div style="margin-top: 14px; padding: 14px 18px; background-color: #FBF9F5; border: 1px solid #E5E2DA; border-radius: 6px;">
        <div style="font-weight: 600; font-size: 14px; color: #121417; margin-bottom: 6px;">${dl.title}</div>
        <a href="${dl.downloadUrl}" style="display: inline-block; padding: 8px 16px; background-color: #121417; color: #FFFFFF; font-size: 13px; font-weight: 600; text-decoration: none; border-radius: 4px;">
          Download Product →
        </a>
      </div>`
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your Order Receipt - The Growth Archive</title>
</head>
<body style="margin: 0; padding: 30px 20px; background-color: #F6F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 580px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E2DA; border-radius: 8px; padding: 36px;">
    <div style="border-bottom: 2px solid #121417; padding-bottom: 16px; margin-bottom: 24px;">
      <h1 style="margin: 0; font-size: 20px; letter-spacing: 0.05em; font-family: Georgia, serif; text-transform: uppercase; color: #121417;">
        The Growth Archive
      </h1>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #71767E; text-transform: uppercase; letter-spacing: 0.08em;">
        Field-Tested Digital Marketing Knowledge
      </p>
    </div>

    <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #121417;">
      Payment Confirmed — Order #${props.orderNumber}
    </h2>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #575D65; line-height: 1.5;">
      Hello ${props.customerName || 'there'}, thank you for your purchase. Your digital products are ready for immediate download below.
    </p>

    <div style="margin-bottom: 28px;">
      <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #71767E; margin: 0 0 12px 0;">
        Your Download Links
      </h3>
      ${downloadsHtml}
    </div>

    <div style="margin-bottom: 28px;">
      <h3 style="font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #71767E; margin: 0 0 12px 0;">
        Order Breakdown
      </h3>
      <table style="width: 100%; border-collapse: collapse;">
        ${itemsHtml}
        <tr>
          <td style="padding: 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 15px; font-weight: 700; color: #121417;">
            Total Paid
          </td>
          <td style="padding: 14px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 16px; font-weight: 700; color: #121417; text-align: right;">
            ₹${props.total}
          </td>
        </tr>
      </table>
    </div>

    <div style="padding: 16px; background-color: #FBF9F5; border: 1px solid #E5E2DA; border-radius: 6px; font-size: 12px; color: #71767E; line-height: 1.5;">
      <strong>Purchase Recovery:</strong> You can always recover and re-download your purchases by visiting 
      <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/purchases" style="color: #121417; text-decoration: underline;">
        ${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/purchases
      </a> using this email address (${props.customerEmail}).
    </div>

    <div style="margin-top: 30px; border-top: 1px solid #E5E2DA; padding-top: 16px; text-align: center; font-size: 12px; color: #9AA0A6;">
      © ${new Date().getFullYear()} The Growth Archive. Confidential single-user license.
    </div>
  </div>
</body>
</html>`;
}

/**
 * Sends transactional receipt email.
 * Uses Resend if RESEND_API_KEY is available, or logs cleanly to stdout in development.
 */
export async function sendOrderReceiptEmail(props: EmailReceiptProps): Promise<{ success: boolean; id?: string }> {
  const htmlContent = renderEmailReceiptHtml(props);
  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey && !apiKey.includes('placeholder')) {
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || 'The Growth Archive <orders@growtharchive.com>',
          to: [props.customerEmail],
          subject: `Your Digital Products & Receipt [Order #${props.orderNumber}]`,
          html: htmlContent,
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error('Failed to send email via Resend:', err);
        return { success: false };
      }

      const res = await response.json();
      return { success: true, id: res.id };
    } catch (err) {
      console.error('Email sending exception:', err);
      return { success: false };
    }
  }

  // Fallback / local dev notification
  console.log(`\n--- [TRANSACTIONAL EMAIL DISPATCH] ---`);
  console.log(`To: ${props.customerEmail}`);
  console.log(`Subject: Your Digital Products & Receipt [Order #${props.orderNumber}]`);
  console.log(`Products: ${props.items.map((i) => i.title).join(', ')}`);
  console.log(`Download links:`);
  props.downloadLinks.forEach((dl) => console.log(`  - ${dl.title}: ${dl.downloadUrl}`));
  console.log(`--------------------------------------\n`);

  return { success: true, id: 'simulated_email_id' };
}
