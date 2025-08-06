// Employee types
export interface Employee {
	id: number;
	name: string;
	email: string;
	phone?: string;
	company_id: number;
	created_at: string;
	updated_at: string;
}

export interface EmployeeInsert {
	name: string;
	email: string;
	phone?: string;
	company_id: number;
}

export interface EmployeeUpdate {
	id: number;
	name?: string;
	email?: string;
	phone?: string;
	company_id?: number;
}

export interface EmployeeFilter {
	company_id: number;
	name?: string;
	email?: string;
}