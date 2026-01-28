// Quick test script to create a Sparkus session
// Run with: node test-session.js

const API_URL = 'http://localhost:5000/api';

async function createTestSession() {
    try {
        console.log('🔐 Step 1: Creating host account...');

        // Create host account
        const signupResponse = await fetch(`${API_URL}/auth/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'teacher@test.com',
                password: 'test123',
                fullName: 'Test Teacher'
            })
        });

        let token;
        if (signupResponse.status === 409) {
            console.log('   Account already exists, logging in...');

            // Login instead
            const loginResponse = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: 'teacher@test.com',
                    password: 'test123'
                })
            });

            const loginData = await loginResponse.json();
            token = loginData.token;
            console.log('   ✅ Logged in successfully');
        } else {
            const signupData = await signupResponse.json();
            token = signupData.token;
            console.log('   ✅ Account created successfully');
        }

        console.log('\n📝 Step 2: Creating test session...');

        // Create session
        const sessionResponse = await fetch(`${API_URL}/sessions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                sessionName: 'Test Class - Data Structures',
                platform: 'google_meet',
                focusTrackingEnabled: true,
                aiRecordingEnabled: false,
                examMonitoringEnabled: false,
                focusThreshold: 70,
                focusUpdateInterval: 5,
                warningLimit: 3,
                allowedWebsites: [],
                tabSwitchingAllowed: false,
                splitScreenDuration: 0
            })
        });

        const sessionData = await sessionResponse.json();
        const sessionId = sessionData.session.id;
        const sessionCode = sessionData.session.sessionCode;

        console.log('   ✅ Session created successfully');
        console.log(`   Session ID: ${sessionId}`);
        console.log(`   Session Code: ${sessionCode}`);

        console.log('\n🚀 Step 3: Starting session...');

        // Start session
        const startResponse = await fetch(`${API_URL}/sessions/${sessionId}/start`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        await startResponse.json();
        console.log('   ✅ Session started');

        console.log('\n' + '='.repeat(60));
        console.log('🎉 TEST SESSION READY!');
        console.log('='.repeat(60));
        console.log('\n📋 INSTRUCTIONS FOR TESTING:\n');
        console.log('1. Open Google Meet (any meeting): https://meet.google.com/new');
        console.log('2. The Sparkus extension will detect the meeting');
        console.log('3. Click "Join Session" when prompted');
        console.log(`4. Enter this session code: ${sessionCode}`);
        console.log('5. Enter your name and roll number');
        console.log('6. Grant camera permission');
        console.log('7. Watch the floating widget track your focus!\n');
        console.log('='.repeat(60));
        console.log('\n💡 TIP: Try these actions to test focus tracking:');
        console.log('   - Switch to another tab (focus drops 5%)');
        console.log('   - Minimize the window (focus drops 5%)');
        console.log('   - Return to the meeting (focus slowly recovers)');
        console.log('   - You\'ll get warnings before major penalties\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

createTestSession();
