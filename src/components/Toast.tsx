import { CheckCircle2, Info, XCircle, X } from 'lucide-react';
import { useApp } from '../store';

export function ToastStack() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 w-[92%] max-w-sm">
      {toasts.map((t) => {
        const Icon = t.kind === 'success' ? CheckCircle2 : t.kind === 'error' ? XCircle : Info;
        const color =
          t.kind === 'success' ? 'text-volt-600' : t.kind === 'error' ? 'text-rose-500' : 'text-sky-500';
        return (
          <div
            key={t.id}
            className="card px-4 py-3 flex items-center gap-3 animate-slide-up shadow-lg"
          >
            <Icon size={20} className={color} />
            <p className="text-sm font-semibold text-navy-800 flex-1">{t.message}</p>
            <button
              onClick={() => dismissToast(t.id)}
              className="text-slate-400 hover:text-navy-800"
              aria-label="닫기"
            >
              <X size={16} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
