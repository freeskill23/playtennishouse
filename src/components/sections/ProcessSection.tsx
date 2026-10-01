import { Reveal } from "@/components/Reveal";
import { PROCESS_STEPS } from "@/config/steps";

export function ProcessSection() {
  return (
    <section className="bg-birch-50 section-padding">
      <div className="container-wide">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="overflow-hidden rounded-3xl">
              <img
                src="/manufacturing-cnc.webp"
                alt="CNC 가공 작업"
                className="h-full w-full object-cover"
              />
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-charcoal-muted">
                PROCESS · 제작과정
              </p>
              <h2 className="mt-6 font-serif text-3xl leading-snug text-charcoal text-balance sm:text-4xl md:text-5xl">
                주문받은 사이즈에 맞춰
                <br />
                하나씩 제작합니다.
              </h2>

              <div className="mt-10">
                <div className="relative">
                  <div className="absolute left-[18px] top-2 bottom-2 w-px bg-birch-200" />
                  <div className="space-y-5">
                    {PROCESS_STEPS.map((step, i) => (
                      <div key={step.label} className="flex items-start gap-4">
                        <div className="z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-birch-300 bg-white text-xs font-semibold text-charcoal">
                          {i + 1}
                        </div>
                        <div className="pt-1">
                          <h3 className="text-sm font-semibold text-charcoal">{step.label}</h3>
                          <p className="mt-0.5 text-sm text-charcoal-muted">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
