import { NextResponse } from "next/server";
import {
  AUDIENCE_LABELS,
  validateAppointment,
  type AppointmentInput,
} from "@/lib/appointment";

/**
 * Appointment requests are delivered by e-mail through Resend's REST API. Called
 * directly with fetch rather than through the SDK — this is one POST, and it keeps
 * the site's dependency list at three packages.
 */
const RESEND_ENDPOINT = "https://api.resend.com/emails";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  // The honeypot is never filled by a person. Answer as if it worked, so a bot
  // learns nothing and does not come back to try a different shape.
  const honeypot = (payload as { website?: unknown })?.website;
  if (typeof honeypot === "string" && honeypot.trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  const validated = validateAppointment(payload);
  if (!validated.ok) {
    return NextResponse.json({ errors: validated.errors }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.APPOINTMENT_TO_EMAIL;
  const from = process.env.APPOINTMENT_FROM_EMAIL;

  if (!apiKey || !to || !from) {
    console.error(
      "Appointment e-mail is not configured: RESEND_API_KEY, APPOINTMENT_TO_EMAIL and APPOINTMENT_FROM_EMAIL are all required.",
    );
    return NextResponse.json({ error: "not_configured" }, { status: 500 });
  }

  const appointment = validated.data;

  let response: Response;
  try {
    response = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: appointment.email,
        subject: `Randevu talebi — ${appointment.name}${
          appointment.company ? ` (${appointment.company})` : ""
        }`,
        text: formatAppointment(appointment),
      }),
    });
  } catch (error) {
    console.error("Appointment e-mail could not be dispatched.", error);
    return NextResponse.json({ error: "dispatch_failed" }, { status: 502 });
  }

  if (!response.ok) {
    // Body is logged, never returned — it can carry provider detail the visitor
    // has no business seeing.
    console.error(
      `Resend rejected the appointment e-mail (${response.status}):`,
      await response.text().catch(() => "<unreadable body>"),
    );
    return NextResponse.json({ error: "dispatch_failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

function formatAppointment(appointment: AppointmentInput): string {
  const lines = [
    `Ad soyad     : ${appointment.name}`,
    `İşletme      : ${appointment.company || "—"}`,
    `E-posta      : ${appointment.email}`,
    `Telefon      : ${appointment.phone || "—"}`,
    `Taraf        : ${AUDIENCE_LABELS[appointment.audience]}`,
    `Tercih ettiği: ${appointment.preferredAt || "—"}`,
    "",
    "Mesaj:",
    appointment.message || "—",
  ];

  return lines.join("\n");
}
