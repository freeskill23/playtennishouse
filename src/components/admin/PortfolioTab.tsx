import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit3, X, Loader2, Eye, EyeOff, Save } from "lucide-react";
import { fetchAllPortfolio, upsertPortfolioItem, deletePortfolioItem } from "@/lib/api";
import type { PortfolioRow } from "@/types/database";

export function PortfolioTab() {
  const [items, setItems] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<PortfolioRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllPortfolio();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    try {
      await deletePortfolioItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const handleToggleVisible = async (item: PortfolioRow) => {
    try {
      await upsertPortfolioItem({ ...item, is_visible: !item.is_visible });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_visible: !i.is_visible } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "변경에 실패했습니다.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-charcoal sm:text-3xl">포트폴리오 관리</h1>
          <p className="mt-2 text-sm text-charcoal-muted">"오늘의 코코스핏" 제작 사례를 관리합니다.</p>
        </div>
        <button onClick={() => setCreating(true)} className="btn-primary text-sm">
          <Plus size={16} />
          추가
        </button>
      </div>

      {error && <div className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Loader2 size={28} className="animate-spin text-birch-400" />
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-birch-200 bg-white">
              <div className="relative aspect-[4/5] bg-birch-100">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.dog_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-charcoal-muted">이미지 없음</div>
                )}
                <div className="absolute right-2 top-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.is_visible ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                    {item.is_visible ? "공개" : "숨김"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-charcoal-muted">
                  <span className="font-semibold text-charcoal">{item.dog_name}</span>
                  <span>·</span>
                  <span>{item.breed}</span>
                  <span>·</span>
                  <span>{item.weight}</span>
                </div>
                <p className="mt-2 font-mono text-xs font-medium text-charcoal">{item.size}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-charcoal-muted line-clamp-2">{item.note}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setEditing(item)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-charcoal transition-colors hover:bg-birch-100">
                    <Edit3 size={13} /> 수정
                  </button>
                  <button onClick={() => handleToggleVisible(item)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-charcoal transition-colors hover:bg-birch-100">
                    {item.is_visible ? <EyeOff size={13} /> : <Eye size={13} />}
                    {item.is_visible ? "숨김" : "공개"}
                  </button>
                  <button onClick={() => handleDelete(item.id)} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50">
                    <Trash2 size={13} /> 삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <PortfolioEditor
          item={editing}
          onClose={() => {
            setEditing(null);
            setCreating(false);
          }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function PortfolioEditor({
  item,
  onClose,
  onSaved,
}: {
  item: PortfolioRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dogName, setDogName] = useState(item?.dog_name ?? "");
  const [breed, setBreed] = useState(item?.breed ?? "");
  const [weight, setWeight] = useState(item?.weight ?? "");
  const [size, setSize] = useState(item?.size ?? "");
  const [note, setNote] = useState(item?.note ?? "");
  const [imageUrl, setImageUrl] = useState(item?.image_url ?? "");
  const [order, setOrder] = useState(item?.display_order ?? 0);
  const [visible, setVisible] = useState(item?.is_visible ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!dogName || !breed || !weight || !size || !note) {
      setError("모든 필수 항목을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertPortfolioItem({
        id: item?.id,
        dog_name: dogName,
        breed,
        weight,
        size,
        note,
        image_url: imageUrl || null,
        display_order: order,
        is_visible: visible,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-charcoal">{item ? "사례 수정" : "사례 추가"}</h2>
          <button onClick={onClose} className="text-charcoal-muted hover:text-charcoal">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="강아지 이름">
              <input value={dogName} onChange={(e) => setDogName(e.target.value)} className="input-field" placeholder="몽이" />
            </FormField>
            <FormField label="견종">
              <input value={breed} onChange={(e) => setBreed(e.target.value)} className="input-field" placeholder="비숑" />
            </FormField>
            <FormField label="몸무게">
              <input value={weight} onChange={(e) => setWeight(e.target.value)} className="input-field" placeholder="6.8kg" />
            </FormField>
            <FormField label="제작 사이즈">
              <input value={size} onChange={(e) => setSize(e.target.value)} className="input-field" placeholder="720 × 520 × 580mm" />
            </FormField>
          </div>
          <FormField label="설명">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} className="input-field resize-none" placeholder="거실 소파 옆 공간에 맞춰 제작했습니다." />
          </FormField>
          <FormField label="이미지 URL (선택)">
            <input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="input-field" placeholder="https://..." />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="표시 순서">
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} className="input-field" />
            </FormField>
            <FormField label="공개 여부">
              <button
                onClick={() => setVisible(!visible)}
                className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${
                  visible ? "border-charcoal bg-birch-50 text-charcoal" : "border-birch-200 text-charcoal-muted"
                }`}
              >
                {visible ? <Eye size={16} /> : <EyeOff size={16} />}
                {visible ? "공개" : "숨김"}
              </button>
            </FormField>
          </div>

          {error && <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-outline flex-1 text-sm">취소</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 text-sm">
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              저장
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-charcoal">{label}</label>
      {children}
    </div>
  );
}
