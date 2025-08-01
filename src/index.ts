#!/usr/bin/env node

import { MCPServer } from './server.js';

// Handle graceful shutdown
const server = new MCPServer();

process.on('SIGINT', async () => {
	await server.stop();
	process.exit(0);
});

process.on('SIGTERM', async () => {
	await server.stop();
	process.exit(0);
});

// Start the server
server.start().catch((error: Error) => {
	console.error('Fatal error:', error);
	process.exit(1);
});
