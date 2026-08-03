import { Lockup } from "@/components/brand";
import { Button } from "@/components/ui";
import { navigation } from "@/lib/site-config";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="mx-auto flex h-[4.25rem] w-full max-w-6xl items-center justify-between gap-6 px-[clamp(1.15rem,5vw,3.5rem)]">
        <a href="#" aria-label="PayALS ana sayfa" className="flex items-center">
          <Lockup height={30} priority />
        </a>

        <nav className="hidden items-center gap-7 text-[0.88rem] lg:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted transition-colors hover:text-ink"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Button href="#randevu" variant="ink">
          Randevu al
        </Button>
      </div>
    </header>
  );
}
