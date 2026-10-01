import { Reveal } from "@/components/Reveal";

export function ThreeStepSection() {
  const steps = [
    { num: "01", title: "상품 선택", desc: "원하는 강아지집 모델을 선택하세요." },
    { num: "02", title: "실시간 견적 확인", desc: "입력한 사이즈와 옵션에 맞춰 즉시 가격이 계산됩니다." },
    { num: "03", title: "주문 후 제작", desc: "주문 완료 후 자작나무 합판으로 하나씩 제작합니다." },
  ];

  return (
    <section className="bg-ivory section-padding">
      <div className="container-wide">
        <Reveal>
          <p className="text-center text-xs font-semibold tracking-[0.25em] text-charcoal-muted">
            3 STEP
          </p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-3xl leading-snug text-charcoal text-balance sm:text-4xl md:text-5xl">
            맞춤제작이지만 주문은 기성품처럼 간편하게.
          </h2>
        </Reveal>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal key={step.num} delay={i * 120}>
              <div className="group h-full rounded-3xl border border-birch-200 bg-white p-8 transition-all duration-300 hover:border-birch-400 hover:shadow-[0_8px_40px_rgba(184,160,126,0.1)]">
                <span className="font-serif text-5xl text-birch-300 transition-colors group-hover:text-birch-400">
                  {step.num}
                </span>
                <h3 className="mt-6 text-xl font-semibold text-charcoal">{step.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-charcoal-muted">{step.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
