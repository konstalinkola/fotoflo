#!/usr/bin/env node

/**
 * Fotoflo Auto Upload API Test Script
 * 
 * This script tests the auto upload API endpoints to ensure they work correctly.
 * Run with: node test_auto_upload.js
 */

const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_PROJECT_ID = 'test-project-id'; // Replace with actual project ID
const TEST_USER_TOKEN = 'test-token'; // Replace with actual user token

// Test results tracking
const testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

// Helper function to make API requests
async function makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${TEST_USER_TOKEN}`
        }
    };
    
    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        const response = await fetch(url, finalOptions);
        const data = await response.json();
        return { response, data };
    } catch (error) {
        return { error: error.message };
    }
}

// Test functions
async function testConfigAPI() {
    console.log('🧪 Testing Configuration API...');
    
    // Test GET config
    const { response: getResponse, data: getData } = await makeRequest(`/api/auto-upload/config?projectId=${TEST_PROJECT_ID}`);
    
    if (getResponse && getResponse.ok) {
        console.log('✅ GET /api/auto-upload/config - PASSED');
        testResults.passed++;
    } else {
        console.log('❌ GET /api/auto-upload/config - FAILED');
        testResults.failed++;
    }
    
    // Test POST config
    const testConfig = {
        project_id: TEST_PROJECT_ID,
        auto_organize: true,
        duplicate_detection: true,
        max_file_size: 10485760,
        allowed_formats: ["image/jpeg", "image/png", "image/webp"],
        auto_collection_creation: true,
        collection_naming_pattern: "Test Upload {date}",
        background_processing: true
    };
    
    const { response: postResponse, data: postData } = await makeRequest(`/api/auto-upload/config`, {
        method: 'POST',
        body: JSON.stringify(testConfig)
    });
    
    if (postResponse && postResponse.ok) {
        console.log('✅ POST /api/auto-upload/config - PASSED');
        testResults.passed++;
    } else {
        console.log('❌ POST /api/auto-upload/config - FAILED');
        testResults.failed++;
    }
}

async function testStatusAPI() {
    console.log('🧪 Testing Status API...');
    
    const { response, data } = await makeRequest(`/api/auto-upload/status?projectId=${TEST_PROJECT_ID}`);
    
    if (response && response.ok) {
        console.log('✅ GET /api/auto-upload/status - PASSED');
        testResults.passed++;
    } else {
        console.log('❌ GET /api/auto-upload/status - FAILED');
        testResults.failed++;
    }
}

async function testWebhookAPI() {
    console.log('🧪 Testing Webhook API...');
    
    // Test GET webhook verification
    const { response: getResponse, data: getData } = await makeRequest(`/api/auto-upload/webhook?project_id=${TEST_PROJECT_ID}`, {
        headers: {
            'x-webhook-secret': 'test-secret'
        }
    });
    
    if (getResponse && getResponse.ok) {
        console.log('✅ GET /api/auto-upload/webhook - PASSED');
        testResults.passed++;
    } else {
        console.log('❌ GET /api/auto-upload/webhook - FAILED');
        testResults.failed++;
    }
    
    // Test POST webhook
    const webhookPayload = {
        project_id: TEST_PROJECT_ID,
        files: [
            {
                name: "test-image.jpg",
                url: "https://via.placeholder.com/300x200/0000FF/FFFFFF?text=Test",
                size: 1024,
                type: "image/jpeg",
                metadata: { source: "test" }
            }
        ],
        source: "test_script",
        timestamp: new Date().toISOString()
    };
    
    const { response: postResponse, data: postData } = await makeRequest('/api/auto-upload/webhook', {
        method: 'POST',
        headers: {
            'x-webhook-secret': 'test-secret'
        },
        body: JSON.stringify(webhookPayload)
    });
    
    if (postResponse && postResponse.ok) {
        console.log('✅ POST /api/auto-upload/webhook - PASSED');
        testResults.passed++;
    } else {
        console.log('❌ POST /api/auto-upload/webhook - FAILED');
        testResults.failed++;
    }
}

async function testBatchAPI() {
    console.log('🧪 Testing Batch API...');
    
    // Test GET batch history
    const { response: getResponse, data: getData } = await makeRequest(`/api/auto-upload/batch?projectId=${TEST_PROJECT_ID}`);
    
    if (getResponse && getResponse.ok) {
        console.log('✅ GET /api/auto-upload/batch - PASSED');
        testResults.passed++;
    } else {
        console.log('❌ GET /api/auto-upload/batch - FAILED');
        testResults.failed++;
    }
    
    // Note: POST batch test would require actual file upload, which is complex in a script
    // This would typically be tested with a proper test framework or manual testing
    console.log('⚠️  POST /api/auto-upload/batch - SKIPPED (requires file upload)');
}

async function testDatabaseSchema() {
    console.log('🧪 Testing Database Schema...');
    
    // This would typically involve direct database queries
    // For now, we'll just check if the API endpoints respond correctly
    console.log('⚠️  Database schema test - SKIPPED (requires database access)');
}

// Main test runner
async function runTests() {
    console.log('🚀 Starting Fotoflo Auto Upload API Tests\n');
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`Test Project ID: ${TEST_PROJECT_ID}\n`);
    
    try {
        await testConfigAPI();
        console.log('');
        
        await testStatusAPI();
        console.log('');
        
        await testWebhookAPI();
        console.log('');
        
        await testBatchAPI();
        console.log('');
        
        await testDatabaseSchema();
        console.log('');
        
    } catch (error) {
        console.error('❌ Test runner error:', error);
        testResults.failed++;
    }
    
    // Print results
    console.log('📊 Test Results:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📈 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    if (testResults.failed > 0) {
        console.log('\n⚠️  Some tests failed. Please check the API implementation and database setup.');
        process.exit(1);
    } else {
        console.log('\n🎉 All tests passed! Auto Upload API is working correctly.');
        process.exit(0);
    }
}

// Check if fetch is available (Node.js 18+)
if (typeof fetch === 'undefined') {
    console.log('❌ This script requires Node.js 18+ or a fetch polyfill');
    console.log('💡 Install node-fetch: npm install node-fetch');
    process.exit(1);
}

// Run tests
runTests().catch(error => {
    console.error('💥 Test runner crashed:', error);
    process.exit(1);
});
