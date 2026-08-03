import { IconLock, IconPhone, IconShield } from "@/components/icons";
import { SecureKeypad } from "@/components/secure-keypad";
import { Badge, Eyebrow } from "@/components/ui";

const points = [
  {
    Icon: IconShield,
    title: "Ekranda ne kalacak, ne kalmayacak",
    body: "Çalışan bilgileri, sipariş detayı ve işletme yönetim ekranları gizlenecek. Müşteri kendi kartını, tanımadığı birinin telefonunda değil, tek amaçlı bir ödeme ekranında kullanacak.",
  },
  {
    Icon: IconLock,
    title: "Rakamların yeri sabit olmayacak",
    body: "Tuş takımı her açılışta yeniden karışacak. Omuz üstünden izleyen biri parmak hareketinden PIN'i çıkaramaz — çünkü aynı hareket bir sonraki seferde başka rakamlara denk gelir. Soldaki örnek bunu gösteriyor; butona basarak deneyebilirsiniz.",
  },
  {
    Icon: IconPhone,
    title: "İşi biter bitmez geri dönecek",
    body: "Doğrulama tamamlandığı anda cihaz kendiliğinden çalışan ekranına dönecek. Kuryenin bir şey yapması, bir yeri kapatması gerekmeyecek.",
  },
];

export function SecureMode() {
  return (
    <section id="guvenli" className="border-t border-line bg-surface">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-[clamp(2.5rem,5vw,4rem)] px-[clamp(1.15rem,5vw,3.5rem)] py-[clamp(3.5rem,8vw,6rem)] lg:grid-cols-2">
        <SecureKeypad />

        <div>
          <div className="flex flex-wrap items-center gap-3">
            <Eyebrow>Müşteri Güvenli Modu</Eyebrow>
            <Badge tone="line">Yakında</Badge>
          </div>

          <h2 className="mb-[1.1rem] mt-[0.9rem] text-balance font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.06] tracking-[-0.018em]">
            Müşteri PIN girerken kurye ekranı göremeyecek.
          </h2>

          <p className="text-[clamp(1.02rem,2vw,1.14rem)] text-ink-2">
            PIN, ancak temassız kart kabulüyle birlikte devreye giriyor — dolayısıyla bu mod da
            aynı sağlayıcı entegrasyonunu bekliyor. Kapatılabilen bir ayar olarak değil, kart
            kabulünün zorunlu bir parçası olarak geliyor: kart PIN istediği anda cihaz kilitlenip
            ekranda yalnız iki şey bırakacak — ödenecek tutar ve tuş takımı.
          </p>

          <ul className="mt-7 grid gap-4">
            {points.map(({ Icon, title, body }) => (
              <li key={title} className="grid grid-cols-[auto_1fr] items-start gap-[0.8rem]">
                <Icon className="mt-[0.28rem] size-[1.15rem] shrink-0 text-pink" />
                <div>
                  <b className="block font-semibold">{title}</b>
                  <p className="text-[0.92rem] text-muted">{body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
