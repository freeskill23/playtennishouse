export interface PortfolioItem {
  dogName: string;
  breed: string;
  weight: string;
  size: string;
  note: string;
}

export const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    dogName: "몽이",
    breed: "비숑",
    weight: "6.8kg",
    size: "720 × 520 × 580mm",
    note: "거실 소파 옆 공간에 맞춰 제작했습니다.",
  },
  {
    dogName: "콩이",
    breed: "말티즈",
    weight: "4.2kg",
    size: "600 × 450 × 500mm",
    note: "침실 협탁 공간에 자연스럽게 어울리도록 만들었습니다.",
  },
  {
    dogName: "보리",
    breed: "푸들",
    weight: "7.5kg",
    size: "740 × 540 × 620mm",
    note: "베란다 옆 햇살 좋은 자리에 맞춰 제작했습니다.",
  },
  {
    dogName: "초코",
    breed: "닥스훈트",
    weight: "5.1kg",
    size: "680 × 400 × 480mm",
    note: "긴 몸통에 맞춰 가로를 넉넉히 설계했습니다.",
  },
  {
    dogName: "하니",
    breed: "포메라니안",
    weight: "3.5kg",
    size: "520 × 400 × 460mm",
    note: "아파트 현관 앞 작은 공간에 딱 맞는 사이즈로 제작했습니다.",
  },
  {
    dogName: "대한",
    breed: "시바견",
    weight: "9.2kg",
    size: "820 × 580 × 640mm",
    note: "거실 벽면 공간을 활용해 넓고 편안하게 만들었습니다.",
  },
];
