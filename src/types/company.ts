// Company types
export interface Company {
	id: number;
	name: string;
	description?: string;
	email?: string;
	phone?: string;
	address?: string;
	created_at: string;
	updated_at: string;
}

export interface CompanyInsert {
	name: string;
	description?: string;
	email?: string;
	phone?: string;
	address?: string;
}

export interface CompanyUpdate {
	id: number;
	name?: string;
	description?: string;
	email?: string;
	phone?: string;
	address?: string;
}

export interface CompanyFilter {
	name?: string;
	email?: string;
}