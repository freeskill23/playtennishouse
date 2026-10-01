import { BRAND } from "@/config/brand";

interface LegalPageProps {
  onNavigate: (to: string) => void;
}

function LegalLayout({
  title,
  updatedAt,
  children,
}: {
  title: string;
  updatedAt: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-ivory pt-20 md:pt-24">
      <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8 md:py-20">
        <h1 className="font-serif text-3xl text-charcoal sm:text-4xl">{title}</h1>
        <p className="mt-3 text-xs text-charcoal-muted">최종 수정일: {updatedAt}</p>
        <div className="mt-10 space-y-6 text-sm leading-relaxed text-charcoal">
          {children}
        </div>
      </div>
    </main>
  );
}

export function BusinessInfoPage({ onNavigate: _onNavigate }: LegalPageProps) {
  return (
    <LegalLayout title="사업자 정보" updatedAt="2026-09-29">
      <section>
        <h2 className="text-base font-semibold text-charcoal">상호</h2>
        <p className="mt-2 text-charcoal-muted">{BRAND.nameKr} ({BRAND.nameEn})</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-charcoal">대표자</h2>
        <p className="mt-2 text-charcoal-muted">{BRAND.ceoName}</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-charcoal">사업자등록번호</h2>
        <p className="mt-2 text-charcoal-muted">{BRAND.businessNumber}</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-charcoal">연락처</h2>
        <p className="mt-2 text-charcoal-muted">이메일: {BRAND.email}</p>
        <p className="mt-1 text-charcoal-muted">인스타그램: {BRAND.instagram}</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-charcoal">통신판매업 신고</h2>
        <p className="mt-2 text-charcoal-muted">사업자등록번호 {BRAND.businessNumber}로 통신판매업 신고가 되어 있습니다.</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-charcoal">영업소 재고량</h2>
        <p className="mt-2 text-charcoal-muted">주문제작 상품으로, 사전 재고를 보유하지 않으며 주문 접수 후 제작이 진행됩니다.</p>
      </section>
      <section>
        <h2 className="text-base font-semibold text-charcoal">청약철회 제한 사유</h2>
        <p className="mt-2 text-charcoal-muted">
          본 상품은 소비자의 주문에 의해 개별적으로 생산되는 주문제작 상품으로, 전자상거래법 제17조 제2항 제5호에 따라 제작이 시작된 이후에는 청약철회(주문 취소)가 제한됩니다.
        </p>
      </section>
    </LegalLayout>
  );
}

export function PrivacyPage({ onNavigate: _onNavigate }: LegalPageProps) {
  return (
    <LegalLayout title="개인정보처리방침" updatedAt="2026-09-29">
      <section>
        <p className="text-charcoal-muted">
          {BRAND.nameKr}('{'이하 "회사"'}')는 이용자의 개인정보를 중요하게 생각하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다. 본 개인정보처리방침은 회사가 제공하는 서비스에서 이용자의 개인정보를 어떻게 수집, 이용, 보관, 파기하는지 설명합니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">1. 수집하는 개인정보 항목</h2>
        <p className="mt-2 text-charcoal-muted">회사는 주문 접수 및 배송을 위해 아래의 개인정보를 수집합니다.</p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-charcoal-muted">
          <li>성명 (주문자 이름)</li>
          <li>연락처 (휴대전화 번호)</li>
          <li>이메일 주소 (회원 가입 시 또는 주문 시)</li>
          <li>배송 주소 (우편번호, 기본 주소, 상세 주소)</li>
          <li>주문 메모 (요청사항)</li>
          <li>결제 정보 (결제 수단, 결제 금액 - PG사를 통해 처리됨)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">2. 개인정보 수집 및 이용 목적</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-charcoal-muted">
          <li>주문 접수, 제작 지시 및 배송 처리</li>
          <li>주문 내역 확인 및 고객 문의 응대</li>
          <li>결제 처리 및 환불 처리</li>
          <li>배송 상태 안내</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">3. 개인정보 보유 및 이용 기간</h2>
        <p className="mt-2 text-charcoal-muted">
          수집된 개인정보는 주문 완료(배송 완료) 후 90일간 보관하며, 이후 지체 없이 파기합니다. 단, 전자상거래법 제6조에 따라 거래 기록은 5년간 보관할 수 있습니다.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-charcoal-muted">
          <li>계약 또는 청약철회 등에 관한 기록: 5년</li>
          <li>대금결제 및 재화 등의 공급에 관한 기록: 5년</li>
          <li>소비자의 불만 또는 분쟁 처리에 관한 기록: 3년</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">4. 개인정보 파기 절차 및 방법</h2>
        <p className="mt-2 text-charcoal-muted">
          개인정보 보유 기간이 경과하거나 처리 목적이 달성된 경우, 해당 정보를 지체 없이 파기합니다. 전자적 형태의 정보는 복구할 수 없는 방법으로 삭제하며, 종이 형태의 정보는 분쇄기로 파기합니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">5. 개인정보 제3자 제공</h2>
        <p className="mt-2 text-charcoal-muted">
          회사는 이용자의 동의 없이 개인정보를 제3자에게 제공하지 않습니다. 단, 배송 및 결제 처리를 위해 아래의 경우에 한하여 필요 최소한의 정보를 제공합니다.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-charcoal-muted">
          <li>결제 처리: 포트원(PortOne) 및 연동 PG사 (결제 승인, 취소, 환불 목적)</li>
          <li>배송: 택배사 (수령인 이름, 연락처, 배송 주소)</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">6. 이용자의 권리 및 행사 방법</h2>
        <p className="mt-2 text-charcoal-muted">
          이용자는 언제든지 자신의 개인정보를 조회, 수정, 삭제할 수 있으며, 개인정보 처리에 대한 동의를 철회할 수 있습니다. 관련 요청은 {BRAND.email}로 이메일 주시면 10영업일 이내에 처리해드립니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">7. 개인정보 보호책임자</h2>
        <p className="mt-2 text-charcoal-muted">
          개인정보 보호책임자: {BRAND.ceoName} ({BRAND.nameKr} 대표자)<br />
          연락처: {BRAND.email}
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">8. 권익침해 구제 방법</h2>
        <p className="mt-2 text-charcoal-muted">
          이용자는 개인정보 침해에 대한 피해 구제, 상담 등이 필요하신 경우 아래 기관에 문의하실 수 있습니다.
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-charcoal-muted">
          <li>개인정보침해신고센터: 118 (privacy.kisa.or.kr)</li>
          <li>개인정보분쟁조정위원회: 1833-6972 (kopico.go.kr)</li>
          <li>대검찰청 사이버수사과: 1301 (spo.go.kr)</li>
          <li>경찰청 사이버수사국: 182 (ecrm.cyber.go.kr)</li>
        </ul>
      </section>
    </LegalLayout>
  );
}

