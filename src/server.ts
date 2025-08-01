import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'node:crypto';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import { SupabaseConnection } from './database/index.js';
import { ServicesTools } from './tools/index.js';

// Load environment variables
dotenv.config();

export class MCPServer {
	private app: express.Application;
	private db: SupabaseConnection;
	private servicesTools: ServicesTools;
	private server: McpServer;
	private transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

	constructor() {
		// Validate environment variables
		const supabaseUrl = process.env.SUPABASE_URL;
		const supabaseKey = process.env.SUPABASE_ANON_KEY;

		if (!supabaseUrl || !supabaseKey) {
			throw new Error(
				'Missing required environment variables: SUPABASE_URL and SUPABASE_ANON_KEY'
			);
		}

		// Initialize Supabase connection
		this.db = new SupabaseConnection(supabaseUrl, supabaseKey);

		// Initialize tools
		this.servicesTools = new ServicesTools(this.db);

		// Initialize MCP server
		this.server = new McpServer({
			name: 'supabase-services-server',
			version: '1.0.0',
		});

		// Register tools
		this.setupTools();

		// Initialize Express app
		this.app = express();
		this.setupMiddleware();
		this.setupRoutes();
	}

	private setupMiddleware() {
		// CORS configuration for browser clients
		this.app.use(
			cors({
				origin: '*',
				exposedHeaders: ['Mcp-Session-Id'],
				allowedHeaders: ['Content-Type', 'mcp-session-id'],
			})
		);

		// JSON parsing middleware
		this.app.use(express.json());
	}

	private setupTools(): void {
		// Register tools using McpServer
		this.server.registerTool(
			'list_services',
			{
				description:
					'List all services filtered by company_id with optional filtering by category and price range',
				inputSchema: {
					company_id: z
						.number()
						.positive()
						.int()
						.describe('Company ID to filter services (required)'),
					category: z.string().optional().describe('Filter by service category'),
					price_min: z.number().positive().optional().describe('Minimum price filter'),
					price_max: z.number().positive().optional().describe('Maximum price filter'),
				},
			},
			async (args: {
				company_id: number;
				category?: string;
				price_min?: number;
				price_max?: number;
			}) => {
				const result = await this.servicesTools.listServices(args);
				// Convert the result format to MCP format
				if (result.isError) {
					return {
						content: [{ type: 'text', text: result.content[0].text }],
						isError: true,
					};
				}
				return {
					content: [{ type: 'text', text: result.content[0].text }],
				};
			}
		);

		this.server.registerTool(
			'create_service',
			{
				description: 'Create a new service',
				inputSchema: {
					name: z
						.string()
						.min(1)
						.max(255)
						.describe('Service name (required, max 255 characters)'),
					description: z.string().optional().describe('Service description (optional)'),
					price: z
						.number()
						.positive()
						.describe('Service price (required, must be positive)'),
					duration: z
						.number()
						.positive()
						.int()
						.describe(
							'Service duration in minutes (required, must be positive integer)'
						),
					category: z
						.string()
						.max(100)
						.optional()
						.describe('Service category (optional, max 100 characters)'),
					company_id: z
						.number()
						.positive()
						.int()
						.describe('Company ID that owns this service (required)'),
				},
			},
			async (args: {
				name: string;
				description?: string;
				price: number;
				duration: number;
				category?: string;
				company_id: number;
			}) => {
				const result = await this.servicesTools.createService(args);
				// Convert the result format to MCP format
				if (result.isError) {
					return {
						content: [{ type: 'text', text: result.content[0].text }],
						isError: true,
					};
				}
				return {
					content: [{ type: 'text', text: result.content[0].text }],
				};
			}
		);

		this.server.registerTool(
			'update_service',
			{
				description: 'Update an existing service',
				inputSchema: {
					id: z.number().positive().int().describe('Service ID to update (required)'),
					name: z
						.string()
						.min(1)
						.max(255)
						.optional()
						.describe('Service name (optional, max 255 characters)'),
					description: z.string().optional().describe('Service description (optional)'),
					price: z
						.number()
						.positive()
						.optional()
						.describe('Service price (optional, must be positive)'),
					duration: z
						.number()
						.positive()
						.int()
						.optional()
						.describe(
							'Service duration in minutes (optional, must be positive integer)'
						),
					category: z
						.string()
						.max(100)
						.optional()
						.describe('Service category (optional, max 100 characters)'),
					company_id: z
						.number()
						.positive()
						.int()
						.optional()
						.describe('Company ID that owns this service (optional)'),
				},
			},
			async (args: {
				id: number;
				name?: string;
				description?: string;
				price?: number;
				duration?: number;
				category?: string;
				company_id?: number;
			}) => {
				const result = await this.servicesTools.updateService(args);
				// Convert the result format to MCP format
				if (result.isError) {
					return {
						content: [{ type: 'text', text: result.content[0].text }],
						isError: true,
					};
				}
				return {
					content: [{ type: 'text', text: result.content[0].text }],
				};
			}
		);

		this.server.registerTool(
			'delete_service',
			{
				description: 'Delete a service by ID',
				inputSchema: {
					id: z.number().positive().int().describe('Service ID to delete (required)'),
				},
			},
			async (args: { id: number }) => {
				const result = await this.servicesTools.deleteService(args);
				// Convert the result format to MCP format
				if (result.isError) {
					return {
						content: [{ type: 'text', text: result.content[0].text }],
						isError: true,
					};
				}
				return {
					content: [{ type: 'text', text: result.content[0].text }],
				};
			}
		);
	}

