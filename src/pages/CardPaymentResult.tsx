import { useState, useEffect } from "react";
import { Check, Loader2, X } from "lucide-react";
import { confirmCardPayment } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { formatWon } from "@/lib/pricing";
import { BRAND } from "@/config/brand";
import type { OrderRow } from "@/types/database";

interface CardPaymentResultProps {
  merchantId: string;
  onNavigate: (to: string) => void;
}

export function CardPaymentResult({ merchantId, onNavigate }: CardPaymentResultProps) {
  const [order, setOrder] = useState<OrderRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(true);
  const [status, setStatus] = useState<"verifying" | "success" | "failed">("verifying");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchOrderByMerchantId(merchantId);
        if (!data) {
          setError("주문 정보를 찾을 수 없습니다.");
          setStatus("failed");
          setVerifying(false);
          return;
        }
        setOrder(data);

        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get("status");
        const paymentId = urlParams.get("paymentId");

        if (paymentStatus === "PAID" || (data.status === "paid" && !paymentId)) {
          if (paymentId && data.portone_payment_id !== paymentId) {
            await confirmCardPayment(data.id, paymentId);
          }
          setStatus("success");
        } else if (paymentStatus === "FAILED") {
          setStatus("failed");
          setError("결제가 실패했습니다. 다시 시도해주세요.");
        } else {
          setStatus("success");
        }
      } catch {
        setError("결제 검증 중 오류가 발생했습니다.");
        setStatus("failed");
      } finally {
        setVerifying(false);
        setLoading(false);
      }
    })();
  }, [merchantId]);

  if (loading || verifying) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ivory">
        <div className="text-center">
          <Loader2 size={32} className="mx-auto animate-spin text-birch-400" />
          <p className="mt-4 text-sm text-charcoal-muted">결제 결과를 확인하는 중...</p>
        </div>
      </main>
    );
  }

  if (status === "failed") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ivory px-5">
        <div className="max-w-md text-center">
          <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-red-100">
            <X size={36} className="text-red-600" />
          </div>
          <h1 className="mt-8 font-serif text-2xl text-charcoal">결제 실패</h1>
          <p className="mt-4 text-sm text-charcoal-muted">{error ?? "결제가 완료되지 않았습니다."}</p>
          <div className="mt-8 flex justify-center gap-3">
            <button onClick={() => onNavigate("/cart")} className="btn-outline">장바구니로</button>
            <button onClick={() => onNavigate("/")} className="btn-primary">홈으로</button>
          </div>
        </div>
      </main>
    );
  }

  if (!order) return null;

  return (
    <main className="min-h-screen bg-ivory py-10 md:py-16">
      <div className="mx-auto max-w-2xl px-5 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-charcoal-muted">
            {BRAND.nameEn}
          </p>
          <h1 className="mt-3 font-serif text-3xl text-charcoal sm:text-4xl">결제 완료</h1>
        </div>

        <div className="mt-12 flex flex-col items-center text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
            <Check size={36} className="text-green-600" />
          </div>
          <h2 className="mt-8 font-serif text-2xl text-charcoal">결제가 완료되었습니다</h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-charcoal-muted">
            {order.customer_name}님, 결제해주셔서 감사합니다.
            <br />
            주문이 결제 완료되었습니다. 관리자 확인 후 제작이 시작됩니다.
          </p>

          <div className="mt-10 w-full max-w-md rounded-3xl border border-birch-200 bg-white p-6 text-left">
            <h3 className="text-sm font-semibold text-charcoal">주문 요약</h3>
            <div className="mt-4 space-y-2 text-sm">
              <SummaryRow label="주문번호" value={order.id.slice(0, 8)} />
              <SummaryRow label="상품" value={order.product_name ?? "-"} />
              <SummaryRow label="사이즈" value={`${order.width} × ${order.depth} × ${order.height}mm`} />
              <SummaryRow label="결제 방법" value="카드 결제" />
              <SummaryRow label="총 금액" value={formatWon(order.total_price)} />
            </div>
          </div>

          <button onClick={() => onNavigate("/")} className="btn-primary mt-8">
            홈으로
          </button>
        </div>
      </div>
    </main>
  );
}

async function fetchOrderByMerchantId(merchantId: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("portone_merchant_id", merchantId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-charcoal-muted">{label}</span>
      <span className="font-medium text-charcoal">{value}</span>
    </div>
  );
}
