import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { Service, ServiceInsert, ServiceUpdate, ServiceFilter } from "../types/index.js";

// Database interface for our specific tables
interface Database {
  public: {
    Tables: {
      services: {
        Row: Service;
        Insert: ServiceInsert;
        Update: ServiceUpdate;
      };
    };
  };
}

export class SupabaseConnection {
  private client: SupabaseClient<Database>;

  constructor(url: string, key: string) {
    this.client = createClient<Database>(url, key);
  }

  // List all services with optional filtering
  async listServices(filter?: ServiceFilter): Promise<Service[]> {
    let query = this.client.from("services").select("*");

    if (filter) {
      if (filter.company_id) {
        query = query.eq("company_id", filter.company_id);
      }
      if (filter.category) {
        query = query.eq("category", filter.category);
      }
      if (filter.price_min) {
        query = query.gte("price", filter.price_min);
      }
      if (filter.price_max) {
        query = query.lte("price", filter.price_max);
      }
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to list services: ${error.message}`);
    }

    return data || [];
  }

  // Get service by ID
  async getServiceById(id: number): Promise<Service | null> {
    const { data, error } = await this.client.from("services").select("*").eq("id", id).single();

    if (error) {
      if (error.code === "PGRST116") {
        return null; // Not found
      }
      throw new Error(`Failed to get service: ${error.message}`);
    }

    return data;
  }

  // Create a new service
  async createService(service: ServiceInsert): Promise<Service> {
    const { data, error } = await this.client.from("services").insert(service).select().single();

    if (error) {
      throw new Error(`Failed to create service: ${error.message}`);
    }

    return data;
  }

  // Update an existing service
  async updateService(serviceUpdate: ServiceUpdate): Promise<Service> {
    const { id, ...updateData } = serviceUpdate;

    const { data, error } = await this.client
      .from("services")
      .update({
        ...updateData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update service: ${error.message}`);
    }

    return data;
  }

  // Delete a service
  async deleteService(id: number): Promise<boolean> {
    const { error } = await this.client.from("services").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete service: ${error.message}`);
    }

    return true;
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await this.client.from("services").select("count").limit(1);

      return !error;
    } catch {
      return false;
    }
  }
}
