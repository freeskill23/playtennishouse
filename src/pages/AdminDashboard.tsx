import { useEffect, useState, useCallback } from "react";
import { LogOut, LayoutDashboard, Package, Boxes, Images, Star, Settings, Menu, X, Tag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { BRAND } from "@/config/brand";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { ProductsTab } from "@/components/admin/ProductsTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { PortfolioTab } from "@/components/admin/PortfolioTab";
import { ReviewsTab } from "@/components/admin/ReviewsTab";
import { SettingsTab } from "@/components/admin/SettingsTab";

type TabId = "dashboard" | "orders" | "products" | "categories" | "portfolio" | "reviews" | "settings";

function tabFromPath(path: string): TabId {
  const match = path.match(/^\/admin\/?(\w*)/);
  const segment = match?.[1];
  const valid: TabId[] = ["dashboard", "orders", "products", "categories", "portfolio", "reviews", "settings"];
  return (valid.includes(segment as TabId) ? segment : "dashboard") as TabId;
}

interface AdminDashboardProps {
  onNavigate: (to: string) => void;
  path: string;
}

export function AdminDashboard({ onNavigate, path }: AdminDashboardProps) {
  const { signOut, session } = useAuth();
  const [tab, setTab] = useState<TabId>(() => tabFromPath(path));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [orderCount, setOrderCount] = useState<number | null>(null);

  const handleSignOut = async () => {
    await signOut();
    onNavigate("/");
  };

  const navItems: { id: TabId; label: string; icon: typeof LayoutDashboard }[] = [
    { id: "dashboard", label: "대시보드", icon: LayoutDashboard },
    { id: "orders", label: "주문 관리", icon: Package },
    { id: "products", label: "상품 관리", icon: Boxes },
    { id: "categories", label: "카테고리", icon: Tag },
    { id: "portfolio", label: "포트폴리오", icon: Images },
    { id: "reviews", label: "후기 관리", icon: Star },
    { id: "settings", label: "설정", icon: Settings },
  ];

  const handleTabChange = useCallback((id: TabId) => {
    setTab(id);
    setSidebarOpen(false);
    onNavigate(id === "dashboard" ? "/admin" : `/admin/${id}`);
  }, [onNavigate]);

  useEffect(() => {
    setTab(tabFromPath(path));
  }, [path]);

  return (
    <div className="min-h-screen bg-birch-50">
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-birch-200 bg-white px-5 py-3 lg:hidden">
        <span className="text-sm font-bold text-charcoal">{BRAND.nameEn} Admin</span>
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-charcoal">
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className="flex">
        <aside
          className={`fixed inset-y-0 left-0 z-40 w-60 transform border-r border-birch-200 bg-white transition-transform lg:sticky lg:top-0 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ height: "100vh" }}
        >
          <div className="flex h-full flex-col">
            <div className="hidden border-b border-birch-200 px-6 py-5 lg:block">
              <span className="text-base font-bold text-charcoal">{BRAND.nameEn}</span>
              <p className="text-xs text-charcoal-muted">관리자 페이지</p>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto p-3">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    tab === item.id
                      ? "bg-charcoal text-ivory"
                      : "text-charcoal-light hover:bg-birch-100"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </button>
              ))}
            </nav>

            <div className="border-t border-birch-200 p-4">
              <p className="mb-3 truncate text-xs text-charcoal-muted">{session?.user?.email}</p>
              <button
                onClick={handleSignOut}
                className="flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-charcoal-muted transition-colors hover:bg-red-50 hover:text-red-600"
              >
                <LogOut size={16} />
                로그아웃
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <main className="min-h-screen flex-1 px-5 py-8 sm:px-8 lg:px-12">
          {tab === "dashboard" && (
            <DashboardHome onTabChange={handleTabChange} orderCount={orderCount} setOrderCount={setOrderCount} />
          )}
          {tab === "orders" && <OrdersTab onCountChange={setOrderCount} />}
          {tab === "products" && <ProductsTab />}
          {tab === "categories" && <CategoriesTab />}
          {tab === "portfolio" && <PortfolioTab />}
          {tab === "reviews" && <ReviewsTab />}
          {tab === "settings" && <SettingsTab />}
        </main>
      </div>
    </div>
  );
}

function DashboardHome({
  onTabChange,
  orderCount,
  setOrderCount,
}: {
  onTabChange: (id: TabId) => void;
  orderCount: number | null;
  setOrderCount: (n: number) => void;
}) {
  const [stats, setStats] = useState<{ orders: number; products: number; portfolio: number; reviews: number } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [orders, products, portfolio, reviews] = await Promise.all([
          supabase.from("orders").select("id", { count: "exact", head: true }),
          supabase.from("products").select("id", { count: "exact", head: true }),
          supabase.from("portfolio_items").select("id", { count: "exact", head: true }),
          supabase.from("reviews").select("id", { count: "exact", head: true }),
        ]);
        setStats({
          orders: orders.count ?? 0,
          products: products.count ?? 0,
          portfolio: portfolio.count ?? 0,
          reviews: reviews.count ?? 0,
        });
        setOrderCount(orders.count ?? 0);
      } catch {
        setStats({ orders: 0, products: 0, portfolio: 0, reviews: 0 });
      }
    })();
  }, [setOrderCount]);

  const cards = [
    { label: "총 주문", value: stats?.orders ?? orderCount ?? "-", tab: "orders" as TabId, icon: Package },
    { label: "상품", value: stats?.products ?? "-", tab: "products" as TabId, icon: Boxes },
    { label: "포트폴리오", value: stats?.portfolio ?? "-", tab: "portfolio" as TabId, icon: Images },
    { label: "후기", value: stats?.reviews ?? "-", tab: "reviews" as TabId, icon: Star },
  ];

  return (
    <div>
      <h1 className="font-serif text-2xl text-charcoal sm:text-3xl">대시보드</h1>
      <p className="mt-2 text-sm text-charcoal-muted">코코스퍼니쳐 관리 현황을 한눈에 확인하세요.</p>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => onTabChange(card.tab)}
            className="rounded-3xl border border-birch-200 bg-white p-6 text-left transition-all hover:border-birch-400 hover:shadow-[0_4px_24px_rgba(184,160,126,0.1)]"
          >
            <div className="flex items-center justify-between">
              <card.icon size={24} className="text-birch-400" />
              <span className="font-serif text-3xl font-bold text-charcoal">{card.value}</span>
            </div>
            <p className="mt-3 text-sm text-charcoal-muted">{card.label}</p>
          </button>
        ))}
      </div>

      <div className="mt-8 rounded-3xl border border-birch-200 bg-white p-6">
        <h2 className="text-base font-semibold text-charcoal">빠른 작업</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={() => onTabChange("orders")} className="btn-outline text-sm">
            주문 확인하기
          </button>
          <button onClick={() => onTabChange("products")} className="btn-outline text-sm">
            상품 추가
          </button>
          <button onClick={() => onTabChange("portfolio")} className="btn-outline text-sm">
            포트폴리오 추가
          </button>
          <button onClick={() => onTabChange("settings")} className="btn-outline text-sm">
            가격 설정
          </button>
        </div>
      </div>
    </div>
  );
}
