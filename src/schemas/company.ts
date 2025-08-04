import { z } from 'zod';

// Company validation schemas
export const CompanyInsertSchema = z.object({
	name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters'),
	description: z.string().optional(),
	email: z.string().email('Invalid email format').optional(),
	phone: z.string().max(20, 'Phone must be less than 20 characters').optional(),
	address: z.string().optional(),
});

export const CompanyUpdateSchema = z.object({
	id: z.number().int().positive('ID must be a positive integer'),
	name: z.string().min(1, 'Name is required').max(255, 'Name must be less than 255 characters').optional(),
	description: z.string().optional(),
	email: z.string().email('Invalid email format').optional(),
	phone: z.string().max(20, 'Phone must be less than 20 characters').optional(),
	address: z.string().optional(),
});

export const CompanyDeleteSchema = z.object({
	id: z.number().int().positive('ID must be a positive integer'),
});

export const CompanyFilterSchema = z.object({
	name: z.string().optional(),
	email: z.string().optional(),
});