import { useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, ImageIcon, Type, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

export type DetailBlockType = "text" | "image";

export interface DetailBlock {
  id: string;
  type: DetailBlockType;
  text?: string;
  imageUrl?: string;
}

export function parseDetailContent(raw: string): DetailBlock[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((b) => b.type === "text" || b.type === "image");
    }
  } catch {
    // not JSON — treat as legacy plain text
  }
  return [{ id: "legacy", type: "text", text: raw }];
}

export function serializeDetailContent(blocks: DetailBlock[]): string {
  const clean = blocks.map(({ id, type, text, imageUrl }) => {
    if (type === "text") return { id, type, text: text ?? "" };
    return { id, type, imageUrl: imageUrl ?? "" };
  });
  return JSON.stringify(clean);
}

interface DetailEditorProps {
  value: string;
  onChange: (raw: string) => void;
}

export function DetailEditor({ value, onChange }: DetailEditorProps) {
  const [blocks, setBlocks] = useState<DetailBlock[]>(() => parseDetailContent(value));

  const updateBlocks = (next: DetailBlock[]) => {
    setBlocks(next);
    onChange(serializeDetailContent(next));
  };

  const addText = () => {
    updateBlocks([...blocks, { id: genId(), type: "text", text: "" }]);
  };

  const addImage = () => {
    updateBlocks([...blocks, { id: genId(), type: "image", imageUrl: "" }]);
  };

  const removeBlock = (id: string) => {
    updateBlocks(blocks.filter((b) => b.id !== id));
  };

  const moveBlock = (index: number, dir: -1 | 1) => {
    const newIndex = index + dir;
    if (newIndex < 0 || newIndex >= blocks.length) return;
    const next = [...blocks];
    [next[index], next[newIndex]] = [next[newIndex], next[index]];
    updateBlocks(next);
  };

  const updateText = (id: string, text: string) => {
    updateBlocks(blocks.map((b) => (b.id === id ? { ...b, text } : b)));
  };

  const updateImage = (id: string, imageUrl: string) => {
    updateBlocks(blocks.map((b) => (b.id === id ? { ...b, imageUrl } : b)));
  };

  return (
    <div className="rounded-2xl border border-birch-200 bg-birch-50/50 p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-medium text-charcoal">상세 페이지 구성</span>
        <div className="flex gap-2">
          <button
            onClick={addText}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-charcoal border border-birch-200 transition-colors hover:bg-birch-100"
          >
            <Type size={14} />
            텍스트
          </button>
          <button
            onClick={addImage}
            className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-medium text-charcoal border border-birch-200 transition-colors hover:bg-birch-100"
          >
            <ImageIcon size={14} />
            이미지
          </button>
        </div>
      </div>

      {blocks.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-birch-200 py-12 text-center">
          <p className="text-sm text-charcoal-muted">
            "텍스트" 또는 "이미지" 버튼을 눌러 블록을 추가하세요.
          </p>
          <p className="mt-1 text-xs text-charcoal-muted">
            쇼핑몰 상세페이지처럼 순서를 자유롭게 배치할 수 있습니다.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {blocks.map((block, index) => (
            <BlockEditor
              key={block.id}
              block={block}
              index={index}
              total={blocks.length}
              onRemove={() => removeBlock(block.id)}
              onMoveUp={() => moveBlock(index, -1)}
              onMoveDown={() => moveBlock(index, 1)}
              onTextChange={(text) => updateText(block.id, text)}
              onImageChange={(url) => updateImage(block.id, url)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BlockEditor({
  block,
  index,
  total,
  onRemove,
  onMoveUp,
  onMoveDown,
  onTextChange,
  onImageChange,
}: {
  block: DetailBlock;
  index: number;
  total: number;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onTextChange: (text: string) => void;
  onImageChange: (url: string) => void;
}) {
  return (
    <div className="rounded-xl border border-birch-200 bg-white p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="inline-flex items-center gap-1.5 rounded-md bg-birch-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-charcoal-muted">
          {block.type === "text" ? <Type size={11} /> : <ImageIcon size={11} />}
          {block.type === "text" ? "텍스트" : "이미지"}
          <span className="ml-0.5 text-charcoal-muted/60">#{index + 1}</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="flex h-6 w-6 items-center justify-center rounded text-charcoal-muted transition-colors hover:bg-birch-100 disabled:opacity-30"
          >
            <ArrowUp size={13} />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="flex h-6 w-6 items-center justify-center rounded text-charcoal-muted transition-colors hover:bg-birch-100 disabled:opacity-30"
          >
            <ArrowDown size={13} />
          </button>
          <button
            onClick={onRemove}
            className="flex h-6 w-6 items-center justify-center rounded text-red-500 transition-colors hover:bg-red-50"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {block.type === "text" ? (
        <textarea
          value={block.text ?? ""}
          onChange={(e) => onTextChange(e.target.value)}
          rows={4}
          className="w-full resize-y rounded-lg border border-birch-200 bg-white px-3 py-2.5 text-sm leading-relaxed text-charcoal placeholder:text-charcoal-muted/50 focus:border-birch-400 focus:outline-none focus:ring-2 focus:ring-birch-200"
          placeholder="상세 설명 텍스트를 입력하세요..."
        />
      ) : (
        <ImageBlockEditor value={block.imageUrl ?? ""} onChange={onImageChange} />
      )}
    </div>
  );
}

function ImageBlockEditor({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 파일만 업로드할 수 있습니다.");
      return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setError("50MB 이하 파일만 업로드할 수 있습니다.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || "jpg";
      const fileName = `detail/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file, { contentType: file.type });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      {value ? (
        <div className="relative overflow-hidden rounded-lg">
          <img src={value} alt="상세 이미지" className="w-full" />
          <button
            onClick={() => onChange("")}
            className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white transition-colors hover:bg-black/70"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-birch-200 bg-birch-50/50 py-8 text-center transition-colors hover:border-birch-400 hover:bg-birch-50">
          {uploading ? (
            <>
              <Loader2 size={22} className="animate-spin text-birch-400" />
              <span className="text-xs text-charcoal-muted">업로드 중...</span>
            </>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                <ImageIcon size={18} className="text-birch-400" />
              </div>
              <span className="text-xs font-medium text-charcoal-muted">이미지 업로드 (최대 50MB, 원본 그대로 저장)</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}



function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
