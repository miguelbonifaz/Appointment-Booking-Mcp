import { z } from 'zod';

// Zod schemas for validation
export const ServiceSchema = z.object({
	id: z.number(),
	name: z.string(),
	description: z.string().nullable().optional(),
	price: z.number().positive(),
	duration: z.number().positive().int(),
	category: z.string().nullable().optional(),
	company_id: z.number().positive().int(),
	created_at: z.string().optional(),
	updated_at: z.string().optional(),
});

export const ServiceInsertSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
	description: z.string().optional(),
	price: z.number().positive('Price must be positive'),
	duration: z.number().positive().int('Duration must be a positive integer'),
	category: z.string().max(100, 'Category too long').optional(),
	company_id: z.number().positive().int('Company ID must be a positive integer'),
});

export const ServiceUpdateSchema = z.object({
	id: z.number().positive().int('ID must be a positive integer'),
	name: z.string().min(1, 'Name is required').max(255, 'Name too long').optional(),
	description: z.string().optional(),
	price: z.number().positive('Price must be positive').optional(),
	duration: z.number().positive().int('Duration must be a positive integer').optional(),
	category: z.string().max(100, 'Category too long').optional(),
	company_id: z.number().positive().int('Company ID must be a positive integer').optional(),
});

export const ServiceFilterSchema = z.object({
	company_id: z.number().positive().int('Company ID is required'),
	category: z.string().optional(),
	price_min: z.number().positive().optional(),
	price_max: z.number().positive().optional(),
});

export const ServiceDeleteSchema = z.object({
	id: z.number().positive().int('ID must be a positive integer'),
});
