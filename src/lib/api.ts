import { supabase } from "@/lib/supabase";
import type { OrderRow, PortfolioRow, ReviewRow, SettingsMap, ProductRow, SelectedOption, CategoryRow, CartItemRow, ProductCategoryRow } from "@/types/database";
import { safeUUID } from "@/lib/pricing";

export async function fetchActiveCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllCategories(): Promise<CategoryRow[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function upsertCategory(item: Partial<CategoryRow> & { name: string }): Promise<void> {
  const { error } = await supabase.from("categories").upsert(item);
  if (error) throw error;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchAllProductCategories(): Promise<ProductCategoryRow[]> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("*");
  if (error) throw error;
  return data ?? [];
}

export async function fetchProductCategoryIds(productId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("product_categories")
    .select("category_id")
    .eq("product_id", productId);
  if (error) throw error;
  return (data ?? []).map((r) => r.category_id);
}

export async function setProductCategories(productId: string, categoryIds: string[]): Promise<void> {
  await supabase.from("product_categories").delete().eq("product_id", productId);
  if (categoryIds.length > 0) {
    const rows = categoryIds.map((cid) => ({ product_id: productId, category_id: cid }));
    const { error } = await supabase.from("product_categories").insert(rows);
    if (error) throw error;
  }
}

export async function fetchActiveProducts(categoryId?: string): Promise<ProductRow[]> {
  let productIds: string[] | null = null;
  if (categoryId) {
    const { data: pcData, error: pcError } = await supabase
      .from("product_categories")
      .select("product_id")
      .eq("category_id", categoryId);
    if (pcError) throw pcError;
    productIds = (pcData ?? []).map((r) => r.product_id);
    if (productIds.length === 0) return [];
  }

  let query = supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("display_order", { ascending: true });
  if (productIds) {
    query = query.in("id", productIds);
  }
  const { data, error } = await query;
  if (error) throw error;

  const products = data ?? [];
  if (products.length === 0) return [];

  const { data: pcData } = await supabase
    .from("product_categories")
    .select("product_id, category_id")
    .in("product_id", products.map((p) => p.id));

  const pcMap: Record<string, string[]> = {};
  for (const pc of pcData ?? []) {
    if (!pcMap[pc.product_id]) pcMap[pc.product_id] = [];
    pcMap[pc.product_id].push(pc.category_id);
  }

  return products.map((p) => ({ ...p, category_ids: pcMap[p.id] ?? [] }));
}

export async function fetchAllProducts(): Promise<ProductRow[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;

  const products = data ?? [];
  if (products.length === 0) return [];

  const { data: pcData } = await supabase
    .from("product_categories")
    .select("product_id, category_id")
    .in("product_id", products.map((p) => p.id));

  const pcMap: Record<string, string[]> = {};
  for (const pc of pcData ?? []) {
    if (!pcMap[pc.product_id]) pcMap[pc.product_id] = [];
    pcMap[pc.product_id].push(pc.category_id);
  }

  return products.map((p) => ({ ...p, category_ids: pcMap[p.id] ?? [] }));
}

export interface ProductUpsertData {
  id?: string;
  name: string;
  description: string;
  image_url: string | null;
  detail_content: string;
  base_width: number;
  base_depth: number;
  base_height: number;
  base_price: number;
  display_order: number;
  is_active: boolean;
  size_customizable: boolean;
  customizable_width: boolean;
  customizable_depth: boolean;
  customizable_height: boolean;
  shipping_fee: number | null;
  free_shipping_threshold: number | null;
  options: ProductRow["options"];
  category_ids?: string[];
}

export async function upsertProduct(item: ProductUpsertData): Promise<string> {
  const { category_ids, ...productData } = item;
  const { data, error } = await supabase.from("products").upsert({
    ...productData,
    updated_at: new Date().toISOString(),
  }).select("id").single();
  if (error) throw error;
  const productId = data.id;
  if (category_ids !== undefined) {
    await setProductCategories(productId, category_ids);
  }
  return productId;
}

export async function fetchProductById(id: string): Promise<ProductRow | null> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const categoryIds = await fetchProductCategoryIds(id);
  return { ...data, category_ids: categoryIds };
}

