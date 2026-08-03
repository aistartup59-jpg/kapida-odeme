import { DeviceShot } from "@/components/device";
import { Section } from "@/components/ui";

const steps = [
  {
    kicker: "TUTAR",
    title: "Tutar cihaza gelir",
    body: "Küçük işletmelerde çalışan tutarı elle girer. Sipariş platformlarında tutar platformun kendi sisteminden gelir — kurye hiçbir rakam yazmaz, dolayısıyla yanlış tutar tahsil etme ihtimali ortadan kalkar.",
    shot: "home" as const,
    alt: "PayALS ana ekranı: tutar alanı ve tahsilata başla butonu",
  },
  {
    kicker: "ÖDEME",
    title: "Müşteri öder",
    body: "Karekod ya da nakit. Biri tutarın tamamını karşılamazsa tahsilat baştan başlamaz — kalan tutar anında yeniden hesaplanır ve kaldığı yerden devam eder.",
    shot: "partial" as const,
    alt: "Kısmen ödenmiş tahsilat: 480 liralık tahsilatın 180 lirası alınmış, 300 lira kalmış",
  },
  {
    kicker: "KAPANIŞ",
    title: "Tahsilat kapanır",
    body: "Her ödeme ayrı bir kayıt olarak eklenir ve tahsilat geçmişinde tek tek görünür. Tutarın tamamı toplandığında tahsilat kendiliğinden kapanır.",
    shot: "done" as const,
    alt: "Tamamlanmış tahsilat: kalan tutar sıfır, geçmişte iki ayrı ödeme kaydı",
  },
];

export function HowItWorks() {
  return (
    <Section
      id="nasil"
      eyebrow="Nasıl çalışır"
      title="Kapıda geçen bir dakika."
      description="Tutar girilir, müşteri öder, tahsilat kapanır. Kuryenin öğrenmesi gereken üç ekran var, üçü de aynı uygulamada — ayrı bir cihaz, ayrı bir uygulama ya da eğitim gerektiren bir akış yok."
      tone="surface"
    >
      <ol className="mt-12 grid gap-[clamp(2.5rem,5vw,3rem)] lg:grid-cols-3">
        {steps.map((step, index) => (
          // content-start matters: the steps stretch to the tallest column, and a
          // stretched grid would share that slack out between the rows — pushing
          // each device down by a different amount and knocking the three out of line.
          <li
            key={step.kicker}
            className="grid content-start justify-items-center gap-5 text-center"
          >
            <span className="inline-flex items-center gap-2 font-mono text-[0.72rem] tracking-[0.14em] text-pink">
              <b className="grid size-[1.6rem] place-items-center rounded-full bg-ink font-sans text-[0.78rem] text-white">
                {index + 1}
              </b>
              {step.kicker}
            </span>

            <DeviceShot src={step.shot} alt={step.alt} size="sm" />

            <div className="max-w-[32ch]">
              <h3 className="mb-1 font-display text-[1.2rem] font-semibold tracking-[-0.01em]">
                {step.title}
              </h3>
              <p className="text-[0.92rem] text-muted">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
