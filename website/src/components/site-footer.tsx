import { Lockup } from "@/components/brand";
import { navigation } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-5 px-[clamp(1.15rem,5vw,3.5rem)] py-10">
        <Lockup height={30} />

        <nav className="flex flex-wrap gap-x-6 gap-y-2 text-[0.88rem] text-muted">
          {navigation.map((item) => (
            <a key={item.href} href={item.href} className="transition-colors hover:text-ink">
              {item.label}
            </a>
          ))}
          <a href="#iletisim" className="transition-colors hover:text-ink">
            İletişim
          </a>
        </nav>
      </div>
    </footer>
  );
}
