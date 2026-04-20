
import { Product } from './types';

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'prod-a',
    name: 'Auriculares Premium Bluetooth',
    category: 'Tecnología',
    priceCOP: 100000,
    pricePoints: 10000,
    paymentRule: 'Mínimo 50% en puntos. El resto puede ser dinero.',
    allowsMixedPayment: true,
    minPointsPercentage: 0.5,
  },
  {
    id: 'prod-b',
    name: 'Bono Digital Netflix $50k',
    category: 'Bonos Digitales',
    pricePoints: 5000,
    priceCOP: 50000,
    paymentRule: 'Solo pago con 100% de puntos.',
    allowsMixedPayment: false,
    minPointsPercentage: 1.0,
  }
];

export const MOCK_USER = {
  name: 'Juan Pérez',
  pointsBalance: 12500,
};
