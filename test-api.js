// Test script for User API
// Run with: node test-api.js

const API_BASE_URL = 'http://localhost:5001/thaovystore/us-central1'; // Update with your local emulator URL

async function testAPI() {
    console.log('Testing User API...\n');

    try {
        // Test register
        console.log('1. Testing Register...');
        const registerResponse = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'test123',
                name: 'Test User'
            })
        });
        const registerData = await registerResponse.json();
        console.log('Register result:', registerData);

        // Test login
        console.log('\n2. Testing Login...');
        const loginResponse = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'test@example.com',
                password: 'test123'
            })
        });
        const loginData = await loginResponse.json();
        console.log('Login result:', loginData);

        if (loginData.token) {
            const token = loginData.token;

            // Test get user
            console.log('\n3. Testing Get User...');
            const userResponse = await fetch(`${API_BASE_URL}/getUser`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const userData = await userResponse.json();
            console.log('Get user result:', userData);

            // Test logout
            console.log('\n4. Testing Logout...');
            const logoutResponse = await fetch(`${API_BASE_URL}/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const logoutData = await logoutResponse.json();
            console.log('Logout result:', logoutData);
        }

        // Test demo credentials
        console.log('\n5. Testing Demo Credentials...');
        const demoResponse = await fetch(`${API_BASE_URL}/getDemoCredentials`);
        const demoData = await demoResponse.json();
        console.log('Demo credentials:', demoData);

        // Test demo login
        console.log('\n6. Testing Demo Login...');
        const demoLoginResponse = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: demoData.email,
                password: demoData.password
            })
        });
        const demoLoginData = await demoLoginResponse.json();
        console.log('Demo login result:', demoLoginData);

    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run test
testAPI();