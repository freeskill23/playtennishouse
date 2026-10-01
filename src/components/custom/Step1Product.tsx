import { useEffect, useState } from "react";
import { Loader2, Check, Info } from "lucide-react";
import { fetchActiveProducts, fetchSettings } from "@/lib/api";
import type { ProductRow } from "@/types/database";
import { DEFAULT_PRICING, DEFAULT_SIZES, type PricingSettings, type SizeSettings } from "@/config/pricing";
import { formatWon } from "@/lib/pricing";

interface Step1Props {
  selected: ProductRow | null;
  onSelect: (product: ProductRow, pricing: PricingSettings, sizes: SizeSettings) => void;
  onNext: () => void;
  onBack: () => void;
  onDetail: (productId: string) => void;
}

export function Step1Product({ selected, onSelect, onNext, onBack, onDetail }: Step1Props) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [sizes, setSizes] = useState<SizeSettings>(DEFAULT_SIZES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [prods, settings] = await Promise.all([fetchActiveProducts(), fetchSettings()]);
        setProducts(prods);
        if (settings.pricing) setPricing(settings.pricing);
        if (settings.sizes) setSizes(settings.sizes);
      } catch {
        // fall back to defaults
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div>
      <StepHeader title="상품 선택" desc="원하는 강아지집 모델을 선택하세요." />

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 size={28} className="animate-spin text-birch-400" />
        </div>
      ) : products.length === 0 ? (
        <div className="mt-16 text-center text-sm text-charcoal-muted">
          등록된 상품이 없습니다.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => {
            const isSelected = selected?.id === p.id;
            return (
              <div
                key={p.id}
                className={`group relative flex flex-col overflow-hidden rounded-3xl border-2 bg-white text-left transition-all duration-300 ${
                  isSelected
                    ? "border-charcoal shadow-[0_8px_40px_rgba(184,160,126,0.15)]"
                    : "border-birch-200 hover:border-birch-400"
                }`}
              >
                {isSelected && (
                  <div className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-charcoal text-ivory">
                    <Check size={15} />
                  </div>
                )}
                <div className="relative aspect-square overflow-hidden bg-birch-50">
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-charcoal-muted">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-charcoal">{p.name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-charcoal-muted line-clamp-2">{p.description}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm font-medium text-charcoal">
                      기본가 {formatWon(p.base_price)}
                    </span>
                    <span className="text-xs text-charcoal-muted">
                      {p.base_width}×{p.base_depth}×{p.base_height}mm
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-3 border-t border-birch-100 pt-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelect(p, pricing, sizes); }}
                      className={`flex-1 rounded-lg py-2 text-xs font-medium transition-colors ${
                        isSelected ? "bg-charcoal text-ivory" : "bg-birch-100 text-charcoal hover:bg-birch-200"
                      }`}
                    >
                      선택
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDetail(p.id); }}
                      className="inline-flex items-center gap-1 text-xs font-medium text-charcoal-muted transition-colors hover:text-charcoal"
                    >
                      <Info size={13} />
                      자세히
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="mt-10 flex items-center justify-between gap-4">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-muted transition-colors hover:text-charcoal"
        >
          ← 홈으로
        </button>
        <button
          onClick={onNext}
          disabled={!selected}
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-charcoal px-7 py-3.5 text-sm font-medium text-ivory transition-all hover:bg-charcoal-light active:scale-[0.98] disabled:opacity-40 disabled:hover:bg-charcoal"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

export function StepHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-charcoal sm:text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-charcoal-muted">{desc}</p>
    </div>
  );
}

export function Field({
  label,
  children,
  optional,
}: {
  label: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-charcoal">
        {label}
        {optional && <span className="ml-1.5 text-xs font-normal text-charcoal-muted">(선택)</span>}
      </label>
      {children}
    </div>
  );
}
