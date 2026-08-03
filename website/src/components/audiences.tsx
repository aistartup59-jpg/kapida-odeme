import { IconCheck, IconPhone, IconPlug } from "@/components/icons";
import { Badge, Section } from "@/components/ui";

const businessPoints = [
  "İşletme ve çalışan hesapları, ayrı yetkilerle",
  "Tutar cihazda elle girilir",
  "Karekod ve nakit aynı ekranda",
  "Kimin ne tahsil ettiği tek yerden görünür",
];

const platformPoints = [
  "Kurye için hesap, şifre ve oturum yok",
  "Tutarı kurye değil, sizin sisteminiz belirler",
  "Ödeme sonucu sunucudan sunucuya doğrulanır",
];

const flow = [
  {
    Icon: IconPlug,
    before: "Sisteminiz tahsilatı başlatır ve ",
    strong: "tek kullanımlık",
    after: " bir anahtar alır",
  },
  {
    Icon: IconPhone,
    before: "Kuryenin telefonunda ",
    strong: "yalnız o tahsilat",
    after: " açılır",
  },
  {
    Icon: IconCheck,
    before: "Sonucu kuryenin ekranından değil, ",
    strong: "kendi API anahtarınızla",
    after: " doğrularsınız",
  },
];

function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 grid gap-[0.7rem] border-t border-line pt-5 text-[0.92rem]">
      {items.map((item) => (
        <li key={item} className="grid grid-cols-[auto_1fr] items-start gap-[0.7rem]">
          <i className="mt-[0.55rem] size-[0.45rem] rounded-full bg-pink" />
          {item}
        </li>
      ))}
    </ul>
  );
}

export function Audiences() {
  return (
    <Section
      id="kimler"
      eyebrow="Kimler için"
      title="Tek uygulama, iki farklı çalışma şekli."
      description="Aynı tahsilat altyapısı; kapıdaki kişinin kim olduğuna göre değişen bir akış."
    >
      <div className="mt-12 grid gap-5 lg:grid-cols-2">
        <article className="grid content-start gap-4 rounded-2xl border border-line bg-paper p-[clamp(1.5rem,3vw,2.1rem)]">
          <Badge tone="line" className="justify-self-start">
            <IconPhone className="size-[0.95rem]" /> Küçük işletmeler
          </Badge>
          <h3 className="font-display text-[1.5rem] font-semibold tracking-[-0.015em]">
            Kaydolun, tutarı girin, tahsil edin.
          </h3>
          <p className="text-muted">
            Kendi kuryesiyle teslimat yapan işletmeler için. İşletme hesabınızı açar,
            çalışanlarınızı davet edersiniz. Çalışan kapıda tutarı girer ve tahsilatı başlatır —
            arada entegrasyon, kurulum ya da bekleme süresi yoktur.
          </p>
          <Points items={businessPoints} />
        </article>

        <article className="grid content-start gap-4 rounded-2xl border border-line bg-paper p-[clamp(1.5rem,3vw,2.1rem)]">
          <Badge className="justify-self-start">
            <IconPlug className="size-[0.95rem]" /> Sipariş platformları
          </Badge>
          <h3 className="font-display text-[1.5rem] font-semibold tracking-[-0.015em]">
            Kurye hiçbir zaman giriş yapmaz.
          </h3>
          <p className="text-muted">
            Kendi kurye ağını yöneten platformlar için. Tahsilatı siz kendi sisteminizden
            başlatırsınız; kuryenin telefonunda açılan ekran yalnızca o tahsilata aittir ve
            süresi dolar.
          </p>

          <div className="grid gap-2">
            {flow.map(({ Icon, before, strong, after }) => (
              <div
                key={strong}
                className="grid grid-cols-[auto_1fr] items-center gap-3 rounded-[10px] bg-surface px-[0.85rem] py-[0.7rem] text-[0.84rem]"
              >
                <Icon className="size-[1.1rem] text-muted" />
                <span>
                  {before}
                  <em className="not-italic rounded bg-pink-tint px-[0.4rem] py-[0.15rem] font-mono text-[0.74rem] text-pink-deep">
                    {strong}
                  </em>
                  {after}
                </span>
              </div>
            ))}
          </div>

          <Points items={platformPoints} />
        </article>
      </div>
    </Section>
  );
}
