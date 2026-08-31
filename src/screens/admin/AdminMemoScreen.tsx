import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Search, Trash2, Pencil, X, Calendar, StickyNote, Check, Loader2 } from 'lucide-react';
import { supabase, supabaseConfigured } from '../../lib/supabase';
import { SectionTitle, EmptyState } from '../../components/ui';

type AdminMemo = {
  id: string;
  date: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} (${days[d.getDay()]})`;
}

export function AdminMemoScreen() {
  const [memos, setMemos] = useState<AdminMemo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState(todayStr());
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const editFormRef = useRef<HTMLDivElement | null>(null);

  const loadMemos = useCallback(async () => {
    if (!supabaseConfigured) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('admin_memos')
      .select('*')
      .order('date', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && data) {
      setMemos(data as AdminMemo[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadMemos();
    const channel = supabase
      .channel('admin_memos_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'admin_memos' },
        () => loadMemos(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadMemos]);

  const resetForm = () => {
    setFormDate(todayStr());
    setFormTitle('');
    setFormContent('');
    setEditingId(null);
    setShowForm(false);
  };

  const startEdit = (memo: AdminMemo) => {
    setEditingId(memo.id);
    setFormDate(memo.date);
    setFormTitle(memo.title);
    setFormContent(memo.content);
    setShowForm(true);
    setTimeout(() => {
      editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return;
    setSaving(true);
    try {
      const payload = {
        date: formDate,
        title: formTitle.trim(),
        content: formContent.trim(),
        updated_at: new Date().toISOString(),
      };
      if (editingId) {
        const { error } = await supabase.from('admin_memos').update(payload).eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('admin_memos').insert(payload);
        if (error) throw error;
      }
      resetForm();
      await loadMemos();
    } catch (err) {
      alert('저장 실패: ' + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('이 메모를 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('admin_memos').delete().eq('id', id);
    if (error) {
      alert('삭제 실패: ' + error.message);
      return;
    }
    if (editingId === id) resetForm();
    await loadMemos();
  };

  // Filter memos by search keyword and selected date
  const filtered = memos.filter((m) => {
    if (selectedDate && m.date !== selectedDate) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.title.toLowerCase().includes(q) ||
      m.content.toLowerCase().includes(q) ||
      m.date.includes(q)
    );
  });

  // Get unique dates for the date sidebar
  const dates = Array.from(new Set(memos.map((m) => m.date))).sort().reverse();

  // Group filtered memos by date
  const grouped = filtered.reduce<Record<string, AdminMemo[]>>((acc, m) => {
    if (!acc[m.date]) acc[m.date] = [];
    acc[m.date].push(m);
    return acc;
  }, {});
  const sortedDates = Object.keys(grouped).sort().reverse();

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="관리자 메모"
        subtitle="간단한 메모를 날짜별로 기록하고 관리하세요"
        right={
          <button
            onClick={() => {
              if (showForm) {
                resetForm();
              } else {
                setFormDate(todayStr());
                setShowForm(true);
              }
            }}
            className="chip bg-navy-900 text-white hover:bg-navy-800 transition"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? '취소' : '메모 작성'}
          </button>
        }
      />

      {/* Search bar */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedDate(null);
          }}
          placeholder="제목, 내용, 날짜로 검색"
          className="input pl-10"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Write form (new memo only — edit form renders inline above the memo) */}
      {showForm && !editingId && (
        <div className="card p-5 space-y-4 animate-slide-up">
          <div className="flex items-center gap-2 text-navy-900 font-bold text-sm">
            <StickyNote size={18} className="text-volt-500" />
            새 메모 작성
          </div>
          <div>
            <label className="label">날짜</label>
            <div className="relative">
              <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <div>
            <label className="label">제목</label>
            <input
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="메모 제목을 입력하세요"
              maxLength={100}
              className="input"
            />
          </div>
          <div>
            <label className="label">내용</label>
            <textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="메모 내용을 입력하세요"
              rows={5}
              maxLength={2000}
              className="input resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1 text-right">
              {formContent.length} / 2000
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving || !formTitle.trim()}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={18} className="animate-spin" /> 저장 중...
                </>
              ) : (
                <>
                  <Check size={18} /> 저장
                </>
              )}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition"
            >
              취소
            </button>
          </div>
        </div>
      )}

      {/* Date filter chips */}
      {dates.length > 0 && !search && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedDate(null)}
            className={`chip transition ${
              !selectedDate ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            전체
          </button>
          {dates.slice(0, 12).map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDate(selectedDate === d ? null : d)}
              className={`chip transition ${
                selectedDate === d
                  ? 'bg-volt-500 text-navy-950'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {formatDateLabel(d)}
            </button>
          ))}
        </div>
      )}

      {/* Memo list grouped by date */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 size={24} className="animate-spin text-slate-400" />
        </div>
      ) : sortedDates.length === 0 ? (
        <EmptyState
          icon={<StickyNote size={28} />}
          title={search ? '검색 결과가 없어요' : '작성된 메모가 없어요'}
          description={search ? '다른 키워드로 검색해보세요' : '메모 작성 버튼을 눌러 첫 메모를 남겨보세요'}
        />
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <Calendar size={15} className="text-navy-400" />
                <h3 className="text-sm font-bold text-navy-800">{formatDateLabel(date)}</h3>
                <span className="text-xs text-slate-400">({grouped[date].length}건)</span>
              </div>
              <div className="space-y-2">
                {grouped[date].map((memo) => (
                  <div key={memo.id}>
                    {editingId === memo.id && showForm && (
                      <div ref={editFormRef} className="card p-5 space-y-4 animate-slide-up mb-2 border-volt-300">
                        <div className="flex items-center gap-2 text-navy-900 font-bold text-sm">
                          <StickyNote size={18} className="text-volt-500" />
                          메모 수정
                        </div>
                        <div>
                          <label className="label">날짜</label>
                          <div className="relative">
                            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                            <input
                              type="date"
                              value={formDate}
                              onChange={(e) => setFormDate(e.target.value)}
                              className="input pl-10"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="label">제목</label>
                          <input
                            value={formTitle}
                            onChange={(e) => setFormTitle(e.target.value)}
                            placeholder="메모 제목을 입력하세요"
                            maxLength={100}
                            className="input"
                          />
                        </div>
                        <div>
                          <label className="label">내용</label>
                          <textarea
                            value={formContent}
                            onChange={(e) => setFormContent(e.target.value)}
                            placeholder="메모 내용을 입력하세요"
                            rows={5}
                            maxLength={2000}
                            className="input resize-none"
                          />
                          <p className="text-[11px] text-slate-400 mt-1 text-right">
                            {formContent.length} / 2000
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={handleSave}
                            disabled={saving || !formTitle.trim()}
                            className="btn-primary flex-1 disabled:opacity-50"
                          >
                            {saving ? (
                              <>
                                <Loader2 size={18} className="animate-spin" /> 저장 중...
                              </>
                            ) : (
                              <>
                                <Check size={18} /> 수정 완료
                              </>
                            )}
                          </button>
                          <button
                            onClick={resetForm}
                            className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-sm hover:bg-slate-200 transition"
                          >
                            취소
                          </button>
                        </div>
                      </div>
                    )}
                    <div
                      className="card p-4 group hover:border-navy-200 transition"
                    >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-navy-900 text-sm">{memo.title}</h4>
                        {memo.content && (
                          <p className="text-sm text-slate-600 mt-1.5 whitespace-pre-wrap break-words leading-relaxed">
                            {memo.content}
                          </p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-2">
                          작성: {new Date(memo.created_at).toLocaleString('ko-KR')}
                          {memo.updated_at !== memo.created_at && (
                            <span className="ml-2">
                              · 수정: {new Date(memo.updated_at).toLocaleString('ko-KR')}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(memo)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-navy-700 hover:bg-navy-50 flex items-center justify-center transition"
                          aria-label="수정"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => handleDelete(memo.id)}
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 flex items-center justify-center transition"
                          aria-label="삭제"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                    </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
