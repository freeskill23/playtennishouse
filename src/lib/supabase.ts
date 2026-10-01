import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

export type OrderStatus = "payment_pending" | "paid" | "in_production" | "shipped" | "completed" | "cancelled";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  payment_pending: "결제 대기",
  paid: "결제 완료",
  in_production: "제작 중",
  shipped: "배송 중",
  completed: "완료",
  cancelled: "취소",
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  payment_pending: "bg-amber-100 text-amber-700",
  paid: "bg-teal-100 text-teal-700",
  in_production: "bg-blue-100 text-blue-700",
  shipped: "bg-indigo-100 text-indigo-700",
  completed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export const SHIPPING_COMPANIES = [
  "CJ대한통운",
  "한진택배",
  "로젠택배",
  "롯데택배",
  "우체국택배",
  "대신택배",
  "경동택배",
  "CVSnet",
  "합통택배",
] as const;