export function RefundPolicyPage({ onNavigate: _onNavigate }: LegalPageProps) {
  return (
    <LegalLayout title="환불 및 취소 정책" updatedAt="2026-09-29">
      <section>
        <p className="text-charcoal-muted">
          {BRAND.nameKr}는 주문제작 상품을 판매합니다. 주문제작 상품의 특성상, 전자상거래법에 따라 제작 시작 후에는 청약철회(주문 취소)가 제한됩니다. 아래에 구체적인 취소 및 환불 정책을 안내드립니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">1. 주문 취소</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-charcoal-muted">
          <li><strong>제작 시작 전:</strong> 주문 접수 후 제작이 시작되기 전에는 주문 취소 및 전액 환불이 가능합니다. (무통장입금: 입금 전 취소 가능 / 카드결제: 제작 시작 전 취소 시 전액 취소)</li>
          <li><strong>제작 시작 후:</strong> 전자상거래법 제17조 제2항 제5호에 따라 주문제작 상품은 제작이 시작된 이후 청약철회가 제한됩니다. 제작이 시작된 후에는 취소 및 환불이 불가합니다.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">2. 제작 시작 시점</h2>
        <p className="mt-2 text-charcoal-muted">
          무통장입금의 경우 입금 확인 후 제작이 시작되며, 카드결제의 경우 결제 완료 즉시 제작이 시작됩니다. 주문 상태가 "제작 중"으로 변경된 후에는 취소가 불가합니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">3. 하자 및 오배송에 의한 환불</h2>
        <p className="mt-2 text-charcoal-muted">
          수령 후 7일 이내에 상품 하자 또는 주문 내용과 다른 상품이 배송된 경우, 교환 또는 환불이 가능합니다. 이 경우 배송비는 회사가 부담합니다. 하자 확인 후 동일 상품으로 교환 또는 전액 환불해드립니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">4. 단순 변심에 의한 교환/환불</h2>
        <p className="mt-2 text-charcoal-muted">
          주문제작 상품은 이용자의 요청에 따라 개별적으로 생산되는 상품이므로, 단순 변심에 의한 교환 및 환불은 불가합니다. (전자상거래법 제17조 제2항 제5호)
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">5. 환불 방법</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-charcoal-muted">
          <li><strong>카드 결제:</strong> 결제 취소 처리를 통해 승인 취소됩니다. 영업일 기준 3~5일 내에 카드사에 반영됩니다.</li>
          <li><strong>무통장입금:</strong> 주문 시 입력하신 계좌로 환불됩니다. 환불 처리 후 1~2영업일 내에 입금됩니다.</li>
        </ul>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">6. 부분 취소</h2>
        <p className="mt-2 text-charcoal-muted">
          장바구니에 여러 상품을 담아 주문한 경우, 제작이 시작되지 않은 상품에 대해서만 개별 취소가 가능합니다. 이미 제작이 시작된 상품은 취소에서 제외됩니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">7. 환불 문의</h2>
        <p className="mt-2 text-charcoal-muted">
          환불 및 취소 관련 문의는 {BRAND.email}로 이메일 주시거나 인스타그램({BRAND.instagram})으로 연락 주시면 신속하게 처리해드립니다.
        </p>
      </section>

      <section>
        <h2 className="text-base font-semibold text-charcoal">8. 관련 법령</h2>
        <p className="mt-2 text-charcoal-muted">
          본 정책은 「전자상거래 등에서의 소비자보호에 관한 법률」 제17조(청약철회 등), 동법 시행령 제21조(청약철회 등의 효과) 및 「개인정보 보호법」에 근거합니다.
        </p>
      </section>
    </LegalLayout>
  );
}
