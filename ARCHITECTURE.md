# Axioma - Documentación Técnica y Arquitectura

Bienvenido a la documentación técnica central de **Axioma**, nuestro sistema ERP multi-tenant SaaS. Este documento tiene como objetivo proporcionar una visión integral de la arquitectura del sistema, facilitar el onboarding de nuevos desarrolladores y establecer los estándares técnicos del proyecto.

---

## 1. Resumen Ejecutivo

**Axioma** es un sistema Planificador de Recursos Empresariales (ERP) diseñado de manera nativa para la nube (SaaS), enfocado en la optimización de las operaciones administrativas, financieras y comerciales de las pequeñas y medianas empresas (PyMEs) en México. 

### Propuesta de Valor
* **Centralización:** Unifica control de inventarios, finanzas, ventas y recursos humanos en una sola plataforma.
* **Localización Mexicana:** Integración nativa para la facturación electrónica (CFDI 4.0 del SAT), cálculo de impuestos locales (IVA, ISR) y nómina bajo la ley federal del trabajo.
* **Escalabilidad y Seguridad:** Arquitectura multi-tenant con aislamiento de datos estricto a nivel de base de datos para garantizar la privacidad de la información de cada cliente.

---

## 2. Arquitectura Multi-tenant

El núcleo de Axioma es su arquitectura **Multi-tenant**, donde una misma instancia de la aplicación sirve a múltiples clientes (inquilinos/tenants), pero garantizando que cada cliente solo pueda acceder a su propia información.

Axioma utiliza un modelo de **Base de Datos Compartida / Esquema Compartido (Shared DB / Shared Schema)** debido a su rentabilidad y facilidad de mantenimiento. El aislamiento se logra a través de las Políticas de Seguridad a Nivel de Fila (**RLS - Row Level Security**) de Supabase (PostgreSQL).

### Funcionamiento del Aislamiento (RLS)
Todas las tablas que contienen datos específicos de un cliente incluyen una columna `tenant_id`. Para evitar vulnerabilidades a nivel de aplicación, la verificación del inquilino recae sobre la base de datos a través de políticas de PostgreSQL, inyectando el contexto del usuario autenticado en la sesión de la base de datos.

**Ejemplo de política RLS en Supabase (PostgreSQL):**

```sql
-- Habilitar RLS en una tabla de ejemplo
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento de datos obligatoria
CREATE POLICY "Aislamiento estricto por Tenant" ON invoices
  FOR ALL
  TO authenticated
  USING (
    tenant_id = (SELECT auth.jwt() ->> 'app_metadata' ->> 'tenant_id')::uuid
  );
```

En Next.js, al crear el cliente de servidor de Supabase, el token JWT del usuario se encarga de propagar su `tenant_id` hacia la base de datos, garantizando que ninguna consulta devuelva datos de otro cliente.

---

## 3. Estructura de Base de Datos y ORM

Para la definición programática de esquemas, migraciones y ejecución de consultas tipadas de extremo a extremo, utilizamos **Drizzle ORM** conectado a nuestra instancia de PostgreSQL en Supabase.

### Diseño de Entidades Principales
Los esquemas se organizan lógicamente para separar los datos globales (como la tabla de tenants) de los recursos aislados (productos, clientes, facturas, etc.).

**Ejemplo de esquema en Drizzle ORM (`src/db/schema.ts`):**

