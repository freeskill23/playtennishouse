import { WizardNav } from "@/components/WizardNav";
import { SizePreview } from "@/components/SizePreview";
import { SLIDER_STEP } from "@/config/sizes";
import { StepHeader, Field } from "@/components/custom/Step1Product";
import { calculatePrice, formatWon } from "@/lib/pricing";
import type { PricingSettings, SizeSettings } from "@/config/pricing";
import type { ProductRow } from "@/types/database";

interface Step2Props {
  product: ProductRow;
  dimensions: { width: number; depth: number; height: number };
  onChange: (dims: { width: number; depth: number; height: number }) => void;
  sizes: SizeSettings;
  pricing: PricingSettings;
  onNext: () => void;
  onBack: () => void;
}

export function Step2Size({ product, dimensions, onChange, sizes, pricing, onNext, onBack }: Step2Props) {
  const breakdown = calculatePrice({
    product,
    dimensions,
    pricing,
  }, sizes);

  return (
    <div>
      <StepHeader
        title="사이즈"
        desc="가로 · 세로 · 높이를 조정하세요. 1cm 단위로 가격이 반영됩니다."
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <SizeInput
            label="가로"
            value={dimensions.width}
            base={product.base_width}
            min={sizes.minWidth}
            max={sizes.maxWidth}
            perCm={pricing.perCmWidth}
            onChange={(v) => onChange({ width: v, depth: dimensions.depth, height: dimensions.height })}
          />
          <SizeInput
            label="세로"
            value={dimensions.depth}
            base={product.base_depth}
            min={sizes.minDepth}
            max={sizes.maxDepth}
            perCm={pricing.perCmDepth}
            onChange={(v) => onChange({ width: dimensions.width, depth: v, height: dimensions.height })}
          />
          <SizeInput
            label="높이"
            value={dimensions.height}
            base={product.base_height}
            min={sizes.minHeight}
            max={sizes.maxHeight}
            perCm={pricing.perCmHeight}
            onChange={(v) => onChange({ width: dimensions.width, depth: dimensions.depth, height: v })}
          />
        </div>

        <div className="flex flex-col items-center justify-center rounded-3xl bg-birch-50 p-8 lg:p-12">
          <SizePreview width={dimensions.width} depth={dimensions.depth} height={dimensions.height} />
          <div className="mt-6 grid w-full max-w-xs grid-cols-3 gap-3 text-center">
            <DimCard label="가로" value={dimensions.width} />
            <DimCard label="세로" value={dimensions.depth} />
            <DimCard label="높이" value={dimensions.height} />
          </div>

          <div className="mt-6 w-full max-w-xs rounded-2xl bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-charcoal-muted">예상 견적</span>
              <span className="text-xl font-bold text-charcoal">{formatWon(breakdown.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <WizardNav onBack={onBack} onNext={onNext} />
    </div>
  );
}

function SizeInput({
  label,
  value,
  base,
  min,
  max,
  perCm,
  onChange,
}: {
  label: string;
  value: number;
  base: number;
  min: number;
  max: number;
  perCm: number;
  onChange: (v: number) => void;
}) {
  const clampedBase = Math.max(min, Math.min(max, base));
  const diffCm = Math.max(0, Math.round((value - clampedBase) / 10));
  const adjust = diffCm * perCm;

  return (
    <Field label={`${label}`}>
      <div className="flex items-center gap-2 sm:gap-3">
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={SLIDER_STEP}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!isNaN(v)) onChange(Math.max(min, Math.min(max, v)));
          }}
          className="w-20 shrink-0 rounded-xl border border-birch-200 bg-white px-3 py-3 text-right text-base font-semibold text-charcoal focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200 sm:w-28 sm:text-lg"
        />
        <span className="shrink-0 text-sm text-charcoal-muted">mm</span>
        {adjust > 0 && (
          <span className="ml-auto text-xs font-medium text-birch-500">
            +{formatWon(adjust)}
          </span>
        )}
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={SLIDER_STEP}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-birch-200 accent-charcoal"
      />
      <div className="mt-1.5 flex justify-between text-[10px] text-charcoal-muted">
        <span>최소 {min}mm</span>
        <span>기본 {clampedBase}mm</span>
        <span>최대 {max}mm</span>
      </div>
    </Field>
  );
}

function DimCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white py-3">
      <p className="text-xs text-charcoal-muted">{label}</p>
      <p className="mt-1 text-base font-bold text-charcoal">
        {value}
        <span className="text-xs font-normal text-charcoal-muted">mm</span>
      </p>
    </div>
  );
}
