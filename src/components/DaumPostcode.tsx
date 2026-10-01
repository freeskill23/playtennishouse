import { useEffect, useRef, useState } from "react";
import { Search, X, Loader2, MapPin } from "lucide-react";

interface DaumPostcodeProps {
  onComplete: (data: { zonecode: string; address: string; jibunAddress: string }) => void;
  onClose?: () => void;
}

interface PostcodeData {
  zonecode: string;
  address: string;
  jibunAddress: string;
  roadAddress: string;
  buildingName: string;
  apartment: string;
}

declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: PostcodeData) => void;
        onclose?: () => void;
        width?: string | number;
        height?: string | number;
      }) => {
        embed: (el: HTMLElement) => void;
        open: () => void;
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadDaumPostcodeScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.daum?.Postcode) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("주소 검색 스크립트를 불러오지 못했습니다."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function useDaumPostcode() {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const open = (onComplete: (data: { zonecode: string; address: string; jibunAddress: string }) => void) => {
    setLoading(true);
    setIsOpen(true);
    loadDaumPostcodeScript()
      .then(() => {
        setLoading(false);
        setTimeout(() => {
          if (!containerRef.current || !window.daum) return;
          containerRef.current.innerHTML = "";
          new window.daum.Postcode({
            oncomplete: (data: PostcodeData) => {
              onComplete({
                zonecode: data.zonecode,
                address: data.roadAddress || data.jibunAddress || data.address,
                jibunAddress: data.jibunAddress,
              });
              setIsOpen(false);
            },
            onclose: () => setIsOpen(false),
            width: "100%",
            height: "100%",
          }).embed(containerRef.current);
        }, 50);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const close = () => setIsOpen(false);

  return { isOpen, loading, containerRef, open, close };
}
