import { useCallback, useEffect, useState } from 'react';
import { Lightbulb, RefreshCw, Trash2 } from 'lucide-react';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { SectionTitle, EmptyState } from '../../components/ui';

type SuggestionRow = {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
};

export function AdminSuggestionScreen() {
  const [items, setItems] = useState<SuggestionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!supabaseConfigured) return;
    setLoading(true);
    setError(null);
    const { data, error: fetchErr } = await supabase
      .from('suggestions')
      .select('id, author_name, content, created_at')
      .order('created_at', { ascending: false });
    if (fetchErr) {
      setError('의견 목록을 불러오지 못했습니다.');
    } else {
      setItems((data as SuggestionRow[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const confirmDelete = async (id: string) => {
    setDeletingId(id);
    const { error: deleteErr } = await supabase.from('suggestions').delete().eq('id', id);
    setDeletingId(null);
    setDeleteConfirmId(null);
    if (deleteErr) {
      setError('삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="플테하에 바라는 점"
        subtitle={`총 ${items.length}건의 의견`}
        right={
          <button
            onClick={fetchItems}
            disabled={loading}
            className="rounded-lg p-2 bg-white border border-slate-200 text-navy-700 hover:bg-slate-50 transition"
            aria-label="새로고침"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        }
      />

      {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}

      {!loading && items.length === 0 && !error ? (
        <EmptyState icon={<Lightbulb size={28} />} title="접수된 의견이 없어요" />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="card p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-navy-100 flex items-center justify-center text-navy-700 font-bold text-sm">
                    {item.author_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 text-sm">{item.author_name}</p>
                    <p className="text-[11px] text-slate-400">
                      {new Date(item.created_at).toLocaleString('ko-KR', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-navy-800 leading-relaxed whitespace-pre-wrap">{item.content}</p>

              {deleteConfirmId === item.id ? (
                <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 space-y-2">
                  <p className="text-sm font-bold text-rose-700">정말 이 의견을 삭제하시겠습니까?</p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => confirmDelete(item.id)}
                      disabled={deletingId === item.id}
                      className="flex-1 py-2 rounded-xl bg-rose-500 text-white font-bold text-sm hover:bg-rose-600 transition disabled:opacity-50"
                    >
                      삭제
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      className="flex-1 py-2 rounded-xl bg-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-300 transition"
                    >
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex pt-1">
                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-600 text-xs font-bold hover:bg-rose-200 transition"
                  >
                    <Trash2 size={14} />
                    삭제
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
