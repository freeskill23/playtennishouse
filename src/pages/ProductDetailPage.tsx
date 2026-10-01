import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, Loader2, Package, ShoppingBag, Check, Minus, Plus } from "lucide-react";
import { fetchProductById, fetchSettings } from "@/lib/api";
import { useCart } from "@/hooks/useCart";
import type { ProductRow, SelectedOption } from "@/types/database";
import { DEFAULT_PRICING, DEFAULT_SIZES, type PricingSettings, type SizeSettings } from "@/config/pricing";
import { calculatePrice, formatWon } from "@/lib/pricing";
import { parseDetailContent } from "@/components/admin/DetailEditor";
import { SizePreview } from "@/components/SizePreview";

interface ProductDetailPageProps {
  productId: string;
  onNavigate: (to: string) => void;
}

export function ProductDetailPage({ productId, onNavigate }: ProductDetailPageProps) {
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [sizes, setSizes] = useState<SizeSettings>(DEFAULT_SIZES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOptionValueIds, setSelectedOptionValueIds] = useState<Record<string, string>>({});
  const [optionQuantities, setOptionQuantities] = useState<Record<string, number>>({});
  const [dimensions, setDimensions] = useState({ width: 0, depth: 0, height: 0 });
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [buyingNow, setBuyingNow] = useState(false);
  const [cartError, setCartError] = useState<string | null>(null);
  const { add, buyNow } = useCart();

  useEffect(() => {
    (async () => {
      try {
        const [data, settings] = await Promise.all([
          fetchProductById(productId),
          fetchSettings(),
        ]);
        if (!data) {
          setError("상품을 찾을 수 없습니다.");
          return;
        }
        setProduct(data);
        const ps = settings.pricing ?? DEFAULT_PRICING;
        const ss = settings.sizes ?? DEFAULT_SIZES;
        setPricing(ps);
        setSizes(ss);
        if (data.size_customizable) {
          setDimensions({
            width: Math.max(ss.minWidth, Math.min(ss.maxWidth, data.base_width)),
            depth: Math.max(ss.minDepth, Math.min(ss.maxDepth, data.base_depth)),
            height: Math.max(ss.minHeight, Math.min(ss.maxHeight, data.base_height)),
          });
        } else {
          setDimensions({ width: data.base_width, depth: data.base_depth, height: data.base_height });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "상품을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [productId]);

  const selectedOptions: SelectedOption[] = (product?.options ?? [])
    .filter((opt) => selectedOptionValueIds[opt.id])
    .map((opt) => {
      const val = opt.values.find((v) => v.id === selectedOptionValueIds[opt.id]);
      const qty = optionQuantities[opt.id] ?? 1;
      return {
        optionName: opt.name,
        valueLabel: val?.label ?? "",
        price: val?.price ?? 0,
        quantity: qty,
      };
    })
    .filter((s) => s.valueLabel);

  const optionsTotal = selectedOptions.reduce((sum, s) => sum + s.price * s.quantity, 0);
  const breakdown = product
    ? calculatePrice({ product, dimensions, pricing }, sizes)
    : null;
  const unitPrice = (breakdown?.basePrice ?? product?.base_price ?? 0)
    + (breakdown?.widthAdjust ?? 0)
    + (breakdown?.depthAdjust ?? 0)
    + (breakdown?.heightAdjust ?? 0)
    + (breakdown?.shippingFee ?? 0)
    + optionsTotal;

  const handleAddToCart = async () => {
    if (!product) return;
    setAdding(true);
    setAdded(false);
    setCartError(null);
    try {
      await add({
        product_id: product.id,
        product_name: product.name,
        width: dimensions.width,
        depth: dimensions.depth,
        height: dimensions.height,
        selected_options: selectedOptions,
        unit_price: unitPrice,
        quantity,
      });
      setAdded(true);
      setTimeout(() => setAdded(false), 3000);
    } catch (err) {
      setCartError(err instanceof Error ? err.message : "장바구니 추가에 실패했습니다.");
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;
    setBuyingNow(true);
    setCartError(null);
    try {
      await buyNow({
        product_id: product.id,
        product_name: product.name,
        width: dimensions.width,
        depth: dimensions.depth,
        height: dimensions.height,
        selected_options: selectedOptions,
        unit_price: unitPrice,
        quantity,
      });
      onNavigate("/checkout");
    } catch (err) {
      setCartError(err instanceof Error ? err.message : "바로 구매에 실패했습니다.");
    } finally {
      setBuyingNow(false);
    }
  };

  return (
    <main className="min-h-screen bg-ivory pt-20 md:pt-24">
      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 md:py-16 lg:px-12">
        <button
          onClick={() => onNavigate("/")}
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-muted transition-colors hover:text-charcoal"
        >
          <ArrowLeft size={16} />
          제품 목록으로
        </button>

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={28} className="animate-spin text-birch-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <Package size={36} className="text-birch-300" />
            <p className="text-sm text-charcoal-muted">{error}</p>
            <button onClick={() => onNavigate("/")} className="btn-outline text-sm mt-2">
              목록으로
            </button>
          </div>
        ) : product ? (
          <div>
            <div className="mx-auto max-w-4xl">
              <div className="grid gap-8 lg:grid-cols-2 lg:gap-12">
                <div className="overflow-hidden rounded-3xl border border-birch-200 bg-white">
                  <div className="aspect-square bg-birch-50">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-charcoal-muted">이미지 없음</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col">
                  <h1 className="font-serif text-3xl text-charcoal sm:text-4xl">{product.name}</h1>
                  <p className="mt-3 text-sm leading-relaxed text-charcoal-muted">{product.description}</p>

                  <div className="mt-6 rounded-2xl bg-birch-50 p-5">
                    <div className="grid grid-cols-2 gap-4">
                      {product.size_customizable ? (
                        <SpecCard label="기본 사이즈" value={`${product.base_width}×${product.base_depth}×${product.base_height}mm`} />
                      ) : (
                        <SpecCard label="사이즈" value={`${product.base_width}×${product.base_depth}×${product.base_height}mm`} />
                      )}
                      <SpecCard label="기본 가격" value={formatWon(product.base_price)} />
                    </div>
                  </div>

                  {product.size_customizable && (
                    <div className="mt-5 rounded-2xl border border-birch-200 bg-white p-5">
                      <p className="text-xs font-semibold text-charcoal">사이즈 조절 (mm)</p>
                      <div className="mt-3 mb-4 rounded-xl bg-birch-50/60 py-3">
                        <SizePreview
                          width={dimensions.width}
                          depth={dimensions.depth}
                          height={dimensions.height}
                          maxW={sizes.maxWidth}
                          maxD={sizes.maxDepth}
                          maxH={sizes.maxHeight}
                        />
                      </div>
                      <div className="space-y-3">
                        {product.customizable_width !== false && (
                          <SizeSlider label="가로" value={dimensions.width} min={sizes.minWidth} max={sizes.maxWidth}
                            onChange={(v) => setDimensions({ ...dimensions, width: v })} />
                        )}
                        {product.customizable_depth !== false && (
                          <SizeSlider label="세로" value={dimensions.depth} min={sizes.minDepth} max={sizes.maxDepth}
                            onChange={(v) => setDimensions({ ...dimensions, depth: v })} />
                        )}
                        {product.customizable_height !== false && (
                          <SizeSlider label="높이" value={dimensions.height} min={sizes.minHeight} max={sizes.maxHeight}
                            onChange={(v) => setDimensions({ ...dimensions, height: v })} />
                        )}
                      </div>
                      {breakdown && (breakdown.widthAdjust > 0 || breakdown.depthAdjust > 0 || breakdown.heightAdjust > 0) && (
                        <div className="mt-3 space-y-1 border-t border-birch-100 pt-3 text-xs text-charcoal-muted">
                          {breakdown.widthAdjust > 0 && <div>가로 추가: +{formatWon(breakdown.widthAdjust)}</div>}
                          {breakdown.depthAdjust > 0 && <div>세로 추가: +{formatWon(breakdown.depthAdjust)}</div>}
                          {breakdown.heightAdjust > 0 && <div>높이 추가: +{formatWon(breakdown.heightAdjust)}</div>}
                        </div>
                      )}
                    </div>
                  )}

                  {(product.options ?? []).length > 0 && (
                    <div className="mt-5 rounded-2xl border border-birch-200 bg-white p-5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold text-charcoal">추가 옵션</p>
                        {optionsTotal > 0 && (
                          <span className="text-xs font-bold text-birch-600">+{formatWon(optionsTotal)}</span>
                        )}
                      </div>
                      <div className="mt-3 space-y-3">
                        {(product.options ?? []).map((opt) => {
                          const selectedValId = selectedOptionValueIds[opt.id];
                          const selectedVal = opt.values.find((v) => v.id === selectedValId);
                          const optQty = optionQuantities[opt.id] ?? 1;
                          return (
                            <div key={opt.id}>
                              <div className="flex items-center gap-2">
                                <select
                                  value={selectedValId ?? ""}
                                  onChange={(e) => {
                                    setSelectedOptionValueIds({ ...selectedOptionValueIds, [opt.id]: e.target.value });
                                    if (e.target.value && !optionQuantities[opt.id]) {
                                      setOptionQuantities({ ...optionQuantities, [opt.id]: 1 });
                                    }
                                  }}
                                  className="flex-1 rounded-lg border border-birch-200 bg-white px-3 py-2 text-sm text-charcoal focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200"
                                >
                                  <option value="">{opt.name} 선택</option>
                                  {opt.values.map((val) => (
                                    <option key={val.id} value={val.id}>
                                      {val.label}{val.price > 0 ? ` (+${formatWon(val.price)})` : ""}
                                    </option>
                                  ))}
                                </select>
                                {selectedValId && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setOptionQuantities({ ...optionQuantities, [opt.id]: Math.max(1, optQty - 1) })}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-birch-200 text-charcoal"
                                    >
                                      <Minus size={12} />
                                    </button>
                                    <span className="w-8 text-center text-sm font-medium text-charcoal">{optQty}</span>
                                    <button
                                      type="button"
                                      onClick={() => setOptionQuantities({ ...optionQuantities, [opt.id]: optQty + 1 })}
                                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-birch-200 text-charcoal"
                                    >
                                      <Plus size={12} />
                                    </button>
                                  </div>
                                )}
                              </div>
                              {selectedVal && selectedVal.price > 0 && (
                                <p className="mt-1.5 text-xs text-birch-600">
                                  +{formatWon(selectedVal.price)} × {optQty} = +{formatWon(selectedVal.price * optQty)}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="mt-5 rounded-2xl bg-birch-50 p-5">
                    <p className="text-xs font-semibold text-charcoal">가격 상세</p>
                    <div className="mt-3 space-y-1.5 text-xs">
                      <div className="flex justify-between">
                        <span className="text-charcoal-muted">기본 가격</span>
                        <span className="font-medium text-charcoal">{formatWon(breakdown?.basePrice ?? product.base_price)}</span>
                      </div>
                      {breakdown && breakdown.widthAdjust > 0 && (
                        <div className="flex justify-between">
                          <span className="text-charcoal-muted">가로 추가 ({Math.round((dimensions.width - product.base_width) / 10)}cm)</span>
                          <span className="font-medium text-charcoal">+{formatWon(breakdown.widthAdjust)}</span>
                        </div>
                      )}
                      {breakdown && breakdown.depthAdjust > 0 && (
                        <div className="flex justify-between">
                          <span className="text-charcoal-muted">세로 추가 ({Math.round((dimensions.depth - product.base_depth) / 10)}cm)</span>
                          <span className="font-medium text-charcoal">+{formatWon(breakdown.depthAdjust)}</span>
                        </div>
                      )}
                      {breakdown && breakdown.heightAdjust > 0 && (
                        <div className="flex justify-between">
                          <span className="text-charcoal-muted">높이 추가 ({Math.round((dimensions.height - product.base_height) / 10)}cm)</span>
                          <span className="font-medium text-charcoal">+{formatWon(breakdown.heightAdjust)}</span>
                        </div>
                      )}
                      {selectedOptions.map((opt) => (
                        <div key={opt.optionName} className="flex justify-between">
                          <span className="text-charcoal-muted">{opt.optionName}: {opt.valueLabel}{opt.quantity > 1 ? ` × ${opt.quantity}` : ""}</span>
                          {opt.price > 0
                            ? <span className="font-medium text-birch-600">+{formatWon(opt.price * opt.quantity)}</span>
                            : <span className="font-medium text-charcoal-muted">포함</span>
                          }
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 flex items-center justify-between border-t border-birch-200 pt-3">
                      <span className="text-xs text-charcoal-muted">단가 × {quantity}개</span>
                      <span className="text-base font-bold text-charcoal">{formatWon(unitPrice * quantity)}</span>
                    </div>
                    {(breakdown?.shippingFee ?? 0) > 0 && (
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-charcoal-muted">
                        <span>배송비 포함</span>
                        <span>{formatWon(breakdown?.shippingFee ?? 0)}</span>
                      </div>
                    )}
                    {(breakdown?.shippingFee ?? 0) === 0 && (
                      <div className="mt-1.5 flex items-center justify-between text-[11px] text-green-600">
                        <span>배송비 무료</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="flex h-9 w-9 items-center justify-center rounded-lg border border-birch-200 text-charcoal">
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center text-sm font-medium text-charcoal">{quantity}</span>
                      <button onClick={() => setQuantity(quantity + 1)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-birch-200 text-charcoal">
                        <Plus size={14} />
                      </button>
                    </div>
                    <div className="flex-1 text-right">
                      <p className="text-xs text-charcoal-muted">상품 금액</p>
                      <p className="text-xl font-bold text-charcoal">{formatWon(unitPrice * quantity)}</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 space-y-3">
                    {cartError && (
                      <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{cartError}</div>
                    )}
                    <button
                      onClick={handleAddToCart}
                      disabled={adding || buyingNow}
                      className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-charcoal bg-white py-3.5 text-sm font-medium text-charcoal transition-all hover:bg-birch-50 active:scale-[0.98] disabled:opacity-50"
                    >
                      {added ? (
                        <>
                          <Check size={18} className="text-green-600" />
                          장바구니에 추가됨
                        </>
                      ) : adding ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          <ShoppingBag size={18} />
                          장바구니 담기
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleBuyNow}
                      disabled={buyingNow || adding}
                      className="group flex w-full items-center justify-center gap-2 rounded-full bg-charcoal py-3.5 text-sm font-medium text-ivory transition-all hover:bg-charcoal-light active:scale-[0.98] disabled:opacity-50"
                    >
                      {buyingNow ? (
                        <Loader2 size={18} className="animate-spin" />
                      ) : (
                        <>
                          바로 구매하기
                          <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => onNavigate("/cart")}
                      className="text-center text-xs font-medium text-charcoal-muted transition-colors hover:text-charcoal"
                    >
                      장바구니 보기
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {product.detail_content && (
              <div className="mt-12 border-t border-birch-200 pt-10">
                <h2 className="font-serif text-2xl text-charcoal sm:text-3xl">상세 정보</h2>
                <div className="mt-6 space-y-6">
                  {parseDetailContent(product.detail_content).map((block) =>
                    block.type === "text" ? (
                      block.text ? (
                        <p key={block.id} className="whitespace-pre-line text-base leading-relaxed text-charcoal-light">
                          {block.text}
                        </p>
                      ) : null
                    ) : (
                      block.imageUrl ? (
                        <div key={block.id} className="flex justify-center">
                          <img
                            src={block.imageUrl}
                            alt="상세 이미지"
                            style={{ maxWidth: "850px", width: "100%", height: "auto" }}
                            className="rounded-2xl border border-birch-200"
                          />
                        </div>
                      ) : null
                    )
                  )}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}

function SpecCard({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-charcoal-muted">{label}</p>
      <p className="mt-1 text-base font-bold text-charcoal">{value}</p>
    </div>
  );
}

function SizeSlider({ label, value, min, max, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-charcoal-muted">{label}</span>
        <span className="text-xs font-medium text-charcoal">{value}mm</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1.5 w-full accent-birch-600"
      />
    </div>
  );
}
