import { Instagram, Mail } from "lucide-react";
import { BRAND, NAV_LINKS } from "@/config/brand";

interface FooterProps {
  onNavigate: (to: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-birch-200 bg-birch-50">
      <div className="mx-auto max-w-8xl px-5 py-16 sm:px-8 lg:px-12">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <div className="flex flex-col leading-none">
              <span className="text-lg font-bold text-charcoal">{BRAND.nameEn}</span>
              <span className="mt-1 text-xs font-medium tracking-[0.15em] text-charcoal-muted">
                {BRAND.nameKr}
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-charcoal-muted">
              {BRAND.slogan}
              <br />
              {BRAND.subCopy}
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-charcoal">바로가기</h4>
            <ul className="mt-4 space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <button
                    onClick={() => onNavigate(link.href)}
                    className="text-sm text-charcoal-muted transition-colors hover:text-charcoal"
                  >
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-charcoal">소식 받기</h4>
            <p className="mt-4 text-sm text-charcoal-muted">
              새로운 디자인과 제작 사례를 가장 먼저 만나보세요.
            </p>
            <div className="mt-4 flex gap-3">
              <a
                href={`https://instagram.com/${BRAND.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-birch-200 text-charcoal-muted transition-colors hover:border-charcoal hover:text-charcoal"
              >
                <Instagram size={18} />
              </a>
              <a
                href={`mailto:${BRAND.email}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-birch-200 text-charcoal-muted transition-colors hover:border-charcoal hover:text-charcoal"
              >
                <Mail size={18} />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-birch-200 pt-8">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <button onClick={() => onNavigate("/business")} className="text-xs text-charcoal-muted transition-colors hover:text-charcoal">사업자 정보</button>
            <button onClick={() => onNavigate("/privacy")} className="text-xs text-charcoal-muted transition-colors hover:text-charcoal">개인정보처리방침</button>
            <button onClick={() => onNavigate("/refund")} className="text-xs text-charcoal-muted transition-colors hover:text-charcoal">환불 정책</button>
            <button
              onClick={() => onNavigate("/admin")}
              className="text-xs text-charcoal-muted/60 transition-colors hover:text-charcoal-muted"
            >
              관리자
            </button>
          </div>

          <div className="flex flex-col gap-2 text-xs text-charcoal-muted sm:flex-row sm:items-center sm:justify-between">
            <p>
              © {new Date().getFullYear()} {BRAND.nameEn}. All rights reserved.
            </p>
            <p>
              {BRAND.nameKr} · 대표자: {BRAND.ceoName} · 사업자등록번호: {BRAND.businessNumber}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
