import { IconLedger, IconLock, IconSplit } from "@/components/icons";
import { PaymentLedger } from "@/components/payment-ledger";
import { Eyebrow } from "@/components/ui";

const points = [
  {
    Icon: IconSplit,
    title: "Bir tahsilat, birden çok ödeme",
    body: "₺480'lik bir tahsilat karekodla ₺300 ve nakit ₺180 olarak kapanabilir. İkisi de aynı tahsilatın altında toplanır; sayı kaç ödemeyle kapandığına göre değişir, sınırı yoktur.",
  },
  {
    Icon: IconLedger,
    title: "Kalan tutar saklanmaz, hesaplanır",
    body: "Kalan tutar bir yere yazılıp güncellenmez; her ödemede toplam tutardan tahsil edilenler düşülerek yeniden bulunur. Böylece iki farklı yerde iki farklı rakam oluşamaz.",
  },
  {
    Icon: IconLock,
    title: "Geçmiş geriye dönük değişmez",
    body: "Alınan her ödeme kalıcı bir kayıttır; sonradan düzeltilmez veya silinmez. İptal ve iade, geçmişi bozmadan yeni kayıtlar olarak işlenir.",
  },
];

export function PartialPayments() {
  return (
    <section id="parcali" className="border-t border-line">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-[clamp(2.5rem,5vw,4rem)] px-[clamp(1.15rem,5vw,3.5rem)] py-[clamp(3.5rem,8vw,6rem)] lg:grid-cols-2">
        <div>
          <Eyebrow>Parçalı tahsilat</Eyebrow>
          <h2 className="mb-[1.1rem] mt-[0.9rem] text-balance font-display text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.06] tracking-[-0.018em]">
            Kart yetmedi diye teslimat geri dönmesin.
          </h2>
          <p className="text-[clamp(1.02rem,2vw,1.14rem)] text-ink-2">
            Kapıda en sık yaşanan sorun, ödemenin tamamen başarısız olması değil — bir kısmının
            ödenememesi. Müşterinin üstü çıkmaz, hesabında o an yeterlisi yoktur, nakit eksik
            kalır. PayALS bu durumu bir hata olarak değil, normal bir tahsilat şekli olarak ele
            alır.
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

        <PaymentLedger />
      </div>
    </section>
  );
}
