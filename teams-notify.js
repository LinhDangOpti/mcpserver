#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Teams Notification Script
 * Checks for tickets missing development artifacts and sends alerts to Microsoft Teams
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_FILE = path.join(__dirname, 'cache', 'work-items.json');
const WEBHOOK_URL = process.env.TEAMS_WEBHOOK_URL;

// Testing states to monitor
const TESTING_STATES = ['in acc', 'uat approved', 'testing in intg', 'ready for testing'];

/**
 * Read and parse the cache file
 */
function readCache() {
  if (!fs.existsSync(CACHE_FILE)) {
    console.error('❌ Cache file not found. Run npm run refresh first.');
    process.exit(1);
  }

  const data = fs.readFileSync(CACHE_FILE, 'utf8');
  return JSON.parse(data);
}

/**
 * Find tickets in testing states that are missing development artifacts
 */
function findTicketsMissingDevelopment(cache) {
  return cache.workItems.filter(wi => {
    const stateMatch = TESTING_STATES.some(s => wi.state.toLowerCase() === s);
    const noPRs = !wi.development?.hasPullRequests;
    const noCommits = !wi.development?.hasCommits;
    const noBranches = !wi.development?.hasBranches;
    
    // Flag if missing ALL THREE development artifacts
    return stateMatch && (noPRs && noCommits && noBranches);
  });
}

/**
 * Format Teams message for Power Automate
 */
function createTeamsMessage(tickets, cache) {
  if (tickets.length === 0) {
    return {
      title: "✅ Azure DevOps Status",
      text: `All tickets in testing have development artifacts (PRs/commits/branches).\n\nSprint: ${cache.sprintName || 'Sprint 155'}\nLast Updated: ${new Date(cache.lastUpdated).toLocaleString()}\nTotal Work Items: ${cache.workItems.length}`,
      tickets: []
    };
  }

  // Format ticket details for Power Automate
  const ticketDetails = tickets.map(ticket => ({
    id: ticket.id,
    title: ticket.title,
    state: ticket.state,
    assignedTo: ticket.assignedTo?.displayName || "Unassigned",
    url: `https://ericsson-web.visualstudio.com/ericssondotcom-vnext/_workitems/edit/${ticket.id}`
  }));

  const ticketList = tickets.map((t, i) => 
    `${i + 1}. #${t.id} - ${t.title}\n   State: ${t.state} | Assigned: ${t.assignedTo?.displayName || 'Unassigned'}`
  ).join('\n\n');

  return {
    title: "⚠️ Azure DevOps Alert",
    text: `Found ${tickets.length} ticket${tickets.length > 1 ? 's' : ''} in testing without development artifacts:\n\n${ticketList}\n\nSprint: ${cache.sprintName || 'Sprint 155'}\nLast Updated: ${new Date(cache.lastUpdated).toLocaleString()}`,
    tickets: ticketDetails
  };
}

/**
 * Send message to Teams webhook (Power Automate)
 */
async function sendToTeams(message) {
  if (!WEBHOOK_URL || WEBHOOK_URL === 'paste_your_webhook_url_here') {
    console.error('❌ Teams webhook URL not configured in .env file');
    console.log('   Set TEAMS_WEBHOOK_URL in .env file');
    process.exit(1);
  }

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });

    const responseText = await response.text();
    
    if (response.ok || response.status === 202) {
      console.log('✅ Notification sent to Teams successfully');
      if (responseText) {
        console.log('Response:', responseText);
      }
    } else {
      console.error('❌ Failed to send to Teams:', response.status);
      console.error('Response:', responseText);
      console.log('\n💡 Tip: Your Power Automate flow might need to accept specific fields.');
      console.log('   Check the flow inputs in Power Automate and ensure it matches the payload.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error sending to Teams:', error.message);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Checking Azure DevOps tickets...\n');

  // Read cache
  const cache = readCache();
  console.log(`📦 Loaded ${cache.workItems.length} work items from cache`);

  // Find tickets missing development
  const tickets = findTicketsMissingDevelopment(cache);
  console.log(`⚠️  Found ${tickets.length} ticket(s) missing all development artifacts\n`);

  if (tickets.length > 0) {
    tickets.forEach(ticket => {
      console.log(`   - #${ticket.id}: ${ticket.title}`);
      console.log(`     State: ${ticket.state} | Assigned: ${ticket.assignedTo?.displayName || 'Unassigned'}`);
    });
    console.log();
  }

  // Create and send Teams message
  const message = createTeamsMessage(tickets, cache);
  await sendToTeams(message);
}

// Run
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
