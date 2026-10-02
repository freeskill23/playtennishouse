import { useState, useEffect } from 'react';
import { Flame, Save, Clock, Users, Wallet, Settings } from 'lucide-react';
import { useApp } from '../../store';
import { SectionTitle } from '../../components/ui';
import { formatWon } from '../../pricing';
import type { BBQPricing } from '../../pricing';

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
    updateBBQPricing(edit);
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
    { key: 'openDays', label: '예약 오픈 기간', icon: Settings, suffix: '일', step: 1, min: 1, max: 365 },
  ];

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
        </div>
      </div>
    </div>
  );
}
