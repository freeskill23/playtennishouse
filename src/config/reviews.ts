export interface ReviewItem {
  dogName: string;
  breed: string;
  weight: string;
  size: string;
  review: string;
  author: string;
}

export const REVIEWS: ReviewItem[] = [
  {
    dogName: "몽이",
    breed: "비숑",
    weight: "6.8kg",
    size: "720 × 520 × 580mm",
    review:
      "소파 옆 빈 공간이 730mm밖에 안 됐는데, 720mm로 맞춰 제작해주셔서 정말 딱 맞아요. 집에 들어오는 사람마다 어디서 샀냐고 물어봅니다.",
    author: "서울 송파구 · 김OO",
  },
  {
    dogName: "콩이",
    breed: "말티즈",
    weight: "4.2kg",
    size: "600 × 450 × 500mm",
    review:
      "기성품은 항상 너무 크거나 작았는데, 드디어 콩이 사이즈에 맞는 집을 구했어요. 원목 느낌이 인테리어랑 너무 잘 어울립니다.",
    author: "경기 고양시 · 이OO",
  },
  {
    dogName: "보리",
    breed: "푸들",
    weight: "7.5kg",
    size: "740 × 540 × 620mm",
    review:
      "상판을 협탁처럼 쓸 수 있게 요청했는데, 진짜 사이드테이블처럼 자연스러워요. 보리도 첫날부터 금방 들어가서 잠들었어요.",
    author: "서울 마포구 · 박OO",
  },
];
