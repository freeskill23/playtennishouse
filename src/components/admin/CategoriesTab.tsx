import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Edit3, X, Loader2, Save, Tag, GripVertical } from "lucide-react";
import { fetchAllCategories, upsertCategory, deleteCategory } from "@/lib/api";
import type { CategoryRow } from "@/types/database";

export function CategoriesTab() {
  const [items, setItems] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAllCategories();
      setItems(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("정말 삭제하시겠습니까? 해당 카테고리의 상품은 '카테고리 없음'으로 변경됩니다.")) return;
    try {
      await deleteCategory(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-charcoal sm:text-3xl">카테고리 관리</h1>
          <p className="mt-2 text-sm text-charcoal-muted">강아지, 고양이, 기타반려동물 등 대 카테고리를 관리합니다.</p>
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
      ) : items.length === 0 ? (
        <div className="mt-16 flex flex-col items-center gap-3 text-center">
          <Tag size={36} className="text-birch-300" />
          <p className="text-sm text-charcoal-muted">등록된 카테고리가 없습니다.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 rounded-2xl border border-birch-200 bg-white p-4">
              <GripVertical size={16} className="text-birch-300" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-charcoal">{item.name}</h3>
                <p className="text-xs text-charcoal-muted">표시 순서: {item.display_order}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-medium ${item.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                {item.is_active ? "사용중" : "사용안함"}
              </span>
              <button onClick={() => setEditing(item)} className="rounded-lg p-2 text-charcoal transition-colors hover:bg-birch-100">
                <Edit3 size={15} />
              </button>
              <button onClick={() => handleDelete(item.id)} className="rounded-lg p-2 text-red-600 transition-colors hover:bg-red-50">
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}

      {(editing || creating) && (
        <CategoryEditor
          item={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => { setEditing(null); setCreating(false); load(); }}
        />
      )}
    </div>
  );
}

function CategoryEditor({ item, onClose, onSaved }: {
  item: CategoryRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [order, setOrder] = useState(item?.display_order ?? 0);
  const [active, setActive] = useState(item?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!name.trim()) {
      setError("카테고리명을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertCategory({
        id: item?.id,
        name: name.trim(),
        display_order: order,
        is_active: active,
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
      <div className="w-full max-w-md rounded-3xl bg-white p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-charcoal">{item ? "카테고리 수정" : "카테고리 추가"}</h2>
          <button onClick={onClose} className="text-charcoal-muted hover:text-charcoal">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">카테고리명</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="예: 강아지, 고양이, 기타반려동물" />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-charcoal">표시 순서</label>
            <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} className="input-field" />
          </div>
          <button onClick={() => setActive(!active)} className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${active ? "border-charcoal bg-birch-50 text-charcoal" : "border-birch-200 text-charcoal-muted"}`}>
            {active ? "사용중" : "사용안함"}
          </button>

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
