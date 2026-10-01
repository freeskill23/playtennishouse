import { useState, useRef } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ImageUploadProps {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspectRatio?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export function ImageUpload({
  value,
  onChange,
  label = "이미지",
  aspectRatio = "aspect-[4/3]",
  maxWidth = 1200,
  maxHeight = 1200,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("10MB 이하 파일만 업로드할 수 있습니다.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const resized = await resizeImage(file, maxWidth, maxHeight);
      const ext = resized.type === "image/jpeg" ? "jpg" : "webp";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(filePath, resized, { contentType: resized.type });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("product-images").getPublicUrl(filePath);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    onChange(null);
    setError(null);
  };

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-charcoal">{label}</label>
      <div className={`relative ${aspectRatio} w-full overflow-hidden rounded-2xl border-2 border-dashed border-birch-200 bg-birch-50`}>
        {value ? (
          <>
            <img src={value} alt="preview" className="h-full w-full object-cover" />
            <button
              onClick={handleRemove}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
            >
              <X size={14} />
            </button>
          </>
        ) : uploading ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-charcoal-muted">
            <Loader2 size={24} className="animate-spin text-birch-400" />
            <span className="text-xs">업로드 중...</span>
          </div>
        ) : (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex h-full w-full flex-col items-center justify-center gap-2 text-charcoal-muted transition-colors hover:text-charcoal"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
              <Upload size={20} className="text-birch-400" />
            </div>
            <span className="text-xs font-medium">이미지 업로드</span>
            <span className="text-[10px]">클릭하여 파일 선택 (최대 10MB)</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = "";
        }}
      />

      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

async function resizeImage(file: File, maxWidth: number, maxHeight: number): Promise<Blob> {
  const img = await loadImage(file);
  const ratio = Math.min(maxWidth / img.width, maxHeight / img.height, 1);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.width * ratio);
  canvas.height = Math.round(img.height * ratio);
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((b) => resolve(b ?? file), "image/webp", 0.85);
  });
  return blob;
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("이미지를 불러오지 못했습니다."));
    };
    img.src = url;
  });
}
