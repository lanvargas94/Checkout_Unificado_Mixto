
export type Category = 'Tecnología' | 'Bonos Digitales';

export interface Product {
  id: string;
  name: string;
  category: Category;
  priceCOP: number;
  pricePoints: number;
  paymentRule: string;
  allowsMixedPayment: boolean;
  minPointsPercentage: number; // 0 to 1
}

export interface CartItem extends Product {
  quantity: number;
}

export type CheckoutStep = 'cart' | 'checkout' | 'summary' | 'payment' | 'confirmation';

export interface TransactionStatus {
  id: string;
  state: 'success' | 'failed' | 'success_points_only';
  pointsUsed: number;
  cashPaid: number;
  timestamp: string;
}
