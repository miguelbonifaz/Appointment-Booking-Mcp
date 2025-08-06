# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an MCP (Model Context Protocol) server that provides CRUD operations for appointment booking services via Supabase. The server exposes tools for managing companies, employees, and services in an appointment booking system.

## Development Commands

- `npm run dev` - Start development server with hot reload using tsx
- `npm run build` - Compile TypeScript to JavaScript in dist/
- `npm start` - Run the compiled production server
- `npm run lint` - Lint TypeScript files with ESLint
- `npm run format` - Format code with Prettier

## Testing with MCP Inspector

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Architecture

### MCP Server Structure
The application follows the MCP (Model Context Protocol) pattern:

- **Entry Point**: `src/index.ts` - Handles graceful shutdown and starts the MCPServer
- **Main Server**: `src/server.ts` - Core MCP server with Express HTTP transport
- **Tools**: `src/tools/` - Individual tool classes for each entity (Services, Companies, Employees)
- **Database**: `src/database/` - Supabase connection and data access layer
- **Schemas**: `src/schemas/` - Zod validation schemas for all operations
- **Types**: `src/types/` - TypeScript interfaces for all entities

### Key Components

1. **MCPServer Class** (`src/server.ts:15`): Main orchestrator that:
   - Initializes Supabase connection
   - Registers all MCP tools with validation schemas
   - Sets up Express HTTP server with CORS
   - Handles MCP protocol communication via HTTP transport

2. **Tool Classes**: Each entity has its own tool class:
   - `ServicesTools` - CRUD operations for services (requires user authorization)
   - `CompaniesTools` - CRUD operations for companies
   - `EmployeesTools` - CRUD operations for employees

3. **SupabaseConnection** (`src/database/supabase.ts:40`): Database abstraction layer providing typed methods for all CRUD operations

### Authorization System
- Services operations require `user_number` parameter for authorization
- The system validates user permissions before allowing create/update/delete operations
- Company filtering is enforced: `company_id` is required for listing services and employees

## Environment Configuration

Required environment variables (see `.env.example`):
- `SUPABASE_URL` - Supabase project URL (defaults to local: http://127.0.0.1:54321)
- `SUPABASE_ANON_KEY` - Supabase anonymous key for authentication
- `SUPABASE_SERVICE_ROLE_KEY` - Optional service role key for admin operations
- `PORT` - HTTP server port (defaults to 3000)

## Available MCP Tools

### Services Tools
- `list_services` - List services by company_id with optional filters (category, price range)
- `create_service` - Create new service (requires user_number for auth)
- `update_service` - Update existing service (requires user_number for auth)
- `delete_service` - Delete service by ID (requires user_number for auth)

### Companies Tools
- `list_companies` - List companies with optional name/email filters
- `create_company` - Create new company
- `update_company` - Update existing company
- `delete_company` - Delete company by ID

### Employees Tools
- `list_employees` - List employees by company_id with optional filters
- `create_employee` - Create new employee
- `update_employee` - Update existing employee
- `delete_employee` - Delete employee by ID

## Data Models

### Service Structure
```typescript
interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number; // in minutes
  category?: string;
  company_id: number;
  created_at?: string;
  updated_at?: string;
}
```

### Company Structure
```typescript
interface Company {
  id: number;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
  updated_at?: string;
}
```

### Employee Structure
```typescript
interface Employee {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company_id: number;
  created_at?: string;
  updated_at?: string;
}
```

## Important Implementation Notes

1. **All operations return JSON responses** with consistent structure including success/error status
2. **Error handling** is centralized in each tool class with proper Zod validation
3. **HTTP transport** is used instead of stdio for MCP communication to support browser clients
4. **Session management** maintains separate transports per client session
5. **TypeScript compilation** uses ES modules - all imports must use `.js` extensions in source files
6. **Authorization validation** is required for service management operations