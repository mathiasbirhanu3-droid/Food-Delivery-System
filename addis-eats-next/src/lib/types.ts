export type Role = 'customer' | 'kitchen';
export type OrderStatus = 'pending' | 'preparing' | 'delivering' | 'delivered' | 'cancelled';

export interface Zone { name: string; fee: number; etaMin: number; etaMax: number }

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;          // absent for Google users until they edit their profile
  role: Role;
  defaultZone?: string;    // absent for Google users; checkout falls back to the first zone
  provider?: 'local' | 'google';
  passwordHash?: string;   // absent for Google users — passwordless via Google
  passwordSalt?: string;
  demoPassword?: string;
}

export type DishCategory = 'Ethiopian' | 'Pizza' | 'Burgers' | 'Drinks';
export interface Dish {
  id: string; slug: string; name: string; description: string; ingredients: string[];
  category: DishCategory; price: number; image: string; tags: string[];
  spicy: boolean; vegetarian: boolean; popular: boolean;
  prepMinutes: number; rating: number; available: boolean;
  marketingLine?: string;
  discountPercent?: number;
}

export interface Favorite { userId: string; dishId: string; at: string }

export interface Announcement {
  id: string;
  message: string;
  href?: string;
  tone: 'festival' | 'deal' | 'info';
  active: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface OrderItem { dishId: string; qty: number; unitPrice: number }
export interface OrderEvent { at: string; status: OrderStatus }
export interface Order {
  id: string; userId: string; items: OrderItem[];
  zone: string; fee: number; etaMin: number; etaMax: number;
  note?: string; contact?: { name: string; phone: string };
  status: OrderStatus; placedAt: string; events: OrderEvent[];
}

export interface Restaurant {
  name: string; tagline: string; address: string; phone: string;
  hours: string; currency: string; zones: string[];
}