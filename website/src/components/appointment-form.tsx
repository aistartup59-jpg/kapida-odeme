"use client";

import { useId, useState } from "react";
import {
  AUDIENCES,
  AUDIENCE_LABELS,
  EMPTY_APPOINTMENT,
  validateAppointment,
  type AppointmentErrors,
  type AppointmentInput,
  type Audience,
} from "@/lib/appointment";

type Status = "idle" | "sending" | "sent" | "error";

const FIELD =
  "w-full rounded-xl border border-line bg-white px-4 py-3 text-base outline-none transition-colors placeholder:text-faint focus:border-pink focus:ring-2 focus:ring-pink/20 aria-[invalid=true]:border-red-500";

export function AppointmentForm() {
  const formId = useId();
  const [values, setValues] = useState<AppointmentInput>(EMPTY_APPOINTMENT);
  const [errors, setErrors] = useState<AppointmentErrors>({});
  const [status, setStatus] = useState<Status>("idle");
  const [failureMessage, setFailureMessage] = useState("");
  // Bots fill every field they find; people never see this one.
  const [honeypot, setHoneypot] = useState("");

  function update<K extends keyof AppointmentInput>(key: K, value: AppointmentInput[K]) {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const validated = validateAppointment(values);
    if (!validated.ok) {
      setErrors(validated.errors);
      setStatus("idle");
      return;
    }

    setStatus("sending");
    setFailureMessage("");

    try {
      const response = await fetch("/api/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validated.data, website: honeypot }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          errors?: AppointmentErrors;
        } | null;

        if (body?.errors) {
          setErrors(body.errors);
          setStatus("idle");
          return;
        }

        throw new Error(`Beklenmeyen yanıt: ${response.status}`);
      }

      setValues(EMPTY_APPOINTMENT);
      setStatus("sent");
    } catch {
      setFailureMessage(
        "Talebiniz gönderilemedi. Bağlantınızı kontrol edip tekrar deneyin ya da bize doğrudan yazın.",
      );
      setStatus("error");
    }
  }

  if (status === "sent") {
    return (
      <div role="status" className="rounded-2xl bg-white p-8 text-ink">
        <h3 className="font-display text-xl font-semibold">Talebiniz bize ulaştı.</h3>
        <p className="mt-3 text-muted">
          En kısa sürede yazdığınız e-posta adresinden dönüş yapıp randevuyu netleştireceğiz.
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-6 text-[0.9rem] font-semibold text-pink-deep underline underline-offset-4"
        >
          Yeni bir talep gönder
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl bg-white p-6 text-ink shadow-[0_40px_80px_-40px_rgba(0,0,0,0.55)] sm:p-8"
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id={`${formId}-name`} label="Ad soyad" error={errors.name} required>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="name"
              value={values.name}
              onChange={(event) => update("name", event.target.value)}
              className={FIELD}
            />
          )}
        </Field>

        <Field id={`${formId}-company`} label="İşletme / şirket" error={errors.company}>
          {(props) => (
            <input
              {...props}
              type="text"
              autoComplete="organization"
              value={values.company}
              onChange={(event) => update("company", event.target.value)}
              className={FIELD}
            />
          )}
        </Field>

        <Field id={`${formId}-email`} label="E-posta" error={errors.email} required>
          {(props) => (
            <input
              {...props}
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={(event) => update("email", event.target.value)}
              className={FIELD}
            />
          )}
        </Field>

        <Field id={`${formId}-phone`} label="Telefon" error={errors.phone}>
          {(props) => (
            <input
              {...props}
              type="tel"
              autoComplete="tel"
              placeholder="+90 5xx xxx xx xx"
              value={values.phone}
              onChange={(event) => update("phone", event.target.value)}
              className={FIELD}
            />
          )}
        </Field>
      </div>

      <fieldset className="mt-6">
        <legend className="text-sm font-medium">Hangi taraftasınız?</legend>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          {AUDIENCES.map((audience) => (
            <label
              key={audience}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-colors ${
                values.audience === audience
                  ? "border-pink bg-pink-tint"
                  : "border-line hover:bg-surface"
              }`}
            >
              <input
                type="radio"
                name={`${formId}-audience`}
                value={audience}
                checked={values.audience === audience}
                onChange={() => update("audience", audience as Audience)}
                className="size-4 accent-pink"
              />
              {AUDIENCE_LABELS[audience]}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-6 grid gap-5">
        <Field
          id={`${formId}-preferredAt`}
          label="Tercih ettiğiniz gün ve saat"
          hint="Zorunlu değil — uymazsa birlikte başka bir zaman buluruz."
          error={errors.preferredAt}
        >
          {(props) => (
            <input
              {...props}
              type="datetime-local"
              value={values.preferredAt}
              onChange={(event) => update("preferredAt", event.target.value)}
              className={FIELD}
            />
          )}
        </Field>

        <Field id={`${formId}-message`} label="Mesaj" error={errors.message}>
          {(props) => (
            <textarea
              {...props}
              rows={4}
              placeholder="Günde kaç teslimat yapıyorsunuz, hangi ödeme yöntemlerine ihtiyacınız var?"
              value={values.message}
              onChange={(event) => update("message", event.target.value)}
              className={`${FIELD} resize-y`}
            />
          )}
        </Field>
      </div>

      {/* Honeypot: hidden from people, irresistible to bots. */}
      <div aria-hidden className="hidden">
        <label htmlFor={`${formId}-website`}>Web sitesi</label>
        <input
          id={`${formId}-website`}
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {status === "error" ? (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {failureMessage}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={status === "sending"}
          className="inline-flex items-center justify-center rounded-lg bg-pink px-7 py-3 text-[0.9rem] font-semibold text-white transition-colors hover:bg-pink-deep disabled:cursor-not-allowed disabled:opacity-60"
        >
          {status === "sending" ? "Gönderiliyor…" : "Randevu talebi gönder"}
        </button>
        <p className="text-sm text-muted">Bilgileriniz yalnızca bu görüşme için kullanılır.</p>
      </div>
    </form>
  );
}

type FieldProps = {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: (props: {
    id: string;
    "aria-invalid": boolean;
    "aria-describedby": string | undefined;
  }) => React.ReactNode;
};

function Field({ id, label, hint, error, required, children }: FieldProps) {
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;

  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required ? <span className="text-pink"> *</span> : null}
      </label>
      <div className="mt-2">
        {children({
          id,
          "aria-invalid": Boolean(error),
          "aria-describedby": describedBy,
        })}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-sm text-red-600">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-sm text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
