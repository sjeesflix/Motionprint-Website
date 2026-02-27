/**
 * Motionprint Contact Form — Cloudflare Worker
 *
 * Receives form submissions via POST and sends an email
 * to info@motion-print.com using MailChannels (free with CF Workers).
 *
 * ─── SETUP ───
 * 1. Install Wrangler CLI:        npm install -g wrangler
 * 2. Login to Cloudflare:         wrangler login
 * 3. Create a new Workers project: wrangler init motionprint-contact
 * 4. Replace the generated worker code with this file.
 * 5. In wrangler.toml set:
 *      name = "motionprint-contact"
 *      main = "worker.js"
 *      compatibility_date = "2024-01-01"
 * 6. Deploy:                      wrangler deploy
 * 7. Copy the deployed URL (e.g. https://motionprint-contact.YOUR-SUBDOMAIN.workers.dev)
 *    and paste it into index.html → WORKER_URL (replace the placeholder).
 *
 * ─── DNS (required for MailChannels) ───
 * Add a TXT record on your domain (motion-print.com):
 *   Type: TXT
 *   Name: _mailchannels
 *   Value: v=mc1 cfid=YOUR-SUBDOMAIN.workers.dev
 * This authorizes MailChannels to send on behalf of your domain.
 *
 * ─── CORS ───
 * Update ALLOWED_ORIGINS below with your actual domain(s).
 */

const TO_EMAIL = 'info@motion-print.com';
const FROM_EMAIL = 'noreply@motion-print.com';
const FROM_NAME = 'Motionprint Website';
const ALLOWED_ORIGINS = [
  'https://motion-print.com',
  'https://www.motion-print.com',
  'http://localhost:3000',       // dev
  'http://127.0.0.1:3000',      // dev
];

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return corsResponse(request, new Response(null, { status: 204 }));
    }

    // Only accept POST to /contact
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/contact') {
      return corsResponse(request, new Response('Not found', { status: 404 }));
    }

    try {
      const body = await request.json();

      // Validate required fields
      const { name, email, company } = body;
      if (!name || !email || !company) {
        return corsResponse(request, Response.json(
          { error: 'Name, email, and company are required.' },
          { status: 400 }
        ));
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return corsResponse(request, Response.json(
          { error: 'Invalid email address.' },
          { status: 400 }
        ));
      }

      // Compose email body
      const topic = body.topic || 'General inquiry';
      const lines = [
        `New form submission from the Motionprint website:\n`,
        `Topic:   ${topic}`,
        `Name:    ${name}`,
        `Email:   ${email}`,
        `Company: ${company}`,
      ];
      if (body.role)    lines.push(`Role:    ${body.role}`);
      if (body.phone)   lines.push(`Phone:   ${body.phone}`);
      if (body.message) lines.push(`\nMessage:\n${body.message}`);
      const text = lines.join('\n');

      // Send via MailChannels API
      const mailRes = await fetch('https://api.mailchannels.net/tx/v1/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: TO_EMAIL }] }],
          from: { email: FROM_EMAIL, name: FROM_NAME },
          reply_to: { email: email, name: name },
          subject: `${topic} — ${company} (${name})`,
          content: [{ type: 'text/plain', value: text }],
        }),
      });

      if (!mailRes.ok) {
        const errText = await mailRes.text();
        console.error('MailChannels error:', errText);
        return corsResponse(request, Response.json(
          { error: 'Failed to send email.' },
          { status: 502 }
        ));
      }

      return corsResponse(request, Response.json({ ok: true }));

    } catch (err) {
      console.error('Worker error:', err);
      return corsResponse(request, Response.json(
        { error: 'Internal error.' },
        { status: 500 }
      ));
    }
  }
};

function corsResponse(request, response) {
  const origin = request.headers.get('Origin') || '';
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  const headers = new Headers(response.headers);
  headers.set('Access-Control-Allow-Origin', allowed);
  headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type');
  headers.set('Access-Control-Max-Age', '86400');
  return new Response(response.body, {
    status: response.status,
    headers,
  });
}
