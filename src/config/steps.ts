export interface ProcessStep {
  label: string;
  description: string;
}

export const PROCESS_STEPS: ProcessStep[] = [
  { label: "자작나무 합판", description: "엄선한 원목 소재 준비" },
  { label: "CNC 가공", description: "정밀한 사이즈로 절단" },
  { label: "샌딩", description: "부드러운 표면 마감" },
  { label: "조립", description: "튼튼한 구조로 결합" },
  { label: "검수", description: "품질 확인 후 승인" },
  { label: "포장", description: "안전한 보호 포장" },
  { label: "배송", description: "고객의 집까지 배송" },
];
