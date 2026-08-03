import { IconCash, IconNfc, IconQr } from "@/components/icons";
import { Badge, Section } from "@/components/ui";

const methods = [
  {
    Icon: IconQr,
    title: "Gerçek banka karekodu",
    body: "Ekranda çıkan kare, bankanın ürettiği TR Karekod / EMV QR'dır. Müşteri kendi bankasının uygulamasından okutur, para doğrudan hesabınıza geçer. Bir ödeme linkinin karekoda çevrilmiş hâli değildir — bu ayrımı ürünün başından beri koruyoruz.",
    soon: false,
  },
  {
    Icon: IconCash,
    title: "Nakit",
    body: "Nakit de kayıt dışı kalmaz. Alınan tutar cihaza girilir, kalan tutar aynı anda yeniden hesaplanır. Gün sonunda kimin ne tahsil ettiği tek yerden görünür.",
    soon: false,
  },
  {
    Icon: IconNfc,
    title: "Temassız kart",
    body: "Telefonda temassız kart kabul etmek, sağlayıcının PCI sertifikalı SoftPOS bileşenini gerektiriyor; ham Android NFC bunun yerine geçmiyor. Akış uygulamada hazır, buton o entegrasyon tamamlanınca açılacak.",
    soon: true,
  },
];

export function PaymentMethods() {
  return (
    <Section
      rule
      title="Bugün iki yöntem, yakında üç."
      description="Müşteri kapıda hangi yöntemi isterse onu kullanır. Kurye ekran değiştirmez, uygulama değiştirmez, ikinci bir cihaz çıkarmaz."
    >
      <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-line bg-line md:grid-cols-3">
        {methods.map(({ Icon, title, body, soon }) => (
          <div key={title} className="bg-paper p-6">
            <div
              className={`mb-3 grid size-10 place-items-center rounded-[9px] ${
                soon ? "bg-surface text-faint" : "bg-pink-tint text-pink-deep"
              }`}
            >
              <Icon className="size-[1.35rem]" />
            </div>
            <h3 className="flex flex-wrap items-center gap-2 font-display text-[1.05rem] font-semibold">
              {title}
              {soon ? <Badge tone="line">Yakında</Badge> : null}
            </h3>
            <p className="mt-2 text-[0.9rem] text-muted">{body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
