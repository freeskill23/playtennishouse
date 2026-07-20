import { useState, useEffect } from 'react';
import {
  BedDouble,
  CalendarRange,
  Users,
  Clock,
  Lock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Wallet,
  Save,
  ImageIcon,
  XCircle,
  CalendarPlus,
  CalendarMinus,
  Landmark,
} from 'lucide-react';
import { useApp } from '../../store';
import { Calendar, todayYMD } from '../../components/Calendar';
import { SectionTitle, StatusBadge } from '../../components/ui';
import { COURT_TIME_SLOTS } from '../../types';
import { formatWon } from '../../pricing';
import type { CourtName, RoomName } from '../../types';

export function AdminDashboardScreen() {
  const {
    rooms,
    getPensionStatusForDate,
    getCourtSlotStatus,
    getReservationsByDate,
    getMatchingsByDate,
    getUser,
    pensionWeekdayPrice,
    pensionWeekendPrice,
    pensionPriceOverrides,
    getPensionPrice,
    updatePensionPrice,
    setPensionPriceForDate,
    removePensionPriceOverride,
    bannerImageUrl,
    updateBannerImage,
    logoImageUrl,
    updateLogoImage,
    bankAccount,
    updateBankAccount,
    updateRoom,
    cancelReservation,
    tempHolidays,
    toggleHoliday,
    isHoliday,
    reservations,
  } = useApp();
  const [cancelTarget, setCancelTarget] = useState<{ id: string; label: string } | null>(null);
  const [date, setDate] = useState(todayYMD());
  const [priceEdit, setPriceEdit] = useState({ weekday: pensionWeekdayPrice, weekend: pensionWeekendPrice });
  const [datePriceInput, setDatePriceInput] = useState<string>('');
  const [bannerUrlInput, setBannerUrlInput] = useState('');
  const [logoUrlInput, setLogoUrlInput] = useState('');
  const [bankEdit, setBankEdit] = useState({ bank: bankAccount.bank, number: bankAccount.number, holder: bankAccount.holder });
  const [roomEdits, setRoomEdits] = useState(() =>
    Object.fromEntries(rooms.map((r) => [r.id, { maxCapacity: r.maxCapacity, description: r.description }])),
  );

  // Sync bankEdit when bankAccount loads/updates from Supabase
  useEffect(() => {
    setBankEdit({ bank: bankAccount.bank, number: bankAccount.number, holder: bankAccount.holder });
  }, [bankAccount]);

  // Sync roomEdits when rooms load/update from Supabase
  useEffect(() => {
    setRoomEdits(Object.fromEntries(rooms.map((r) => [r.id, { maxCapacity: r.maxCapacity, description: r.description }])));
  }, [rooms]);

  const dayReservations = reservations.filter((r) => r.date === date);
  const dayMatchings = getMatchingsByDate(date);

  const pensionReservations = dayReservations.filter((r) => r.type === 'pension');
  const courtReservations = dayReservations.filter((r) => r.type === 'court');

  const priceDirty = priceEdit.weekday !== pensionWeekdayPrice || priceEdit.weekend !== pensionWeekendPrice;
  const bankDirty =
    bankEdit.bank !== bankAccount.bank ||
    bankEdit.number !== bankAccount.number ||
    bankEdit.holder !== bankAccount.holder;

  const handleSavePrice = () => {
    updatePensionPrice(priceEdit.weekday, priceEdit.weekend);
  };

  const currentDatePrice = getPensionPrice(date);
  const hasOverride = pensionPriceOverrides[date] != null;
  const sortedOverrides = Object.entries(pensionPriceOverrides).sort(([a], [b]) => a.localeCompare(b));
  const selectedIsTempHoliday = tempHolidays.includes(date);
  const sortedTempHolidays = [...tempHolidays].sort();

  return (
    <div className="space-y-5 pb-4">
      <SectionTitle
        title="통합 관리자 캘린더"
        subtitle="날짜를 선택하면 전체 현황이 한눈에"
        right={
          <span className="chip bg-navy-50 text-navy-700">
            <TrendingUp size={14} /> {date}
          </span>
        }
      />

      {/* Pension pricing control */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-volt-100 flex items-center justify-center">
            <Wallet size={16} className="text-volt-700" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-sm">펜션 요금 설정</h3>
            <p className="text-xs text-slate-400">기본 요금과 날짜별 개별 요금을 설정할 수 있습니다</p>
          </div>
        </div>

        {/* Default prices */}
        <div className="mb-4">
          <p className="text-xs font-bold text-navy-500 mb-2">기본 요금</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs font-semibold text-navy-600 mb-1 block">평일</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={10000}
                  min={0}
                  value={priceEdit.weekday}
                  onChange={(e) => setPriceEdit((s) => ({ ...s, weekday: Number(e.target.value) }))}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-navy-900 focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
                />
                <span className="text-xs text-slate-400 shrink-0">원</span>
              </div>
            </label>
            <label className="block">
              <span className="text-xs font-semibold text-navy-600 mb-1 block">주말·공휴일</span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step={10000}
                  min={0}
                  value={priceEdit.weekend}
                  onChange={(e) => setPriceEdit((s) => ({ ...s, weekend: Number(e.target.value) }))}
                  className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-navy-900 focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
                />
                <span className="text-xs text-slate-400 shrink-0">원</span>
              </div>
            </label>
          </div>
          <div className="flex justify-end mt-2">
            <button
              onClick={handleSavePrice}
              disabled={!priceDirty}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
                priceDirty
                  ? 'bg-volt-500 text-navy-950 hover:bg-volt-400 shadow-volt'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Save size={14} /> 기본 요금 저장
            </button>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4">
          {/* Per-date price for selected date */}
          <p className="text-xs font-bold text-navy-500 mb-2">
            날짜별 요금 <span className="text-slate-400 font-normal">(선택한 날짜: {date})</span>
          </p>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex-1 flex items-center gap-2">
              <input
                type="number"
                step={10000}
                min={0}
                placeholder={formatWon(currentDatePrice)}
                value={datePriceInput}
                onChange={(e) => setDatePriceInput(e.target.value)}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-navy-900 focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
              />
              <span className="text-xs text-slate-400 shrink-0">원</span>
            </div>
            <button
              onClick={() => {
                const v = Number(datePriceInput);
                if (!datePriceInput || isNaN(v) || v < 0) return;
                setPensionPriceForDate(date, v);
                setDatePriceInput('');
              }}
              disabled={!datePriceInput || isNaN(Number(datePriceInput))}
              className="px-3 py-2 rounded-lg text-sm font-bold bg-navy-900 text-white hover:bg-navy-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              이 날짜 설정
            </button>
            {hasOverride && (
              <button
                onClick={() => removePensionPriceOverride(date)}
                className="px-3 py-2 rounded-lg text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
              >
                개별요금 삭제
              </button>
            )}
          </div>
          <p className="text-xs text-slate-400 mb-3">
            {hasOverride ? (
              <>
                <span className="font-bold text-volt-700">{date}</span> 개별 요금 적용 중:{' '}
                <span className="font-bold text-navy-700">{formatWon(currentDatePrice)}</span>
              </>
            ) : (
              <>
                <span className="font-bold text-navy-600">{date}</span> 요금:{' '}
                <span className="font-bold text-navy-700">{formatWon(currentDatePrice)}</span> (기본 요금 적용)
              </>
            )}
          </p>

          {/* Override list */}
          {sortedOverrides.length > 0 && (
            <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
              <p className="text-xs font-bold text-navy-500 mb-2">설정된 개별 요금 목록</p>
              <div className="flex flex-wrap gap-2">
                {sortedOverrides.map(([d, p]) => (
                  <button
                    key={d}
                    onClick={() => setDate(d)}
                    className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                      date === d
                        ? 'bg-volt-500 text-navy-950'
                        : 'bg-white text-navy-700 border border-navy-100 hover:border-volt-300'
                    }`}
                  >
                    <span>{d}</span>
                    <span className={date === d ? 'text-navy-800' : 'text-slate-500'}>{formatWon(p)}</span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        removePensionPriceOverride(d);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          removePensionPriceOverride(d);
                        }
                      }}
                      className="ml-0.5 text-slate-300 hover:text-rose-500 transition cursor-pointer"
                    >
                      ×
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Temporary holiday control */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
            <CalendarRange size={16} className="text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-sm">임시 공휴일 설정</h3>
            <p className="text-xs text-slate-400">선택한 날짜를 임시 공휴일로 지정하면 평일도 주말·공휴일 요금이 적용됩니다</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-bold text-navy-900">{date}</span>
          <span className="text-xs text-slate-400">
            {isHoliday(date) ? '(공휴일 요금 적용)' : '(평일 요금 적용)'}
          </span>
          <button
            onClick={() => toggleHoliday(date)}
            className={`ml-auto flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
              selectedIsTempHoliday
                ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                : 'bg-amber-500 text-white hover:bg-amber-400'
            }`}
          >
            {selectedIsTempHoliday ? (
              <><CalendarMinus size={14} /> 임시 공휴일 해제</>
            ) : (
              <><CalendarPlus size={14} /> 임시 공휴일 지정</>
            )}
          </button>
        </div>

        {sortedTempHolidays.length > 0 && (
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-3">
            <p className="text-xs font-bold text-navy-500 mb-2">지정된 임시 공휴일 목록</p>
            <div className="flex flex-wrap gap-2">
              {sortedTempHolidays.map((d) => (
                <button
                  key={d}
                  onClick={() => setDate(d)}
                  className={`group flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition ${
                    date === d
                      ? 'bg-amber-500 text-white'
                      : 'bg-white text-navy-700 border border-navy-100 hover:border-amber-300'
                  }`}
                >
                  <span>{d}</span>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleHoliday(d);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        toggleHoliday(d);
                      }
                    }}
                    className="ml-0.5 text-slate-300 hover:text-rose-500 transition cursor-pointer"
                  >
                    ×
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bank account control */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
            <Landmark size={16} className="text-emerald-700" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-sm">입금 계좌 설정</h3>
            <p className="text-xs text-slate-400">예약 안내에 표시되는 입금 계좌를 수시로 변경할 수 있습니다</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <label className="block">
            <span className="text-xs font-semibold text-navy-600 mb-1 block">은행명</span>
            <input
              type="text"
              value={bankEdit.bank}
              onChange={(e) => setBankEdit((s) => ({ ...s, bank: e.target.value }))}
              placeholder="농협 (NH)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-navy-900 focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy-600 mb-1 block">계좌번호</span>
            <input
              type="text"
              value={bankEdit.number}
              onChange={(e) => setBankEdit((s) => ({ ...s, number: e.target.value }))}
              placeholder="302-1234-5678-09"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-navy-900 tracking-wider focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold text-navy-600 mb-1 block">예금주</span>
            <input
              type="text"
              value={bankEdit.holder}
              onChange={(e) => setBankEdit((s) => ({ ...s, holder: e.target.value }))}
              placeholder="플테하 (PLAY TENNIS HOUSE)"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-navy-900 focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
            />
          </label>
        </div>

        <div className="flex justify-end mt-3">
          <button
            onClick={() => updateBankAccount(bankEdit)}
            disabled={!bankDirty}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
              bankDirty
                ? 'bg-volt-500 text-navy-950 hover:bg-volt-400 shadow-volt'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
          >
            <Save size={14} /> 입금 계좌 저장
          </button>
        </div>
      </div>

      {/* Banner image control */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-sky-100 flex items-center justify-center">
            <ImageIcon size={16} className="text-sky-600" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-sm">메인 배너 이미지</h3>
            <p className="text-xs text-slate-400">메인화면 상단 배너로 사용할 이미지 URL을 입력하세요</p>
          </div>
        </div>

        {/* Preview */}
        <div className="relative overflow-hidden rounded-xl h-32 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-700 mb-3">
          {bannerImageUrl ? (
            <>
              <img src={bannerImageUrl} alt="배너 미리보기" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-navy-950/80 via-navy-900/40 to-transparent" />
            </>
          ) : (
            <div className="relative p-4 text-white/70 flex items-center justify-center h-full text-sm">
              기본 배너 (그라데이션)
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="url"
            placeholder="https://images.pexels.com/..."
            value={bannerUrlInput}
            onChange={(e) => setBannerUrlInput(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy-900 focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
          />
          <button
            onClick={() => {
              if (!bannerUrlInput.trim()) return;
              updateBannerImage(bannerUrlInput.trim());
              setBannerUrlInput('');
            }}
            disabled={!bannerUrlInput.trim()}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-navy-900 text-white hover:bg-navy-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            적용
          </button>
          {bannerImageUrl && (
            <button
              onClick={() => updateBannerImage(null)}
              className="px-3 py-2 rounded-lg text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
            >
              초기화
            </button>
          )}
        </div>
        {bannerImageUrl && (
          <p className="text-xs text-slate-400 mt-2 truncate">
            현재: <span className="text-navy-600">{bannerImageUrl}</span>
          </p>
        )}
      </div>

      {/* Logo image control */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-volt-100 flex items-center justify-center">
            <ImageIcon size={16} className="text-volt-700" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-sm">로고 이미지</h3>
            <p className="text-xs text-slate-400">앱 전체에 표시되는 로고 이미지 URL을 입력하세요</p>
          </div>
        </div>

        {/* Preview */}
        <div className="flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 p-4 mb-3">
          <img
            src={logoImageUrl || `${import.meta.env.BASE_URL}logo_png.png`}
            alt="로고 미리보기"
            className="w-12 h-12 object-contain"
          />
          <span className="ml-auto text-xs text-slate-400">미리보기</span>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="url"
            placeholder="https://images.pexels.com/..."
            value={logoUrlInput}
            onChange={(e) => setLogoUrlInput(e.target.value)}
            className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy-900 focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
          />
          <button
            onClick={() => {
              if (!logoUrlInput.trim()) return;
              updateLogoImage(logoUrlInput.trim());
              setLogoUrlInput('');
            }}
            disabled={!logoUrlInput.trim()}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-navy-900 text-white hover:bg-navy-800 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            적용
          </button>
          {logoImageUrl && (
            <button
              onClick={() => updateLogoImage(null)}
              className="px-3 py-2 rounded-lg text-sm font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition"
            >
              초기화
            </button>
          )}
        </div>
        {logoImageUrl && (
          <p className="text-xs text-slate-400 mt-2 truncate">
            현재: <span className="text-navy-600">{logoImageUrl}</span>
          </p>
        )}
      </div>

      {/* Room info control */}
      <div className="rounded-2xl border border-navy-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center">
            <BedDouble size={16} className="text-rose-600" />
          </div>
          <div>
            <h3 className="font-bold text-navy-900 text-sm">객실 정보 설정</h3>
            <p className="text-xs text-slate-400">A동·B동 최대 인원수와 소개글을 수정할 수 있습니다</p>
          </div>
        </div>

        <div className="space-y-4">
          {rooms.map((room) => {
            const edit = roomEdits[room.id] ?? { maxCapacity: room.maxCapacity, description: room.description };
            const dirty =
              edit.maxCapacity !== room.maxCapacity || edit.description !== room.description;
            return (
              <div key={room.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center gap-2 mb-3">
                  <span className="chip bg-navy-900 text-white">{room.name}</span>
                </div>
                <div className="grid sm:grid-cols-[120px_1fr] gap-3">
                  <label className="block">
                    <span className="text-xs font-semibold text-navy-600 mb-1 block">최대 인원수</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        max={50}
                        value={edit.maxCapacity}
                        onChange={(e) =>
                          setRoomEdits((s) => ({
                            ...s,
                            [room.id]: { ...s[room.id], maxCapacity: Number(e.target.value) },
                          }))
                        }
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold text-navy-900 focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
                      />
                      <span className="text-xs text-slate-400 shrink-0">명</span>
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-xs font-semibold text-navy-600 mb-1 block">소개글</span>
                    <input
                      type="text"
                      value={edit.description}
                      onChange={(e) =>
                        setRoomEdits((s) => ({
                          ...s,
                          [room.id]: { ...s[room.id], description: e.target.value },
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-navy-900 focus:border-volt-400 focus:ring-2 focus:ring-volt-100 outline-none"
                    />
                  </label>
                </div>
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() =>
                      updateRoom(room.id, {
                        maxCapacity: edit.maxCapacity,
                        description: edit.description,
                      })
                    }
                    disabled={!dirty}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition ${
                      dirty
                        ? 'bg-volt-500 text-navy-950 hover:bg-volt-400 shadow-volt'
                        : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  >
                    <Save size={14} /> {room.name} 저장
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Calendar
        value={date}
        onChange={setDate}
        minDate={todayYMD()}
        dayRender={(d) => {
          const res = getReservationsByDate(d);
          if (res.length === 0) return null;
          const pensionRes = res.filter((r) => r.type === 'pension');
          if (pensionRes.length > 0) {
            const hasA = pensionRes.some((r) => r.targetId === 'roomA');
            const hasB = pensionRes.some((r) => r.targetId === 'roomB');
            let label = '';
            if (hasA && hasB) label = 'AB동';
            else if (hasA) label = 'A동';
            else if (hasB) label = 'B동';
            return (
              <span className="text-[8px] font-bold leading-none text-volt-700 bg-volt-100 rounded px-1 py-0.5">
                {label}예약
              </span>
            );
          }
          const aBooked = COURT_TIME_SLOTS.some((s) => getCourtSlotStatus(d, 'A코트', s) === 'booked');
          const bBooked = COURT_TIME_SLOTS.some((s) => getCourtSlotStatus(d, 'B코트', s) === 'booked');
          if (aBooked || bBooked) return <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />;
          const aPending = COURT_TIME_SLOTS.some((s) => getCourtSlotStatus(d, 'A코트', s) === 'pending');
          const bPending = COURT_TIME_SLOTS.some((s) => getCourtSlotStatus(d, 'B코트', s) === 'pending');
          if (aPending || bPending) return <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />;
          return null;
        }}
      />

      {/* Dashboard cards */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Pension status */}
        {rooms.map((room) => {
          const st = getPensionStatusForDate(date, room.name as RoomName);
          const roomReservations = pensionReservations.filter(
            (r) => r.targetId === room.id && r.waitingSequence === null,
          );
          const waitings = pensionReservations.filter(
            (r) => r.targetId === room.id && r.waitingSequence !== null,
          );
          return (
            <div key={room.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-volt-100 flex items-center justify-center text-volt-700">
                    <BedDouble size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-navy-900">{room.name}</p>
                    <p className="text-xs text-slate-500">펜션</p>
                  </div>
                </div>
                {st.status === 'booked' && <span className="chip bg-volt-100 text-volt-800"><CheckCircle2 size={12} /> 예약완료</span>}
                {st.status === 'pending' && <span className="chip bg-amber-100 text-amber-700">신청중</span>}
                {st.status === 'available' && <span className="chip bg-slate-100 text-slate-600">예약가능</span>}
                {st.status === 'full' && <span className="chip bg-rose-100 text-rose-600">만석(대기)</span>}
              </div>
              <div className="space-y-1.5">
                {roomReservations.length === 0 && waitings.length === 0 ? (
                  <p className="text-sm text-slate-400 py-2">예약 내역 없음</p>
                ) : (
                  <>
                    {roomReservations.map((r) => {
                      const u = getUser(r.userId);
                      return (
                        <div key={r.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                          <img src={u?.profileImg} className="w-7 h-7 rounded-lg object-cover" alt="" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-navy-900 truncate">{u?.name} · {r.capacity}명</p>
                          </div>
                          <StatusBadge status={r.status} />
                          {r.status === '예약완료' && r.waitingSequence === null && (
                            <button
                              onClick={() => setCancelTarget({ id: r.id, label: `${u?.name ?? ''} ${room.name} 펜션` })}
                              className="text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition"
                              aria-label="관리자 취소"
                            >
                              <XCircle size={16} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                    {waitings.length > 0 && (
                      <p className="text-xs text-amber-600 px-1 pt-1 flex items-center gap-1">
                        <Clock size={12} /> 대기 {waitings.length}명
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {/* Court timelines */}
        {(['A코트', 'B코트'] as CourtName[]).map((court) => {
          const courtRes = courtReservations.filter((r) => r.targetId === court);
          return (
            <div key={court} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-navy-50 flex items-center justify-center text-navy-700">
                    <CalendarRange size={18} />
                  </div>
                  <div>
                    <p className="font-bold text-navy-900">{court}</p>
                    <p className="text-xs text-slate-500">코트 타임라인</p>
                  </div>
                </div>
                <span className="text-xs text-slate-400">{courtRes.length}건</span>
              </div>
              <div className="space-y-1">
                {COURT_TIME_SLOTS.map((slot) => {
                  const status = getCourtSlotStatus(date, court, slot);
                  const res = courtRes.find((r) => r.timeSlot === slot && r.waitingSequence === null && r.status !== '취소')
                    || courtRes.find((r) => r.timeSlot === slot && r.waitingSequence === null && r.status === '취소')
                    || null;
                  const u = res ? getUser(res.userId) : null;
                  const isCancelled = res?.status === '취소';
                  return (
                    <div
                      key={slot}
                      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${
                        status === 'booked'
                          ? 'bg-volt-50 text-navy-900'
                          : status === 'pending'
                            ? 'bg-amber-50 text-navy-900'
                            : status === 'blocked'
                              ? 'bg-slate-100 text-slate-400'
                              : isCancelled
                                ? 'bg-rose-50 text-rose-400'
                                : 'bg-slate-50 text-slate-500'
                      }`}
                    >
                      <Clock size={13} className="shrink-0" />
                      <span className={`font-semibold w-28 shrink-0 ${isCancelled ? 'line-through' : ''}`}>{slot}</span>
                      {status === 'available' && !isCancelled && <span className="text-xs">예약가능</span>}
                      {status === 'blocked' && (
                        <span className="text-xs flex items-center gap-1"><Lock size={11} /> 펜션전용</span>
                      )}
                      {res && u && (
                        <span className={`flex-1 min-w-0 truncate text-xs ${isCancelled ? 'line-through' : ''}`}>
                          {u.name} {res.capacity ? `· ${res.capacity}명` : ''}
                        </span>
                      )}
                      {res && <StatusBadge status={res.status} />}
                      {res && res.status === '예약완료' && res.waitingSequence === null && (
                        <button
                          onClick={() => setCancelTarget({ id: res.id, label: `${u?.name ?? ''} ${court} ${slot}` })}
                          className="text-rose-500 hover:bg-rose-50 rounded-lg p-1 transition ml-auto"
                          aria-label="관리자 취소"
                        >
                          <XCircle size={16} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Matching count + list */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-sky-50 flex items-center justify-center text-sky-700">
              <Users size={18} />
            </div>
            <div>
              <p className="font-bold text-navy-900">당일 매칭</p>
              <p className="text-xs text-slate-500">{dayMatchings.length}건</p>
            </div>
          </div>
        </div>
        {dayMatchings.length === 0 ? (
          <p className="text-sm text-slate-400 py-2">당일 매칭 없음</p>
        ) : (
          <div className="space-y-1.5">
            {dayMatchings.map((m) => {
              const u = getUser(m.userId);
              return (
                <div key={m.id} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
                  <img src={u?.profileImg} className="w-7 h-7 rounded-lg object-cover" alt="" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-900 truncate">
                      {u?.name} · {m.court} {m.time}
                    </p>
                    <p className="text-xs text-slate-500">{m.applications.length}명 신청</p>
                  </div>
                  <span className={`chip ${m.status === '모집중' ? 'bg-volt-100 text-volt-800' : 'bg-slate-100 text-slate-600'}`}>
                    {m.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Mutual exclusion warnings */}
      {(() => {
        const pensionCompleted = pensionReservations.some((r) => r.status === '예약완료' && r.waitingSequence === null);
        const courtCompleted = courtReservations.some((r) => r.status === '예약완료' && r.waitingSequence === null);
        if (!pensionCompleted && !courtCompleted) return null;
        return (
          <div className="rounded-2xl bg-navy-50 border border-navy-100 p-4 flex items-start gap-3">
            <AlertTriangle size={20} className="text-navy-700 shrink-0 mt-0.5" />
            <div className="text-sm text-navy-800">
              <p className="font-bold">상호 배제 적용 중</p>
              <p className="mt-0.5">
                {pensionCompleted && '펜션 예약완료 → 모든 코트 시간대 예약불가. '}
                {courtCompleted && '코트 예약완료 → 펜션 예약 불가.'}
              </p>
            </div>
          </div>
        );
      })()}
      {/* Admin cancel confirm */}
      {cancelTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                <AlertTriangle size={20} className="text-rose-600" />
              </div>
              <h3 className="font-bold text-navy-900">예약 직권 취소</h3>
            </div>
            <p className="text-sm text-slate-600">
              <span className="font-bold text-navy-900">{cancelTarget.label}</span> 예약을 관리자 권한으로 취소하시겠습니까?
            </p>
            <p className="text-xs text-slate-400 mt-2">취소 후 복구할 수 없으며, 대기자가 있을 경우 자동 승격됩니다.</p>
            <div className="mt-5 flex gap-2">
              <button
                onClick={() => setCancelTarget(null)}
                className="flex-1 rounded-lg border border-slate-300 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                아니오
              </button>
              <button
                onClick={() => {
                  cancelReservation(cancelTarget.id);
                  setCancelTarget(null);
                }}
                className="flex-1 rounded-lg bg-rose-600 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
              >
                <XCircle size={16} /> 취소하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
