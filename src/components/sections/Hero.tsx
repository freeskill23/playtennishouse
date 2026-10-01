import { ArrowRight } from "lucide-react";
import { BRAND } from "@/config/brand";

interface HeroProps {
  onNavigate: (to: string) => void;
  onScrollToPortfolio: () => void;
}

export function Hero({ onNavigate, onScrollToPortfolio }: HeroProps) {
  return (
    <section className="relative min-h-screen w-full overflow-hidden">
      {/* Background image */}
      <div className="absolute inset-0">
        <img
          src="/hero-living-room.webp"
          alt="프리미엄 거실에 자연스럽게 배치된 자작나무 강아지집"
          className="h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-ivory/90 via-ivory/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ivory/50 via-transparent to-ivory/20" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-8xl flex-col justify-center px-5 pt-20 sm:px-8 lg:px-12">
        <div className="max-w-2xl">
          <p className="mb-6 text-xs font-semibold tracking-[0.25em] text-charcoal-muted sm:text-sm">
            {BRAND.fitLineEn} · {BRAND.fitLineKr}
          </p>
          <h1 className="font-serif text-4xl leading-[1.15] text-charcoal text-balance sm:text-5xl md:text-6xl lg:text-7xl">
            강아지집도
            <br />
            맞춤가구가 될 수 있으니까.
          </h1>
          <p className="mt-8 text-lg leading-relaxed text-charcoal-light sm:text-xl md:text-2xl">
            우리 아이에게 맞추고,
            <br className="sm:hidden" />
            우리 집에 맞추다.
          </p>

          <div className="mt-12 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              onClick={() => onNavigate("/custom")}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-charcoal px-8 py-4 text-base font-medium text-ivory transition-all duration-300 hover:bg-charcoal-light hover:gap-3.5 active:scale-[0.98]"
            >
              우리 아이 집 만들기
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </button>
            <button
              onClick={onScrollToPortfolio}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-charcoal/20 bg-ivory/50 px-8 py-4 text-base font-medium text-charcoal backdrop-blur-sm transition-all duration-300 hover:border-charcoal hover:bg-charcoal hover:text-ivory active:scale-[0.98]"
            >
              맞춤 제작 사례 보기
            </button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <div className="flex flex-col items-center gap-2 text-charcoal-muted">
          <span className="text-[10px] tracking-[0.2em]">SCROLL</span>
          <div className="h-12 w-px bg-charcoal-muted/30" />
        </div>
      </div>
    </section>
  );
}
