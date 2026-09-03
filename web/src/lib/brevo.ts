/**
 * Brevo (formerly Sendinblue) transactional email, over its REST API rather
 * than the `@getbrevo/brevo` SDK — this project sends exactly one kind of
 * email, so a `fetch` call and a JSON body outweigh a wrapper package built
 * for the whole API surface. Same reasoning as razorpay.ts.
 *
 * Must never be imported from a Client Component: it reads the API key.
 */

const API_BASE = "https://api.brevo.com/v3";

/**
 * Read at call time, not at module load, so a missing key fails only the one
 * email that needed it rather than crashing the whole server on boot.
 */
function credentials(): { apiKey: string; senderEmail: string; senderName: string } {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;

  if (!apiKey || !senderEmail) {
    throw new Error("BREVO_API_KEY and BREVO_SENDER_EMAIL must be set to send email.");
  }

  return {
    apiKey,
    senderEmail,
    senderName: process.env.BREVO_SENDER_NAME || "Salman Perfumes",
  };
}

export async function sendEmail(input: {
  to: { email: string; name?: string }[];
  subject: string;
  html: string;
}): Promise<void> {
  const { apiKey, senderEmail, senderName } = credentials();

  const res = await fetch(`${API_BASE}/smtp/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { email: senderEmail, name: senderName },
      to: input.to,
      subject: input.subject,
      htmlContent: input.html,
    }),
  });

  if (!res.ok) {
    // Brevo puts the useful part in message; the raw body is the fallback for
    // a non-JSON failure.
    const body = await res.text();
    let message = body;
    try {
      message = JSON.parse(body)?.message ?? body;
    } catch {
      // keep the raw body
    }
    throw new Error(`Brevo email send failed (${res.status}): ${message}`);
  }
}
