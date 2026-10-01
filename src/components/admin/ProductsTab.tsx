import { useEffect, useState, useCallback, useRef } from "react";
import { Plus, Trash2, Edit3, X, Loader2, Eye, EyeOff, Save, Package, GripVertical, Truck } from "lucide-react";
import { fetchAllProducts, upsertProduct, deleteProduct, fetchAllCategories } from "@/lib/api";
import type { ProductRow, ProductOption, ProductOptionValue, CategoryRow } from "@/types/database";
import { formatWon } from "@/lib/pricing";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { DetailEditor } from "@/components/admin/DetailEditor";

let optionIdCounter = 0;
function genId(prefix: string): string {
  optionIdCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${optionIdCounter}`;
}

export function ProductsTab() {
  const [items, setItems] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<ProductRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [data, cats] = await Promise.all([fetchAllProducts(), fetchAllCategories()]);
      setItems(data);
      setCategories(cats);
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
      await deleteProduct(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "삭제에 실패했습니다.");
    }
  };

  const handleToggleActive = async (item: ProductRow) => {
    try {
      await upsertProduct({ ...item, is_active: !item.is_active });
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_active: !i.is_active } : i)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "변경에 실패했습니다.");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl text-charcoal sm:text-3xl">상품 관리</h1>
          <p className="mt-2 text-sm text-charcoal-muted">판매할 강아지집 상품을 등록하고 관리합니다.</p>
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
          <Package size={36} className="text-birch-300" />
          <p className="text-sm text-charcoal-muted">등록된 상품이 없습니다.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-birch-200 bg-white">
              <div className="relative aspect-[4/3] bg-birch-100">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-charcoal-muted">이미지 없음</div>
                )}
                <div className="absolute right-2 top-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${item.is_active ? "bg-green-100 text-green-700" : "bg-gray-200 text-gray-500"}`}>
                    {item.is_active ? "판매중" : "판매중지"}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-charcoal">{item.name}</h3>
                <p className="mt-1 text-xs text-charcoal-muted line-clamp-2">{item.description}</p>
                <p className="mt-2 font-mono text-xs font-medium text-charcoal">
                  {item.base_width}×{item.base_depth}×{item.base_height}mm
                </p>
                <p className="mt-1 text-sm font-bold text-charcoal">{formatWon(item.base_price)}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => setEditing(item)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-charcoal transition-colors hover:bg-birch-100">
                    <Edit3 size={13} /> 수정
                  </button>
                  <button onClick={() => handleToggleActive(item)} className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-charcoal transition-colors hover:bg-birch-100">
                    {item.is_active ? <EyeOff size={13} /> : <Eye size={13} />}
                    {item.is_active ? "판매중지" : "판매"}
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
        <ProductEditor
          item={editing}
          categories={categories}
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

