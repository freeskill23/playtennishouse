import { useState, useEffect, useCallback } from "react";

function getHashPath(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/";
}

export function useRouter() {
  const [path, setPath] = useState<string>(getHashPath());

  useEffect(() => {
    const onPop = () => setPath(getHashPath());
    window.addEventListener("popstate", onPop);
    window.addEventListener("hashchange", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      window.removeEventListener("hashchange", onPop);
    };
  }, []);

  // On initial load, if the hash is empty, set it to #/
  useEffect(() => {
    if (!window.location.hash) {
      window.history.replaceState({}, "", "#/");
    }
  }, []);

  const navigate = useCallback((to: string) => {
    let cleanTo = to.startsWith("/") ? to : `/${to}`;
    if (cleanTo.includes("#")) {
      const [route, anchor] = cleanTo.split("#");
      const routePath = route || "/";
      window.location.hash = routePath;
      setPath(routePath);
      setTimeout(() => {
        const el = document.getElementById(anchor);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    } else {
      window.location.hash = cleanTo;
      setPath(cleanTo);
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
    }
  }, []);

  return { path, navigate };
}

export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
