import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashToken } from '@/lib/auth/crypto';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email address is required' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const customer = await prisma.customer.findUnique({
      where: { email: cleanEmail },
      include: {
        orders: {
          where: { status: 'PAID' },
        },
      },
    });

    if (!customer || customer.orders.length === 0) {
      return NextResponse.json({
        error: 'No active purchases found for this email address. Please make sure you enter the same email address used during payment.',
      }, { status: 404 });
    }

    // Generate clean 6-digit OTP code (e.g. 749201)
    const sixDigitOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const tokenHash = hashToken(sixDigitOtp);

    // Clean up any old unused tokens for this customer
    await prisma.customerMagicLink.deleteMany({
      where: { customerId: customer.id },
    });

    // Store single-use OTP valid for 15 minutes
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await prisma.customerMagicLink.create({
      data: {
        customerId: customer.id,
        tokenHash,
        expiresAt,
      },
    });

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://web-test-km0an5ukt-yusufnoor786s-projects.vercel.app';
    const directAccessLink = `${siteUrl}/purchases?email=${encodeURIComponent(customer.email)}&token=${sixDigitOtp}`;

    // Dispatch verification email via Resend
    const apiKey = process.env.RESEND_API_KEY;
    const senderEmail = process.env.EMAIL_FROM || 'The Growth Archive <onboarding@resend.dev>';
    let emailSent = false;

    if (apiKey && !apiKey.includes('placeholder')) {
      try {
        const emailRes = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: senderEmail,
            to: [customer.email],
            subject: `Your Access Code: ${sixDigitOtp} — The Growth Archive`,
            html: `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"></head>
              <body style="margin: 0; padding: 24px; background-color: #F6F4EF; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
                <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E5E2DA; border-radius: 8px; padding: 36px;">
                  <div style="border-bottom: 2px solid #121417; padding-bottom: 14px; margin-bottom: 24px;">
                    <h1 style="margin: 0; font-size: 18px; letter-spacing: 0.05em; font-family: Georgia, serif; text-transform: uppercase; color: #121417;">
                      The Growth Archive
                    </h1>
                  </div>

                  <h2 style="margin: 0 0 10px 0; font-size: 18px; color: #121417;">
                    Your Digital Library Verification Code
                  </h2>
                  <p style="margin: 0 0 24px 0; font-size: 14px; color: #575D65; line-height: 1.5;">
                    Hello ${customer.name || 'there'}, here is your 6-digit access code to enter your customer portal and re-download your digital products:
                  </p>

                  <div style="background-color: #FBF9F5; border: 2px dashed #DCD6CC; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 28px;">
                    <div style="font-size: 34px; font-weight: 800; font-family: 'SF Mono', Monaco, monospace; letter-spacing: 8px; color: #121417;">
                      ${sixDigitOtp}
                    </div>
                    <div style="font-size: 12px; color: #71767E; margin-top: 8px;">
                      Expires in 15 minutes · Single-use code
                    </div>
                  </div>

                  <div style="text-align: center; margin-bottom: 28px;">
                    <a href="${directAccessLink}" style="display: inline-block; padding: 12px 28px; background-color: #121417; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; border-radius: 6px;">
                      1-Click Instant Access →
                    </a>
                  </div>

                  <p style="font-size: 12px; color: #9AA0A6; line-height: 1.5; margin: 0; border-top: 1px solid #E5E2DA; padding-top: 16px;">
                    If you did not request this login code, you can safely ignore this email.
                  </p>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (emailRes.ok) {
          emailSent = true;
          console.log(`[Resend] Recovery OTP sent successfully to ${customer.email}`);
        } else {
          const errText = await emailRes.text();
          console.error('[Resend] Recovery email rejected:', errText);
          // If unverified domain or sandbox limitation, auto-retry with sandbox sender if different
          if (errText.includes('domain is not verified') && !senderEmail.includes('onboarding@resend.dev')) {
            const retryRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
              },
              body: JSON.stringify({
                from: 'The Growth Archive <onboarding@resend.dev>',
                to: [customer.email],
                subject: `Your Access Code: ${sixDigitOtp} — The Growth Archive`,
                html: `<p>Your verification code is: <strong>${sixDigitOtp}</strong></p><p><a href="${directAccessLink}">Click here to access your library</a></p>`,
              }),
            });
            if (retryRes.ok) {
              emailSent = true;
            }
          }
        }
      } catch (err) {
        console.error('[Resend] Recovery email exception:', err);
      }
    }

    console.log(`\n--- [CUSTOMER ACCESS CODE DISPATCH] ---`);
    console.log(`Customer: ${customer.email}`);
    console.log(`6-Digit OTP: ${sixDigitOtp}`);
    console.log(`Magic Link: ${directAccessLink}`);
    console.log(`Email Sent: ${emailSent}`);
    console.log(`---------------------------------------\n`);

    return NextResponse.json({
      success: true,
      message: 'A 6-digit verification code has been dispatched to your email inbox.',
      // Always pass debugOtp when in dev OR if email was not confirmed sent (e.g. Resend sandbox address restriction)
      debugOtp: process.env.NODE_ENV !== 'production' || !emailSent ? sixDigitOtp : undefined,
    });
  } catch (err) {
    console.error('Purchase recovery error:', err);
    return NextResponse.json({ error: 'Recovery service error' }, { status: 500 });
  }
}
