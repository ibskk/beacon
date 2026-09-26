import { createHash } from "node:crypto";

/**
 * Netlify event-triggered function. Fires on every verified submission to the
 * `waitlist` form and pushes the signup to the email tool.
 *
 * Provider is chosen by which credentials are present, so the same deploy works
 * for either tool and stays inert until one is configured:
 *   Mailchimp  - MAILCHIMP_API_KEY, MAILCHIMP_LIST_ID
 *   ConvertKit - CONVERTKIT_API_KEY, CONVERTKIT_FORM_ID
 */

type Payload = {
  form_name?: string;
  data?: Record<string, unknown>;
};

const TIMEOUT_MS = 8000;

function str(value: unknown): string {
  if (Array.isArray(value)) return value.map(str).filter(Boolean).join(", ");
  return typeof value === "string" ? value.trim() : "";
}

async function post(url: string, init: RequestInit) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...init, signal: controller.signal });
    const body = await res.text();
    return { ok: res.ok, status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}

async function toMailchimp(fields: Record<string, string>) {
  const key = Netlify.env.get("MAILCHIMP_API_KEY")!;
  const listId = Netlify.env.get("MAILCHIMP_LIST_ID")!;
  const dc = key.split("-")[1];
  if (!dc) throw new Error("MAILCHIMP_API_KEY is missing its -usX datacenter suffix");

  // PUT on the subscriber hash upserts, so a repeat signup updates instead of erroring.
  const hash = createHash("md5").update(fields.email.toLowerCase()).digest("hex");

  return post(`https://${dc}.api.mailchimp.com/3.0/lists/${listId}/members/${hash}`, {
    method: "PUT",
    headers: {
      Authorization: `Basic ${Buffer.from(`anystring:${key}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email_address: fields.email,
      status_if_new: "subscribed",
      merge_fields: {
        FNAME: fields.first_name,
        CITY: fields.city,
        SPORTS: fields.sports,
        MYCODE: fields.my_code,
        REFBY: fields.referred_by,
      },
      tags: [fields.city, ...(fields.referred_by ? ["referred"] : [])].filter(Boolean),
    }),
  });
}

async function toConvertKit(fields: Record<string, string>) {
  const key = Netlify.env.get("CONVERTKIT_API_KEY")!;
  const formId = Netlify.env.get("CONVERTKIT_FORM_ID")!;

  return post(`https://api.convertkit.com/v3/forms/${formId}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      email: fields.email,
      first_name: fields.first_name,
      fields: {
        city: fields.city,
        sports: fields.sports,
        my_code: fields.my_code,
        referred_by: fields.referred_by,
      },
    }),
  });
}

export default async (req: Request) => {
  let payload: Payload;
  try {
    payload = (await req.json()) as Payload;
  } catch {
    return new Response("bad payload", { status: 400 });
  }

  const form = payload.form_name ?? "";
  if (form && form !== "waitlist") {
    return new Response(`ignored form ${form}`, { status: 200 });
  }

  const data = payload.data ?? {};
  const fields = {
    email: str(data.email).toLowerCase(),
    first_name: str(data.first_name),
    city: str(data.city),
    sports: str(data["sports[]"] ?? data.sports),
    my_code: str(data.my_code),
    referred_by: str(data.referred_by),
    adult: str(data.adult),
  };

  if (!fields.email.includes("@")) {
    console.warn("skip: no usable email on submission");
    return new Response("no email", { status: 200 });
  }

  // 18+ is confirmed at signup. No confirmation, no mail. CASL and the brief both require this.
  if (fields.adult.toLowerCase() !== "yes") {
    console.warn("skip: 18+ not confirmed, not subscribing");
    return new Response("age not confirmed", { status: 200 });
  }

  const hasMailchimp = Boolean(
    Netlify.env.get("MAILCHIMP_API_KEY") && Netlify.env.get("MAILCHIMP_LIST_ID"),
  );
  const hasConvertKit = Boolean(
    Netlify.env.get("CONVERTKIT_API_KEY") && Netlify.env.get("CONVERTKIT_FORM_ID"),
  );

  if (!hasMailchimp && !hasConvertKit) {
    // Deployed but not yet configured. Log and pass, so signups are never lost
    // to a 500 and the Netlify submission record stays the source of truth.
    console.log(`bridge idle, no provider configured. queued locally: ${fields.email}`);
    return new Response("no provider configured", { status: 200 });
  }

  const provider = hasMailchimp ? "mailchimp" : "convertkit";

  try {
    const res = hasMailchimp ? await toMailchimp(fields) : await toConvertKit(fields);
    if (!res.ok) {
      console.error(`${provider} rejected ${fields.email}: ${res.status} ${res.body.slice(0, 400)}`);
      return new Response("provider error", { status: 502 });
    }
    console.log(`${provider}: subscribed ${fields.email} (${fields.city || "no city"})`);
    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error(`${provider} call failed for ${fields.email}:`, err);
    return new Response("provider call failed", { status: 502 });
  }
};
