import { useState, useEffect } from "react";
import { Loader2, Package, ArrowRight } from "lucide-react";
import { fetchActiveProducts, fetchActiveCategories } from "@/lib/api";
import type { ProductRow, CategoryRow } from "@/types/database";
import { formatWon } from "@/lib/pricing";

interface ShopPageProps {
  onNavigate: (to: string) => void;
  categoryId?: string;
}

export function ShopPage({ onNavigate, categoryId }: ShopPageProps) {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const [cats, prods] = await Promise.all([
          fetchActiveCategories(),
          fetchActiveProducts(categoryId),
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [categoryId]);

  const currentCategory = categoryId
    ? categories.find((c) => c.id === categoryId)
    : null;

  return (
    <main className="min-h-screen bg-ivory pt-20 md:pt-24">
      <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 md:py-16 lg:px-12">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold tracking-[0.25em] text-charcoal-muted">COCOS FURNITURE</p>
          <h1 className="mt-3 font-serif text-3xl text-charcoal sm:text-4xl">
            {currentCategory ? currentCategory.name : "제품 전체보기"}
          </h1>
          <p className="mt-4 text-sm text-charcoal-muted">반려동물을 위한 자작나무 가구</p>
        </div>

        {categories.length > 0 && (
          <div className="mb-10 flex flex-wrap justify-center gap-2">
            <button
              onClick={() => onNavigate("/")}
              className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                !categoryId ? "bg-charcoal text-ivory" : "bg-white text-charcoal border border-birch-200 hover:border-birch-400"
              }`}
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onNavigate(`/category/${cat.id}`)}
                className={`rounded-full px-5 py-2.5 text-sm font-medium transition-colors ${
                  categoryId === cat.id ? "bg-charcoal text-ivory" : "bg-white text-charcoal border border-birch-200 hover:border-birch-400"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-24">
            <Loader2 size={28} className="animate-spin text-birch-400" />
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-24 text-center">
            <Package size={36} className="text-birch-300" />
            <p className="text-sm text-charcoal-muted">등록된 상품이 없습니다.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => onNavigate(`/product/${product.id}`)}
                className="group overflow-hidden rounded-3xl border border-birch-200 bg-white text-left transition-all hover:border-birch-400 hover:shadow-[0_8px_32px_rgba(184,160,126,0.15)]"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-birch-100">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-charcoal-muted">
                      이미지 없음
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-base font-semibold text-charcoal">{product.name}</h3>
                  <p className="mt-1.5 text-sm text-charcoal-muted line-clamp-2">{product.description}</p>
                  <div className="mt-4 flex items-end justify-between">
                    <div>
                      <p className="text-xs text-charcoal-muted">기본가격</p>
                      <p className="text-lg font-bold text-charcoal">{formatWon(product.base_price)}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-birch-500 group-hover:text-birch-600">
                      자세히
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