function ProductEditor({
  item,
  categories,
  onClose,
  onSaved,
}: {
  item: ProductRow | null;
  categories: CategoryRow[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(item?.name ?? "");
  const [description, setDescription] = useState(item?.description ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(item?.image_url ?? null);
  const [detailContent, setDetailContent] = useState(item?.detail_content ?? "");
  const [baseWidth, setBaseWidth] = useState(item?.base_width ?? 750);
  const [baseDepth, setBaseDepth] = useState(item?.base_depth ?? 550);
  const [baseHeight, setBaseHeight] = useState(item?.base_height ?? 600);
  const [basePrice, setBasePrice] = useState(item?.base_price ?? 50000);
  const [order, setOrder] = useState(item?.display_order ?? 0);
  const [active, setActive] = useState(item?.is_active ?? true);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(item?.category_ids ?? []);
  const [sizeCustomizable, setSizeCustomizable] = useState(item?.size_customizable ?? true);
  const [customizableWidth, setCustomizableWidth] = useState(item?.customizable_width ?? true);
  const [customizableDepth, setCustomizableDepth] = useState(item?.customizable_depth ?? true);
  const [customizableHeight, setCustomizableHeight] = useState(item?.customizable_height ?? true);
  const [useDefaultShipping, setUseDefaultShipping] = useState(item?.shipping_fee === null && item?.free_shipping_threshold === null);
  const [shippingFee, setShippingFee] = useState(item?.shipping_fee ?? 15000);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(item?.free_shipping_threshold ?? 200000);
  const [options, setOptions] = useState<ProductOption[]>(
    (item?.options ?? []).map((o) => ({
      ...o,
      id: o.id || genId("opt"),
      values: (o.values ?? []).map((v) => ({ ...v, id: v.id || genId("val") })),
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const backdropMouseDownTarget = useRef<EventTarget | null>(null);

  const handleSave = async () => {
    if (!name || basePrice <= 0) {
      setError("상품명과 기본가격을 입력해주세요.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await upsertProduct({
        id: item?.id,
        name,
        description: description || "",
        image_url: imageUrl,
        detail_content: detailContent,
        base_width: baseWidth,
        base_depth: baseDepth,
        base_height: baseHeight,
        base_price: basePrice,
        display_order: order,
        is_active: active,
        category_ids: selectedCategoryIds,
        size_customizable: sizeCustomizable,
        customizable_width: customizableWidth,
        customizable_depth: customizableDepth,
        customizable_height: customizableHeight,
        shipping_fee: useDefaultShipping ? null : shippingFee,
        free_shipping_threshold: useDefaultShipping ? null : freeShippingThreshold,
        options,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
      onMouseDown={(e) => { backdropMouseDownTarget.current = e.target; }}
      onClick={(e) => {
        if (e.target === backdropMouseDownTarget.current && e.target === e.currentTarget) {
          onClose();
        }
        backdropMouseDownTarget.current = null;
      }}
    >
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 sm:p-8" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-xl text-charcoal">{item ? "상품 수정" : "상품 추가"}</h2>
          <button onClick={onClose} className="text-charcoal-muted hover:text-charcoal">
            <X size={20} />
          </button>
        </div>

        <div className="mt-6 space-y-4">
          <FormField label="상품명">
            <input value={name} onChange={(e) => setName(e.target.value)} className="input-field" placeholder="예: 클래식 강아지집" />
          </FormField>
          <FormField label="상품 설명">
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="input-field resize-none" placeholder="상품 목록에 표시될 짧은 설명" />
          </FormField>

          <ImageUpload
            label="상품 이미지"
            value={imageUrl}
            onChange={setImageUrl}
            aspectRatio="aspect-[4/3]"
            maxWidth={1200}
            maxHeight={1200}
          />

          <FormField label="카테고리 (복수 선택 가능)">
            <div className="flex flex-wrap gap-2">
              {categories.length === 0 ? (
                <p className="text-xs text-charcoal-muted">등록된 카테고리가 없습니다. 먼저 카테고리 관리에서 카테고리를 추가해주세요.</p>
              ) : (
                categories.map((cat) => {
                  const isSelected = selectedCategoryIds.includes(cat.id);
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setSelectedCategoryIds((prev) =>
                          isSelected ? prev.filter((id) => id !== cat.id) : [...prev, cat.id]
                        );
                      }}
                      className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
                        isSelected ? "border-charcoal bg-charcoal text-ivory" : "border-birch-200 bg-white text-charcoal hover:border-birch-400"
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })
              )}
            </div>
          </FormField>

          <FormField label="사이즈 변경">
            <button
              type="button"
              onClick={() => setSizeCustomizable(!sizeCustomizable)}
              className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${sizeCustomizable ? "border-charcoal bg-birch-50 text-charcoal" : "border-birch-200 text-charcoal-muted"}`}
            >
              {sizeCustomizable ? "사이즈 변경 가능" : "사이즈 변경 불필요 (고정 사이즈)"}
            </button>
            {sizeCustomizable && (
              <div className="mt-3 space-y-2">
                <p className="text-xs text-charcoal-muted">조절 가능한 축 선택 (복수 선택 가능)</p>
                <div className="flex flex-wrap gap-2">
                  <AxisToggle label="가로" active={customizableWidth} onClick={() => setCustomizableWidth(!customizableWidth)} />
                  <AxisToggle label="세로" active={customizableDepth} onClick={() => setCustomizableDepth(!customizableDepth)} />
                  <AxisToggle label="높이" active={customizableHeight} onClick={() => setCustomizableHeight(!customizableHeight)} />
                </div>
              </div>
            )}
          </FormField>

          <FormField label="상세 페이지 구성">
            <DetailEditor value={detailContent} onChange={setDetailContent} />
          </FormField>

          <div className="rounded-2xl bg-birch-50 p-4">
            <p className="text-xs font-semibold text-charcoal">기본 사이즈 (mm)</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              <FormField label="가로">
                <input type="number" value={baseWidth} onChange={(e) => setBaseWidth(Number(e.target.value) || 0)} className="input-field" />
              </FormField>
              <FormField label="세로">
                <input type="number" value={baseDepth} onChange={(e) => setBaseDepth(Number(e.target.value) || 0)} className="input-field" />
              </FormField>
              <FormField label="높이">
                <input type="number" value={baseHeight} onChange={(e) => setBaseHeight(Number(e.target.value) || 0)} className="input-field" />
              </FormField>
            </div>
          </div>
          <FormField label="기본 가격 (원)">
            <input type="number" value={basePrice} onChange={(e) => setBasePrice(Number(e.target.value) || 0)} className="input-field" />
          </FormField>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="표시 순서">
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value) || 0)} className="input-field" />
            </FormField>
            <FormField label="판매 상태">
              <button onClick={() => setActive(!active)} className={`flex w-full items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-sm font-medium transition-all ${active ? "border-charcoal bg-birch-50 text-charcoal" : "border-birch-200 text-charcoal-muted"}`}>
                {active ? <Eye size={16} /> : <EyeOff size={16} />}
                {active ? "판매중" : "판매중지"}
              </button>
            </FormField>
          </div>

          <div className="rounded-2xl bg-birch-50 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-charcoal">배송비 설정</p>
              <label className="flex items-center gap-2 text-xs text-charcoal-muted">
                <input
                  type="checkbox"
                  checked={useDefaultShipping}
                  onChange={(e) => setUseDefaultShipping(e.target.checked)}
                  className="h-4 w-4 accent-birch-600"
                />
                기본 배송비 사용
              </label>
            </div>
            {useDefaultShipping ? (
              <p className="mt-3 text-xs text-charcoal-muted">설정에 등록된 기본 배송비와 무료배송 기준이 적용됩니다.</p>
            ) : (
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                <FormField label="배송비 (원)">
                  <input type="number" value={shippingFee} onChange={(e) => setShippingFee(Number(e.target.value) || 0)} className="input-field" />
                </FormField>
                <FormField label="무료배송 기준 (원)">
                  <input type="number" value={freeShippingThreshold} onChange={(e) => setFreeShippingThreshold(Number(e.target.value) || 0)} className="input-field" />
                </FormField>
              </div>
            )}
          </div>

          <OptionsEditor options={options} setOptions={setOptions} />

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

function OptionsEditor({
  options,
  setOptions,
}: {
  options: ProductOption[];
  setOptions: React.Dispatch<React.SetStateAction<ProductOption[]>>;
}) {
  const addOption = () => {
    setOptions((prev) => [
      ...prev,
      { id: genId("opt"), name: "", values: [{ id: genId("val"), label: "", price: 0 }] },
    ]);
  };

  const removeOption = (optId: string) => {
    setOptions((prev) => prev.filter((o) => o.id !== optId));
  };

  const updateOptionName = (optId: string, name: string) => {
    setOptions((prev) => prev.map((o) => (o.id === optId ? { ...o, name } : o)));
  };

  const addValue = (optId: string) => {
    setOptions((prev) =>
      prev.map((o) =>
        o.id === optId ? { ...o, values: [...o.values, { id: genId("val"), label: "", price: 0 }] } : o
      )
    );
  };

  const removeValue = (optId: string, valId: string) => {
    setOptions((prev) =>
      prev.map((o) =>
        o.id === optId ? { ...o, values: o.values.filter((v) => v.id !== valId) } : o
      )
    );
  };

  const updateValue = (optId: string, valId: string, field: keyof ProductOptionValue, value: string | number) => {
    setOptions((prev) =>
      prev.map((o) =>
        o.id === optId
          ? { ...o, values: o.values.map((v) => (v.id === valId ? { ...v, [field]: value } : v)) }
          : o
      )
    );
  };

  return (
    <div className="rounded-2xl bg-birch-50 p-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-charcoal">추가 옵션</p>
        <button
          type="button"
          onClick={addOption}
          className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1.5 text-xs font-medium text-charcoal transition-colors hover:bg-birch-100"
        >
          <Plus size={13} />
          옵션 추가
        </button>
      </div>

      {options.length === 0 ? (
        <p className="mt-3 text-xs text-charcoal-muted">
          옵션이 없습니다. 예: 바닥재(기본 합판 / 소프트 쿠션 +15,000원) 등
        </p>
      ) : (
        <div className="mt-4 space-y-4">
          {options.map((opt) => (
            <div key={opt.id} className="rounded-xl border border-birch-200 bg-white p-4">
              <div className="flex items-center gap-2">
                <GripVertical size={14} className="shrink-0 text-birch-300" />
                <input
                  type="text"
                  value={opt.name}
                  onChange={(e) => updateOptionName(opt.id, e.target.value)}
                  placeholder="옵션명 (예: 바닥재)"
                  className="flex-1 rounded-lg border border-birch-200 bg-white px-3 py-2 text-sm font-medium text-charcoal focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200"
                />
                <button
                  type="button"
                  onClick={() => removeOption(opt.id)}
                  className="shrink-0 rounded-lg p-1.5 text-red-500 transition-colors hover:bg-red-50"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="mt-3 space-y-2 pl-6">
                {opt.values.map((val) => (
                  <div key={val.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={val.label}
                      onChange={(e) => updateValue(opt.id, val.id, "label", e.target.value)}
                      placeholder="옵션값 (예: 소프트 쿠션)"
                      className="flex-1 rounded-lg border border-birch-200 bg-white px-3 py-2 text-sm text-charcoal focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      <input
                        type="number"
                        value={val.price}
                        onChange={(e) => updateValue(opt.id, val.id, "price", Number(e.target.value) || 0)}
                        placeholder="0"
                        className="w-24 rounded-lg border border-birch-200 bg-white px-3 py-2 text-right text-sm text-charcoal focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200"
                      />
                      <span className="text-xs text-charcoal-muted">원</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeValue(opt.id, val.id)}
                      className="shrink-0 rounded-lg p-1 text-charcoal-muted transition-colors hover:bg-birch-100 hover:text-red-500"
                    >
                      <X size={15} />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addValue(opt.id)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-charcoal-muted transition-colors hover:text-charcoal"
                >
                  <Plus size={13} />
                  옵션값 추가
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
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

function AxisToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border-2 px-3 py-2 text-xs font-medium transition-all ${
        active ? "border-charcoal bg-charcoal text-ivory" : "border-birch-200 bg-white text-charcoal hover:border-birch-400"
      }`}
    >
      {label} 조절 {active ? "가능" : "불가"}
    </button>
  );
}
