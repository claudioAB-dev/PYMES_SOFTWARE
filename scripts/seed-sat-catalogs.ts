import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/db/schema';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local or .env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
if (!process.env.DATABASE_URL) {
    dotenv.config({ path: path.resolve(process.cwd(), '.env') });
}

if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is required');
    process.exit(1);
}

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

async function seed() {
    console.log('🌱 Seeding SAT Catalogs...');

    try {
        console.log('Inserting sat_claves_prod_serv...');
        await db.insert(schema.satClavesProdServ).values([
            { id: '80111600', descripcion: 'Servicios de consultoría de gestión', palabrasSimilares: 'asesoría, consultoría, gestión' },
            { id: '43211500', descripcion: 'Computadoras', palabrasSimilares: 'pc, laptop, ordenador' },
            { id: '01010101', descripcion: 'No existe en el catálogo', palabrasSimilares: 'no existe, generico, general' },
            { id: '84111506', descripcion: 'Servicios de facturación', palabrasSimilares: 'facturación, contabilidad' },
            { id: '81111500', descripcion: 'Ingeniería de software o hardware', palabrasSimilares: 'desarrollo, programación' },
        ]).onConflictDoNothing(); // Prevent errors if run multiple times

        console.log('Inserting sat_claves_unidad...');
        await db.insert(schema.satClavesUnidad).values([
            { id: 'H87', nombre: 'Pieza' },
            { id: 'E48', nombre: 'Unidad de servicio' },
            { id: 'KGM', nombre: 'Kilogramo' },
            { id: 'MTR', nombre: 'Metro' },
            { id: 'DAY', nombre: 'Día' },
        ]).onConflictDoNothing();

        console.log('✅ Seeding completed successfully.');
    } catch (error) {
        console.error('❌ Error seeding SAT catalogs:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

seed();
