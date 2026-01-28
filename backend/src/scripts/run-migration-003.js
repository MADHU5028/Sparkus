import { query } from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
    try {
        const migrationPath = path.join(__dirname, '../models/migration_003_ai_summaries.sql');
        const migrationSql = fs.readFileSync(migrationPath, 'utf8');

        console.log('Running migration_003_ai_summaries...');
        await query(migrationSql);
        console.log('✅ Migration completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    }
}

runMigration();
