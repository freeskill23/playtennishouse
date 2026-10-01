import { useEffect, useState, useCallback } from "react";
import { Trash2, ChevronDown, ChevronUp, Loader2, RefreshCw, Copy, Check, Printer, Save, Truck, CheckCircle2, Hammer, XCircle } from "lucide-react";
import { fetchAllOrders, updateOrderStatus, updateOrderMemo, deleteOrder, bulkDeleteOrders, updateOrderShipping, autoCompleteShippedOrders } from "@/lib/api";
import type { OrderRow } from "@/types/database";
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS, SHIPPING_COMPANIES, type OrderStatus } from "@/lib/supabase";
import { formatWon } from "@/lib/pricing";
import { BRAND } from "@/config/brand";

interface OrdersTabProps {
  onCountChange: (n: number) => void;
}

export function OrdersTab({ onCountChange }: OrdersTabProps) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await autoCompleteShippedOrders();
      const data = await fetchAllOrders();
      setOrders(data);
      onCountChange(data.length);
    } catch (err) {
      setError(err instanceof Error ? err.message : "주문 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [onCountChange]);

  useEffect(() => {
    load();
  }, [load]);

  const handleStatusChange = async (id: string, status: OrderStatus) => {
    try {
      await updateOrderStatus(id, status);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "상태 변경에 실패했습니다.");
    }
  };

  const handleShipping = async (id: string, company: string, tracking: string) => {
    try {
      await updateOrderShipping(id, company, tracking);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status: "shipped", shipping_company: company, tracking_number: tracking, shipped_at: new Date().toISOString() } : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "배송 정보 저장에 실패했습니다.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("정말 이 주문을 삭제하시겠습니까?")) return;
    try {
      await deleteOrder(id);
      setOrders((prev) => prev.filter((o) => o.id !== id));
      setSelectedIds((prev) => { const next = new Set(prev); next.delete(id); return next; });
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const handleMemoSave = async (id: string, memo: string) => {
    try {
      await updateOrderMemo(id, memo);
      setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, memo } : o)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "메모 저장에 실패했습니다.");
    }
  };

  const filteredOrders = filter === "all" ? orders : orders.filter((o) => o.status === filter);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map((o) => o.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`선택된 ${selectedIds.size}개 주문을 정말 삭제하시겠습니까?`)) return;
    setBulkDeleting(true);
    try {
      await bulkDeleteOrders(Array.from(selectedIds));
      setOrders((prev) => prev.filter((o) => !selectedIds.has(o.id)));
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : "일괄 삭제에 실패했습니다.");
    } finally {
      setBulkDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (orders.length === 0) return;
    if (!confirm(`전체 ${orders.length}개 주문을 정말 전부 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    if (!confirm("정말 확실합니까? 모든 주문 데이터가 영구 삭제됩니다.")) return;
    setBulkDeleting(true);
    try {
      await bulkDeleteOrders(orders.map((o) => o.id));
      setOrders([]);
      setSelectedIds(new Set());
      onCountChange(0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "전체 삭제에 실패했습니다.");
    } finally {
      setBulkDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-charcoal sm:text-3xl">주문 관리</h1>
          <p className="mt-2 text-sm text-charcoal-muted">접수된 주문 목록입니다.</p>
        </div>
        <button onClick={load} className="btn-ghost text-sm">
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          새로고침
        </button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
          전체 ({orders.length})
        </FilterButton>
        {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => {
          const count = orders.filter((o) => o.status === status).length;
          return (
            <FilterButton key={status} active={filter === status} onClick={() => setFilter(status)}>
              {ORDER_STATUS_LABELS[status]} ({count})
            </FilterButton>
          );
        })}
      </div>

      {!loading && filteredOrders.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-medium text-charcoal-muted">
            <input
              type="checkbox"
              checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0}
              onChange={toggleSelectAll}
              className="h-4 w-4 accent-birch-600"
            />
            전체 선택
          </label>
          {selectedIds.size > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={bulkDeleting}
              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              {bulkDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              선택 삭제 ({selectedIds.size})
            </button>
          )}
          <button
            onClick={handleDeleteAll}
            disabled={bulkDeleting || orders.length === 0}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
          >
            <Trash2 size={13} />
            전체 삭제
          </button>
        </div>
      )}

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 size={28} className="animate-spin text-birch-400" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="mt-16 text-center text-sm text-charcoal-muted">주문이 없습니다.</div>
      ) : (
        <div className="mt-6 space-y-3">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              selected={selectedIds.has(order.id)}
              onToggle={() => setExpandedId(expandedId === order.id ? null : order.id)}
              onSelect={() => toggleSelect(order.id)}
              onStatusChange={handleStatusChange}
              onShipping={handleShipping}
              onDelete={handleDelete}
              onMemoSave={handleMemoSave}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
        active ? "bg-charcoal text-ivory" : "bg-white text-charcoal-muted border border-birch-200 hover:border-birch-400"
      }`}
    >
      {children}
    </button>
  );
}

