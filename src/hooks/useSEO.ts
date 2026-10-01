import { useEffect } from "react";

interface SEOOptions {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
}

const BASE_KEYWORDS = "강아지집, 강아지침대, 강아지계단, 강아지방석, 강아지식탁, 강아지밥그릇, 고양이집, 고양이침대, 캣타워, 캣휠, 캣선반, 반려동물가구, 반려견가구, 반려묘가구, 펫가구, 맞춤가구, 자작나무가구, 코코스퍼니쳐, 코코스핏";
const DEFAULT_TITLE = "코코스퍼니쳐 | 맞춤형 반려동물 가구 — 강아지집 고양이집 캣타워 맞춤 제작";
const DEFAULT_DESCRIPTION = "강아지집, 강아지침대, 강아지계단, 고양이집, 고양이침대, 캣타워, 캣휠, 캣선반, 반려동물가구를 자작나무 합판으로 맞춤 제작합니다. 원하는 가로·세로·높이로 만드는 코코스핏 하우스.";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setCanonical(url: string) {
  let el = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", "canonical");
    document.head.appendChild(el);
  }
  el.setAttribute("href", url);
}

const PAGE_SEO: Record<string, SEOOptions> = {
  "/custom": {
    title: "맞춤 제작 — 강아지집 고양이집 캣타워 맞춤 가구 | 코코스퍼니쳐",
    description: "원하는 가로·세로·높이로 맞춤 제작하는 반려동물 가구. 강아지집, 고양이집, 캣타워, 강아지계단, 캣선반을 자작나무 합판으로 직접 설계하세요.",
  },
  "/cart": {
    title: "장바구니 | 코코스퍼니쳐",
    description: "선택한 맞춤형 반려동물 가구를 확인하고 주문하세요.",
  },
  "/checkout": {
    title: "주문 결제 | 코코스퍼니쳐",
    description: "맞춤형 반려동물 가구 주문 결제 페이지.",
  },
  "/auth": {
    title: "로그인 | 코코스퍼니쳐",
    description: "코코스퍼니쳐 회원 로그인.",
  },
  "/business": {
    title: "사업자 정보 | 코코스퍼니쳐",
    description: "코코스퍼니쳐 사업자 정보 및 이용약관.",
  },
  "/privacy": {
    title: "개인정보처리방침 | 코코스퍼니쳐",
    description: "코코스퍼니쳐 개인정보처리방침.",
  },
  "/refund": {
    title: "환불 정책 | 코코스퍼니쳐",
    description: "코코스퍼니쳐 환불 및 교환 정책.",
  },
};

export function useSEO(path: string) {
  useEffect(() => {
    let seo: SEOOptions = {};

    if (path === "/" || path === "") {
      seo = {};
    } else if (PAGE_SEO[path]) {
      seo = PAGE_SEO[path];
    } else if (path.startsWith("/product/")) {
      seo = {
        title: "맞춤형 반려동물 가구 상품 | 코코스퍼니쳐",
        description: "강아지집, 고양이집, 캣타워 등 반려동물 가구 상품 상세 정보. 자작나무 합판으로 맞춤 제작.",
      };
    } else if (path.startsWith("/category/")) {
      seo = {
        title: "반려동물 가구 컬렉션 | 코코스퍼니쳐",
        description: "강아지집, 고양이집, 캣타워, 강아지계단, 캣휠, 캣선반 등 반려동물 가구 컬렉션.",
      };
    }

    const title = seo.title ?? DEFAULT_TITLE;
    const description = seo.description ?? DEFAULT_DESCRIPTION;
    const keywords = seo.keywords ? `${seo.keywords}, ${BASE_KEYWORDS}` : BASE_KEYWORDS;
    const url = `https://mycocos.co.kr/${path === "/" ? "" : "#" + path}`;

    document.title = title;
    setMeta("name", "title", title);
    setMeta("name", "description", description);
    setMeta("name", "keywords", keywords);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setCanonical(url);
  }, [path]);
}
