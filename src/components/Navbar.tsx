import { useState, useEffect } from "react";
import { Menu, X, ShoppingBag, User, LogOut, Settings } from "lucide-react";
import { BRAND } from "@/config/brand";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { fetchActiveCategories } from "@/lib/api";
import type { CategoryRow } from "@/types/database";

interface NavbarProps {
  onNavigate: (to: string) => void;
  currentPath: string;
}

export function Navbar({ onNavigate, currentPath }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const { count } = useCart();
  const { session, signOut } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    fetchActiveCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleNavClick = (href: string) => {
    setMenuOpen(false);
    onNavigate(href);
  };

  const handleLogout = async () => {
    setMenuOpen(false);
    await signOut();
    onNavigate("/");
  };

  const isCategoryActive = (catId: string) => currentPath === `/category/${catId}`;
  const isAllActive = currentPath === "/" || currentPath === "";

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled || menuOpen
            ? "bg-ivory/95 backdrop-blur-md shadow-[0_1px_0_rgba(0,0,0,0.04)]"
            : "bg-transparent"
        }`}
      >
        <nav className="mx-auto max-w-8xl px-5 sm:px-8 lg:px-12">
          <div className="flex h-16 items-center justify-between md:h-20">
            <button
              onClick={() => handleNavClick("/")}
              className="flex flex-col items-start leading-none"
              aria-label={`${BRAND.nameKr} 홈`}
            >
              <span className="text-base font-bold tracking-tight text-charcoal md:text-lg">
                {BRAND.nameEn}
              </span>
              <span className="text-[10px] font-medium tracking-[0.15em] text-charcoal-muted md:text-xs">
                {BRAND.nameKr}
              </span>
            </button>

            <div className="hidden items-center gap-6 md:flex">
              <button
                onClick={() => handleNavClick("/")}
                className={`text-sm font-medium transition-colors hover:text-charcoal ${
                  isAllActive ? "text-charcoal" : "text-charcoal-light"
                }`}
              >
                전체
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleNavClick(`/category/${cat.id}`)}
                  className={`text-sm font-medium transition-colors hover:text-charcoal ${
                    isCategoryActive(cat.id) ? "text-charcoal" : "text-charcoal-light"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleNavClick("/cart")}
                className="relative inline-flex h-10 w-10 items-center justify-center text-charcoal transition-colors hover:text-charcoal-light"
                aria-label="장바구니"
              >
                <ShoppingBag size={20} />
                {count > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-birch-600 px-1 text-[10px] font-bold text-white">
                    {count}
                  </span>
                )}
              </button>
              <button
                onClick={() => handleNavClick(session ? "/account" : "/auth")}
                className="hidden h-10 w-10 items-center justify-center text-charcoal transition-colors hover:text-charcoal-light sm:inline-flex"
                aria-label="계정"
              >
                <User size={20} />
              </button>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="inline-flex h-10 w-10 items-center justify-center text-charcoal"
                aria-label="메뉴"
              >
                {menuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </nav>
      </header>

      {menuOpen && (
        <div className="fixed inset-0 top-16 z-40 bg-ivory">
          <div className="flex flex-col gap-1 px-6 py-8">
            <button
              onClick={() => handleNavClick("/")}
              className="rounded-xl px-4 py-3.5 text-left text-base font-medium text-charcoal transition-colors hover:bg-birch-100"
            >
              전체
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleNavClick(`/category/${cat.id}`)}
                className="rounded-xl px-4 py-3.5 text-left text-base font-medium text-charcoal transition-colors hover:bg-birch-100"
              >
                {cat.name}
              </button>
            ))}
            <div className="my-2 h-px bg-birch-200" />
            <button
              onClick={() => handleNavClick("/cart")}
              className="rounded-xl px-4 py-3.5 text-left text-base font-medium text-charcoal transition-colors hover:bg-birch-100"
            >
              장바구니 {count > 0 && `(${count})`}
            </button>
            {session ? (
              <>
                <div className="px-4 py-2 text-xs text-charcoal-muted">
                  {session.user.email}
                </div>
                <button
                  onClick={() => handleNavClick("/account")}
                  className="flex items-center gap-2 rounded-xl px-4 py-3.5 text-left text-base font-medium text-charcoal transition-colors hover:bg-birch-100"
                >
                  <Settings size={18} />
                  내 정보 관리
                </button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-xl px-4 py-3.5 text-left text-base font-medium text-charcoal transition-colors hover:bg-birch-100"
                >
                  <LogOut size={18} />
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick("/auth")}
                  className="rounded-xl px-4 py-3.5 text-left text-base font-medium text-charcoal transition-colors hover:bg-birch-100"
                >
                  로그인 / 회원가입
                </button>
                <button
                  onClick={() => handleNavClick("/guest-order")}
                  className="rounded-xl px-4 py-3.5 text-left text-base font-medium text-charcoal-muted transition-colors hover:bg-birch-100"
                >
                  비회원 주문 조회
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
