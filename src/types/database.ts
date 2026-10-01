export interface ProductOptionValue {
  id: string;
  label: string;
  price: number;
}

export interface ProductOption {
  id: string;
  name: string;
  values: ProductOptionValue[];
}

export interface SelectedOption {
  optionName: string;
  valueLabel: string;
  price: number;
  quantity: number;
}

export interface CategoryRow {
  id: string;
  name: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

export interface ProductCategoryRow {
  id: string;
  product_id: string;
  category_id: string;
  created_at: string;
}

export interface ProductRow {
  id: string;
  name: string;
  description: string;
  image_url: string | null;
  base_width: number;
  base_depth: number;
  base_height: number;
  base_price: number;
  detail_content: string;
  options: ProductOption[];
  is_active: boolean;
  display_order: number;
  category_ids: string[];
  size_customizable: boolean;
  customizable_width: boolean;
  customizable_depth: boolean;
  customizable_height: boolean;
  shipping_fee: number | null;
  free_shipping_threshold: number | null;
  created_at: string;
  updated_at: string;
}

export interface OrderRow {
  id: string;
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
  selected_options: SelectedOption[] | null;
  memo: string | null;
  status: string;
  payment_token: string | null;
  payment_method: string | null;
  portone_payment_id: string | null;
  portone_merchant_id: string | null;
  order_number: string | null;
  shipping_company: string | null;
  tracking_number: string | null;
  shipped_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PortfolioRow {
  id: string;
  dog_name: string;
  breed: string;
  weight: string;
  size: string;
  note: string;
  image_url: string | null;
  display_order: number;
  is_visible: boolean;
  created_at: string;
}

export interface ReviewRow {
  id: string;
  dog_name: string;
  breed: string;
  weight: string;
  size: string;
  review: string;
  author: string;
  display_order: number;
  is_visible: boolean;
  created_at: string;
}

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

export interface CartItemRow {
  id: string;
  session_id: string | null;
  user_id: string | null;
  product_id: string;
  product_name: string;
  width: number;
  depth: number;
  height: number;
  selected_options: SelectedOption[] | null;
  unit_price: number;
  quantity: number;
  memo: string | null;
  created_at: string;
}

export interface BankAccount {
  id: string;
  bank: string;
  accountHolder: string;
  accountNumber: string;
}

export interface PortOneConfig {
  storeId: string;
  channelKey: string;
}

export interface SettingsMap {
  pricing?: PricingSettings;
  sizes?: SizeSettings;
  bank_accounts?: BankAccount[];
  portone?: PortOneConfig;
}
