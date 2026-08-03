import { DeviceShot } from "@/components/device";
import { IconArrow, IconCash, IconNfc, IconQr } from "@/components/icons";
import { Badge, Button, Eyebrow } from "@/components/ui";

const claims = [
  { title: "Gerçek banka karekodu", detail: "TR Karekod / EMV QR", now: true },
  { title: "Parçalı tahsilat", detail: "Karekod + nakit, tek kayıtta", now: true },
  {
    title: "Temassız kart ve Güvenli Mod",
    detail: "Sağlayıcı entegrasyonuyla",
    now: false,
  },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/*
        Pink as a light source rather than a fill. Three layers: a wide bed under
        the whole hero, a hot core behind the device, and a warm third that stops
        the lower left from going flat. On white this has to be denser than it
        would be on a dark ground to read as light at all.
      */}
      <div aria-hidden className="pointer-events-none absolute inset-0 z-0">
        <span className="absolute left-1/2 top-[42%] h-[min(46rem,95vw)] w-[min(76rem,155vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(240,1,97,0.24),rgba(240,1,97,0.08)_55%,transparent_78%)] blur-[28px]" />
        <span className="absolute left-[62%] top-[46%] h-[min(34rem,86vw)] w-[min(34rem,86vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(240,1,97,0.4),rgba(240,1,97,0.12)_52%,transparent_74%)] blur-[22px] lg:left-[72%]" />
        <span className="absolute left-[16%] top-[78%] h-[min(22rem,62vw)] w-[min(22rem,62vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,191,46,0.2),transparent_72%)] blur-[26px]" />
      </div>

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-[clamp(2.75rem,6vw,4rem)] px-[clamp(1.15rem,5vw,3.5rem)] pb-[clamp(3rem,7vw,5rem)] pt-[clamp(3rem,7vw,5.5rem)] lg:grid-cols-[1fr_auto]">
        <div>
          <Eyebrow>Ödemeyi kolaylaştırır</Eyebrow>

          <h1 className="mb-[1.3rem] mt-[1.1rem] max-w-[13ch] text-balance font-display text-[clamp(2.35rem,6vw,4.1rem)] font-semibold leading-none tracking-[-0.02em]">
            Ödeme kapıda başlar, kapıda biter.
          </h1>

          <p className="max-w-[46ch] text-[clamp(1.02rem,2vw,1.14rem)] text-ink-2">
            Kuryenin cebindeki tek bir Android cihaz tahsilatın tamamını görür: bankanın gerçek
            karekodunu üretir, nakiti düşer, kalanı anında yeniden hesaplar. Ek terminal yok,
            ikinci uygulama yok, müşteriye gönderilen bir ödeme linki hiç yok.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="#randevu">
              Demo randevusu al
              <IconArrow className="size-[1.05em]" />
            </Button>
            <Button href="#nasil" variant="line">
              Nasıl çalıştığını gör
            </Button>
          </div>

          <ul className="mt-10 max-w-[31rem]">
            {claims.map((claim) => (
              <li
                key={claim.title}
                className="flex items-center justify-between gap-4 border-t border-line py-[0.85rem] text-[0.9rem] last:border-b"
              >
                <b className={claim.now ? "font-semibold" : "font-semibold text-muted"}>
                  {claim.title}
                </b>
                <span className="flex items-center gap-2 text-right text-muted">
                  {claim.detail}
                  {claim.now ? null : <Badge tone="line">Yakında</Badge>}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Annotation badges. The only rotated things on the page — sticker energy
            stays here and the rest stays straight. */}
        <div className="relative justify-self-center">
          <Badge
            tone="ink"
            className="absolute -left-10 top-[12%] z-[3] -rotate-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.4)] max-sm:-left-2"
          >
            <IconQr className="size-[0.95rem]" /> TR Karekod
          </Badge>
          <Badge className="absolute -right-9 top-[44%] z-[3] rotate-2 shadow-[0_8px_24px_-12px_rgba(0,0,0,0.35)] max-sm:-right-2">
            <IconCash className="size-[0.95rem]" /> Nakit karışık
          </Badge>
          <Badge
            tone="line"
            className="absolute -left-9 bottom-[13%] z-[3] rotate-1 text-faint shadow-[0_8px_24px_-12px_rgba(0,0,0,0.3)] max-sm:-left-1"
          >
            <IconNfc className="size-[0.95rem]" /> NFC · yakında
          </Badge>

          <DeviceShot
            src="qr"
            alt="PayALS uygulamasında bankanın ürettiği karekodun gösterildiği tahsilat ekranı"
            glow
            priority
          />
        </div>
      </div>
    </section>
  );
}
