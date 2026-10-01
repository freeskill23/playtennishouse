import { useState, useEffect } from "react";
import { Loader2, Check, ArrowRight, User, Mail, Lock, Copy, Building2, Info, CreditCard, Search, MapPin, X } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { insertOrder, fetchSettings, type OrderInsert } from "@/lib/api";
import { formatWon } from "@/lib/pricing";
import { BRAND } from "@/config/brand";
import { requestCardPayment } from "@/lib/portone";
import { supabase } from "@/lib/supabase";
import { useDaumPostcode } from "@/components/DaumPostcode";
import type { BankAccount, PortOneConfig } from "@/types/database";

interface CheckoutPageProps {
  onNavigate: (to: string) => void;
}

type PaymentMethod = "bank_transfer" | "card";

export function CheckoutPage({ onNavigate }: CheckoutPageProps) {
  const { items, buyNowItem, clear, clearBuyNow } = useCart();
  const { session, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"guest" | "login" | "signup">("guest");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    postcode: "",
    address: "",
    detailAddress: "",
    memo: "",
  });
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [portoneConfig, setPortoneConfig] = useState<PortOneConfig | null>(null);
  const [orderNumbers, setOrderNumbers] = useState<string[]>([]);
  const [finalTotal, setFinalTotal] = useState(0);
  const postcode = useDaumPostcode();

  useEffect(() => {
    fetchSettings().then((settings) => {
      if (settings.bank_accounts) setBankAccounts(settings.bank_accounts);
      if (settings.portone) setPortoneConfig(settings.portone);
    });
  }, []);

  const checkoutItems = buyNowItem ? [buyNowItem] : items;
  const total = checkoutItems.reduce((sum, i) => sum + i.unit_price * i.quantity, 0);
  const validBankAccounts = bankAccounts.filter((a) => a.bank.trim() && a.accountNumber.trim() && a.accountHolder.trim());
  const phonePattern = /^010-\d{3,4}-\d{4}$/;
  const phoneError = customer.phone && !phonePattern.test(customer.phone)
    ? "올바른 전화번호 형식이 아닙니다 (예: 010-0000-0000)"
    : null;
  const isValid = customer.name.trim() && phonePattern.test(customer.phone.trim()) && customer.address.trim();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);
    try {
      const result = mode === "login"
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
      if (result.error) setAuthError(result.error);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!isValid || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      if (paymentMethod === "card") {
        if (!portoneConfig?.storeId || !portoneConfig?.channelKey) {
          setSubmitError("카드 결제 설정이 완료되지 않았습니다. 관리자에게 문의해주세요.");
          setSubmitting(false);
          return;
        }

        const merchantIds: string[] = [];
        const createdNumbers: string[] = [];
        for (const item of checkoutItems) {
          const merchantId = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
          merchantIds.push(merchantId);
          const order: OrderInsert = {
            product_id: item.product_id,
            product_name: item.product_name,
            width: item.width,
            depth: item.depth,
            height: item.height,
            total_price: item.unit_price * item.quantity,
            customer_name: customer.name.trim(),
            customer_phone: customer.phone.trim(),
            customer_email: session?.user?.email ?? null,
            customer_postcode: customer.postcode.trim() || null,
            customer_address: customer.address.trim(),
            customer_detail_address: customer.detailAddress.trim() || null,
            selected_options: item.selected_options ?? [],
            memo: customer.memo.trim() || null,
            payment_method: "card",
            portone_merchant_id: merchantId,
          };
          const insertedId = await insertOrder(order);
          if (insertedId) {
            const { data: inserted } = await supabase.from("orders").select("order_number").eq("id", insertedId).single();
            if (inserted?.order_number) createdNumbers.push(inserted.order_number);
          }
        }
        setOrderNumbers(createdNumbers);

        const orderNames = checkoutItems.map((i) => `${i.product_name} × ${i.quantity}`).join(", ");
        const firstMerchantId = merchantIds[0];
        const redirectUrl = `${window.location.origin}/pay/card/${firstMerchantId}`;

        const result = await requestCardPayment({
          storeId: portoneConfig.storeId,
          channelKey: portoneConfig.channelKey,
          paymentId: firstMerchantId,
          orderName: orderNames.length > 50 ? orderNames.slice(0, 50) + "..." : orderNames,
          totalAmount: total,
          customerName: customer.name.trim(),
          customerPhone: customer.phone.trim(),
          customerEmail: session?.user?.email ?? undefined,
          redirectUrl,
        });

        if (result.status === "PAID") {
          if (buyNowItem) { clearBuyNow(); } else { await clear(); }
          onNavigate(`/pay/card/${firstMerchantId}`);
        } else if (result.status === "FAILED") {
          setSubmitError("결제가 실패했습니다. 다시 시도해주세요.");
        }
      } else {
        const createdNumbers: string[] = [];
        for (const item of checkoutItems) {
          const order: OrderInsert = {
            product_id: item.product_id,
            product_name: item.product_name,
            width: item.width,
            depth: item.depth,
            height: item.height,
            total_price: item.unit_price * item.quantity,
            customer_name: customer.name.trim(),
            customer_phone: customer.phone.trim(),
            customer_email: session?.user?.email ?? null,
            customer_postcode: customer.postcode.trim() || null,
            customer_address: customer.address.trim(),
            customer_detail_address: customer.detailAddress.trim() || null,
            selected_options: item.selected_options ?? [],
            memo: customer.memo.trim() || null,
            payment_method: "bank_transfer",
          };
          const insertedId = await insertOrder(order);
          if (insertedId) {
            const { data: inserted } = await supabase.from("orders").select("order_number").eq("id", insertedId).single();
            if (inserted?.order_number) createdNumbers.push(inserted.order_number);
          }
        }
        setOrderNumbers(createdNumbers);
        setFinalTotal(total);
        if (buyNowItem) { clearBuyNow(); } else { await clear(); }
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "주문 접수 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyAccount = (acc: BankAccount, idx: number) => {
    const text = `${acc.bank} ${acc.accountNumber} ${acc.accountHolder}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    });
  };

  if (submitted) {
    return (
      <main className="min-h-screen bg-ivory pt-20 md:pt-24">
        <div className="mx-auto max-w-2xl px-5 py-16">
          <div className="text-center">
            <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-green-100">
              <Check size={36} className="text-green-600" />
            </div>
            <h2 className="mt-8 font-serif text-3xl text-charcoal">주문 접수 완료</h2>
            <p className="mt-4 text-sm text-charcoal-muted">
              {customer.name}님, 주문해주셔서 감사합니다.
              <br />
              아래 계좌로 입금해주시면 확인 후 제작을 시작합니다.
            </p>
            {orderNumbers.length > 0 && (
              <div className="mt-6 inline-flex flex-col items-center gap-1 rounded-2xl bg-birch-50 px-6 py-4">
                <p className="text-xs text-charcoal-muted">주문번호</p>
                {orderNumbers.map((num) => (
                  <p key={num} className="font-mono text-lg font-bold text-charcoal">{num}</p>
                ))}
                <p className="mt-1 text-[11px] text-charcoal-muted">주문번호를 메모해두시면 비회원 주문 조회 시 사용할 수 있습니다.</p>
                <button
                  onClick={() => {
                    const text = orderNumbers.length === 1 ? orderNumbers[0] : orderNumbers.join(", ");
                    navigator.clipboard.writeText(text).then(() => {
                      setCopiedIdx(-1);
                      setTimeout(() => setCopiedIdx(null), 2000);
                    });
                  }}
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-birch-200 bg-white px-3 py-1.5 text-xs font-medium text-charcoal transition-colors hover:bg-birch-100"
                >
                  {copiedIdx === -1 ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
                  {copiedIdx === -1 ? "복사됨" : "모두 복사하기"}
                </button>
              </div>
            )}
          </div>

          <div className="mt-10 rounded-3xl border border-birch-200 bg-white p-6 sm:p-8">
            <div className="flex items-end justify-between border-b border-birch-200 pb-4">
              <span className="text-sm text-charcoal-muted">총 결제 금액</span>
              <span className="font-serif text-3xl font-bold text-charcoal">{formatWon(finalTotal)}</span>
            </div>

            {validBankAccounts.length > 0 ? (
              <div className="mt-6 space-y-3">
                <div className="flex items-center gap-2">
                  <Building2 size={16} className="text-birch-500" />
                  <h3 className="text-sm font-semibold text-charcoal">입금 계좌 안내</h3>
                </div>
                {validBankAccounts.map((acc, idx) => (
                  <div key={acc.id} className="rounded-xl border border-birch-200 bg-birch-50/60 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-charcoal">{acc.bank}</p>
                        <p className="mt-1 font-mono text-base text-charcoal">{acc.accountNumber}</p>
                        <p className="mt-0.5 text-xs text-charcoal-muted">예금주: {acc.accountHolder}</p>
                      </div>
                      <button
                        onClick={() => handleCopyAccount(acc, idx)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-birch-200 bg-white px-3 py-2 text-xs font-medium text-charcoal transition-colors hover:bg-birch-100"
                      >
                        {copiedIdx === idx ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
                        {copiedIdx === idx ? "복사됨" : "계좌 복사"}
                      </button>
                    </div>
                  </div>
                ))}
                <div className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                  <p className="flex items-start gap-2">
                    <Info size={14} className="mt-0.5 shrink-0" />
                    <span>
                      입금자명은 주문자명({customer.name})과 동일하게 해주세요.
                      <br />
                      입금 확인 후 1영업일 이내에 제작이 시작됩니다.
                    </span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
                입금 계좌 정보가 관리자 설정에서 아직 등록되지 않았습니다. 별도로 연락드리겠습니다.
              </div>
            )}
          </div>

          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="flex justify-center gap-3">
              <button onClick={() => onNavigate("/")} className="btn-outline">홈으로</button>
              {session && (
                <button onClick={() => onNavigate("/account")} className="btn-primary">내 주문 보기</button>
              )}
            </div>
            {!session && (
              <button
                onClick={() => onNavigate("/guest-order")}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-charcoal-muted transition-colors hover:text-charcoal"
              >
                <Search size={13} />
                비회원 주문 조회
              </button>
            )}
          </div>
        </div>
      </main>
    );
  }

  if (checkoutItems.length === 0) {
    return (
      <main className="min-h-screen bg-ivory pt-20 md:pt-24">
        <div className="mx-auto max-w-2xl px-5 py-16 text-center">
          <p className="text-sm text-charcoal-muted">장바구니가 비어 있습니다.</p>
          <button onClick={() => onNavigate("/")} className="btn-outline mt-6">상품 둘러보기</button>
        </div>
      </main>
    );
  }

  const cardAvailable = portoneConfig?.storeId && portoneConfig?.channelKey;

  return (
    <main className="min-h-screen bg-ivory pt-20 md:pt-24">
      <div className="mx-auto max-w-4xl px-5 py-10 sm:px-8 md:py-16 lg:px-12">
        <h1 className="font-serif text-3xl text-charcoal sm:text-4xl">주문서</h1>

        {!session && (
          <div className="mt-8 rounded-3xl border border-birch-200 bg-white p-6">
            <div className="flex gap-2 rounded-xl bg-birch-50 p-1">
              <button onClick={() => { setMode("guest"); setAuthError(null); }} className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${mode === "guest" ? "bg-charcoal text-ivory" : "text-charcoal-muted"}`}>
                비회원 구매
              </button>
              <button onClick={() => { setMode("login"); setAuthError(null); }} className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${mode === "login" ? "bg-charcoal text-ivory" : "text-charcoal-muted"}`}>
                로그인
              </button>
              <button onClick={() => { setMode("signup"); setAuthError(null); }} className={`flex-1 rounded-lg py-2.5 text-sm font-medium transition-colors ${mode === "signup" ? "bg-charcoal text-ivory" : "text-charcoal-muted"}`}>
                회원가입
              </button>
            </div>

            {(mode === "login" || mode === "signup") && (
              <form onSubmit={handleAuth} className="mt-5 space-y-3">
                <div className="relative">
                  <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="이메일" className="w-full rounded-xl border border-birch-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200" />
                </div>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-charcoal-muted" />
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="비밀번호 (6자 이상)" className="w-full rounded-xl border border-birch-200 bg-white py-3 pl-10 pr-4 text-sm focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200" />
                </div>
                {authError && <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">{authError}</div>}
                <button type="submit" disabled={authLoading} className="flex w-full items-center justify-center gap-2 rounded-full bg-charcoal py-3 text-sm font-medium text-ivory transition-all hover:bg-charcoal-light disabled:opacity-50">
                  {authLoading ? <Loader2 size={16} className="animate-spin" /> : mode === "login" ? "로그인" : "가입하기"}
                </button>
              </form>
            )}

            {mode === "guest" && (
              <p className="mt-4 text-sm text-charcoal-muted">
                비회원으로 구매하실 수 있습니다. 아래에 배송 정보를 입력해주세요.
              </p>
            )}
          </div>
        )}

        <div className="mt-8 rounded-3xl border border-birch-200 bg-white p-6 sm:p-8">
          <h3 className="text-sm font-semibold text-charcoal">주문 상품</h3>
          <div className="mt-4 space-y-3">
            {checkoutItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border-b border-birch-100 pb-3 last:border-0">
                <div>
                  <p className="text-sm font-medium text-charcoal">{item.product_name} × {item.quantity}</p>
                  {(item.width > 0 || item.depth > 0 || item.height > 0) && (
                    <p className="mt-0.5 text-xs text-charcoal-muted">{item.width} × {item.depth} × {item.height}mm</p>
                  )}
                </div>
                <p className="text-sm font-bold text-charcoal">{formatWon(item.unit_price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-birch-200 bg-white p-6 sm:p-8 space-y-4">
          <h3 className="text-sm font-semibold text-charcoal">배송 정보</h3>
          <Field label="주문자 이름">
            <input type="text" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} placeholder="이름" className="input-field" />
          </Field>
          <Field label="연락처">
            <input
              type="tel"
              value={customer.phone}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d-]/g, "");
                let formatted = raw;
                const digits = raw.replace(/-/g, "");
                if (digits.length <= 3) {
                  formatted = digits;
                } else if (digits.length <= 7) {
                  formatted = `${digits.slice(0, 3)}-${digits.slice(3)}`;
                } else {
                  formatted = `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7, 11)}`;
                }
                setCustomer({ ...customer, phone: formatted });
              }}
              placeholder="010-0000-0000"
              maxLength={13}
              className="input-field"
            />
            {phoneError && (
              <p className="mt-1.5 text-xs text-red-600">{phoneError}</p>
            )}
          </Field>
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">배송 주소</label>
            <div className="flex gap-2">
              <input type="text" value={customer.postcode} onChange={(e) => setCustomer({ ...customer, postcode: e.target.value })} placeholder="우편번호" className="input-field w-32" readOnly />
              <input type="text" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} placeholder="도로명 주소" className="input-field flex-1" readOnly />
              <button
                type="button"
                onClick={() => postcode.open((data) => setCustomer({ ...customer, postcode: data.zonecode, address: data.address }))}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-charcoal px-4 text-sm font-medium text-ivory transition-all hover:bg-charcoal-light active:scale-[0.98]"
              >
                <Search size={15} />
                주소 검색
              </button>
            </div>
            <p className="mt-1.5 text-xs text-charcoal-muted">주소 검색 버튼을 눌러 도로명 주소를 검색하면 우편번호가 자동으로 입력됩니다.</p>
          </div>
          <Field label="상세 주소">
            <input type="text" value={customer.detailAddress} onChange={(e) => setCustomer({ ...customer, detailAddress: e.target.value })} placeholder="동, 호수 등 (직접 입력)" className="input-field" />
          </Field>
          <Field label="메모" optional>
            <textarea value={customer.memo} onChange={(e) => setCustomer({ ...customer, memo: e.target.value })} rows={3} placeholder="요청사항" className="input-field resize-none" />
          </Field>
        </div>

        <div className="mt-6 rounded-3xl border border-birch-200 bg-white p-6 sm:p-8">
          <h3 className="text-sm font-semibold text-charcoal">결제 방법</h3>
          <div className="mt-4 space-y-3">
            <button
              onClick={() => setPaymentMethod("card")}
              disabled={!cardAvailable}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                paymentMethod === "card"
                  ? "border-birch-400 bg-birch-50"
                  : "border-birch-200 bg-white hover:border-birch-300"
              } ${!cardAvailable ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <CreditCard size={20} className="text-birch-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-charcoal">카드 결제</p>
                <p className="mt-0.5 text-xs text-charcoal-muted">
                  {cardAvailable ? "신용/체크카드, 간편결제로 즉시 결제" : "현재 이용할 수 없습니다"}
                </p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 ${paymentMethod === "card" ? "border-birch-500 bg-birch-500" : "border-birch-300"}`}>
                {paymentMethod === "card" && <Check size={12} className="m-auto text-white" />}
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("bank_transfer")}
              className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                paymentMethod === "bank_transfer"
                  ? "border-birch-400 bg-birch-50"
                  : "border-birch-200 bg-white hover:border-birch-300"
              }`}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white">
                <Building2 size={20} className="text-birch-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-charcoal">무통장입금</p>
                <p className="mt-0.5 text-xs text-charcoal-muted">주문 접수 후 안내된 계좌로 입금해주시면 확인 후 제작을 시작합니다.</p>
              </div>
              <div className={`h-5 w-5 rounded-full border-2 ${paymentMethod === "bank_transfer" ? "border-birch-500 bg-birch-500" : "border-birch-300"}`}>
                {paymentMethod === "bank_transfer" && <Check size={12} className="m-auto text-white" />}
              </div>
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-3xl border border-birch-200 bg-white p-6">
          <div className="flex items-end justify-between">
            <span className="text-sm text-charcoal-muted">총 결제 금액</span>
            <span className="font-serif text-3xl font-bold text-charcoal">{formatWon(total)}</span>
          </div>
        </div>

        {submitError && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!isValid || submitting}
          className="group mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-charcoal py-4 text-base font-medium text-ivory transition-all hover:bg-charcoal-light active:scale-[0.98] disabled:opacity-40"
        >
          {submitting ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {paymentMethod === "card" ? "결제 진행 중..." : "접수 중..."}
            </>
          ) : (
            <>
              {paymentMethod === "card" ? `${formatWon(total)} 결제하기` : "주문 신청하기"}
              <ArrowRight size={18} className="transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </button>

        <p className="mt-6 text-center text-xs text-charcoal-muted">
          {BRAND.nameKr}는 주문제작 상품으로, 제작 시작 후에는 취소가 어려울 수 있습니다.
        </p>
      </div>

      {postcode.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin size={18} className="text-birch-600" />
                <span className="text-sm font-semibold text-charcoal">도로명 주소 검색</span>
              </div>
              <button onClick={postcode.close} className="rounded-lg p-1.5 text-charcoal-muted transition-colors hover:bg-birch-50">
                <X size={18} />
              </button>
            </div>
            {postcode.loading ? (
              <div className="flex h-96 items-center justify-center">
                <Loader2 size={28} className="animate-spin text-birch-400" />
              </div>
            ) : (
              <div ref={postcode.containerRef} className="h-96 w-full overflow-hidden rounded-lg" />
            )}
          </div>
        </div>
      )}
    </main>
  );
}

function Field({ label, children, optional }: { label: string; children: React.ReactNode; optional?: boolean }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-charcoal">
        {label}
        {optional && <span className="ml-1 text-xs text-charcoal-muted">(선택)</span>}
      </label>
      {children}
    </div>
  );
}