	private setupRoutes() {
		// Handle POST requests for client-to-server communication
		this.app.post('/mcp', async (req, res) => {
			const sessionId = req.headers['mcp-session-id'] as string | undefined;
			let transport: StreamableHTTPServerTransport;

			if (sessionId && this.transports[sessionId]) {
				// Reuse existing transport
				transport = this.transports[sessionId];
			} else if (!sessionId && isInitializeRequest(req.body)) {
				// New initialization request
				transport = new StreamableHTTPServerTransport({
					sessionIdGenerator: () => randomUUID(),
					onsessioninitialized: (sessionId: string) => {
						this.transports[sessionId] = transport;
					},
					enableDnsRebindingProtection: false,
				});

				// Clean up transport when closed
				transport.onclose = () => {
					if (transport.sessionId) {
						delete this.transports[transport.sessionId];
					}
				};

				await this.server.connect(transport);
			} else {
				// Invalid request
				res.status(400).json({
					jsonrpc: '2.0',
					error: {
						code: -32000,
						message: 'Bad Request: No valid session ID provided',
					},
					id: null,
				});
				return;
			}

			// Handle the request
			await transport.handleRequest(req, res, req.body);
		});

		// Handle GET requests for server-to-client notifications via SSE
		this.app.get('/mcp', async (req, res) => {
			const sessionId = req.headers['mcp-session-id'] as string | undefined;
			if (!sessionId || !this.transports[sessionId]) {
				res.status(400).send('Invalid or missing session ID');
				return;
			}

			const transport = this.transports[sessionId];
			await transport.handleRequest(req, res);
		});

		// Handle DELETE requests for session termination
		this.app.delete('/mcp', async (req, res) => {
			const sessionId = req.headers['mcp-session-id'] as string | undefined;
			if (!sessionId || !this.transports[sessionId]) {
				res.status(400).send('Invalid or missing session ID');
				return;
			}

			const transport = this.transports[sessionId];
			await transport.handleRequest(req, res);
		});
	}

	async start() {
		try {
			// Test Supabase connection
			const connectionOk = await this.db.testConnection();
			if (!connectionOk) {
				throw new Error('Failed to connect to Supabase database');
			}

			console.error('✅ Connected to Supabase database');
			console.error('🚀 MCP Supabase Services Server starting...');

			// Start the HTTP server
			const PORT = process.env.PORT || 3000;
			this.app.listen(PORT, () => {
				console.error(`✅ MCP HTTP Server listening on port ${PORT}`);
				console.error(`🌐 Server URL: http://localhost:${PORT}/mcp`);
				console.error('📋 Available tools:');
				console.error(
					'   - list_services: List all services filtered by company_id with optional filtering by category and price range'
				);
				console.error('   - create_service: Create a new service');
				console.error('   - update_service: Update an existing service');
				console.error('   - delete_service: Delete a service by ID');
			});
		} catch (error) {
			console.error('❌ Failed to start MCP server:', error);
			process.exit(1);
		}
	}

	async stop() {
		console.error('🛑 Shutting down MCP server...');
		// Close all active transports
		Object.values(this.transports).forEach((transport) => {
			transport.close();
		});
	}
}

// Default export
export default MCPServer;
