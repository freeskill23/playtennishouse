import { useEffect, useState } from 'react';
import { Clock, Save, Sunrise, Sunset } from 'lucide-react';
import { useApp } from '../../store';
import { WEEKDAY_LABELS } from '../../pricing';
import type { CourtWeekdaySchedule } from '../../pricing';

const DEFAULT_SCHEDULE: CourtWeekdaySchedule = { enabled: true, startHour: 5, endHour: 24 };
const ALL_DAY_SCHEDULES = (): CourtWeekdaySchedule[] => Array.from({ length: 7 }, () => ({ ...DEFAULT_SCHEDULE }));

export function AdminCourtScheduleEditor() {
  const { courtWeekdaySchedules, updateCourtWeekdaySchedules } = useApp();
  const [draft, setDraft] = useState<CourtWeekdaySchedule[]>(() => courtWeekdaySchedules ?? ALL_DAY_SCHEDULES());

  useEffect(() => {
    setDraft(courtWeekdaySchedules ?? ALL_DAY_SCHEDULES());
  }, [courtWeekdaySchedules]);

  const saved = courtWeekdaySchedules ?? ALL_DAY_SCHEDULES();
  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const hasInvalidRange = draft.some((s) => s.enabled && s.endHour <= s.startHour);

  const updateDay = (idx: number, patch: Partial<CourtWeekdaySchedule>) => {
    setDraft((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  };

  const toggleAllDay = (idx: number) => {
    const s = draft[idx];
    const isAllDay = s.startHour === 5 && s.endHour === 24;
    updateDay(idx, isAllDay ? { startHour: 9, endHour: 18 } : { startHour: 5, endHour: 24 });
  };

  const handleSave = () => {
    if (hasInvalidRange) return;
    updateCourtWeekdaySchedules(draft);
  };

  return (
    <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-navy-100 flex items-center justify-center">
          <Clock size={16} className="text-navy-700" />
        </div>
        <div>
          <h3 className="font-bold text-navy-900 text-sm">요일별 · 시간대별 코트 예약 오픈 설정</h3>
          <p className="text-xs text-slate-400">요일마다 오픈 여부와 예약 가능한 시간대를 설정합니다</p>
        </div>
      </div>

      <div className="mt-3 space-y-2">
        {WEEKDAY_LABELS.map((label, idx) => {
          const s = draft[idx] ?? DEFAULT_SCHEDULE;
          const isAllDay = s.startHour === 5 && s.endHour === 24;
          const invalid = s.enabled && s.endHour <= s.startHour;
          return (
            <div
              key={idx}
              className={`rounded-xl border p-3 transition ${
                s.enabled ? 'border-navy-200 bg-navy-50/40' : 'border-slate-100 bg-slate-50/50'
              }`}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <button
                  onClick={() => updateDay(idx, { enabled: !s.enabled })}
                  className={`flex items-center gap-2 ${s.enabled ? '' : 'opacity-50'}`}
                >
                  <span
                    className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition ${
                      s.enabled
                        ? idx === 0
                          ? 'bg-rose-500 text-white'
                          : idx === 6
                            ? 'bg-sky-500 text-white'
                            : 'bg-navy-700 text-white'
                        : 'bg-slate-200 text-slate-400'
                    }`}
                  >
                    {label}
                  </span>
                  <span className={`text-sm font-bold ${s.enabled ? 'text-navy-900' : 'text-slate-400'}`}>
                    {s.enabled ? '오픈' : '닫힘'}
                  </span>
                </button>

                {s.enabled && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      onClick={() => toggleAllDay(idx)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        isAllDay ? 'bg-navy-900 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      종일
                    </button>
                    <div className="flex items-center gap-1">
                      <Sunrise size={14} className="text-amber-500" />
                      <select
                        value={s.startHour}
                        onChange={(e) => updateDay(idx, { startHour: Number(e.target.value) })}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-navy-900 focus:border-volt-400 outline-none"
                      >
                        {Array.from({ length: 24 }, (_, h) => h).map((h) => (
                          <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <span className="text-xs text-slate-400">~</span>
                    <div className="flex items-center gap-1">
                      <Sunset size={14} className="text-navy-500" />
                      <select
                        value={s.endHour}
                        onChange={(e) => updateDay(idx, { endHour: Number(e.target.value) })}
                        className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-navy-900 focus:border-volt-400 outline-none"
                      >
                        {Array.from({ length: 24 }, (_, h) => h + 1).map((h) => (
                          <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>
              {s.enabled && !isAllDay && !invalid && (
                <p className="text-[11px] text-slate-400 mt-1.5">
                  {label}요일 {String(s.startHour).padStart(2, '0')}:00 ~ {String(s.endHour).padStart(2, '0')}:00 예약 가능
                </p>
              )}
              {invalid && (
                <p className="text-[11px] text-rose-500 mt-1.5">종료 시간은 시작 시간보다 늦어야 합니다</p>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end mt-3">
        <button
          onClick={handleSave}
          disabled={!dirty || hasInvalidRange}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
            dirty && !hasInvalidRange
              ? 'bg-navy-900 text-white hover:bg-navy-800'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          <Save size={14} /> 코트 오픈 설정 저장
        </button>
      </div>
    </div>
  );
}
