import { z } from 'zod';

// Employee validation schemas
export const EmployeeInsertSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
	email: z.string().email('Invalid email format').optional(),
	phone: z.string().max(20, 'Phone must be less than 20 characters').optional(),
	company_id: z.number().int().positive('Company ID must be a positive integer'),
});

export const EmployeeUpdateSchema = z.object({
	id: z.number().int().positive('ID must be a positive integer'),
	name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
	email: z.string().email('Invalid email format').optional(),
	phone: z.string().max(20, 'Phone must be less than 20 characters').optional(),
	company_id: z.number().int().positive('Company ID must be a positive integer').optional(),
});

export const EmployeeDeleteSchema = z.object({
	id: z.number().int().positive('ID must be a positive integer'),
});

export const EmployeeFilterSchema = z.object({
	company_id: z.number().int().positive('Company ID must be a positive integer'),
	name: z.string().optional(),
	email: z.string().optional(),
});