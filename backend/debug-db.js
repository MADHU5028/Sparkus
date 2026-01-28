import { query } from './src/config/database.js';

async function checkData() {
    try {
        const users = await query('SELECT id, email FROM users');
        const sessions = await query('SELECT id, session_code, host_id FROM sessions');

        console.log(`Total Users: ${users.rows.length}`);
        users.rows.forEach(u => console.log(`User: ${u.id} - ${u.email}`));

        console.log(`Total Sessions: ${sessions.rows.length}`);
        sessions.rows.forEach(s => console.log(`Session: ${s.session_code} - Host: ${s.host_id}`));

    } catch (error) {
        console.error('Err:', error);
    } finally {
        process.exit();
    }
}

checkData();