function OrderCard({
  order,
  expanded,
  selected,
  onToggle,
  onSelect,
  onStatusChange,
  onShipping,
  onDelete,
  onMemoSave,
}: {
  order: OrderRow;
  expanded: boolean;
  selected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onStatusChange: (id: string, status: OrderStatus) => void;
  onShipping: (id: string, company: string, tracking: string) => void;
  onDelete: (id: string) => void;
  onMemoSave: (id: string, memo: string) => void;
}) {
  const status = order.status as OrderStatus;
  const created = new Date(order.created_at);
  const [editingMemo, setEditingMemo] = useState(false);
  const [memoDraft, setMemoDraft] = useState(order.memo ?? "");
  const [shippingCompany, setShippingCompany] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [shippingError, setShippingError] = useState<string | null>(null);

  useEffect(() => {
    setMemoDraft(order.memo ?? "");
  }, [order.memo]);

  const handleSaveMemo = () => {
    onMemoSave(order.id, memoDraft.trim());
    setEditingMemo(false);
  };

  const handlePrint = () => {
    const win = window.open("", "_blank", "width=800,height=600");
    if (!win) return;
    const options = (order.selected_options ?? [])
      .map((s) => `<tr><td style="padding:4px 0;color:#666;">${s.optionName}</td><td style="padding:4px 0;font-weight:500;">${s.valueLabel}${s.price > 0 ? " (+" + s.price.toLocaleString("ko-KR") + "원)" : ""}</td></tr>`)
      .join("");
    win.document.write(`<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>주문서 - ${order.customer_name}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Noto Sans KR', sans-serif; padding: 40px; color: #222; }
      h1 { font-size: 22px; margin-bottom: 8px; }
      .subtitle { font-size: 13px; color: #888; margin-bottom: 32px; }
      .section { margin-bottom: 24px; }
      .section-title { font-size: 14px; font-weight: 700; border-bottom: 2px solid #333; padding-bottom: 6px; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      td { padding: 6px 0; font-size: 14px; vertical-align: top; }
      td:first-child { width: 120px; color: #888; }
      td:last-child { font-weight: 500; }
      .total { text-align: right; font-size: 20px; font-weight: 700; margin-top: 16px; }
      .memo-box { background: #f8f6f2; border-radius: 8px; padding: 12px 16px; font-size: 14px; min-height: 40px; white-space: pre-wrap; }
      @media print { body { padding: 20px; } .no-print { display: none; } }
    </style></head><body>
    <h1>${BRAND.nameKr} 주문서</h1>
    <p class="subtitle">주문번호: ${order.order_number ?? order.id.slice(0, 8)} · ${created.toLocaleDateString("ko-KR")} ${created.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</p>
    <div class="section">
      <div class="section-title">제작 정보</div>
      <table>
        <tr><td>상품명</td><td>${order.product_name ?? "-"}</td></tr>
        <tr><td>가로</td><td>${order.width}mm</td></tr>
        <tr><td>세로</td><td>${order.depth}mm</td></tr>
        <tr><td>높이</td><td>${order.height}mm</td></tr>
        ${options}
      </table>
    </div>
    <div class="section">
      <div class="section-title">고객 정보</div>
      <table>
        <tr><td>주문자명</td><td>${order.customer_name}</td></tr>
        <tr><td>연락처</td><td>${order.customer_phone}</td></tr>
        <tr><td>주소</td><td>${(order.customer_postcode ?? "") + " " + order.customer_address + " " + (order.customer_detail_address ?? "")}</td></tr>
      </table>
    </div>
    <div class="section">
      <div class="section-title">메모</div>
      <div class="memo-box">${order.memo ?? "—"}</div>
    </div>
    <p class="total">총 금액: ${order.total_price.toLocaleString("ko-KR")}원</p>
    <div class="no-print" style="margin-top:32px;text-align:center;">
      <button onclick="window.print()" style="padding:10px 24px;background:#222;color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:14px;">인쇄하기</button>
    </div>
    </body></html>`);
    win.document.close();
  };

  const handleShip = () => {
    if (!shippingCompany || !trackingNumber.trim()) {
      setShippingError("택배사와 송장번호를 모두 입력해주세요.");
      return;
    }
    setShippingError(null);
    onShipping(order.id, shippingCompany, trackingNumber.trim());
  };

  const canComplete = status === "shipped" && order.shipped_at &&
    Date.now() - new Date(order.shipped_at).getTime() >= 2 * 24 * 60 * 60 * 1000;

  return (
    <div className={`overflow-hidden rounded-2xl border bg-white transition-colors ${selected ? "border-birch-400 ring-1 ring-birch-300" : "border-birch-200"}`}>
      <div className="flex items-center">
        <button
          onClick={onSelect}
          className="flex h-full items-center px-4"
          aria-label="주문 선택"
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={onSelect}
            className="h-4 w-4 accent-birch-600"
          />
        </button>
        <button onClick={onToggle} className="flex flex-1 items-center justify-between p-5 text-left">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-charcoal">{order.customer_name}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${ORDER_STATUS_COLORS[status] ?? "bg-birch-100 text-charcoal"}`}>
                  {ORDER_STATUS_LABELS[status] ?? order.status}
                </span>
                {order.payment_method && (
                  <span className="rounded-full bg-birch-50 px-2 py-0.5 text-[10px] text-charcoal-muted">
                    {order.payment_method === "card" ? "카드" : "무통장입금"}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-charcoal-muted">
                {order.product_name || "-"} · {order.width}×{order.depth}×{order.height}mm · {formatWon(order.total_price)}
              </p>
              <p className="mt-0.5 text-[10px] text-charcoal-muted">
                {order.order_number && <span className="font-mono text-charcoal">{order.order_number} · </span>}
                {created.toLocaleDateString("ko-KR")} {created.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
          {expanded ? <ChevronUp size={18} className="text-charcoal-muted" /> : <ChevronDown size={18} className="text-charcoal-muted" />}
        </button>
      </div>

      {expanded && (
        <div className="border-t border-birch-200 p-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <h4 className="text-xs font-semibold text-charcoal-muted">제작 정보</h4>
              <div className="mt-2 space-y-1.5 text-sm">
                <DetailRow label="주문번호" value={order.order_number ?? "-"} />
                <DetailRow label="상품" value={order.product_name || "-"} />
                <DetailRow label="사이즈" value={`${order.width} × ${order.depth} × ${order.height}mm`} />
                {(order.selected_options ?? []).map((s, i) => (
                  <DetailRow key={i} label={s.optionName} value={s.price > 0 ? `${s.valueLabel} (+${formatWon(s.price)})` : s.valueLabel} />
                ))}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-charcoal-muted">메모</h4>
                  {!editingMemo && (
                    <button
                      onClick={() => setEditingMemo(true)}
                      className="text-[11px] font-medium text-birch-500 hover:text-birch-600"
                    >
                      수정
                    </button>
                  )}
                </div>
                {editingMemo ? (
                  <div className="mt-2">
                    <textarea
                      value={memoDraft}
                      onChange={(e) => setMemoDraft(e.target.value)}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-birch-200 bg-white px-3 py-2 text-sm text-charcoal focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200"
                      placeholder="관리자 메모를 입력하세요."
                    />
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={handleSaveMemo}
                        className="inline-flex items-center gap-1 rounded-lg bg-charcoal px-3 py-1.5 text-xs font-medium text-ivory hover:bg-charcoal-light"
                      >
                        <Save size={12} />
                        저장
                      </button>
                      <button
                        onClick={() => { setEditingMemo(false); setMemoDraft(order.memo ?? ""); }}
                        className="rounded-lg border border-birch-200 px-3 py-1.5 text-xs font-medium text-charcoal-muted hover:bg-birch-50"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="mt-2 rounded-xl bg-birch-50 px-3 py-2 text-sm text-charcoal min-h-[36px] whitespace-pre-wrap">
                    {order.memo || "—"}
                  </p>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-xs font-semibold text-charcoal-muted">고객 정보</h4>
              <div className="mt-2 space-y-1.5 text-sm">
                <DetailRow label="이름" value={order.customer_name} />
                <DetailRow label="연락처" value={order.customer_phone} />
                <DetailRow label="이메일" value={order.customer_email || "-"} />
                <DetailRow label="주소" value={`${order.customer_postcode ?? ""} ${order.customer_address} ${order.customer_detail_address || ""}`.trim()} />
              </div>

              <h4 className="mt-4 text-xs font-semibold text-charcoal-muted">결제</h4>
              <div className="mt-2 space-y-1.5 text-sm">
                <DetailRow label="결제 방법" value={order.payment_method === "card" ? "카드 결제" : order.payment_method === "bank_transfer" ? "무통장입금" : "-"} />
                <DetailRow label="총 견적" value={formatWon(order.total_price)} />
              </div>

              {status === "shipped" && order.shipping_company && (
                <div className="mt-4 rounded-xl border border-birch-200 bg-birch-50 p-3">
                  <h4 className="text-xs font-semibold text-charcoal">배송 정보</h4>
                  <div className="mt-2 space-y-1.5 text-sm">
                    <DetailRow label="택배사" value={order.shipping_company} />
                    <DetailRow label="송장번호" value={order.tracking_number ?? "-"} />
                    {order.shipped_at && (
                      <DetailRow label="배송 시작" value={new Date(order.shipped_at).toLocaleDateString("ko-KR")} />
                    )}
                  </div>
                </div>
              )}

              {/* Action buttons based on status */}
              <div className="mt-5 space-y-3">
                {status === "payment_pending" && order.payment_method === "bank_transfer" && (
                  <button
                    onClick={() => onStatusChange(order.id, "paid")}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-teal-700"
                  >
                    <CheckCircle2 size={16} />
                    입금 확인 · 결제 완료
                  </button>
                )}

                {status === "paid" && (
                  <button
                    onClick={() => onStatusChange(order.id, "in_production")}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                  >
                    <Hammer size={16} />
                    제작 시작
                  </button>
                )}

                {status === "in_production" && (
                  <div className="rounded-xl border border-birch-200 bg-birch-50 p-4">
                    <h4 className="text-xs font-semibold text-charcoal">배송 정보 입력</h4>
                    <div className="mt-3 space-y-2">
                      <select
                        value={shippingCompany}
                        onChange={(e) => setShippingCompany(e.target.value)}
                        className="w-full rounded-lg border border-birch-200 bg-white px-3 py-2 text-sm text-charcoal focus:border-birch-400 focus:outline-none"
                      >
                        <option value="">택배사 선택</option>
                        {SHIPPING_COMPANIES.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={trackingNumber}
                        onChange={(e) => setTrackingNumber(e.target.value)}
                        placeholder="송장번호 입력"
                        className="w-full rounded-lg border border-birch-200 bg-white px-3 py-2 text-sm text-charcoal focus:border-birch-400 focus:outline-none"
                      />
                      {shippingError && <p className="text-xs text-red-600">{shippingError}</p>}
                      <button
                        onClick={handleShip}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                      >
                        <Truck size={16} />
                        배송 진행하기
                      </button>
                    </div>
                  </div>
                )}

                {status === "shipped" && (
                  <div className="space-y-2">
                    {canComplete ? (
                      <button
                        onClick={() => onStatusChange(order.id, "completed")}
                        className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                      >
                        <CheckCircle2 size={16} />
                        완료 처리
                      </button>
                    ) : (
                      <p className="rounded-lg bg-birch-50 px-3 py-2 text-center text-xs text-charcoal-muted">
                        배송 시작 후 2일이 경과하면 자동으로 완료됩니다.
                        {order.shipped_at && (
                          <> (배송 시작: {new Date(order.shipped_at).toLocaleDateString("ko-KR")})</>
                        )}
                      </p>
                    )}
                  </div>
                )}

                {(status === "payment_pending" || status === "paid") && (
                  <button
                    onClick={() => onStatusChange(order.id, "cancelled")}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
                  >
                    <XCircle size={16} />
                    주문 취소
                  </button>
                )}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-birch-200 px-3 py-2 text-xs font-medium text-charcoal transition-colors hover:bg-birch-50"
                >
                  <Printer size={14} />
                  주문서 출력
                </button>
                <button
                  onClick={() => onDelete(order.id)}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 transition-colors hover:bg-red-50"
                >
                  <Trash2 size={14} />
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="w-16 shrink-0 text-charcoal-muted">{label}</span>
      <span className="font-medium text-charcoal">{value}</span>
    </div>
  );
}