export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function fetchVisiblePortfolio(): Promise<PortfolioRow[]> {
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .eq("is_visible", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllPortfolio(): Promise<PortfolioRow[]> {
  const { data, error } = await supabase
    .from("portfolio_items")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchVisibleReviews(): Promise<ReviewRow[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("is_visible", true)
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllReviews(): Promise<ReviewRow[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .order("display_order", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchAllOrders(): Promise<OrderRow[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function fetchSettings(): Promise<SettingsMap> {
  const { data, error } = await supabase.from("settings").select("key, value");
  if (error) throw error;
  const map: SettingsMap = {};
  for (const row of data ?? []) {
    (map as Record<string, unknown>)[row.key] = row.value;
  }
  return map;
}

export async function upsertSetting(key: string, value: unknown): Promise<void> {
  const { error } = await supabase
    .from("settings")
    .upsert({ key, value, updated_at: new Date().toISOString() });
  if (error) throw error;
}

export interface OrderInsert {
  product_id: string | null;
  product_name: string | null;
  width: number;
  depth: number;
  height: number;
  total_price: number;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_postcode: string | null;
  customer_address: string;
  customer_detail_address: string | null;
  selected_options: SelectedOption[];
  memo: string | null;
  payment_method?: string | null;
  portone_merchant_id?: string | null;
}

export async function insertOrder(order: OrderInsert): Promise<string | null> {
  const orderNumber = generateOrderNumber();
  const { data, error } = await supabase
    .from("orders")
    .insert({ ...order, order_number: orderNumber })
    .select("id")
    .single();
  if (error) throw error;
  return data?.id ?? null;
}

function generateOrderNumber(): string {
  const now = new Date();
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `COCO-${date}-${random}`;
}

export async function updateOrderStatus(id: string, status: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function updateOrderMemo(id: string, memo: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ memo, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function generatePaymentToken(id: string): Promise<string> {
  const token = safeUUID();
  const { error } = await supabase
    .from("orders")
    .update({ payment_token: token, status: "payment_pending", updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  return token;
}

export async function fetchOrderByToken(token: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("payment_token", token)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function confirmPaymentByToken(token: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status: "paid", updated_at: new Date().toISOString() })
    .eq("payment_token", token);
  if (error) throw error;
}

export async function confirmCardPayment(
  orderId: string,
  portonePaymentId: string
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "paid",
      portone_payment_id: portonePaymentId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", orderId);
  if (error) throw error;
}

export async function fetchOrderById(id: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateOrderShipping(
  id: string,
  shippingCompany: string,
  trackingNumber: string
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({
      status: "shipped",
      shipping_company: shippingCompany,
      tracking_number: trackingNumber,
      shipped_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function autoCompleteShippedOrders(): Promise<number> {
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("status", "shipped")
    .lt("shipped_at", twoDaysAgo)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export async function deleteOrder(id: string): Promise<void> {
  const { error } = await supabase.from("orders").delete().eq("id", id);
  if (error) throw error;
}

export async function bulkDeleteOrders(ids: string[]): Promise<void> {
  const { error } = await supabase.from("orders").delete().in("id", ids);
  if (error) throw error;
}

export async function fetchOrderByNumber(orderNumber: string): Promise<OrderRow | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("order_number", orderNumber.trim().toUpperCase())
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function cancelOrder(id: string): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", id)
    .in("status", ["payment_pending", "paid"]);
  if (error) throw error;
}

export async function upsertPortfolioItem(item: Partial<PortfolioRow> & { dog_name: string; breed: string; weight: string; size: string; note: string }): Promise<void> {
  const { error } = await supabase.from("portfolio_items").upsert(item);
  if (error) throw error;
}

export async function deletePortfolioItem(id: string): Promise<void> {
  const { error } = await supabase.from("portfolio_items").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertReview(item: Partial<ReviewRow> & { dog_name: string; breed: string; weight: string; size: string; review: string; author: string }): Promise<void> {
  const { error } = await supabase.from("reviews").upsert(item);
  if (error) throw error;
}

export async function deleteReview(id: string): Promise<void> {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

export interface CartItemInsert {
  session_id: string | null;
  user_id: string | null;
  product_id: string;
  product_name: string;
  width: number;
  depth: number;
  height: number;
  selected_options: SelectedOption[];
  unit_price: number;
  quantity: number;
  memo: string | null;
}

export async function fetchCartItems(owner: { session_id: string } | { user_id: string }): Promise<CartItemRow[]> {
  let query = supabase.from("cart_items").select("*").order("created_at", { ascending: false });
  if ("session_id" in owner) {
    query = query.eq("session_id", owner.session_id);
  } else {
    query = query.eq("user_id", owner.user_id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function insertCartItem(item: CartItemInsert): Promise<void> {
  const { error } = await supabase.from("cart_items").insert(item);
  if (error) throw error;
}

export async function updateCartQuantity(id: string, quantity: number): Promise<void> {
  const { error } = await supabase
    .from("cart_items")
    .update({ quantity })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCartItem(id: string): Promise<void> {
  const { error } = await supabase.from("cart_items").delete().eq("id", id);
  if (error) throw error;
}

export async function deleteAllCartItems(owner: { session_id: string } | { user_id: string }): Promise<void> {
  let query = supabase.from("cart_items").delete();
  if ("session_id" in owner) {
    query = query.eq("session_id", owner.session_id);
  } else {
    query = query.eq("user_id", owner.user_id);
  }
  const { error } = await query;
  if (error) throw error;
}
