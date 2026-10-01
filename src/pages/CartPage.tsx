import { useState, useEffect } from "react";
import { Trash2, ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { formatWon } from "@/lib/pricing";

interface CartPageProps {
  onNavigate: (to: string) => void;
}

export function CartPage({ onNavigate }: CartPageProps) {
  const { items, loading, updateQuantity, remove, count } = useCart();
  const [updating, setUpdating] = useState(false);

  const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);

  if (loading) {
    return (
      <main className="min-h-screen bg-ivory pt-20 md:pt-24 flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-birch-400" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-ivory pt-20 md:pt-24">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 md:py-16 lg:px-12">
        <h1 className="font-serif text-3xl text-charcoal sm:text-4xl">장바구니</h1>
        <p className="mt-2 text-sm text-charcoal-muted">담긴 상품 {count}개</p>

        {items.length === 0 ? (
          <div className="mt-16 flex flex-col items-center gap-4 text-center">
            <ShoppingBag size={48} className="text-birch-300" />
            <p className="text-sm text-charcoal-muted">장바구니가 비어 있습니다.</p>
            <button onClick={() => onNavigate("/")} className="btn-primary text-sm mt-2">
              상품 둘러보기
            </button>
          </div>
        ) : (
          <>
            <div className="mt-8 space-y-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-4 rounded-2xl border border-birch-200 bg-white p-4 sm:p-5">
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-charcoal">{item.product_name}</h3>
                    {(item.width > 0 || item.depth > 0 || item.height > 0) && (
                      <p className="mt-1 text-xs text-charcoal-muted">
                        사이즈: {item.width} × {item.depth} × {item.height}mm
                      </p>
                    )}
                    {(item.selected_options ?? []).length > 0 && (
                      <p className="mt-1 text-xs text-charcoal-muted">
                        {(item.selected_options ?? []).map((s) => s.valueLabel).join(", ")}
                      </p>
                    )}
                    {item.memo && (
                      <p className="mt-1 text-xs text-charcoal-muted">메모: {item.memo}</p>
                    )}
                    <p className="mt-2 text-sm font-bold text-charcoal">{formatWon(item.unit_price)}</p>
                  </div>

                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => remove(item.id)}
                      className="rounded-lg p-1.5 text-charcoal-muted transition-colors hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={16} />
                    </button>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={async () => {
                          if (item.quantity <= 1) return;
                          setUpdating(true);
                          await updateQuantity(item.id, item.quantity - 1);
                          setUpdating(false);
                        }}
                        disabled={updating || item.quantity <= 1}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-birch-200 text-charcoal disabled:opacity-30"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-sm font-medium text-charcoal">{item.quantity}</span>
                      <button
                        onClick={async () => {
                          setUpdating(true);
                          await updateQuantity(item.id, item.quantity + 1);
                          setUpdating(false);
                        }}
                        disabled={updating}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-birch-200 text-charcoal disabled:opacity-30"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-3xl border border-birch-200 bg-white p-6">
              <div className="flex items-end justify-between">
                <span className="text-sm text-charcoal-muted">총 결제 금액</span>
                <span className="font-serif text-3xl font-bold text-charcoal">{formatWon(total)}</span>
              </div>
              <button
                onClick={() => onNavigate("/checkout")}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-charcoal py-4 text-base font-medium text-ivory transition-all hover:bg-charcoal-light active:scale-[0.98]"
              >
                주문하기
                <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
