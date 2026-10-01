import { useEffect, useState } from "react";
import { Save, Loader2, AlertCircle, Check, Plus, Trash2 } from "lucide-react";
import { fetchSettings, upsertSetting } from "@/lib/api";
import { safeUUID } from "@/lib/pricing";
import type { PricingSettings, SizeSettings, BankAccount, PortOneConfig } from "@/types/database";
import { DEFAULT_PRICING, DEFAULT_SIZES } from "@/config/pricing";

export function SettingsTab() {
  const [pricing, setPricing] = useState<PricingSettings>(DEFAULT_PRICING);
  const [sizes, setSizes] = useState<SizeSettings>(DEFAULT_SIZES);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [portone, setPortone] = useState<PortOneConfig>({ storeId: "", channelKey: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const settings = await fetchSettings();
        if (settings.pricing) setPricing((prev) => ({ ...prev, ...settings.pricing! }));
        if (settings.sizes) setSizes((prev) => ({ ...prev, ...settings.sizes! }));
        if (settings.bank_accounts) setBankAccounts(settings.bank_accounts);
        if (settings.portone) setPortone(settings.portone);
      } catch (err) {
        setError(err instanceof Error ? err.message : "설정을 불러오지 못했습니다.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      await Promise.all([
        upsertSetting("pricing", pricing),
        upsertSetting("sizes", sizes),
        upsertSetting("bank_accounts", bankAccounts),
        upsertSetting("portone", portone),
      ]);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-16 flex justify-center">
        <Loader2 size={28} className="animate-spin text-birch-400" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-charcoal sm:text-3xl">설정</h1>
          <p className="mt-2 text-sm text-charcoal-muted">가격 및 사이즈 범위를 관리합니다.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary text-sm">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          저장
        </button>
      </div>

      {error && (
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      {saved && (
        <div className="mt-6 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">
          <Check size={16} />
          설정이 저장되었습니다.
        </div>
      )}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {/* Per-cm pricing */}
        <div className="rounded-3xl border border-birch-200 bg-white p-6">
          <h2 className="text-base font-semibold text-charcoal">1cm당 가격 상승폭</h2>
          <p className="mt-1 text-xs text-charcoal-muted">기본 사이즈에서 1cm 커질 때마다 추가되는 가격입니다.</p>
          <div className="mt-6 space-y-4">
            <NumberField label="가로 1cm당 (원)" value={pricing.perCmWidth} onChange={(v) => setPricing({ ...pricing, perCmWidth: v })} />
            <NumberField label="세로 1cm당 (원)" value={pricing.perCmDepth} onChange={(v) => setPricing({ ...pricing, perCmDepth: v })} />
            <NumberField label="높이 1cm당 (원)" value={pricing.perCmHeight} onChange={(v) => setPricing({ ...pricing, perCmHeight: v })} />
          </div>
        </div>

        {/* Other pricing */}
        <div className="rounded-3xl border border-birch-200 bg-white p-6">
          <h2 className="text-base font-semibold text-charcoal">기타 가격 설정</h2>
          <p className="mt-1 text-xs text-charcoal-muted">배송비 등 추가 비용 설정입니다.</p>
          <div className="mt-6 space-y-4">
            <NumberField label="배송비 (원)" value={pricing.shippingFee} onChange={(v) => setPricing({ ...pricing, shippingFee: v })} />
            <NumberField label="무료배송 기준 (원)" value={pricing.freeShippingThreshold} onChange={(v) => setPricing({ ...pricing, freeShippingThreshold: v })} />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-birch-200 bg-white p-6">
        <h2 className="text-base font-semibold text-charcoal">사이즈 범위</h2>
        <p className="mt-1 text-xs text-charcoal-muted">고객이 조정할 수 있는 최소/최대 사이즈입니다.</p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="grid gap-4">
            <NumberField label="가로 최소 (mm)" value={sizes.minWidth} onChange={(v) => setSizes({ ...sizes, minWidth: v })} />
            <NumberField label="가로 최대 (mm)" value={sizes.maxWidth} onChange={(v) => setSizes({ ...sizes, maxWidth: v })} />
          </div>
          <div className="grid gap-4">
            <NumberField label="세로 최소 (mm)" value={sizes.minDepth} onChange={(v) => setSizes({ ...sizes, minDepth: v })} />
            <NumberField label="세로 최대 (mm)" value={sizes.maxDepth} onChange={(v) => setSizes({ ...sizes, maxDepth: v })} />
          </div>
          <div className="grid gap-4">
            <NumberField label="높이 최소 (mm)" value={sizes.minHeight} onChange={(v) => setSizes({ ...sizes, minHeight: v })} />
            <NumberField label="높이 최대 (mm)" value={sizes.maxHeight} onChange={(v) => setSizes({ ...sizes, maxHeight: v })} />
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-birch-200 bg-white p-6">
        <h2 className="text-base font-semibold text-charcoal">무통장입금 계좌 관리</h2>
        <p className="mt-1 text-xs text-charcoal-muted">주문 완료 화면에 표시될 입금 계좌 정보입니다. 여러 개를 등록할 수 있습니다.</p>
        <div className="mt-6 space-y-3">
          {bankAccounts.map((acc) => (
            <div key={acc.id} className="flex items-center gap-3 rounded-xl border border-birch-200 bg-birch-50/50 p-4">
              <div className="grid flex-1 gap-3 sm:grid-cols-3">
                <input
                  type="text"
                  value={acc.bank}
                  onChange={(e) => setBankAccounts(bankAccounts.map((a) => a.id === acc.id ? { ...a, bank: e.target.value } : a))}
                  placeholder="은행명 (예: 국민은행)"
                  className="input-field"
                />
                <input
                  type="text"
                  value={acc.accountNumber}
                  onChange={(e) => setBankAccounts(bankAccounts.map((a) => a.id === acc.id ? { ...a, accountNumber: e.target.value } : a))}
                  placeholder="계좌번호 (예: 123-456-7890)"
                  className="input-field"
                />
                <input
                  type="text"
                  value={acc.accountHolder}
                  onChange={(e) => setBankAccounts(bankAccounts.map((a) => a.id === acc.id ? { ...a, accountHolder: e.target.value } : a))}
                  placeholder="예금주 (예: 코코스퍼니쳐)"
                  className="input-field"
                />
              </div>
              <button
                onClick={() => setBankAccounts(bankAccounts.filter((a) => a.id !== acc.id))}
                className="shrink-0 rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <button
            onClick={() => setBankAccounts([...bankAccounts, { id: safeUUID(), bank: "", accountNumber: "", accountHolder: "" }])}
            className="inline-flex items-center gap-1.5 rounded-lg border border-birch-200 px-4 py-2.5 text-xs font-medium text-charcoal transition-colors hover:bg-birch-50"
          >
            <Plus size={14} />
            계좌 추가
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-birch-200 bg-white p-6">
        <h2 className="text-base font-semibold text-charcoal">포트원(PortOne) 카드결제 설정</h2>
        <p className="mt-1 text-xs text-charcoal-muted">포트원 V2 Store ID와 Channel Key를 입력하면 카드 결제가 활성화됩니다.</p>
        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Store ID (포트원 상점 아이디)</label>
            <input
              type="text"
              value={portone.storeId}
              onChange={(e) => setPortone({ ...portone, storeId: e.target.value })}
              placeholder="store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="input-field"
            />
            <p className="mt-1.5 text-xs text-charcoal-muted">
              포트원 관리자 콘솔(admin.portone.io) &gt; 내 상점에서 확인. PG사의 MID가 아닙니다.
            </p>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">Channel Key (채널 키)</label>
            <input
              type="text"
              value={portone.channelKey}
              onChange={(e) => setPortone({ ...portone, channelKey: e.target.value })}
              placeholder="channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              className="input-field"
            />
            <p className="mt-1.5 text-xs text-charcoal-muted">
              포트원 콘솔 &gt; 연동 관리 &gt; 연동 정보 &gt; 채널 관리에서 확인.
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
            <p className="font-medium">주의: Store ID와 MID는 다른 값입니다</p>
            <p className="mt-1">MID(예: IPC8B)는 PG사(NHN KCP, KG이니시스 등)에서 발급받은 상점아이디이며, 포트원 콘솔에서 채널 설정 시 입력하는 값입니다. 결제 호출에 사용하는 Store ID는 포트원에서 발급하는 별도의 값입니다.</p>
          </div>
          <div className="rounded-xl bg-birch-50 px-4 py-3 text-xs leading-relaxed text-charcoal-muted">
            카드 결제를 사용하지 않으려면 두 필드를 비워두세요. 무통장입금만 유지됩니다.
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-2xl bg-birch-50 p-4 text-xs leading-relaxed text-charcoal-muted">
        저장된 설정은 데이터베이스에 보관됩니다. 변경된 가격은 새로운 주문부터 반영됩니다.
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-charcoal">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value) || 0)}
        className="input-field"
      />
    </div>
  );
}
