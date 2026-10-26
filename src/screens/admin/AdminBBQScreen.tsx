import { useState, useEffect } from 'react';
import { Flame, Save, Clock, Users, Wallet, Settings, Sunrise, Sunset } from 'lucide-react';
import { useApp } from '../../store';
import { SectionTitle } from '../../components/ui';
import { formatWon, WEEKDAY_LABELS } from '../../pricing';
import type { BBQPricing, BBQWeekdaySchedule } from '../../pricing';

const DEFAULT_SCHEDULE: BBQWeekdaySchedule = { enabled: true, startHour: 5, endHour: 24 };

export function AdminBBQScreen() {
  const { bbqPricing, updateBBQPricing, pushToast } = useApp();
  const [edit, setEdit] = useState<BBQPricing>(bbqPricing);

  useEffect(() => {
    setEdit(bbqPricing);
  }, [bbqPricing]);

  const dirty = JSON.stringify(edit) !== JSON.stringify(bbqPricing);

  const handleSave = () => {
    if (edit.nightStartHour <= edit.dayStartHour) {
      pushToast('나이트타임 시작 시간은 데이타임 시작 시간보다 커야 합니다.', 'error');
      return;
    }
    if (edit.baseHours < 1) {
      pushToast('기본 시간은 1시간 이상이어야 합니다.', 'error');
      return;
    }
    if (edit.baseCapacity < 1) {
      pushToast('기본 인원은 1명 이상이어야 합니다.', 'error');
      return;
    }
    const enabledCount = (edit.openWeekdaySchedules ?? []).filter((s) => s.enabled).length;
    if (enabledCount === 0) {
      pushToast('최소 1개 이상의 요일을 활성화해야 합니다.', 'error');
      return;
    }
    const syncedWeekdays = (edit.openWeekdaySchedules ?? Array.from({ length: 7 }, () => ({ ...DEFAULT_SCHEDULE })))
      .map((s, i) => (s.enabled ? i : -1))
      .filter((i) => i >= 0);
    updateBBQPricing({ ...edit, openWeekdays: syncedWeekdays });
  };

  const fields: {
    key: keyof BBQPricing;
    label: string;
    icon: typeof Clock;
    suffix: string;
    step: number;
    min: number;
    max: number;
  }[] = [
    { key: 'dayStartHour', label: '데이타임 시작 시간', icon: Clock, suffix: '시', step: 1, min: 0, max: 23 },
    { key: 'nightStartHour', label: '나이트타임 시작 시간 (조명 켜는 시간)', icon: Clock, suffix: '시', step: 1, min: 1, max: 24 },
    { key: 'baseHours', label: '기본 이용 시간', icon: Clock, suffix: '시간', step: 1, min: 1, max: 12 },
    { key: 'baseCapacity', label: '기본 인원', icon: Users, suffix: '명', step: 1, min: 1, max: 50 },
    { key: 'dayPrice', label: '데이타임 기본 가격', icon: Wallet, suffix: '원', step: 10000, min: 0, max: 1000000 },
    { key: 'nightPrice', label: '나이트타임 기본 가격', icon: Wallet, suffix: '원', step: 10000, min: 0, max: 1000000 },
    { key: 'extraPersonFee', label: '추가 인원 1인당 금액', icon: Users, suffix: '원', step: 5000, min: 0, max: 100000 },
    { key: 'extraHourFee', label: '시간 초과 1인당 금액 (시간당)', icon: Clock, suffix: '원', step: 1000, min: 0, max: 50000 },
  ];

  const schedules = edit.openWeekdaySchedules ?? Array.from({ length: 7 }, () => ({ ...DEFAULT_SCHEDULE }));

  const updateSchedule = (idx: number, patch: Partial<BBQWeekdaySchedule>) => {
    setEdit((prev) => {
      const current = prev.openWeekdaySchedules ?? Array.from({ length: 7 }, () => ({ ...DEFAULT_SCHEDULE }));
      const next = current.map((s, i) => (i === idx ? { ...s, ...patch } : s));
      return { ...prev, openWeekdaySchedules: next };
    });
  };

  const toggleAllDay = (idx: number) => {
    const s = schedules[idx];
    updateSchedule(idx, { startHour: 5, endHour: 24, enabled: true });
    void s;
  };

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="바베큐패키지 설정"
        subtitle="기본 시간, 가격, 추가 금액 등을 설정합니다"
        right={
          <span className="chip bg-amber-50 text-amber-700">
            <Flame size={14} /> BBQ
          </span>
        }
      />

      {/* Time settings */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Clock size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-sm">시간대 및 기본 설정</h3>
            <p className="text-xs text-slate-400">계절에 따라 나이트타임 시작 시간을 조정하세요</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {fields.slice(0, 4).map((f) => {
            const Icon = f.icon;
            return (
              <label key={f.key} className="block">
                <span className="text-xs font-semibold text-navy-600 mb-1 flex items-center gap-1">
                  <Icon size={12} /> {f.label}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={f.step}
                    min={f.min}
                    max={f.max}
                    value={edit[f.key] as number}
                    onChange={(e) => {
                      const v = Math.max(f.min, Math.min(f.max, Number(e.target.value)));
                      setEdit((prev) => ({ ...prev, [f.key]: v }));
                    }}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-navy-900 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                  />
                  <span className="text-xs text-slate-400 shrink-0">{f.suffix}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Price settings */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Wallet size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-sm">가격 설정</h3>
            <p className="text-xs text-slate-400">기본 가격과 추가 금액을 설정합니다</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          {fields.slice(4).map((f) => {
            const Icon = f.icon;
            return (
              <label key={f.key} className="block">
                <span className="text-xs font-semibold text-navy-600 mb-1 flex items-center gap-1">
                  <Icon size={12} /> {f.label}
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step={f.step}
                    min={f.min}
                    max={f.max}
                    value={edit[f.key] as number}
                    onChange={(e) => {
                      const v = Math.max(f.min, Math.min(f.max, Number(e.target.value)));
                      setEdit((prev) => ({ ...prev, [f.key]: v }));
                    }}
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-navy-900 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
                  />
                  <span className="text-xs text-slate-400 shrink-0">{f.suffix}</span>
                </div>
              </label>
            );
          })}
        </div>

        {/* Open days */}
        <div className="mt-4 border-t border-slate-100 pt-4">
          <label className="block">
            <span className="text-xs font-semibold text-navy-600 mb-1 flex items-center gap-1">
              <Settings size={12} /> 예약 오픈 기간
            </span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                step={1}
                min={1}
                max={365}
                value={edit.openDays}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(365, Number(e.target.value)));
                  setEdit((prev) => ({ ...prev, openDays: v }));
                }}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-navy-900 focus:border-amber-400 focus:ring-2 focus:ring-amber-100 outline-none"
              />
              <span className="text-xs text-slate-400 shrink-0">일 (오늘부터 N일 후까지)</span>
            </div>
          </label>
        </div>

        <div className="flex justify-end mt-3">
          <button
            onClick={handleSave}
            disabled={!dirty}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
              dirty
                ? 'bg-amber-500 text-white hover:bg-amber-400 shadow-amber'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save size={14} /> 바베큐패키지 설정 저장
          </button>
        </div>
      </div>

      {/* Per-weekday schedule */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Clock size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-sm">요일별 예약 오픈 설정</h3>
            <p className="text-xs text-slate-400">각 요일을 활성화하고, 종일 또는 특정 시간대만 오픈할 수 있습니다</p>
          </div>
        </div>

        <div className="mt-3 rounded-lg bg-sky-50 border border-sky-100 p-3 text-xs text-sky-800">
          <p className="font-bold mb-0.5">펜션 체크아웃 안내</p>
          <p>펜션은 익일 오전 11시까지 이용 가능합니다. 예: 월요일을 오픈하면 일요일 밤 펜션 투숙객이 있을 수 있으므로, 월요일 시작 시간을 11시 이후로 설정하면 충돌을 피할 수 있습니다.</p>
        </div>

        <div className="mt-3 space-y-2">
          {WEEKDAY_LABELS.map((label, idx) => {
            const s = schedules[idx] ?? { ...DEFAULT_SCHEDULE };
            const isAllDay = s.startHour === 5 && s.endHour === 24;
            return (
              <div
                key={idx}
                className={`rounded-xl border p-3 transition ${
                  s.enabled ? 'border-amber-200 bg-amber-50/40' : 'border-slate-100 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => updateSchedule(idx, { enabled: !s.enabled })}
                    className={`flex items-center gap-2 ${s.enabled ? '' : 'opacity-50'}`}
                  >
                    <span
                      className={`w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold transition ${
                        s.enabled
                          ? idx === 0
                            ? 'bg-rose-500 text-white'
                            : idx === 6
                              ? 'bg-sky-500 text-white'
                              : 'bg-amber-500 text-white'
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
                          onChange={(e) => updateSchedule(idx, { startHour: Number(e.target.value) })}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-navy-900 focus:border-amber-400 outline-none"
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
                          onChange={(e) => updateSchedule(idx, { endHour: Number(e.target.value) })}
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-navy-900 focus:border-amber-400 outline-none"
                        >
                          {Array.from({ length: 20 }, (_, h) => h + 5).map((h) => (
                            <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
                {s.enabled && !isAllDay && (
                  <p className="text-[11px] text-slate-400 mt-1.5 ml-11">
                    {WEEKDAY_LABELS[idx]}요일 {String(s.startHour).padStart(2, '0')}:00 ~ {String(s.endHour).padStart(2, '0')}:00만 예약 가능
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-end mt-3">
          <button
            onClick={handleSave}
            disabled={!dirty}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
              dirty
                ? 'bg-amber-500 text-white hover:bg-amber-400 shadow-amber'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save size={14} /> 바베큐패키지 설정 저장
          </button>
        </div>
      </div>

      {/* Preview */}
      <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <Flame size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-sm">현재 설정 미리보기</h3>
            <p className="text-xs text-slate-400">사용자에게 표시되는 요금 안내</p>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg bg-white border border-amber-100 p-3">
            <p className="text-xs text-slate-500">기본 이용</p>
            <p className="font-bold text-navy-900">{edit.baseHours}시간 / {edit.baseCapacity}인 기준</p>
          </div>
          <div className="rounded-lg bg-white border border-amber-100 p-3">
            <p className="text-xs text-slate-500">데이타임</p>
            <p className="font-bold text-amber-700">{formatWon(edit.dayPrice)}</p>
            <p className="text-xs text-slate-400">{edit.dayStartHour}:00 ~ {edit.nightStartHour}:00</p>
          </div>
          <div className="rounded-lg bg-white border border-amber-100 p-3">
            <p className="text-xs text-slate-500">나이트타임</p>
            <p className="font-bold text-navy-700">{formatWon(edit.nightPrice)}</p>
            <p className="text-xs text-slate-400">{edit.nightStartHour}:00 ~ 24:00</p>
          </div>
          <div className="rounded-lg bg-white border border-amber-100 p-3">
            <p className="text-xs text-slate-500">추가 요금</p>
            <p className="font-bold text-navy-900">인원 추가: {formatWon(edit.extraPersonFee)}/인</p>
            <p className="font-bold text-navy-900">시간 초과: {formatWon(edit.extraHourFee)}/인/시간</p>
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-white border border-amber-100 p-3">
          <p className="text-xs text-slate-500">예약 오픈 기간</p>
          <p className="font-bold text-navy-900">오늘부터 {edit.openDays}일 후까지 예약 가능</p>
          <div className="mt-1.5 space-y-0.5">
            {schedules.map((s, idx) => (
              <p key={idx} className={`text-xs ${s.enabled ? 'text-navy-700' : 'text-slate-300'}`}>
                {WEEKDAY_LABELS[idx]}: {s.enabled
                  ? (s.startHour === 5 && s.endHour === 24 ? '종일 (05:00~24:00)' : `${String(s.startHour).padStart(2, '0')}:00~${String(s.endHour).padStart(2, '0')}:00`)
                  : '닫힘'}
              </p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
