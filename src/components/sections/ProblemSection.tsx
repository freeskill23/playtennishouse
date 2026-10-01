import { Reveal } from "@/components/Reveal";

export function ProblemSection() {
  return (
    <section className="bg-ivory section-padding">
      <div className="container-wide">
        <Reveal>
          <p className="text-center text-xs font-semibold tracking-[0.25em] text-charcoal-muted">
            THE PROBLEM
          </p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-3xl leading-snug text-charcoal text-balance sm:text-4xl md:text-5xl">
            우리 집 공간은 모두 다른데
            <br />
            강아지집은 왜 정해진 사이즈만 있을까요?
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="flex items-end justify-center gap-6 sm:gap-12">
              {/* Available space */}
              <div className="flex flex-col items-center">
                <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-birch-300 bg-birch-50 px-3 sm:h-40">
                  <span className="text-center text-xs text-charcoal-muted sm:text-sm">
                    남는 공간
                    <br />
                    <span className="text-base font-bold text-charcoal sm:text-lg">723mm</span>
                  </span>
                </div>
                <span className="mt-3 text-xs text-charcoal-muted">실제 공간</span>
              </div>

              {/* S size */}
              <div className="flex flex-col items-center">
                <div className="flex h-32 w-24 items-center justify-center rounded-lg border-2 border-birch-200 bg-white sm:h-40 sm:w-28">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-birch-400 sm:text-3xl">S</p>
                    <p className="mt-1 text-xs text-charcoal-muted">600mm</p>
                  </div>
                </div>
                <span className="mt-3 text-xs text-charcoal-muted">기성품</span>
              </div>

              {/* M size */}
              <div className="flex flex-col items-center">
                <div className="flex h-32 w-28 items-center justify-center rounded-lg border-2 border-birch-200 bg-white sm:h-40 sm:w-32">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-birch-400 sm:text-3xl">M</p>
                    <p className="mt-1 text-xs text-charcoal-muted">800mm</p>
                  </div>
                </div>
                <span className="mt-3 text-xs text-charcoal-muted">기성품</span>
              </div>
            </div>

            <div className="mt-12 text-center">
              <div className="inline-flex items-center gap-3 rounded-full bg-birch-100 px-6 py-3">
                <span className="text-sm text-charcoal-light">S는 123mm 남고</span>
                <span className="h-1 w-1 rounded-full bg-charcoal-muted/40" />
                <span className="text-sm text-charcoal-light">M은 77mm 넘칩니다</span>
              </div>
            </div>

            <h3 className="mx-auto mt-10 max-w-2xl text-center font-serif text-2xl text-charcoal sm:text-3xl md:text-4xl">
              <span className="border-b-2 border-birch-400 pb-1">코코스핏은 723mm</span>
              <span className="text-charcoal">도 가능합니다.</span>
            </h3>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
