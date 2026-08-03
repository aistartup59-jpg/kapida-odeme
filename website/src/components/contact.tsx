import { Section } from "@/components/ui";
import { contactChannels } from "@/lib/site-config";

export function Contact() {
  return (
    <Section
      id="iletisim"
      eyebrow="İletişim"
      title="Randevu almadan da yazabilirsiniz."
      description="Sorunuz kısaysa form doldurmanıza gerek yok."
    >
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {contactChannels.map((channel) => (
          <a
            key={channel.id}
            href={channel.href}
            className="rounded-2xl border border-line p-6 transition-colors hover:bg-surface"
          >
            <p className="text-[0.85rem] font-semibold text-pink-deep">{channel.label}</p>
            <p className="mt-2 break-words font-display text-[1.15rem] font-medium">
              {channel.value}
            </p>
            <p className="mt-2 text-[0.9rem] text-muted">{channel.hint}</p>
          </a>
        ))}
      </div>
    </Section>
  );
}
