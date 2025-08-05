import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
	Service,
	ServiceInsert,
	ServiceUpdate,
	ServiceFilter,
	Company,
	CompanyInsert,
	CompanyUpdate,
	CompanyFilter,
} from '../types/index.js';

// Database interface for our specific tables
interface Database {
	public: {
		Tables: {
			services: {
				Row: Service;
				Insert: ServiceInsert;
				Update: ServiceUpdate;
			};
			companies: {
				Row: Company;
				Insert: CompanyInsert;
				Update: CompanyUpdate;
			};
		};
	};
}

export class SupabaseConnection {
	private client: SupabaseClient<Database>;

	constructor(url: string, key: string) {
		this.client = createClient<Database>(url, key);
	}

	// List all services filtered by company_id with optional additional filtering
	async listServices(filter: ServiceFilter): Promise<Service[]> {
		let query = this.client
			.from('services')
			.select(
				`
				*,
				companies!inner(*)
			`
			)
			.eq('companies.company_id', filter.company_id);

		if (filter.category) {
			query = query.eq('category', filter.category);
		}
		if (filter.price_min) {
			query = query.gte('price', filter.price_min);
		}
		if (filter.price_max) {
			query = query.lte('price', filter.price_max);
		}

		const { data, error } = await query.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to list services: ${error.message}`);
		}

		return data || [];
	}

	// Get service by ID
	async getServiceById(id: number): Promise<Service | null> {
		const { data, error } = await this.client
			.from('services')
			.select(`
				*,
				company:companies(*)
			`)
			.eq('id', id)
			.single();

		if (error) {
			if (error.code === 'PGRST116') {
				return null; // Not found
			}
			throw new Error(`Failed to get service: ${error.message}`);
		}

		return data;
	}

	// Create a new service
	async createService(service: ServiceInsert): Promise<Service> {
		// Search company_id in companies table
		const { data: companyData, error: companyError } = await this.client
			.from('companies')
			.select('id')
			.eq('company_id', service.company_id)
			.single();

		if (companyError || !companyData) {
			throw new Error(`Company with company_id ${service.company_id} not found`);
		}

		const serviceWithInternalId = {
			...service,
			company_id: companyData.id,
		};

		const { data, error } = await this.client
			.from('services')
			.insert(serviceWithInternalId)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create service: ${error.message}`);
		}

		return data;
	}

	// Update an existing service
	async updateService(serviceUpdate: ServiceUpdate): Promise<Service> {
		const { id, ...updateData } = serviceUpdate;

		const { data, error } = await this.client
			.from('services')
			.update({
				...updateData,
				updated_at: new Date().toISOString(),
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update service: ${error.message}`);
		}

		return data;
	}

	// Delete a service
	async deleteService(id: number): Promise<boolean> {
		const { error } = await this.client.from('services').delete().eq('id', id);

		if (error) {
			throw new Error(`Failed to delete service: ${error.message}`);
		}

		return true;
	}

	// List all companies with optional filtering
	async listCompanies(filter?: CompanyFilter): Promise<Company[]> {
		let query = this.client.from('companies').select('*');

		if (filter?.name) {
			query = query.ilike('name', `%${filter.name}%`);
		}
		if (filter?.email) {
			query = query.eq('email', filter.email);
		}

		const { data, error } = await query.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to list companies: ${error.message}`);
		}

		return data || [];
	}

	// Get company by ID
	async getCompanyById(id: number): Promise<Company | null> {
		const { data, error } = await this.client
			.from('companies')
			.select('*')
			.eq('id', id)
			.single();

		if (error) {
			if (error.code === 'PGRST116') {
				return null; // Not found
			}
			throw new Error(`Failed to get company: ${error.message}`);
		}

		return data;
	}

	// Create a new company
	async createCompany(company: CompanyInsert): Promise<Company> {
		const { data, error } = await this.client
			.from('companies')
			.insert(company)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create company: ${error.message}`);
		}

		return data;
	}

	// Update an existing company
	async updateCompany(companyUpdate: CompanyUpdate): Promise<Company> {
		const { id, ...updateData } = companyUpdate;

		const { data, error } = await this.client
			.from('companies')
			.update({
				...updateData,
				updated_at: new Date().toISOString(),
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update company: ${error.message}`);
		}

		return data;
	}

	// Delete a company
	async deleteCompany(id: number): Promise<boolean> {
		const { error } = await this.client.from('companies').delete().eq('id', id);

		if (error) {
			throw new Error(`Failed to delete company: ${error.message}`);
		}

		return true;
	}

	// Validate user authorization
	// Código CORREGIDO
	async validateUserAuthorization(
		user_number: string,
		external_company_id: number
	): Promise<boolean> {
		try {
			console.log(
				`Validating authorization for user_number: ${user_number}, external_company_id: ${external_company_id}`
			);

			// 1. Primero buscar el ID interno de la empresa
			const { data: companyData, error: companyError } = await this.client
				.from('companies')
				.select('id, company_id')
				.eq('company_id', external_company_id) // Busca por company_id "1944"
				.single();

			console.log({external_company_id});

			if (companyError || !companyData) {
				console.log('Company not found');
				return false;
			}

			// 2. Luego validar autorización con el ID interno
			const { data, error } = await this.client
				.from('authorized_users')
				.select('*')
				.eq('phone_number', user_number)
				.eq('company_id', companyData.id) // Usa el ID interno (1)
				.single();

			if (error) {
				console.log('Authorization check failed:', error);
				return false;
			}

			return !!data;
		} catch (error) {
			console.log('Validation error:', error);
			return false;
		}
	}

	// Test connection
	async testConnection(): Promise<boolean> {
		try {
			const { data, error } = await this.client.from('services').select('count').limit(1);

			return !error;
		} catch {
			return false;
		}
	}
}
