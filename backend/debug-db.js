import { query } from './src/config/database.js';

async function checkData() {
    try {
        const users = await query('SELECT id, email, full_name FROM users');
        const sessions = await query('SELECT id, session_code, session_name, host_id, status, created_at FROM sessions ORDER BY created_at DESC');

        const fs = await import('fs');

        const output = {
            users: users.rows,
            sessions: sessions.rows
        };

        fs.writeFileSync('debug_output.json', JSON.stringify(output, null, 2));
        console.log('Data written to debug_output.json');

    } catch (error) {
        console.error('Err:', error);
    } finally {
        process.exit();
    }
}

checkData();
