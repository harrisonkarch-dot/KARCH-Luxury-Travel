// Receives Journal signups and emails them to Harrison so the address can be
// added to his list. Deliberately minimal - this is a capture point, not a
// mailing platform. When the list is worth automating, the same endpoint can
// forward to Resend Audiences or Mailchimp without the front end changing.
//
// Reuses the same env vars as api/inquiry.mjs:
//   RESEND_API_KEY  - from resend.com
//   INQUIRY_TO      - where signups land
//
// Returns 501 when unconfigured so the form can say so plainly rather than
// pretending it worked.

const ESCAPE = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ESCAPE[c]);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.RESEND_API_KEY;
  const to = process.env.INQUIRY_TO;
  if (!key || !to) {
    return res.status(501).json({ error: "Signups are not configured yet." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Malformed request." }); }
  }
  body = body || {};

  // Honeypot: real people never see this field, bots fill it in.
  if (body.company) return res.status(200).json({ ok: true });

  const email = String(body.email || "").trim();
  const name = String(body.name || "").trim();
  const source = String(body.source || "").trim().slice(0, 120);

  if (!email) return res.status(400).json({ error: "An email address is required." });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: "That email address looks wrong." });
  }

  const html = `
    <div style="max-width:620px;margin:0 auto;font-family:sans-serif">
      <p style="font:700 11px sans-serif;letter-spacing:.22em;text-transform:uppercase;color:#8c6b34">New Journal signup</p>
      <h1 style="font:600 24px Georgia,serif;color:#111;margin:6px 0 18px">${esc(name || email)}</h1>
      <table style="border-collapse:collapse;width:100%">
        <tr><td style="padding:6px 16px 6px 0;color:#8c6b34;font:600 12px sans-serif;text-transform:uppercase;letter-spacing:.08em">Email</td>
            <td style="padding:6px 0;font:400 15px sans-serif;color:#111">${esc(email)}</td></tr>
        ${name ? `<tr><td style="padding:6px 16px 6px 0;color:#8c6b34;font:600 12px sans-serif;text-transform:uppercase;letter-spacing:.08em">Name</td>
            <td style="padding:6px 0;font:400 15px sans-serif;color:#111">${esc(name)}</td></tr>` : ""}
        ${source ? `<tr><td style="padding:6px 16px 6px 0;color:#8c6b34;font:600 12px sans-serif;text-transform:uppercase;letter-spacing:.08em">Signed up on</td>
            <td style="padding:6px 0;font:400 15px sans-serif;color:#111">${esc(source)}</td></tr>` : ""}
      </table>
      <p style="margin-top:26px;font:400 13px sans-serif;color:#777">Add this address to your Journal list. Sent from karchluxurytravel.com</p>
    </div>`;

  try {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "KARCH Website <onboarding@resend.dev>", // swap for the verified domain once set up
        to: [to],
        reply_to: email,
        subject: `Journal signup — ${name || email}`,
        html,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      console.error("Resend rejected the signup:", r.status, detail);
      return res.status(502).json({ error: "Could not complete the signup." });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Signup failed:", err);
    return res.status(502).json({ error: "Could not complete the signup." });
  }
}
