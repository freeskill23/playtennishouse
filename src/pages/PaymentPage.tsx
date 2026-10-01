import { useState, useEffect } from "react";
import { Check, Loader2, CreditCard, Package, User, MapPin, FileText } from "lucide-react";
import { fetchOrderByToken, confirmPaymentByToken } from "@/lib/api";
import { formatWon } from "@/lib/pricing";
import { BRAND } from "@/config/brand";
import type { OrderRow } from "@/types/database";

interface PaymentPageProps {
  token: string;
  onNavigate: (to: string) => void;
}

export function PaymentPage({ token, onNavigate }: PaymentPageProps) {
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchOrderByToken(token);
        if (!data) {
          setError("주문 정보를 찾을 수 없습니다.");
        } else {
          setOrder(data);
          if (data.status === "in_production" || data.status === "shipped" || data.status === "completed") {
            setPaid(true);
          }
        }
      } catch {
        setError("주문 정보를 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handlePay = async () => {
    if (!order || paying) return;
    setPaying(true);
    try {
      await confirmPaymentByToken(token);
      setPaid(true);
    } catch {
      setError("결제 처리 중 오류가 발생했습니다.");
    } finally {
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ivory">
        <Loader2 size={32} className="animate-spin text-birch-400" />
      </main>
    );
  }

  if (error && !order) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ivory px-5">
        <div className="max-w-md text-center">
          <p className="font-serif text-2xl text-charcoal">{error}</p>
          <button onClick={() => onNavigate("/")} className="btn-outline mt-8">
            홈으로
          </button>
        </div>
      </main>
    );
  }

  if (!order) return null;

  const created = new Date(order.created_at);

  return (
    <main className="min-h-screen bg-ivory py-10 md:py-16">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-charcoal-muted">
            {BRAND.nameEn}
          </p>
          <h1 className="mt-3 font-serif text-3xl text-charcoal sm:text-4xl">
            {paid ? "결제 완료" : "결제하기"}
          </h1>
        </div>

        {paid ? (
          <div className="mt-12 flex flex-col items-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <Check size={36} className="text-green-600" />
            </div>
            <h2 className="mt-8 font-serif text-2xl text-charcoal">결제가 완료되었습니다</h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-charcoal-muted">
              {order.customer_name}님, 결제해주셔서 감사합니다.
              <br />
              주문이 제작 중으로 전환되었습니다. 제작 완료 후 배송됩니다.
            </p>

            <div className="mt-10 w-full max-w-md rounded-3xl border border-birch-200 bg-white p-6 text-left">
              <h3 className="text-sm font-semibold text-charcoal">주문 요약</h3>
              <div className="mt-4 space-y-2 text-sm">
                <SummaryRow label="주문번호" value={order.id.slice(0, 8)} />
                <SummaryRow label="상품" value={order.product_name ?? "-"} />
                <SummaryRow label="사이즈" value={`${order.width} × ${order.depth} × ${order.height}mm`} />
                <SummaryRow label="총 금액" value={formatWon(order.total_price)} />
              </div>
            </div>

            <button onClick={() => onNavigate("/")} className="btn-primary mt-8">
              홈으로
            </button>
          </div>
        ) : (
          <>
            <div className="mt-10 rounded-3xl border border-birch-200 bg-white p-6 sm:p-8">
              <div className="flex items-center justify-between border-b border-birch-200 pb-4">
                <div>
                  <p className="text-xs text-charcoal-muted">주문번호</p>
                  <p className="mt-1 text-sm font-semibold text-charcoal">{order.id.slice(0, 8)}</p>
                </div>
                <p className="text-xs text-charcoal-muted">
                  {created.toLocaleDateString("ko-KR")} {created.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>

              <div className="mt-6 space-y-6">
                <InfoSection icon={<Package size={16} />} title="제작 정보">
                  <DetailRow label="상품" value={order.product_name ?? "-"} />
                  <DetailRow label="가로" value={`${order.width}mm`} />
                  <DetailRow label="세로" value={`${order.depth}mm`} />
                  <DetailRow label="높이" value={`${order.height}mm`} />
                  {(order.selected_options ?? []).map((s, i) => (
                    <DetailRow
                      key={i}
                      label={s.optionName}
                      value={s.price > 0 ? `${s.valueLabel} (+${formatWon(s.price)})` : s.valueLabel}
                    />
                  ))}
                </InfoSection>

                <InfoSection icon={<User size={16} />} title="고객 정보">
                  <DetailRow label="이름" value={order.customer_name} />
                  <DetailRow label="연락처" value={order.customer_phone} />
                  <InfoRow icon={<MapPin size={14} />} value={`${order.customer_postcode ?? ""} ${order.customer_address} ${order.customer_detail_address ?? ""}`.trim()} />
                </InfoSection>

                {order.memo && (
                  <InfoSection icon={<FileText size={16} />} title="요청 메모">
                    <p className="rounded-xl bg-birch-50 px-4 py-3 text-sm text-charcoal whitespace-pre-wrap">
                      {order.memo}
                    </p>
                  </InfoSection>
                )}
              </div>

              <div className="mt-8 border-t border-birch-200 pt-6">
                <div className="flex items-end justify-between">
                  <span className="text-sm text-charcoal-muted">결제 금액</span>
                  <span className="font-serif text-3xl font-bold text-charcoal">{formatWon(order.total_price)}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            <button
              onClick={handlePay}
              disabled={paying}
              className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-charcoal py-4 text-base font-medium text-ivory transition-all hover:bg-charcoal-light active:scale-[0.98] disabled:opacity-50"
            >
              {paying ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  결제 처리 중...
                </>
              ) : (
                <>
                  <CreditCard size={18} />
                  {formatWon(order.total_price)} 결제하기
                </>
              )}
            </button>

            <p className="mt-6 text-center text-xs text-charcoal-muted">
              {BRAND.nameKr}는 주문제작 상품으로, 제작 시작 후에는 취소가 어려울 수 있습니다.
            </p>
          </>
        )}
      </div>
    </main>
  );
}

function InfoSection({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-birch-500">{icon}</span>
        <h3 className="text-xs font-semibold text-charcoal">{title}</h3>
      </div>
      <div className="mt-3 space-y-1.5 pl-6">{children}</div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 text-sm">
      <span className="w-16 shrink-0 text-charcoal-muted">{label}</span>
      <span className="font-medium text-charcoal">{value}</span>
    </div>
  );
}

function InfoRow({ icon, value }: { icon: React.ReactNode; value: string }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 text-charcoal-muted">{icon}</span>
      <span className="font-medium text-charcoal">{value}</span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-charcoal-muted">{label}</span>
      <span className="font-medium text-charcoal">{value}</span>
    </div>
  );
}
