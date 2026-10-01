import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import {
  fetchCartItems,
  insertCartItem,
  updateCartQuantity,
  deleteCartItem,
  deleteAllCartItems,
  type CartItemInsert,
} from "@/lib/api";
import { safeUUID } from "@/lib/pricing";
import type { CartItemRow, SelectedOption } from "@/types/database";

const SESSION_ID_KEY = "cocosfit_session_id";

function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = safeUUID();
    localStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

export interface AddToCartParams {
  product_id: string;
  product_name: string;
  width: number;
  depth: number;
  height: number;
  selected_options: SelectedOption[];
  unit_price: number;
  quantity: number;
  memo?: string;
}

interface CartContextType {
  items: CartItemRow[];
  buyNowItem: CartItemRow | null;
  loading: boolean;
  count: number;
  refresh: () => Promise<void>;
  add: (params: AddToCartParams) => Promise<void>;
  buyNow: (params: AddToCartParams) => Promise<void>;
  clearBuyNow: () => void;
  updateQuantity: (id: string, quantity: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItemRow[]>([]);
  const [buyNowItem, setBuyNowItem] = useState<CartItemRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId] = useState(getOrCreateSessionId);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const owner = userData.user ? { user_id: userData.user.id } : { session_id: sessionId };
      const data = await fetchCartItems(owner);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const add = useCallback(
    async (params: AddToCartParams) => {
      const { data: userData } = await supabase.auth.getUser();
      const item: CartItemInsert = {
        session_id: userData.user ? null : sessionId,
        user_id: userData.user?.id ?? null,
        product_id: params.product_id,
        product_name: params.product_name,
        width: params.width,
        depth: params.depth,
        height: params.height,
        selected_options: params.selected_options,
        unit_price: params.unit_price,
        quantity: params.quantity,
        memo: params.memo ?? null,
      };
      await insertCartItem(item);
      await refresh();
    },
    [sessionId, refresh]
  );

  const buyNow = useCallback(
    async (params: AddToCartParams) => {
      const { data: userData } = await supabase.auth.getUser();
      const item: CartItemRow = {
        id: `buynow_${Date.now()}`,
        session_id: userData.user ? null : sessionId,
        user_id: userData.user?.id ?? null,
        product_id: params.product_id,
        product_name: params.product_name,
        width: params.width,
        depth: params.depth,
        height: params.height,
        selected_options: params.selected_options,
        unit_price: params.unit_price,
        quantity: params.quantity,
        memo: params.memo ?? null,
        created_at: new Date().toISOString(),
      };
      setBuyNowItem(item);
    },
    [sessionId]
  );

  const clearBuyNow = useCallback(() => {
    setBuyNowItem(null);
  }, []);

  const updateQuantity = useCallback(
    async (id: string, quantity: number) => {
      await updateCartQuantity(id, quantity);
      setItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity } : i)));
    },
    []
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteCartItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    },
    []
  );

  const clear = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const owner = userData.user ? { user_id: userData.user.id } : { session_id: sessionId };
    await deleteAllCartItems(owner);
    setItems([]);
  }, [sessionId]);

  const count = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, buyNowItem, loading, count, refresh, add, buyNow, clearBuyNow, updateQuantity, remove, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
