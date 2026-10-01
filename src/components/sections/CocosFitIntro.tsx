import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/Reveal";
import { SizePreview } from "@/components/SizePreview";
import { DEFAULT_PRICING, DEFAULT_SIZES } from "@/config/pricing";
import { calculatePrice, formatWon } from "@/lib/pricing";

interface CocosFitIntroProps {
  onNavigate: (to: string) => void;
}

const DEMO_PRODUCT = {
  base_width: 750,
  base_depth: 550,
  base_height: 600,
  base_price: 50000,
};

export function CocosFitIntro({ onNavigate }: CocosFitIntroProps) {
  const [w, setW] = useState(750);
  const [d, setD] = useState(550);
  const [h, setH] = useState(600);

  const price = calculatePrice({
    product: DEMO_PRODUCT,
    dimensions: { width: w, depth: d, height: h },
    pricing: DEFAULT_PRICING,
  }, DEFAULT_SIZES);

  return (
    <section className="bg-birch-50 section-padding">
      <div className="container-wide">
        <Reveal>
          <p className="text-center text-xs font-semibold tracking-[0.25em] text-charcoal-muted">
            COCOS FIT
          </p>
          <h2 className="mx-auto mt-6 max-w-3xl text-center font-serif text-3xl leading-snug text-charcoal text-balance sm:text-4xl md:text-5xl">
            원하는 사이즈를 입력하세요.
            <br />
            코코스퍼니쳐가 그대로 만듭니다.
          </h2>
        </Reveal>

        <Reveal delay={150}>
          <div className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-3xl border border-birch-200 bg-white shadow-[0_2px_40px_rgba(184,160,126,0.08)]">
            <div className="grid gap-0 md:grid-cols-2">
              <div className="p-8 sm:p-10">
                <h3 className="text-lg font-semibold text-charcoal">사이즈 입력</h3>
                <p className="mt-2 text-sm text-charcoal-muted">
                  가로 · 세로 · 높이를 mm 단위로 입력해보세요.
                </p>

                <div className="mt-8 space-y-6">
                  <DimensionSlider
                    label="가로"
                    value={w}
                    min={DEFAULT_SIZES.minWidth}
                    max={DEFAULT_SIZES.maxWidth}
                    onChange={setW}
                  />
                  <DimensionSlider
                    label="세로"
                    value={d}
                    min={DEFAULT_SIZES.minDepth}
                    max={DEFAULT_SIZES.maxDepth}
                    onChange={setD}
                  />
                  <DimensionSlider
                    label="높이"
                    value={h}
                    min={DEFAULT_SIZES.minHeight}
                    max={DEFAULT_SIZES.maxHeight}
                    onChange={setH}
                  />
                </div>

                <div className="mt-8 flex items-center justify-between rounded-2xl bg-birch-50 px-5 py-4">
                  <span className="text-sm text-charcoal-muted">예상 견적</span>
                  <span className="text-2xl font-bold text-charcoal">{formatWon(price.total)}</span>
                </div>

                <button
                  onClick={() => onNavigate("/custom")}
                  className="group mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-charcoal px-6 py-4 text-base font-medium text-ivory transition-all hover:bg-charcoal-light hover:gap-3.5 active:scale-[0.98]"
                >
                  내 사이즈로 가격 확인하기
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>

              <div className="flex flex-col items-center justify-center border-t border-birch-200 bg-birch-50/50 p-8 sm:p-10 md:border-l md:border-t-0">
                <SizePreview width={w} depth={d} height={h} />
                <div className="mt-6 grid w-full max-w-xs grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-charcoal-muted">가로</p>
                    <p className="mt-1 text-base font-semibold text-charcoal">{w}</p>
                  </div>
                  <div>
                    <p className="text-xs text-charcoal-muted">세로</p>
                    <p className="mt-1 text-base font-semibold text-charcoal">{d}</p>
                  </div>
                  <div>
                    <p className="text-xs text-charcoal-muted">높이</p>
                    <p className="mt-1 text-base font-semibold text-charcoal">{h}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

interface DimensionSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}

function DimensionSlider({ label, value, min, max, onChange }: DimensionSliderProps) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-charcoal">{label}</label>
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            onChange={(e) => {
              const v = Number(e.target.value);
              if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
            }}
            className="w-20 rounded-lg border border-birch-200 bg-white px-3 py-1.5 text-right text-sm font-semibold text-charcoal focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200"
          />
          <span className="text-sm text-charcoal-muted">mm</span>
        </div>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={10}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-birch-200 accent-charcoal"
      />
      <div className="mt-1.5 flex justify-between text-[10px] text-charcoal-muted">
        <span>{min}mm</span>
        <span>{max}mm</span>
      </div>
    </div>
  );
}
