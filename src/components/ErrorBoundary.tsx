import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}
interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): State {
    const message = err instanceof Error ? err.message : String(err);
    return { hasError: true, message };
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-navy-950 px-4">
          <div className="max-w-sm w-full rounded-2xl bg-white p-6 shadow-2xl text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-rose-100 flex items-center justify-center mb-4">
              <AlertTriangle size={28} className="text-rose-500" />
            </div>
            <h1 className="text-lg font-extrabold text-navy-900 mb-2">
              문제가 발생했습니다
            </h1>
            <p className="text-sm text-slate-500 mb-5 break-words">
              {this.state.message || '알 수 없는 오류가 발생했습니다.'}
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-3 rounded-xl bg-volt-500 text-navy-950 font-bold hover:bg-volt-400 active:scale-[0.98] transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> 새로고침
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