```typescript
import { pgTable, uuid, varchar, numeric, timestamp } from "drizzle-orm/pg-core";

// Entidad Global: El Inquilino o Empresa cliente
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  rfc: varchar("rfc", { length: 13 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Entidad Aislada: Productos (Requiere tenant_id)
export const products = pgTable("products", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id").references(() => tenants.id).notNull(),
  sku: varchar("sku", { length: 64 }).notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  price: numeric("price", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

El ORM asegura el tipo de dato tanto en las migraciones como cuando realizamos el *fetching* desde nuestros *Server Components* en Next.js.

---

## 4. Arquitectura del Frontend

El frontend está construido sobre el ecosistema de React usando **Next.js (App Router)** para beneficiarnos de las optimizaciones híbridas, la mejor postura de SEO para nuestros landing pages orientados a B2B, y la seguridad al manejar datos de backend en el servidor.

### Estructura de Directorios

La organización del proyecto prioriza la escalabilidad y una clara separación de responsabilidades:

```text
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (marketing)/        # Landing pages y secciones públicas B2B
│   │   ├── (auth)/             # Flujos de inicio de sesión y registro
│   │   ├── (dashboard)/        # Aplicación ERP post-login
│   │   │   ├── [tenantId]/     # Rutas dinámicas con contexto del Inquilino
│   │   │   │   ├── inventario/
│   │   │   │   ├── finanzas/
│   │   │   │   └── cfdi/
│   │   └── api/                # Route Handlers (Webhooks, integraciones externas)
│   ├── components/
│   │   ├── ui/                 # Componentes genéricos y de diseño (ej. shadcn/ui)
│   │   ├── layout/             # Componentes estructurales (Sidebar, Navbar)
│   │   └── features/           # Componentes específicos por dominio de negocio
│   ├── lib/                    # Utilidades puras, formatters, constantes
│   ├── server/                 # Infraestructura de Backend en Next.js
│   │   ├── db/                 # Conexión principal de Drizzle ORM
│   │   └── supabase/           # Clientes para browser, server y middleware
│   └── types/                  # Definiciones de tipos y esquemas de validación (Zod)
```

### Flujo de Datos
1. **Server Components (Por defecto):** Utilizados para interactuar con Drizzle ORM y Supabase de manera directa y segura. No exponemos las reglas de negocio al cliente.
2. **Client Components (Interactividad):** Se limitan a las partes de la UI que requieren interacción (formularios de creación de facturas, tablas dinámicas). Las mutaciones las gestionamos delegando a **Server Actions** de Next.js.
3. **Manejo de Estado Global:** Mínimo vital con `Zustand` o *React Context* solo para información persistente del cliente (estado de la barra lateral, tema oscuro/claro, tenant activo).

---

## 5. Guía de Configuración Local

Para empezar a desarrollar e iterar sobre Axioma de forma local, sigue estos pasos:

### 5.1. Clonar e Instalar
```bash
git clone https://github.com/tu-organizacion/axioma-erp.git
cd axioma-erp
# Instalar dependencias con pnpm (recomendado)
pnpm install
```

### 5.2. Variables de Entorno
Copia el archivo de ejemplo para generar tus credenciales locales:
```bash
cp .env.example .env.local
```
Completa las variables de Supabase locales, Drizzle URL de base de datos y la llave secreta.

### 5.3. Levantar la Infraestructura Local de Supabase
Asegúrate de tener instalado el CLI de Supabase y Docker.
```bash
supabase start
```
*Este comando levantará una instancia local de PostgreSQL, la capa de autenticación y el estudio.*

### 5.4. Migraciones de Base de Datos
Sincroniza el esquema local de Drizzle a tu instancia de Postgres:
```bash
pnpm db:push
```

### 5.5. Iniciar el Entorno de Desarrollo
Levanta Next.js:
```bash
pnpm dev
```
Accede a la aplicación en `http://localhost:3000`.

---

## 6. Scripts y Comandos

A continuación, la lista de los comandos (definidos en `package.json`) esenciales en tu ciclo de trabajo:

| Comando | Descripción |
| :--- | :--- |
| `pnpm dev` | Inicia el servidor de desarrollo de Next.js con soporte Hot-Reload. |
| `pnpm build` | Compila la aplicación para el despliegue en producción. |
| `pnpm start` | Ejecuta la aplicación compilada (modo producción local). |
| `pnpm lint` | Ejecuta ESLint sobre el código para validar reglas de estilo. |
| `pnpm db:generate` | Analiza `schema.ts` y genera los archivos `.sql` de migración. |
| `pnpm db:push` | Empuja el esquema directo a la DB de desarrollo sin guardar tracking local. Útil en fases tempranas. |
| `pnpm db:migrate` | Ejecuta las migraciones guardadas contra la base de datos configurada. |
| `pnpm db:studio` | Abre el estudio local de Drizzle para visualizar e interactuar visualmente con tus datos (Drizzle Studio). |
