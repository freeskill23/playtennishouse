import { useState } from "react";
import { Search, Loader2, Package, XCircle, ArrowLeft } from "lucide-react";
import { fetchOrderByNumber, cancelOrder } from "@/lib/api";
import { formatWon } from "@/lib/pricing";
import { BRAND } from "@/config/brand";
import type { OrderRow } from "@/types/database";

interface GuestOrderPageProps {
  onNavigate: (to: string) => void;
}

const statusLabels: Record<string, string> = {
  payment_pending: "결제 대기",
  paid: "결제 완료",
  in_production: "제작 중",
  shipped: "배송 중",
  completed: "완료",
  cancelled: "취소",
};

const statusColors: Record<string, string> = {
  payment_pending: "bg-amber-100 text-amber-700",
  paid: "bg-teal-100 text-teal-700",
  in_production: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export function GuestOrderPage({ onNavigate }: GuestOrderPageProps) {
  const [orderNumber, setOrderNumber] = useState("");
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  const handleSearch = async () => {
    if (!orderNumber.trim()) return;
    setSearching(true);
    setError(null);
    setOrder(null);
    try {
      const result = await fetchOrderByNumber(orderNumber.trim());
      if (!result) {
        setError("해당 주문번호를 찾을 수 없습니다. 주문번호를 확인해주세요.");
      } else {
        setOrder(result);
      }
    } catch {
      setError("주문 조회 중 오류가 발생했습니다.");
    } finally {
      setSearching(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    if (!confirm("정말 이 주문을 취소하시겠습니까? 제작이 시작되기 전에만 취소할 수 있습니다.")) return;
    setCancelling(true);
    try {
      await cancelOrder(order.id);
      setOrder({ ...order, status: "cancelled" });
    } catch {
      alert("주문 취소에 실패했습니다. 이미 제작이 시작되었을 수 있습니다.");
    } finally {
      setCancelling(false);
    }
  };

  const cancellableStatuses = ["payment_pending", "paid"];
  const canCancel = order && cancellableStatuses.includes(order.status);

  return (
    <main className="min-h-screen bg-ivory pt-20 md:pt-24">
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8 md:py-16">
        <button
          onClick={() => onNavigate("/")}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-charcoal-muted transition-colors hover:text-charcoal"
        >
          <ArrowLeft size={16} />
          홈으로
        </button>

        <p className="text-xs font-semibold tracking-[0.25em] text-charcoal-muted">{BRAND.nameEn}</p>
        <h1 className="mt-3 font-serif text-3xl text-charcoal sm:text-4xl">비회원 주문 조회</h1>
        <p className="mt-4 text-sm leading-relaxed text-charcoal-muted">
          주문 시 발급받은 주문번호를 입력하면 주문 내역을 확인하고 취소할 수 있습니다.
        </p>

        <div className="mt-8 rounded-3xl border border-birch-200 bg-white p-6 sm:p-8">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-charcoal-muted" />
              <input
                type="text"
                value={orderNumber}
                onChange={(e) => setOrderNumber(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
                placeholder="예: COCO-20260930-AB12"
                className="w-full rounded-xl border border-birch-200 bg-white py-3.5 pl-12 pr-4 text-sm font-mono text-charcoal focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200"
              />
            </div>
            <button
              onClick={handleSearch}
              disabled={searching || !orderNumber.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-charcoal px-6 py-3.5 text-sm font-medium text-ivory transition-all hover:bg-charcoal-light active:scale-[0.98] disabled:opacity-40"
            >
              {searching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
              조회
            </button>
          </div>

          {error && (
            <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          {order && (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-birch-200 bg-birch-50/50 p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-sm font-bold text-charcoal">{order.order_number}</p>
                    <p className="mt-1 text-xs text-charcoal-muted">
                      {new Date(order.created_at).toLocaleDateString("ko-KR")} {new Date(order.created_at).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusColors[order.status] ?? "bg-birch-100 text-charcoal"}`}>
                    {statusLabels[order.status] ?? order.status}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-birch-200 bg-white p-5">
                <h3 className="text-xs font-semibold text-charcoal-muted">주문 상품</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">상품명</span>
                    <span className="font-medium text-charcoal">{order.product_name ?? "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">사이즈</span>
                    <span className="font-medium text-charcoal">{order.width} × {order.depth} × {order.height}mm</span>
                  </div>
                  {(order.selected_options ?? []).map((s, i) => (
                    <div key={i} className="flex justify-between">
                      <span className="text-charcoal-muted">{s.optionName}</span>
                      <span className="font-medium text-charcoal">{s.valueLabel}{s.price > 0 ? ` (+${formatWon(s.price)})` : ""}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-birch-100 pt-2">
                    <span className="text-charcoal-muted">총 금액</span>
                    <span className="font-bold text-charcoal">{formatWon(order.total_price)}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-birch-200 bg-white p-5">
                <h3 className="text-xs font-semibold text-charcoal-muted">배송 정보</h3>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">주문자</span>
                    <span className="font-medium text-charcoal">{order.customer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">연락처</span>
                    <span className="font-medium text-charcoal">{order.customer_phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-charcoal-muted">주소</span>
                    <span className="font-medium text-charcoal text-right">{`${order.customer_postcode ?? ""} ${order.customer_address} ${order.customer_detail_address ?? ""}`.trim()}</span>
                  </div>
                </div>
              </div>

              {canCancel && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex w-full items-center justify-center gap-2 rounded-full border-2 border-red-300 bg-white py-3.5 text-sm font-medium text-red-600 transition-all hover:bg-red-50 active:scale-[0.98] disabled:opacity-50"
                >
                  {cancelling ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <XCircle size={16} />
                  )}
                  주문 취소하기
                </button>
              )}

              {order.status === "cancelled" && (
                <div className="rounded-xl bg-red-50 px-4 py-3 text-center text-sm text-red-700">
                  취소된 주문입니다.
                </div>
              )}
            </div>
          )}

          {!order && !error && !searching && (
            <div className="mt-6 flex flex-col items-center gap-2 py-8 text-center">
              <Package size={32} className="text-birch-300" />
              <p className="text-sm text-charcoal-muted">주문번호를 입력하고 조회 버튼을 눌러주세요.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
