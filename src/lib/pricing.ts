import type { PricingSettings, SizeSettings } from "@/config/pricing";
import { DEFAULT_PRICING, DEFAULT_SIZES } from "@/config/pricing";
import type { ProductRow } from "@/types/database";

export interface HouseDimensions {
  width: number;
  depth: number;
  height: number;
}

export interface PriceBreakdown {
  basePrice: number;
  widthAdjust: number;
  depthAdjust: number;
  heightAdjust: number;
  shippingFee: number;
  total: number;
}

export interface PriceInput {
  product: Pick<ProductRow, "base_width" | "base_depth" | "base_height" | "base_price" | "shipping_fee" | "free_shipping_threshold">;
  dimensions: HouseDimensions;
  pricing: PricingSettings;
}

function clampDimensions(d: HouseDimensions, sizes: SizeSettings): HouseDimensions {
  return {
    width: Math.max(sizes.minWidth, Math.min(sizes.maxWidth, d.width)),
    depth: Math.max(sizes.minDepth, Math.min(sizes.maxDepth, d.depth)),
    height: Math.max(sizes.minHeight, Math.min(sizes.maxHeight, d.height)),
  };
}

export function calculatePrice(input: PriceInput, sizes: SizeSettings = DEFAULT_SIZES): PriceBreakdown {
  const d = clampDimensions(input.dimensions, sizes);
  const p = input.pricing;

  // Use clamped base dimensions as reference so no adjustment is shown
  // when the user hasn't changed anything beyond allowed range.
  const baseW = clampDimensions(
    { width: input.product.base_width, depth: input.product.base_depth, height: input.product.base_height },
    sizes,
  );

  const widthDiffCm = Math.max(0, Math.floor((d.width - baseW.width) / 10));
  const depthDiffCm = Math.max(0, Math.floor((d.depth - baseW.depth) / 10));
  const heightDiffCm = Math.max(0, Math.floor((d.height - baseW.height) / 10));

  const basePrice = input.product.base_price;
  const widthAdjust = widthDiffCm * p.perCmWidth;
  const depthAdjust = depthDiffCm * p.perCmDepth;
  const heightAdjust = heightDiffCm * p.perCmHeight;

  const productShippingFee = input.product.shipping_fee ?? p.shippingFee;
  const productFreeThreshold = input.product.free_shipping_threshold ?? p.freeShippingThreshold;
  let shippingFee = productShippingFee;
  const subtotal = basePrice + widthAdjust + depthAdjust + heightAdjust;
  if (subtotal >= productFreeThreshold) {
    shippingFee = 0;
  }

  const total = subtotal + shippingFee;

  return { basePrice, widthAdjust, depthAdjust, heightAdjust, shippingFee, total };
}

export function safeUUID(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    try {
      return crypto.randomUUID();
    } catch {
      // fall through
    }
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function formatWon(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

export { DEFAULT_PRICING, DEFAULT_SIZES };
