#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cacheFile = path.join(__dirname, 'cache', 'work-items.json');

async function sendTeamsNotification(tickets) {
  const webhookUrl = process.env.TEAMS_WEBHOOK_URL;
  
  if (!webhookUrl) {
    console.error('TEAMS_WEBHOOK_URL not found in .env file');
    process.exit(1);
  }

  // Create adaptive card for Teams
  const card = {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    "summary": `${tickets.length} tickets missing commits`,
    "themeColor": "FF0000",
    "title": "⚠️ Azure DevOps Alert: Tickets Missing Commits",
    "sections": [
      {
        "activityTitle": `Found ${tickets.length} ticket(s) in testing states without commits/branches`,
        "activitySubtitle": "States: In ACC, UAT Approved, Testing in INTG, Ready for Testing",
        "facts": tickets.map(ticket => ({
          "name": `#${ticket.id} - ${ticket.state}`,
          "value": `${ticket.title} (${ticket.assignedTo || 'Unassigned'})`
        }))
      }
    ],
    "potentialAction": tickets.map(ticket => ({
      "@type": "OpenUri",
      "name": `View #${ticket.id}`,
      "targets": [
        {
          "os": "default",
          "uri": `${process.env.AZURE_DEVOPS_ORG_URL}/${process.env.AZURE_DEVOPS_PROJECT}/_workitems/edit/${ticket.id}`
        }
      ]
    }))
  };

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(card)
    });

    if (response.ok) {
      console.log('✓ Teams notification sent successfully!');
    } else {
      const text = await response.text();
      console.error('✗ Failed to send Teams notification:', response.status, text);
    }
  } catch (error) {
    console.error('✗ Error sending Teams notification:', error.message);
  }
}

function loadCache() {
  if (!fs.existsSync(cacheFile)) {
    console.error('Cache file not found. Run "npm run refresh" first.');
    process.exit(1);
  }
  
  const data = fs.readFileSync(cacheFile, 'utf8');
  return JSON.parse(data);
}

async function main() {
  console.log('Checking for tickets without commits...\n');
  
  const cache = loadCache();
  const targetStates = ['in acc', 'uat approved', 'testing in intg', 'ready for testing'];
  
  const ticketsWithoutCommits = cache.workItems.filter(wi => {
    const stateMatch = targetStates.some(s => wi.state.toLowerCase() === s);
    const noCommits = !wi.development?.hasCommits;
    const noBranches = !wi.development?.hasBranches;
    return stateMatch && (noCommits && noBranches);
  });

  if (ticketsWithoutCommits.length === 0) {
    console.log('✓ No tickets found without commits/branches in testing states');
    console.log('No notification sent.');
    return;
  }

  console.log(`Found ${ticketsWithoutCommits.length} ticket(s) without commits/branches:\n`);
  ticketsWithoutCommits.forEach(ticket => {
    console.log(`  #${ticket.id} - ${ticket.title}`);
    console.log(`    State: ${ticket.state}`);
    console.log(`    Assigned: ${ticket.assignedTo || 'Unassigned'}`);
    console.log('');
  });

  console.log('Sending notification to Microsoft Teams...\n');
  await sendTeamsNotification(ticketsWithoutCommits);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
