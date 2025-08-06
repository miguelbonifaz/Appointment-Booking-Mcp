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
	Employee,
	EmployeeInsert,
	EmployeeUpdate,
	EmployeeFilter,
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
			employees: {
				Row: Employee;
				Insert: EmployeeInsert;
				Update: EmployeeUpdate;
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
			.select(
				`
				*,
				company:companies(*)
			`
			)
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

	async validateUserAuthorization(user_number: string, company_id: number): Promise<boolean> {
		try {
			const { data: company, error: companyError } = await this.client
				.from('companies')
				.select('id, company_id')
				.eq('company_id', company_id)
				.single();

			if (companyError || !company) {
				console.error('Company not found');
				return false;
			}

			const { data, error } = await this.client
				.from('authorized_users')
				.select('*')
				.eq('phone_number', user_number)
				.eq('company_id', company.id)
				.single();

			if (error) {
				console.error('Authorization check failed:', error);
				return false;
			}

			return !!data;
		} catch (error) {
			console.error('Validation error:', error);
			return false;
		}
	}

	async listEmployees(filter: EmployeeFilter): Promise<Employee[]> {
		let query = this.client.from('employees').select('*').eq('company_id', filter.company_id);

		if (filter.name) {
			query = query.ilike('name', `%${filter.name}%`);
		}
		if (filter.email) {
			query = query.eq('email', filter.email);
		}

		const { data, error } = await query.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to list employees: ${error.message}`);
		}

		return data || [];
	}

	// Get employee by ID
	async getEmployeeById(id: number): Promise<Employee | null> {
		const { data, error } = await this.client
			.from('employees')
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
			throw new Error(`Failed to get employee: ${error.message}`);
		}

		return data;
	}

	// Create a new employee
	async createEmployee(employee: EmployeeInsert): Promise<Employee> {
		const { data: company, error: companyError } = await this.client
			.from('companies')
			.select('id, company_id')
			.eq('company_id', employee.company_id)
			.single();
			
		if (companyError || !company) {
			throw new Error(`Company with company_id ${employee.company_id} not found`);
		}

		const employeeWithInternalId = {
			...employee,
			company_id: company.id,
		};

		const { data, error } = await this.client
			.from('employees')
			.insert(employeeWithInternalId)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create employee: ${error.message}`);
		}

		return data;
	}

	// Update an existing employee
	async updateEmployee(employeeUpdate: EmployeeUpdate): Promise<Employee> {
		const { id, ...updateData } = employeeUpdate;

		const { data, error } = await this.client
			.from('employees')
			.update({
				...updateData,
				updated_at: new Date().toISOString(),
			})
			.eq('id', id)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update employee: ${error.message}`);
		}

		return data;
	}

	// Delete an employee
	async deleteEmployee(id: number): Promise<boolean> {
		const { error } = await this.client.from('employees').delete().eq('id', id);

		if (error) {
			throw new Error(`Failed to delete employee: ${error.message}`);
		}

		return true;
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
