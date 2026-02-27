#!/usr/bin/env node
require('dotenv').config();
const https = require('https');
const { URL } = require('url');

// Configuration từ .env
const config = {
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    chatId: process.env.TEAMS_CHAT_ID
};

// Validate configuration
function validateConfig() {
    const missing = [];
    if (!config.tenantId) missing.push('AZURE_TENANT_ID');
    if (!config.clientId) missing.push('AZURE_CLIENT_ID');
    if (!config.clientSecret) missing.push('AZURE_CLIENT_SECRET');
    if (!config.chatId) missing.push('TEAMS_CHAT_ID');
    
    if (missing.length > 0) {
        console.error('❌ Missing configuration in .env file:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\n📖 See TEAMS_GRAPH_API_SETUP.md for setup instructions');
        process.exit(1);
    }
}

// Get access token from Microsoft identity platform
async function getAccessToken() {
    return new Promise((resolve, reject) => {
        const tokenUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`;
        const url = new URL(tokenUrl);
        
        const postData = new URLSearchParams({
            client_id: config.clientId,
            client_secret: config.clientSecret,
            scope: 'https://graph.microsoft.com/.default',
            grant_type: 'client_credentials'
        }).toString();
        
        const options = {
            hostname: url.hostname,
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': postData.length
            }
        };
        
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    const response = JSON.parse(data);
                    resolve(response.access_token);
                } else {
                    reject(new Error(`Failed to get token: ${res.statusCode} - ${data}`));
                }
            });
        });
        
        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Send message to Teams chat
async function sendTeamsMessage(message) {
    return new Promise((resolve, reject) => {
        getAccessToken().then(accessToken => {
            const graphUrl = `https://graph.microsoft.com/v1.0/chats/${config.chatId}/messages`;
            const url = new URL(graphUrl);
            
            const messageBody = JSON.stringify({
                body: {
                    contentType: 'text',
                    content: message
                }
            });
            
            const options = {
                hostname: url.hostname,
                path: url.pathname,
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                    'Content-Length': messageBody.length
                }
            };
            
            const req = https.request(options, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 201) {
                        console.log('✅ Message sent successfully to Teams chat!');
                        resolve(JSON.parse(data));
                    } else {
                        console.error('❌ Failed to send message');
                        console.error('Status:', res.statusCode);
                        console.error('Response:', data);
                        reject(new Error(`Failed to send: ${res.statusCode}`));
                    }
                });
            });
            
            req.on('error', reject);
            req.write(messageBody);
            req.end();
        }).catch(reject);
    });
}

// Main
async function main() {
    console.log('🚀 Sending notification to Teams via Graph API...\n');
    
    validateConfig();
    
    const message = process.argv[2] || '✅ Test notification from Azure DevOps MCP Server!';
    
    try {
        await sendTeamsMessage(message);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = { sendTeamsMessage };
