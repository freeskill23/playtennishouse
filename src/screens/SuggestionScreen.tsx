import { useState } from 'react';
import { CheckCircle2, Lightbulb, Loader2, Send } from 'lucide-react';
import { supabase, supabaseConfigured } from '../lib/supabase';
import { SectionTitle } from '../components/ui';

const MAX_CONTENT = 500;

export function SuggestionScreen() {
  const [authorName, setAuthorName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = authorName.trim().length > 0 && content.trim().length > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    if (!supabaseConfigured) {
      setError('지금은 의견을 보낼 수 없습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: insertErr } = await supabase
      .from('suggestions')
      .insert({ author_name: authorName.trim(), content: content.trim() });
    setSubmitting(false);
    if (insertErr) {
      setError('의견 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
      return;
    }
    setSubmitted(true);
  };

  const reset = () => {
    setAuthorName('');
    setContent('');
    setSubmitted(false);
  };

  return (
    <div className="space-y-5 pb-4 max-w-2xl mx-auto">
      <SectionTitle
        title="플테하에 바라는 점"
        subtitle="더 나은 플테하를 만들 수 있도록 소중한 의견을 들려주세요"
      />

      {submitted ? (
        <div className="card p-8 text-center space-y-4 animate-slide-up">
          <div className="mx-auto w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle2 size={28} className="text-green-600" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-bold text-navy-900">의견이 접수되었습니다</p>
            <p className="text-sm text-slate-500">보내주신 의견은 운영진이 꼼꼼히 확인하겠습니다.</p>
          </div>
          <button onClick={reset} className="btn-primary text-sm">
            다른 의견 남기기
          </button>
        </div>
      ) : (
        <div className="card p-5 space-y-4">
          <div className="flex items-center gap-2 text-navy-800">
            <Lightbulb size={18} className="text-amber-500" />
            <p className="text-sm font-semibold">불편했던 점이나 바라는 점을 자유롭게 적어주세요.</p>
          </div>
          <div>
            <label className="label">이름</label>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="이름을 입력하세요"
              maxLength={20}
              className="input"
            />
          </div>
          <div>
            <label className="label">의견 내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="바라는 점을 적어주세요"
              maxLength={MAX_CONTENT}
              rows={6}
              className="input resize-none"
            />
            <p className="text-[11px] text-slate-400 mt-1 text-right">{content.length}/{MAX_CONTENT}</p>
          </div>
          {error && <p className="text-sm font-semibold text-rose-600">{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="btn-primary w-full disabled:opacity-50"
          >
            {submitting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> 보내는 중...
              </>
            ) : (
              <>
                <Send size={18} /> 의견 보내기
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
