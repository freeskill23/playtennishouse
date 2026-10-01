import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit3, X, Loader2, Eye, EyeOff, Save } from "lucide-react";
import { fetchAllReviews, upsertReview, deleteReview } from "@/lib/api";
import type { ReviewRow } from "@/types/database";

export function ReviewsTab() {
  const [items, setItems] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ReviewRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllReviews();
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
      await deleteReview(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const handleToggleVisible = async (item: ReviewRow) => {
    try {
      await upsertReview({ ...item, is_visible: !item.is_visible });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_visible: !i.is_visible } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "변경에 실패했습니다.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-charcoal sm:text-3xl">후기 관리</h1>
          <p className="mt-2 text-sm text-charcoal-muted">고객 후기를 관리합니다.</p>
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
            <div key={item.id} className="rounded-2xl border border-birch-200 bg-white p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-birch-200 text-xs font-bold text-charcoal">
                    {item.dog_name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-charcoal">{item.dog_name}</p>
                    <p className="text-[10px] text-charcoal-muted">{item.breed} · {item.weight}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.is_visible ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                  {item.is_visible ? "공개" : "숨김"}
                </span>
              </div>
              <p className="mt-3 font-mono text-[10px] text-charcoal-muted">{item.size}</p>
              <p className="mt-2 text-xs leading-relaxed text-charcoal-light line-clamp-3">"{item.review}"</p>
              <p className="mt-2 text-[10px] text-charcoal-muted">{item.author}</p>
              <div className="mt-3 flex gap-2">
                <button onClick={() => setEditing(item)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-birch-100">
                  <Edit3 size={13} /> 수정
                </button>
                <button onClick={() => handleToggleVisible(item)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-charcoal hover:bg-birch-100">
                  {item.is_visible ? <EyeOff size={13} /> : <Eye size={13} />}
                  {item.is_visible ? "숨김" : "공개"}
                </button>
                <button onClick={() => handleDelete(item.id)} className="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                  <Trash2 size={13} /> 삭제
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <ReviewEditor
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

function ReviewEditor({
  item,
  onClose,
  onSaved,
}: {
  item: ReviewRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [dogName, setDogName] = useState(item?.dog_name ?? "");
  const [breed, setBreed] = useState(item?.breed ?? "");
  const [weight, setWeight] = useState(item?.weight ?? "");
  const [size, setSize] = useState(item?.size ?? "");
  const [review, setReview] = useState(item?.review ?? "");
  const [author, setAuthor] = useState(item?.author ?? "");
  const [order, setOrder] = useState(item?.display_order ?? 0);
  const [visible, setVisible] = useState(item?.is_visible ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!dogName || !breed || !weight || !size || !review || !author) {
      setError("모든 필수 항목을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertReview({
        id: item?.id,
        dog_name: dogName,
        breed,
        weight,
        size,
        review,
        author,
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
          <h2 className="font-serif text-xl text-charcoal">{item ? "후기 수정" : "후기 추가"}</h2>
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
          <FormField label="후기 내용">
            <textarea value={review} onChange={(e) => setReview(e.target.value)} rows={3} className="input-field resize-none" placeholder="고객 후기를 입력하세요." />
          </FormField>
          <FormField label="작성자">
            <input value={author} onChange={(e) => setAuthor(e.target.value)} className="input-field" placeholder="서울 송파구 · 김OO" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="표시 순서">
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} className="input-field" />
            </FormField>
            <FormField label="공개 여부">
              <button onClick={() => setVisible(!visible)} className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${visible ? "border-charcoal bg-birch-50 text-charcoal" : "border-birch-200 text-charcoal-muted"}`}>
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
