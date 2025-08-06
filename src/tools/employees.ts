import { z } from 'zod';
import { SupabaseConnection } from '../database/index.js';
import {
	EmployeeInsertSchema,
	EmployeeUpdateSchema,
	EmployeeDeleteSchema,
	EmployeeFilterSchema,
} from '../schemas/index.js';

export class EmployeesTools {
	constructor(private db: SupabaseConnection) {}

	// Tool: list_employees
	async listEmployees(args: unknown) {
		try {
			// Validate arguments - company_id is required
			const filter = EmployeeFilterSchema.parse(args);

			// Fetch employees from database
			const employees = await this.db.listEmployees(filter);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: employees,
								count: employees.length,
								message: `Found ${employees.length} employee(s)`,
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

	// Tool: create_employee
	async createEmployee(args: unknown) {
		try {
			// Validate arguments
			const validatedData = EmployeeInsertSchema.parse(args);

			// Generate random email if not provided
			const employeeData = {
				...validatedData,
				email:
					validatedData.email ||
					`employee_${Date.now()}_${Math.random().toString(36).substring(2, 7)}@company.local`,
				phone:
					validatedData.phone ||
					`+1${Math.floor(Math.random() * 9000000000) + 1000000000}`,
			};

			// Create employee in database
			const newEmployee = await this.db.createEmployee(employeeData);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: newEmployee,
								message: `Employee "${newEmployee.name}" created successfully with ID ${newEmployee.id}`,
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

	// Tool: update_employee
	async updateEmployee(args: unknown) {
		try {
			// Validate arguments
			const updateData = EmployeeUpdateSchema.parse(args);

			// Check if employee exists first
			const existingEmployee = await this.db.getEmployeeById(updateData.id);
			if (!existingEmployee) {
				throw new Error(`Employee with ID ${updateData.id} not found`);
			}

			// Update employee in database
			const updatedEmployee = await this.db.updateEmployee(updateData);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: updatedEmployee,
								message: `Employee "${updatedEmployee.name}" updated successfully`,
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

	// Tool: delete_employee
	async deleteEmployee(args: unknown) {
		try {
			// Validate arguments
			const { id } = EmployeeDeleteSchema.parse(args);

			// Check if employee exists first
			const existingEmployee = await this.db.getEmployeeById(id);
			if (!existingEmployee) {
				throw new Error(`Employee with ID ${id} not found`);
			}

			// Delete employee from database
			await this.db.deleteEmployee(id);

			return {
				content: [
					{
						type: 'text',
						text: JSON.stringify(
							{
								success: true,
								data: { id, name: existingEmployee.name },
								message: `Employee "${existingEmployee.name}" deleted successfully`,
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
				name: 'list_employees',
				description:
					'List all employees filtered by company_id with optional filtering by name or email',
				inputSchema: {
					type: 'object',
					properties: {
						company_id: {
							type: 'number',
							description: 'Company ID to filter employees (required)',
						},
						name: {
							type: 'string',
							description:
								'Filter by employee name (partial match, case insensitive)',
						},
						email: {
							type: 'string',
							description: 'Filter by employee email (exact match)',
						},
					},
					required: ['company_id'],
					additionalProperties: false,
				},
			},
			{
				name: 'create_employee',
				description:
					'Create a new employee - only requires name, email and phone will be auto-generated if not provided',
				inputSchema: {
					type: 'object',
					properties: {
						name: {
							type: 'string',
							description: 'Employee name (required, max 255 characters)',
						},
						email: {
							type: 'string',
							description:
								'Employee email (optional, will be auto-generated if not provided)',
						},
						phone: {
							type: 'string',
							description:
								'Employee phone (optional, will be auto-generated if not provided)',
						},
						company_id: {
							type: 'number',
							description: 'Company ID that owns this employee (required)',
						},
					},
					required: ['name', 'company_id'],
					additionalProperties: false,
				},
			},
			{
				name: 'update_employee',
				description: 'Update an existing employee',
				inputSchema: {
					type: 'object',
					properties: {
						id: {
							type: 'number',
							description: 'Employee ID to update (required)',
						},
						name: {
							type: 'string',
							description: 'Employee name (optional, max 255 characters)',
						},
						email: {
							type: 'string',
							description: 'Employee email (optional, must be valid email format)',
						},
						phone: {
							type: 'string',
							description: 'Employee phone (optional, max 20 characters)',
						},
						company_id: {
							type: 'number',
							description: 'Company ID that owns this employee (optional)',
						},
					},
					required: ['id'],
					additionalProperties: false,
				},
			},
			{
				name: 'delete_employee',
				description: 'Delete an employee by ID',
				inputSchema: {
					type: 'object',
					properties: {
						id: {
							type: 'number',
							description: 'Employee ID to delete (required)',
						},
					},
					required: ['id'],
					additionalProperties: false,
				},
			},
		];
	}
}
