import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs/promises';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database setup script
async function setupDatabase() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'sparkus',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD,
    });

    try {
        console.log('🗄️  Setting up Sparkus database...\n');

        // Read schema file
        const schemaPath = join(__dirname, '../models/schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf-8');

        // Execute schema
        await pool.query(schema);

        console.log('✅ Database schema created successfully!\n');
        console.log('Tables created:');
        console.log('  - users');
        console.log('  - sessions');
        console.log('  - participants');
        console.log('  - focus_events');
        console.log('  - warnings');
        console.log('  - recordings');
        console.log('  - ai_summaries');
        console.log('  - violations');
        console.log('\n✅ Database setup complete!');

        await pool.end();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database setup failed:', error);
        await pool.end();
        process.exit(1);
    }
}

setupDatabase();
