import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";

interface FinalCTAProps {
  onNavigate: (to: string) => void;
}

export function FinalCTA({ onNavigate }: FinalCTAProps) {
  return (
    <section className="relative overflow-hidden bg-charcoal section-padding">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -left-20 top-10 h-60 w-60 rounded-full bg-birch-300 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-60 w-60 rounded-full bg-birch-400 blur-3xl" />
      </div>

      <div className="container-wide relative">
        <Reveal>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="font-serif text-3xl leading-snug text-ivory text-balance sm:text-4xl md:text-5xl lg:text-6xl">
              우리 집에 딱 맞는
              <br />
              우리 아이의 공간.
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-base text-birch-200 sm:text-lg">
              지금 바로 원하는 사이즈를 입력하고 견적을 확인하세요.
            </p>
            <button
              onClick={() => onNavigate("/custom")}
              className="group mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-ivory px-8 py-4 text-base font-medium text-charcoal transition-all duration-300 hover:gap-3.5 hover:bg-birch-100 active:scale-[0.98]"
            >
              내 사이즈로 만들어보기
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
