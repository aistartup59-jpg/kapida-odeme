import { Section } from "@/components/ui";

const questions = [
  {
    q: "Ekrandaki karekod gerçekten bankanın karekodu mu?",
    a: "Evet. Karekod bankanın sisteminde üretilen TR Karekod / EMV QR'dır ve müşteri onu kendi bankasının uygulamasından okutur. Bir ödeme sayfasının bağlantısını karekoda çevirip göstermiyoruz; bu iki şey müşteri açısından çok farklı güvenlik anlamına geldiği için ürünün en baştan beri değişmeyen kurallarından biri.",
  },
  {
    q: "Bugün hangi ödeme yöntemleri çalışıyor?",
    a: "Banka karekodu ve nakit. Temassız kart henüz açık değil: telefonda kart kabul etmek sağlayıcının PCI sertifikalı SoftPOS bileşenini gerektiriyor ve ham Android NFC bunun yerine geçmiyor. Akış uygulamada hazır, buton o entegrasyon tamamlandığında açılacak — yani sizin tarafınızda güncelleme dışında bir iş çıkmayacak.",
  },
  {
    q: "Müşteri tutarın tamamını ödeyemezse ne oluyor?",
    a: "Tahsilat iptal olmuyor. Ne kadarı ödendiyse o kadarı kaydedilir, kalan tutar anında yeniden hesaplanır ve müşteri kalanı diğer yöntemle kapatabilir — karekodla başlayıp nakit bitirmek gibi. Kurye siparişi geri götürmek zorunda kalmaz. Sitedeki üçüncü ekran görüntüsü tam olarak bunu gösteriyor: iki ayrı ödemeyle kapanmış tek bir tahsilat.",
  },
  {
    q: "Kurye benim kart bilgilerimi görebilir mi?",
    a: "Bugün uygulama kart okumuyor; ortada kuryenin görebileceği bir kart verisi yok. Temassız kart açıldığında bu soruyu Müşteri Güvenli Modu yanıtlayacak: PIN gerektiren her durumda çalışan bilgileri ve sipariş detayı ekrandan kalkacak, geriye yalnız tutar ve her açılışta yeniden karışan bir tuş takımı kalacak. İkisi aynı anda geliyor — kart kabulü var, güvenli mod yok diye bir ara durum olmayacak.",
  },
  {
    q: "Ek bir POS cihazı almam gerekiyor mu?",
    a: "Hayır. Kuryenin taşıdığı Android telefon yeterli; karekod ve nakit için başka hiçbir donanım gerekmiyor. Temassız kart açıldığında da telefonun kendi NFC donanımı kullanılacak, ayrı bir terminal kiralamanız gerekmeyecek.",
  },
  {
    q: "Kendi sipariş sistemimiz var, entegre olabilir miyiz?",
    a: "Evet. Tahsilatı kendi sisteminizden başlatır, sonucu kendi API anahtarınızla doğrularsınız. Kuryelerinizin uygulamada hesabı olmaz; telefonlarında açılan ekran yalnızca o tahsilata aittir ve süresi dolar. Entegrasyonu görüşmede birlikte geçelim.",
  },
];

export function Faq() {
  return (
    <Section id="sss" eyebrow="Sık sorulanlar" title="Genelde ilk sorulanlar.">
      <div className="mt-11 border-t border-line">
        {questions.map(({ q, a }, index) => (
          <details key={q} open={index === 0} className="group border-b border-line">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-[1.2rem] font-display text-[1.05rem] font-semibold tracking-[-0.01em] [&::-webkit-details-marker]:hidden">
              {q}
              <span
                aria-hidden
                className="size-[0.7rem] shrink-0 rotate-45 border-b-2 border-r-2 border-pink transition-transform group-open:-rotate-[135deg] motion-reduce:transition-none"
              />
            </summary>
            <p className="max-w-[68ch] pb-[1.35rem] text-muted">{a}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
