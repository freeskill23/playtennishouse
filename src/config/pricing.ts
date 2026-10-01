export interface PricingSettings {
  baseFee: number;
  areaRatePerSqmm: number;
  sizeScaleRate: number;
  shippingFee: number;
  freeShippingThreshold: number;
  perCmWidth: number;
  perCmDepth: number;
  perCmHeight: number;
}

export interface SizeSettings {
  minWidth: number;
  maxWidth: number;
  minDepth: number;
  maxDepth: number;
  minHeight: number;
  maxHeight: number;
}

export const DEFAULT_PRICING: PricingSettings = {
  baseFee: 30000,
  areaRatePerSqmm: 0.18,
  sizeScaleRate: 0.04,
  shippingFee: 15000,
  freeShippingThreshold: 200000,
  perCmWidth: 500,
  perCmDepth: 500,
  perCmHeight: 500,
};

export const DEFAULT_SIZES: SizeSettings = {
  minWidth: 400,
  maxWidth: 1200,
  minDepth: 350,
  maxDepth: 900,
  minHeight: 400,
  maxHeight: 1000,
};
