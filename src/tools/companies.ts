import { z } from 'zod';
import { SupabaseConnection } from '../database/index.js';
import {
	CompanyInsertSchema,
	CompanyUpdateSchema,
	CompanyDeleteSchema,
	CompanyFilterSchema,
} from '../schemas/index.js';

export class CompaniesTools {
	constructor(private db: SupabaseConnection) {}

	// Tool: list_companies
	async listCompanies(args: unknown) {
		try {
			// Validate arguments (all filters are optional)
			const filter = CompanyFilterSchema.parse(args || {});

			// Fetch companies from database
			const companies = await this.db.listCompanies(filter);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: companies,
								count: companies.length,
								message: `Found ${companies.length} company(ies)`,
							},
							null,
							2
						),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: false,
								error:
									error instanceof Error
										? error.message
										: 'Unknown error occurred',
								data: null,
							},
							null,
							2
						),
					},
				],
				isError: true,
			};
		}
	}

	// Tool: create_company
	async createCompany(args: unknown) {
		try {
			// Validate arguments
			const companyData = CompanyInsertSchema.parse(args);

			// Create company in database
			const newCompany = await this.db.createCompany(companyData);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: newCompany,
								message: `Company "${newCompany.name}" created successfully with ID ${newCompany.id}`,
							},
							null,
							2
						),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: false,
								error:
									error instanceof Error
										? error.message
										: 'Unknown error occurred',
								data: null,
							},
							null,
							2
						),
					},
				],
				isError: true,
			};
		}
	}

	// Tool: update_company
	async updateCompany(args: unknown) {
		try {
			// Validate arguments
			const updateData = CompanyUpdateSchema.parse(args);

			// Check if company exists first
			const existingCompany = await this.db.getCompanyById(updateData.id);
			if (!existingCompany) {
				throw new Error(`Company with ID ${updateData.id} not found`);
			}

			// Update company in database
			const updatedCompany = await this.db.updateCompany(updateData);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: updatedCompany,
								message: `Company "${updatedCompany.name}" updated successfully`,
							},
							null,
							2
						),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: false,
								error:
									error instanceof Error
										? error.message
										: 'Unknown error occurred',
								data: null,
							},
							null,
							2
						),
					},
				],
				isError: true,
			};
		}
	}

	// Tool: delete_company
	async deleteCompany(args: unknown) {
		try {
			// Validate arguments
			const { id } = CompanyDeleteSchema.parse(args);

			// Check if company exists first
			const existingCompany = await this.db.getCompanyById(id);
			if (!existingCompany) {
				throw new Error(`Company with ID ${id} not found`);
			}

			// Delete company from database
			await this.db.deleteCompany(id);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: { id, name: existingCompany.name },
								message: `Company "${existingCompany.name}" deleted successfully`,
							},
							null,
							2
						),
					},
				],
			};
		} catch (error) {
			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: false,
								error:
									error instanceof Error
										? error.message
										: 'Unknown error occurred',
								data: null,
							},
							null,
							2
						),
					},
				],
				isError: true,
			};
		}
	}

	// Get tool definitions for MCP server
	getToolDefinitions() {
		return [
			{
				name: 'list_companies',
				description:
					'List all companies with optional filtering by name or email',
				inputSchema: {
					type: 'object',
					properties: {
						name: {
							type: 'string',
							description: 'Filter by company name (partial match, case insensitive)',
						},
						email: {
							type: 'string',
							description: 'Filter by company email (exact match)',
						},
					},
					additionalProperties: false,
				},
			},
			{
				name: 'create_company',
				description: 'Create a new company',
				inputSchema: {
					type: 'object',
					properties: {
						name: {
							type: 'string',
							description: 'Company name (required, max 255 characters)',
						},
						description: {
							type: 'string',
							description: 'Company description (optional)',
						},
						email: {
							type: 'string',
							description: 'Company email (optional, must be valid email format)',
						},
						phone: {
							type: 'string',
							description: 'Company phone (optional, max 20 characters)',
						},
						address: {
							type: 'string',
							description: 'Company address (optional)',
						},
					},
					required: ['name'],
					additionalProperties: false,
				},
			},
			{
				name: 'update_company',
				description: 'Update an existing company',
				inputSchema: {
					type: 'object',
					properties: {
						id: {
							type: 'number',
							description: 'Company ID to update (required)',
						},
						name: {
							type: 'string',
							description: 'Company name (optional, max 255 characters)',
						},
						description: {
							type: 'string',
							description: 'Company description (optional)',
						},
						email: {
							type: 'string',
							description: 'Company email (optional, must be valid email format)',
						},
						phone: {
							type: 'string',
							description: 'Company phone (optional, max 20 characters)',
						},
						address: {
							type: 'string',
							description: 'Company address (optional)',
						},
					},
					required: ['id'],
					additionalProperties: false,
				},
			},
			{
				name: 'delete_company',
				description: 'Delete a company by ID',
				inputSchema: {
					type: 'object',
					properties: {
						id: {
							type: 'number',
							description: 'Company ID to delete (required)',
						},
					},
					required: ['id'],
					additionalProperties: false,
				},
			},
		];
	}
}