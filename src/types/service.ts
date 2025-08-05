// Service types based on the Supabase table structure
export interface Service {
  id: number;
  name: string;
  description?: string | null;
  price: number;
  duration: number;
  category?: string | null;
  company_id: number;
  created_at?: string;
  updated_at?: string;
  company: {
    company_id: number;
  };
}

export interface ServiceInsert {
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  company_id: number;
}

export interface ServiceUpdate {
  id: number;
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  category?: string;
  company_id?: number;
}

export interface ServiceFilter {
  company_id?: number;
  category?: string;
  price_min?: number;
  price_max?: number;
}
