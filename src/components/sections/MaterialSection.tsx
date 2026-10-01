import { Reveal } from "@/components/Reveal";

export function MaterialSection() {
  const features = [
    { title: "자작나무 합판 사용", desc: "결이 곧고 색감이 따뜻한 자작나무를 사용합니다." },
    { title: "따뜻한 원목 인테리어", desc: "실내 공간에 자연스럽게 어울리는 온화한 톤." },
    { title: "견고한 구조", desc: "튼튼한 접합으로 오래 사용할 수 있는 구조." },
    { title: "아름다운 단면 디자인", desc: "합판의 단면이 주는 고유한 패턴을 살립니다." },
  ];

  return (
    <section id="material" className="bg-white section-padding">
      <div className="container-wide">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
          <Reveal>
            <div className="overflow-hidden rounded-3xl">
              <img
                src="/birch-material.webp"
                alt="자작나무 합판 소재"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </Reveal>

          <Reveal delay={150}>
            <div>
              <p className="text-xs font-semibold tracking-[0.25em] text-charcoal-muted">
                MATERIAL · 자작나무
              </p>
              <h2 className="mt-6 font-serif text-3xl leading-snug text-charcoal text-balance sm:text-4xl md:text-5xl">
                반려동물 가구도
                <br />
                사람이 사용하는 가구처럼.
              </h2>
              <p className="mt-6 text-base leading-relaxed text-charcoal-muted">
                거실, 침실, 현관 어디에 두어도 자연스러운 따뜻한 원목의 질감.
                자작나무 합판의 아름다운 결과 단면으로 공간을 더 완성도 있게 만듭니다.
              </p>

              <div className="mt-10 grid gap-x-8 gap-y-6 sm:grid-cols-2">
                {features.map((f) => (
                  <div key={f.title} className="border-l-2 border-birch-200 pl-4">
                    <h3 className="text-sm font-semibold text-charcoal">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-charcoal-muted">{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
