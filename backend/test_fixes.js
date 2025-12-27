
import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';
import path from 'path';

const API_URL = 'http://localhost:4000/api';
let TOKEN = '';

// Auth
async function login() {
    try {
        const res = await axios.post(`${API_URL}/auth/login`, {
            email: 'user@example.com',
            password: 'password123'
        });
        TOKEN = res.data.token;
        console.log('Login successful');
    } catch (err) {
        if (err.response?.status === 401) {
            // Try signup if login fails
            try {
                const res = await axios.post(`${API_URL}/auth/register`, {
                    email: 'user@example.com',
                    password: 'password123',
                    name: 'Test User',
                    businessName: 'Test Biz'
                });
                TOKEN = res.data.token;
                console.log('Signup successful');
            } catch (e) {
                console.error('Auth failed:', e.message);
                process.exit(1);
            }
        } else {
            console.error('Login error:', err.message);
            process.exit(1);
        }
    }
}

// 1. Test CSV Upload
async function testCSV() {
    console.log('\n--- Testing CSV Upload ---');
    const headers = { Authorization: `Bearer ${TOKEN}` };

    const csvContent = "date,quantity_sold,revenue\n2024-01-01,10,1000\n2024-01-02,20,2000";
    const filePath = 'test.csv';
    fs.writeFileSync(filePath, csvContent);

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));

    try {
        const res = await axios.post(`${API_URL}/sales-data/preview`, form, {
            headers: { ...headers, ...form.getHeaders() }
        });
        if (res.data.success) {
            console.log('✅ CSV Preview passed');
        } else {
            console.error('❌ CSV Preview failed:', res.data);
        }
    } catch (err) {
        console.error('❌ CSV Preview error:', err.response?.data || err.message);
    } finally {
        fs.unlinkSync(filePath);
    }
}

// 2. Test Promo
async function testPromo() {
    console.log('\n--- Testing Promo Simulation ---');
    const headers = { Authorization: `Bearer ${TOKEN}` };

    // Need a product first
    let productId;
    try {
        const prodRes = await axios.get(`${API_URL}/products`, { headers });
        if (prodRes.data.data.length > 0) {
            productId = prodRes.data.data[0].id;
        } else {
            // Create one
            const newProd = await axios.post(`${API_URL}/products`, {
                name: "Test Product",
                sku: "TEST-001",
                category: "Test",
                currentPrice: 100,
                costPrice: 50,
                stockQuantity: 100
            }, { headers });
            productId = newProd.data.data.id;
        }

        // Simulate
        const simRes = await axios.post(`${API_URL}/promo/simulate`, {
            productId,
            discountPercentage: 20,
            durationDays: 7
        }, { headers });

        if (simRes.data.success) {
            console.log('✅ Promo Simulation passed');
            console.log('Confidence:', simRes.data.data.predictions.confidence);
        } else {
            console.error('❌ Promo Simulation failed:', simRes.data);
        }

    } catch (err) {
        console.error('❌ Promo error:', err.response?.data || err.message);
    }
}

async function run() {
    await login();
    await testCSV();
    await testPromo();
}

run();
