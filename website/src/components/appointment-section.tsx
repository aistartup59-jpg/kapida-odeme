import { AppointmentForm } from "@/components/appointment-form";
import { Mark } from "@/components/brand";

const agenda = [
  "İş akışınızı dinliyoruz: teslimat hacmi, kimin tahsil ettiği, bugün nerede tıkandığı.",
  "Uygulamayı canlı gösteriyoruz — karekod ve nakit, parçalı bir tahsilat dahil.",
  "Sipariş platformuysanız devir akışını ve API tarafını birlikte geçiyoruz.",
];

/**
 * The page opens on white with pink light and closes on ink with the same light,
 * so the two ends answer each other instead of the page just stopping.
 */
export function AppointmentSection() {
  return (
    <section id="randevu" className="relative overflow-hidden bg-ink text-white">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[min(30rem,80vw)] w-[min(60rem,130vw)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(240,1,97,0.5),rgba(240,1,97,0.1)_55%,transparent_76%)] blur-[30px]"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl gap-[clamp(2.5rem,5vw,3.5rem)] px-[clamp(1.15rem,5vw,3.5rem)] py-[clamp(3.5rem,8vw,5.5rem)] lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
        <div>
          <Mark height={30} inverse />
          <p className="mt-6 font-mono text-[0.72rem] uppercase tracking-[0.22em] text-pink">
            Randevu
          </p>
          <h2 className="mb-4 mt-3 max-w-[18ch] text-balance font-display text-[clamp(1.85rem,4vw,2.6rem)] font-semibold leading-[1.06] tracking-[-0.018em]">
            Yarım saat ayırın, kapıdaki akışı birlikte geçelim.
          </h2>
          <p className="max-w-[46ch] text-white/70">
            Uzaktan yapılan, satış sunumundan çok ürün turu olan bir görüşme.
          </p>

          <ul className="mt-8 grid gap-4">
            {agenda.map((item) => (
              <li key={item} className="grid grid-cols-[auto_1fr] gap-3 text-[0.95rem] text-white/75">
                <i className="mt-[0.6rem] size-[0.45rem] shrink-0 rounded-full bg-pink" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <AppointmentForm />
      </div>
    </section>
  );
}
