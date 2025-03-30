export interface MenuItem {
  deleted_at: any;
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image_url: string;
  ingredients: string[];
  preparation_time?: number;
  created_at?: string;
}

export interface CartItem {
  id: string;
  quantity: number;
  menu_items: MenuItem;
}

export interface Cart {
  id: string;
  status: 'active' | 'completed';
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  total: number;
  delivery_time?: number;
  delivery_address: {
    street: string;
    city: string;
    county: string;
    phone: string;
    notes?: string;
  };
  created_at: string;
}