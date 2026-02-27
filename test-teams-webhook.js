#!/usr/bin/env node
require('dotenv').config();
const https = require('https');
const { URL } = require('url');

const webhookUrl = process.env.TEAMS_WEBHOOK_URL;

if (!webhookUrl) {
    console.error('❌ TEAMS_WEBHOOK_URL not found in .env file');
    process.exit(1);
}

const message = {
    text: '✅ Test notification from Azure DevOps MCP Server!',
    title: 'Webhook Test',
    themeColor: '0078D7'
};

console.log('📤 Sending test notification to Teams...');

const url = new URL(webhookUrl);
const options = {
    hostname: url.hostname,
    port: url.port || 443,
    path: url.pathname + url.search,
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    }
};

const req = https.request(options, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 202) {
            console.log('✅ Notification sent successfully!');
            console.log('Response:', data);
        } else {
            console.error('❌ Failed to send notification');
            console.error('Status:', res.statusCode);
            console.error('Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error sending notification:', error.message);
});

req.write(JSON.stringify(message));
req.end();
