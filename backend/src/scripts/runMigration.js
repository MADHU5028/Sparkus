import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Run migration script
async function runMigration() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'sparkus',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
    });

    try {
        console.log('🔄 Running database migration...\n');

        // Read migration file
        const migrationPath = join(__dirname, '../models/migration_001_time_based_penalties.sql');
        const migration = await fs.readFile(migrationPath, 'utf-8');

        // Execute migration
        await pool.query(migration);

        console.log('✅ Migration completed successfully!\n');
        console.log('Added:');
        console.log('  - mode column to sessions');
        console.log('  - settings JSONB column');
        console.log('  - penalty configuration columns');
        console.log('  - network_logs table');
        console.log('  - warnings_count, violations_count to participants');
        console.log('  - duration, penalty_applied to focus_events');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Migration failed:', error);
        await pool.end();
        process.exit(1);
    }
}

runMigration();
