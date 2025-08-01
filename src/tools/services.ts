import { z } from 'zod';
import { SupabaseConnection } from '../database/index.js';
import {
	ServiceInsertSchema,
	ServiceUpdateSchema,
	ServiceDeleteSchema,
	ServiceFilterSchema,
} from '../schemas/index.js';

export class ServicesTools {
	constructor(private db: SupabaseConnection) {}

	// Tool: list_services
	async listServices(args: unknown) {
		try {
			// Validate arguments - company_id is now required
			const filter = ServiceFilterSchema.parse(args);

			// Fetch services from database
			const services = await this.db.listServices(filter);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: services,
								count: services.length,
								message: `Found ${services.length} service(s)`,
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

	// Tool: create_service
	async createService(args: unknown) {
		try {
			// Validate arguments
			const serviceData = ServiceInsertSchema.parse(args);

			// Create service in database
			const newService = await this.db.createService(serviceData);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: newService,
								message: `Service "${newService.name}" created successfully with ID ${newService.id}`,
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

	// Tool: update_service
	async updateService(args: unknown) {
		try {
			// Validate arguments
			const updateData = ServiceUpdateSchema.parse(args);

			// Check if service exists first
			const existingService = await this.db.getServiceById(updateData.id);
			if (!existingService) {
				throw new Error(`Service with ID ${updateData.id} not found`);
			}

			// Update service in database
			const updatedService = await this.db.updateService(updateData);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: updatedService,
								message: `Service "${updatedService.name}" updated successfully`,
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

	// Tool: delete_service
	async deleteService(args: unknown) {
		try {
			// Validate arguments
			const { id } = ServiceDeleteSchema.parse(args);

			// Check if service exists first
			const existingService = await this.db.getServiceById(id);
			if (!existingService) {
				throw new Error(`Service with ID ${id} not found`);
			}

			// Delete service from database
			await this.db.deleteService(id);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: { id, name: existingService.name },
								message: `Service "${existingService.name}" deleted successfully`,
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
				name: 'list_services',
				description:
					'List all services filtered by company_id with optional filtering by category and price range',
				inputSchema: {
					type: 'object',
					properties: {
						company_id: {
							type: 'number',
							description: 'Company ID to filter services (required)',
						},
						category: {
							type: 'string',
							description: 'Filter by service category',
						},
						price_min: {
							type: 'number',
							description: 'Minimum price filter',
						},
						price_max: {
							type: 'number',
							description: 'Maximum price filter',
						},
					},
					required: ['company_id'],
					additionalProperties: false,
				},
			},
			{
				name: 'create_service',
				description: 'Create a new service',
				inputSchema: {
					type: 'object',
					properties: {
						name: {
							type: 'string',
							description: 'Service name (required, max 255 characters)',
						},
						description: {
							type: 'string',
							description: 'Service description (optional)',
						},
						price: {
							type: 'number',
							description: 'Service price (required, must be positive)',
						},
						duration: {
							type: 'number',
							description:
								'Service duration in minutes (required, must be positive integer)',
						},
						category: {
							type: 'string',
							description: 'Service category (optional, max 100 characters)',
						},
						company_id: {
							type: 'number',
							description: 'Company ID that owns this service (required)',
						},
					},
					required: ['name', 'price', 'duration', 'company_id'],
					additionalProperties: false,
				},
			},
			{
				name: 'update_service',
				description: 'Update an existing service',
				inputSchema: {
					type: 'object',
					properties: {
						id: {
							type: 'number',
							description: 'Service ID to update (required)',
						},
						name: {
							type: 'string',
							description: 'Service name (optional, max 255 characters)',
						},
						description: {
							type: 'string',
							description: 'Service description (optional)',
						},
						price: {
							type: 'number',
							description: 'Service price (optional, must be positive)',
						},
						duration: {
							type: 'number',
							description:
								'Service duration in minutes (optional, must be positive integer)',
						},
						category: {
							type: 'string',
							description: 'Service category (optional, max 100 characters)',
						},
						company_id: {
							type: 'number',
							description: 'Company ID that owns this service (optional)',
						},
					},
					required: ['id'],
					additionalProperties: false,
				},
			},
			{
				name: 'delete_service',
				description: 'Delete a service by ID',
				inputSchema: {
					type: 'object',
					properties: {
						id: {
							type: 'number',
							description: 'Service ID to delete (required)',
						},
					},
					required: ['id'],
					additionalProperties: false,
				},
			},
		];
	}
}
