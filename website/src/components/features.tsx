import {
  IconLedger,
  IconPhone,
  IconPlug,
  IconQr,
  IconShield,
  IconSplit,
} from "@/components/icons";
import { Badge, Section } from "@/components/ui";

const features = [
  {
    Icon: IconQr,
    title: "Ödeme linki yok",
    body: "Müşteriye SMS ya da WhatsApp'tan link gönderilmez. Dolandırıcılığın en yaygın yolu bu olduğu için, ürün bu yolu hiç açmıyor.",
  },
  {
    Icon: IconSplit,
    title: "Parçalı tahsilat",
    body: "Bir tahsilat birden çok ödemeyle kapanabilir. Karekod ve nakit istediğiniz sırayla birleşir.",
  },
  {
    Icon: IconShield,
    title: "Müşteri Güvenli Modu",
    body: "PIN gerektiğinde cihaz kilitlenecek, tuş takımı karışacak, iş bitince kendiliğinden geri dönecek.",
    soon: true,
  },
  {
    Icon: IconPlug,
    title: "Sağlayıcı bağımsız",
    body: "Ödeme sağlayıcınız değiştiğinde iş akışınız değişmez. Yeni sağlayıcı sisteme bir adaptörle eklenir.",
  },
  {
    Icon: IconLedger,
    title: "Değişmeyen kayıt",
    body: "Finansal geçmiş yalnızca büyür. Hiçbir ödeme sonradan düzeltilmez, silinmez; iptal ve iade yeni kayıtlarla işlenir.",
  },
  {
    Icon: IconPhone,
    title: "Ek donanım yok",
    body: "Kuryenin zaten taşıdığı Android telefon yeterli. Terminal kiralamak, dağıtmak ve şarj etmek yok.",
  },
];

export function Features() {
  return (
    <Section rule title="Kapıdaki ödemeyi ciddiye alan kararlar." tone="surface">
      <div className="mt-12 grid gap-x-10 gap-y-9 sm:grid-cols-2 lg:grid-cols-3">
        {features.map(({ Icon, title, body, soon }) => (
          <div key={title} className="grid content-start gap-[0.55rem]">
            <Icon className={`size-6 ${soon ? "text-faint" : "text-pink"}`} />
            <h3 className="flex flex-wrap items-center gap-2 font-display text-[1.05rem] font-semibold">
              {title}
              {soon ? <Badge tone="line">Yakında</Badge> : null}
            </h3>
            <p className="text-[0.92rem] text-muted">{body}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}
