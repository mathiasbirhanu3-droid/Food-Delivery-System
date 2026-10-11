export type Role = 'customer' | 'kitchen';
export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

export interface Zone {
  name: string; fee: number; etaMin: number; etaMax: number;
  center?: [number, number];   // map dropoff coordinates
}

export interface User {
  id: string; email: string; name: string; phone?: string;
  role: Role; defaultZone?: string; provider?: 'local' | 'google';
  passwordHash?: string; passwordSalt?: string; demoPassword?: string;
}

export type DishCategory = 'Ethiopian' | 'Pizza' | 'Burgers' | 'Drinks';
export interface Dish {
  id: string; slug: string; name: string; description: string; ingredients: string[];
  category: DishCategory; price: number; image: string; tags: string[];
  spicy: boolean; vegetarian: boolean; popular: boolean;
  prepMinutes: number; rating: number; available: boolean;
  marketingLine?: string; discountPercent?: number;
}

export interface Favorite { userId: string; dishId: string; at: string }

export interface Announcement {
  id: string; message: string; href?: string;
  tone: 'festival' | 'deal' | 'info'; active: boolean;
  startsAt?: string; endsAt?: string;
}

export interface OrderItem { dishId: string; qty: number; unitPrice: number }
export interface OrderEvent { at: string; status: OrderStatus }
export interface Courier { name: string; phone: string }

export interface Order {
  id: string; userId: string; items: OrderItem[];
  zone: string; fee: number; etaMin: number; etaMax: number;
  note?: string; contact?: { name: string; phone: string };
  status: OrderStatus; placedAt: string; events: OrderEvent[];
  deliveringAt?: string;   // set once when status → delivering; drives the live position
  courier?: Courier;       // assigned at dispatch; stable afterwards
}

export interface LoginActivity {
  id: string; email: string; userId?: string; at: string;
  outcome: 'success' | 'wrong-password' | 'locked' | 'google';
  ip?: string; userAgent?: string;
}

export interface Restaurant {
  name: string; tagline: string; address: string; phone: string;
  hours: string; currency: string; zones: string[];
  location?: [number, number];   // map origin coordinates
}