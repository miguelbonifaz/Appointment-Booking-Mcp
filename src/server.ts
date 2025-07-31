import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { SupabaseConnection } from './database/index.js';
import { ServicesTools } from './tools/index.js';

// Load environment variables
dotenv.config();

export class MCPServer {
	private server: Server;
	private db: SupabaseConnection;
	private servicesTools: ServicesTools;

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
		this.server = new Server(
			{
				name: 'supabase-services-server',
				version: '1.0.0',
			},
			{
				capabilities: {
					tools: {},
				},
			}
		);

		this.setupHandlers();
	}

	private setupHandlers() {
		// Handle tool listing
		this.server.setRequestHandler(ListToolsRequestSchema, async () => {
			return {
				tools: this.servicesTools.getToolDefinitions(),
			};
		});

		// Handle tool execution
		this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
			const { name, arguments: args } = request.params;

			try {
				switch (name) {
					case 'list_services':
						return await this.servicesTools.listServices(args);

					case 'create_service':
						return await this.servicesTools.createService(args);

					case 'update_service':
						return await this.servicesTools.updateService(args);

					case 'delete_service':
						return await this.servicesTools.deleteService(args);

					default:
						throw new Error(`Unknown tool: ${name}`);
				}
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
									tool: name,
									arguments: args,
								},
								null,
								2
							),
						},
					],
					isError: true,
				};
			}
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

			// Start the server with stdio transport
			const transport = new StdioServerTransport();
			await this.server.connect(transport);

			console.error('✅ MCP Server started successfully');
			console.error('📋 Available tools:');
			this.servicesTools.getToolDefinitions().forEach((tool) => {
				console.error(`   - ${tool.name}: ${tool.description}`);
			});
		} catch (error) {
			console.error('❌ Failed to start MCP server:', error);
			process.exit(1);
		}
	}

	async stop() {
		// Graceful shutdown logic here if needed
		console.error('🛑 Shutting down MCP server...');
	}
}
