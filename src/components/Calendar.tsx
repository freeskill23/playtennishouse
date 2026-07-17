import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const todayYMD = () => toYMD(new Date());

export const addDaysYMD = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toYMD(d);
};

export const addMonthsYMD = (n: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + n);
  return toYMD(d);
};

export function Calendar({
  value,
  onChange,
  minDate,
  dayRender,
}: {
  value: string;
  onChange: (ymd: string) => void;
  minDate?: string;
  maxDate?: string;
  dayRender?: (ymd: string) => React.ReactNode;
}) {
  const base = useMemo(() => {
    const d = new Date(value || todayYMD());
    return new Date(d.getFullYear(), d.getMonth(), 1);
  }, [value]);

  const year = base.getFullYear();
  const month = base.getMonth();

  const days = useMemo(() => {
    const first = new Date(year, month, 1);
    const startDay = first.getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= lastDate; d++) {
      cells.push(toYMD(new Date(year, month, d)));
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, month]);

  const prevMonth = () => {
    const d = new Date(year, month - 1, 1);
    onChange(toYMD(d));
  };
  const nextMonth = () => {
    const d = new Date(year, month + 1, 1);
    onChange(toYMD(d));
  };

  const today = todayYMD();

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={prevMonth}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"
          aria-label="이전 달"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="font-bold text-navy-900 text-lg">
          {year}년 {month + 1}월
        </div>
        <button
          onClick={nextMonth}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 transition"
          aria-label="다음 달"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((w, i) => (
          <div
            key={w}
            className={`text-center text-xs font-bold py-1 ${
              i === 0 ? 'text-rose-500' : i === 6 ? 'text-sky-500' : 'text-slate-400'
            }`}
          >
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          if (!d) return <div key={i} />;
          const isToday = d === today;
          const isSelected = d === value;
          const disabled = (minDate ? d < minDate : false) || (maxDate ? d > maxDate : false);
          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onChange(d)}
              className={`relative aspect-square rounded-xl text-sm font-semibold transition-all flex flex-col items-center justify-center gap-0.5
                ${isSelected ? 'bg-navy-900 text-white shadow-navy' : disabled ? 'text-slate-300 cursor-not-allowed' : 'text-navy-800 hover:bg-navy-50'}
              `}
            >
              <span className={isToday && !isSelected ? 'flex items-center justify-center w-7 h-7 rounded-full bg-volt-100 text-volt-800' : ''}>
                {Number(d.slice(-2))}
              </span>
              {dayRender && !disabled && (
                <div className="absolute bottom-1 left-0 right-0 flex justify-center">
                  {dayRender(d)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
