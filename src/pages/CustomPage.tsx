import { useState, useEffect, useCallback } from "react";
import { WizardSteps } from "@/components/WizardSteps";
import { Step1Product } from "@/components/custom/Step1Product";
import { Step2Size } from "@/components/custom/Step2Size";
import { Step3Order } from "@/components/custom/Step3Order";
import { DEFAULT_PRICING, DEFAULT_SIZES, type PricingSettings, type SizeSettings } from "@/config/pricing";
import { fetchProductById, fetchSettings } from "@/lib/api";
import type { ProductRow } from "@/types/database";

const WIZARD_STEPS = ["상품 선택", "사이즈", "주문"];

const SESSION_KEY = "cocosfit_custom_state";

interface SavedState {
  step: number;
  productId: string;
  dimensions: { width: number; depth: number; height: number };
}

function loadSavedState(): SavedState | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedState;
    if (parsed && typeof parsed.step === "number" && typeof parsed.productId === "string") {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function saveState(state: SavedState) {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function clearState() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // ignore
  }
}

interface CustomPageProps {
  onNavigate: (to: string) => void;
}

export function CustomPage({ onNavigate }: CustomPageProps) {
  const [step, setStep] = useState(0);
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [dimensions, setDimensions] = useState({ width: 750, depth: 550, height: 600 });
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [sizes, setSizes] = useState<SizeSettings>(DEFAULT_SIZES);
  const [restoring, setRestoring] = useState(true);

  // Restore state from sessionStorage on mount
  useEffect(() => {
    (async () => {
      const saved = loadSavedState();
      if (!saved || saved.step === 0 || !saved.productId) {
        setRestoring(false);
        return;
      }
      try {
        const p = await fetchProductById(saved.productId);
        if (!p) {
          clearState();
          setRestoring(false);
          return;
        }
        setProduct(p);
        const settings = await fetchSettings();
        let clampedSizes: SizeSettings = DEFAULT_SIZES;
        if (settings.sizes) {
          setSizes(settings.sizes as SizeSettings);
          clampedSizes = settings.sizes as SizeSettings;
        }
        setDimensions({
          width: Math.max(clampedSizes.minWidth, Math.min(clampedSizes.maxWidth, saved.dimensions.width)),
          depth: Math.max(clampedSizes.minDepth, Math.min(clampedSizes.maxDepth, saved.dimensions.depth)),
          height: Math.max(clampedSizes.minHeight, Math.min(clampedSizes.maxHeight, saved.dimensions.height)),
        });
        if (settings.pricing) setPricing(settings.pricing as PricingSettings);

        setStep(saved.step);
      } catch {
        clearState();
      } finally {
        setRestoring(false);
      }
    })();
  }, []);

  // Persist state whenever it changes (only if a product is selected)
  useEffect(() => {
    if (restoring) return;
    if (product && step > 0) {
      saveState({ step, productId: product.id, dimensions });
    } else if (step === 0) {
      clearState();
    }
  }, [step, product, dimensions, restoring]);

  const next = useCallback(() => setStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1)), []);
  const back = useCallback(() => setStep((s) => Math.max(s - 1, 0)), []);

  const handleSelectProduct = useCallback(
    (p: ProductRow, pricingSettings: PricingSettings, sizeSettings: SizeSettings) => {
      setProduct(p);
      setPricing(pricingSettings);
      setSizes(sizeSettings);
      setDimensions({
        width: Math.max(sizeSettings.minWidth, Math.min(sizeSettings.maxWidth, p.base_width)),
        depth: Math.max(sizeSettings.minDepth, Math.min(sizeSettings.maxDepth, p.base_depth)),
        height: Math.max(sizeSettings.minHeight, Math.min(sizeSettings.maxHeight, p.base_height)),
      });
    },
    []
  );

  const handleRestart = useCallback(() => {
    setStep(0);
    setProduct(null);
    clearState();
  }, []);

  return (
    <main className="min-h-screen bg-ivory pt-20 md:pt-24">
      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8 md:py-16 lg:px-12">
        <div className="mb-10">
          <p className="text-xs font-semibold tracking-[0.25em] text-charcoal-muted">
            COCOS FIT · 코코스핏
          </p>
          <h1 className="mt-3 font-serif text-3xl text-charcoal sm:text-4xl">
            강아지집 만들기
          </h1>
        </div>

        <div className="mb-12 rounded-2xl border border-birch-200 bg-white p-5 sm:p-6">
          <WizardSteps current={step} steps={WIZARD_STEPS} />
        </div>

        <div className="rounded-3xl border border-birch-200 bg-white p-6 sm:p-8 md:p-10">
          {restoring ? (
            <div className="flex justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-birch-200 border-t-birch-500" />
            </div>
          ) : (
            <>
              {step === 0 && (
                <Step1Product
                  selected={product}
                  onSelect={handleSelectProduct}
                  onNext={next}
                  onBack={() => onNavigate("/")}
                  onDetail={(productId) => onNavigate(`/custom/product/${productId}`)}
                />
              )}
              {step === 1 && product && (
                <Step2Size
                  product={product}
                  dimensions={dimensions}
                  onChange={setDimensions}
                  sizes={sizes}
                  pricing={pricing}
                  onNext={next}
                  onBack={back}
                />
              )}
              {step === 2 && product && (
                <Step3Order
                  product={product}
                  dimensions={dimensions}
                  pricing={pricing}
                  sizes={sizes}
                  onBack={back}
                  onRestart={handleRestart}
                  onHome={() => onNavigate("/")}
                />
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
