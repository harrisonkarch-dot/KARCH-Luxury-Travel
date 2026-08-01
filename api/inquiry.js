// Receives trip inquiries from inquire.html and emails them to Harrison.
//
// Requires two environment variables set in the Vercel project:
//   RESEND_API_KEY  - from resend.com (free tier covers 3,000 emails/month)
//   INQUIRY_TO      - where inquiries land, e.g. harrison@karchluxurytravelconcierge.com
//
// If RESEND_API_KEY is absent this returns 501, which makes the form fall back
// to a prefilled mailto: on the client. That is deliberate - a silent failure
// would lose real business, so the failure mode is always visible and recoverable.

const ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ESCAPE[c]);

const FIELDS = [
  ["name", "Name"],
  ["email", "Email"],
  ["destination", "Destination"],
  ["triptype", "Trip type"],
  ["dates", "Dates"],
  ["travellers", "Travelling"],
];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO;
  if (!key || !to) {
    // Not configured yet - tell the client so it can offer the mailto fallback.
    return res.status(501).json({ error: "Email delivery is not configured yet." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Malformed request." }); }
  }
  body = body || {};

  // Honeypot: real people never see this field, bots fill it in.
  if (body.company) return res.status(200).json({ ok: true });

  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim();
  if (!name || !email) return res.status(400).json({ error: "Name and email are required." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "That email address looks wrong." });

  const rows = FIELDS
    .map(([k, label]) => {
      const v = String(body[k] || "").trim();
      return v ? `<tr><td style="padding:6px 16px 6px 0;color:#8c6b34;font:600 12px sans-serif;text-transform:uppercase;letter-spacing:.08em;vertical-align:top">${esc(label)}</td><td style="padding:6px 0;font:400 15px sans-serif;color:#111">${esc(v)}</td></tr>`;
    })
    .join("");

  const notes = String(body.notes || "").trim();
  const html = `
    <div style="max-width:620px;margin:0 auto;font-family:sans-serif">
      <p style="font:700 11px sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#8c6b34">New trip inquiry</p>
      <h1 style="font:600 26px Georgia,serif;color:#111;margin:6px 0 20px">${esc(name)}</h1>
      <table style="border-collapse:collapse;width:100%">${rows}</table>
      ${notes ? `<p style="margin-top:22px;font:600 12px sans-serif;text-transform:uppercase;letter-spacing:.08em;color:#8c6b34">Notes</p>
                 <p style="font:400 15px/1.6 sans-serif;color:#111;white-space:pre-wrap">${esc(notes)}</p>` : ""}
      <p style="margin-top:28px;font:400 13px sans-serif;color:#777">Sent from the inquiry form on karchluxurytravel.com</p>
    </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "KARCH Website <onboarding@resend.dev>", // swap for your verified domain once set up
        to: [to],
        reply_to: email,                                // replying goes straight to the client
        subject: `Trip inquiry — ${name}`,
        html,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Resend rejected the send:", r.status, detail);
      return res.status(502).json({ error: "Could not send the message." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Inquiry send failed:", err);
    return res.status(502).json({ error: "Could not send the message." });
  }
}
