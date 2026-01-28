// Get active session codes
const API_URL = 'http://localhost:5000/api';

async function getSessionCodes() {
    try {
        // Login
        const loginResponse = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'teacher@test.com',
                password: 'test123'
            })
        });

        const loginData = await loginResponse.json();
        const token = loginData.token;
        const userId = loginData.user.id;

        // Get sessions
        const sessionsResponse = await fetch(`${API_URL}/sessions/host/${userId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const sessionsData = await sessionsResponse.json();

        console.log('\n📋 ACTIVE SESSIONS:\n');
        console.log('='.repeat(60));

        sessionsData.sessions.forEach((session, index) => {
            console.log(`\n${index + 1}. ${session.sessionName}`);
            console.log(`   Code: ${session.sessionCode}`);
            console.log(`   Status: ${session.status}`);
            console.log(`   ID: ${session.id}`);
        });

        console.log('\n' + '='.repeat(60));

        if (sessionsData.sessions.length > 0) {
            const activeSession = sessionsData.sessions.find(s => s.status === 'active') || sessionsData.sessions[0];
            console.log(`\n✅ USE THIS CODE: ${activeSession.sessionCode}\n`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    }
}

getSessionCodes();
