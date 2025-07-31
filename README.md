# MCP Supabase Services Server

Un servidor MCP (Model Context Protocol) que proporciona operaciones CRUD para servicios en Supabase.

## Características

- ✅ **Operaciones CRUD completas** para servicios
- ✅ **Validación de datos** con Zod
- ✅ **Conexión segura** a Supabase
- ✅ **Tipos TypeScript** seguros
- ✅ **Filtrado avanzado** de servicios

## Tools Disponibles

1. **`list_services`** - Lista todos los servicios con filtros opcionales
2. **`create_service`** - Crea un nuevo servicio
3. **`update_service`** - Actualiza un servicio existente
4. **`delete_service`** - Elimina un servicio por ID

## Estructura de Servicio

```typescript
interface Service {
  id: number;
  name: string;
  description?: string;
  price: number;
  duration: number; // en minutos
  category?: string;
  company_id: number;
  created_at?: string;
  updated_at?: string;
}
```

## Instalación

1. **Clona e instala dependencias:**

   ```bash
   npm install
   ```

2. **Configura variables de entorno:**

   ```bash
   cp .env.example .env
   # Edita .env con tus credenciales de Supabase
   ```

3. **Compila el proyecto:**
   ```bash
   npm run build
   ```

## Uso

### Desarrollo

```bash
npm run dev
```

### Producción

```bash
npm start
```

### Con Inspector MCP

```bash
npx @modelcontextprotocol/inspector node dist/index.js
```

## Configuración con Claude Desktop

Agrega esta configuración a tu archivo de configuración de Claude Desktop:

```json
{
  "mcpServers": {
    "supabase-services": {
      "command": "node",
      "args": ["path/to/mcp-supabase-server/dist/index.js"],
      "env": {
        "SUPABASE_URL": "http://127.0.0.1:54321",
        "SUPABASE_ANON_KEY": "tu-anon-key-aqui"
      }
    }
  }
}
```

## Ejemplos de Uso

### Listar servicios

```json
{
  "name": "list_services",
  "arguments": {
    "company_id": 1,
    "category": "beauty"
  }
}
```

### Crear servicio

```json
{
  "name": "create_service",
  "arguments": {
    "name": "Corte de Cabello",
    "description": "Corte de cabello profesional",
    "price": 25.0,
    "duration": 30,
    "category": "beauty",
    "company_id": 1
  }
}
```

### Actualizar servicio

```json
{
  "name": "update_service",
  "arguments": {
    "id": 1,
    "price": 30.0,
    "duration": 45
  }
}
```

### Eliminar servicio

```json
{
  "name": "delete_service",
  "arguments": {
    "id": 1
  }
}
```

## Desarrollo

### Scripts disponibles

- `npm run dev` - Desarrollo con hot reload
- `npm run build` - Compilar TypeScript
- `npm start` - Ejecutar versión compilada
- `npm run lint` - Linting con ESLint
- `npm run format` - Formatear código con Prettier

### Estructura del proyecto

```
src/
├── index.ts          # Punto de entrada
├── server.ts         # Servidor MCP principal
├── database/         # Conexión a Supabase
│   ├── index.ts
│   └── supabase.ts
├── tools/            # Herramientas MCP
│   ├── index.ts
│   └── services.ts
├── schemas/          # Validación con Zod
│   ├── index.ts
│   └── service.ts
└── types/            # Definiciones TypeScript
    ├── index.ts
    └── service.ts
```

## Troubleshooting

### Error de conexión a Supabase

- Verifica que Supabase esté corriendo localmente
- Confirma las variables de entorno en `.env`
- Verifica que la tabla `services` exista

### Error de permisos

- Asegúrate de que la `ANON_KEY` tenga permisos suficientes
- Considera usar `SERVICE_ROLE_KEY` para operaciones administrativas

## Contribución

1. Fork el proyecto
2. Crea una rama para tu feature
3. Commit tus cambios
4. Push a la rama
5. Abre un Pull Request

## Licencia

MIT
