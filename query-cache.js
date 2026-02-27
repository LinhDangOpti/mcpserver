#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cacheFile = path.join(__dirname, 'cache', 'work-items.json');

function cleanHtml(text) {
  if (!text) return '';
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .trim();
}

function loadCache() {
  if (!fs.existsSync(cacheFile)) {
    console.error('Cache file not found. Run "node refresh-cache.js" first.');
    process.exit(1);
  }
  
  const data = fs.readFileSync(cacheFile, 'utf8');
  return JSON.parse(data);
}

function formatItem(item, detailed = false) {
  console.log('\n' + '='.repeat(80));
  console.log(`[${item.id}] ${item.title}`);
  console.log('='.repeat(80));
  console.log(`Type: ${item.type}`);
  console.log(`State: ${item.state}`);
  console.log(`Assigned: ${item.assignedTo || 'Unassigned'}`);
  
  if (detailed) {
    if (item.reproSteps) {
      console.log('\nRepro Steps:');
      console.log(cleanHtml(item.reproSteps));
    }
    
    if (item.comments && item.comments.length > 0) {
      console.log('\nComments:');
      console.log('-'.repeat(80));
      item.comments.forEach((c, i) => {
        console.log(`\n[${i + 1}] ${c.author} - ${new Date(c.date).toLocaleString()}`);
        console.log(cleanHtml(c.text));
      });
    }
  }
  
  console.log('\n' + '='.repeat(80));
}

const command = process.argv[2];
const arg1 = process.argv[3];

try {
  const cache = loadCache();
  const cacheAge = Math.round((Date.now() - new Date(cache.lastUpdated).getTime()) / 1000 / 60);
  
  switch (command) {
    case 'list':
      console.log(`\nCache last updated: ${cache.lastUpdated} (${cacheAge} minutes ago)`);
      if (cache.sprint) {
        console.log(`Sprint: ${cache.sprint.name}`);
      }
      console.log(`\nFound ${cache.workItems.length} work items:\n`);
      
      cache.workItems.forEach((item, i) => {
        console.log(`${i + 1}. [${item.id}] ${item.title}`);
        console.log(`   State: ${item.state}, Type: ${item.type}`);
      });
      break;
      
    case 'item':
      if (!arg1) {
        console.error('Usage: node query-cache.js item <id>');
        process.exit(1);
      }
      
      const id = parseInt(arg1);
      const item = cache.workItems.find(wi => wi.id === id);
      
      if (!item) {
        console.error(`Work item ${id} not found in cache.`);
        console.log('Run "node refresh-cache.js" to update the cache.');
        process.exit(1);
      }
      
      formatItem(item, true);
      break;
      
    case 'by-state':
      if (!arg1) {
        console.error('Usage: node query-cache.js by-state <state>');
        process.exit(1);
      }
      
      const items = cache.workItems.filter(wi => 
        wi.state.toLowerCase() === arg1.toLowerCase()
      );
      
      console.log(`\nFound ${items.length} items with state "${arg1}":\n`);
      items.forEach((item, i) => {
        console.log(`${i + 1}. [${item.id}] ${item.title}`);
        console.log(`   Type: ${item.type}, Assigned: ${item.assignedTo || 'Unassigned'}`);
      });
      break;
      
    case 'info':
      console.log(`\nCache Information:`);
      console.log(`  Last updated: ${cache.lastUpdated}`);
      console.log(`  Cache age: ${cacheAge} minutes`);
      console.log(`  Sprint: ${cache.sprint.name}`);
      console.log(`  Sprint dates: ${cache.sprint.startDate} - ${cache.sprint.finishDate}`);
      console.log(`  User: ${cache.userEmail}`);
      console.log(`  Work items: ${cache.workItems.length}`);
      
      const byState = cache.workItems.reduce((acc, item) => {
        acc[item.state] = (acc[item.state] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`\n  By state:`);
      Object.entries(byState).forEach(([state, count]) => {
        console.log(`    ${state}: ${count}`);
      });
      break;
      
    case 'query':
      const query = process.argv.slice(3).join(' ').toLowerCase();
      
      if (!query) {
        console.error('Usage: node query-cache.js query <your query>');
        console.log('Examples:');
        console.log('  node query-cache.js query tickets without commits in testing states');
        console.log('  node query-cache.js query summarize ticket 13301');
        process.exit(1);
      }
      
      // Summarize ticket - optimized with comprehensive summary
      if (query.includes('summarize ticket') || query.includes('summary ticket')) {
        const match = query.match(/\d+/);
        if (match) {
          const ticketId = parseInt(match[0]);
          const ticket = cache.workItems.find(wi => wi.id === ticketId);
          if (ticket) {
            console.log('\n' + '='.repeat(80));
            console.log(`TICKET SUMMARY: #${ticket.id}`);
            console.log('='.repeat(80));
            console.log(`Title: ${ticket.title}`);
            console.log(`Type: ${ticket.type}`);
            console.log(`State: ${ticket.state}`);
            console.log(`Assigned: ${ticket.assignedTo || 'Unassigned'}`);
            console.log(`Tags: ${ticket.tags || 'none'}`);
            console.log(`Created: ${new Date(ticket.createdDate).toLocaleString()}`);
            console.log(`Last Updated: ${new Date(ticket.changedDate).toLocaleString()}`);
            
            const desc = cleanHtml(ticket.description);
            console.log(`\nDescription:`);
            console.log(desc.length > 600 ? desc.substring(0, 600) + '...' : desc);
            
            if (ticket.reproSteps) {
              const steps = cleanHtml(ticket.reproSteps);
              console.log(`\nRepro Steps:`);
              console.log(steps.length > 400 ? steps.substring(0, 400) + '...' : steps);
            }
            
            console.log(`\nDevelopment Status:`);
            console.log(`  ✓ Pull Requests: ${ticket.development?.hasPullRequests ? 'Yes (' + (ticket.development?.pullRequests?.length || 0) + ')' : 'No'}`);
            console.log(`  ✓ Commits: ${ticket.development?.hasCommits ? 'Yes (' + (ticket.development?.commits?.length || 0) + ')' : 'No'}`);
            console.log(`  ✓ Branches: ${ticket.development?.hasBranches ? 'Yes (' + (ticket.development?.branches?.length || 0) + ')' : 'No'}`);
            
            if (ticket.comments && ticket.comments.length > 0) {
              console.log(`\nComments (${ticket.comments.length} total):`);
              console.log('-'.repeat(80));
              const recentComments = ticket.comments.slice(0, 3);
              recentComments.forEach((c, i) => {
                const commentText = cleanHtml(c.text);
                console.log(`\n[${i + 1}] ${c.author} (${new Date(c.date).toLocaleString()})`);
                console.log(commentText.length > 300 ? commentText.substring(0, 300) + '...' : commentText);
              });
              if (ticket.comments.length > 3) {
                console.log(`\n... and ${ticket.comments.length - 3} more comments`);
              }
            } else {
              console.log(`\nComments: None`);
            }
            
            console.log('\n' + '='.repeat(80));
          } else {
            console.log(`❌ Ticket #${ticketId} not found in cache`);
          }
        }
        break;
      }
      
      // Query tickets without commits/PRs in specified states
      if (query.includes('no commit') || query.includes('without commit') || query.includes('missing commit')) {
        const targetStates = ['in acc', 'uat approved', 'testing in intg', 'ready for testing'];
        const filtered = cache.workItems.filter(wi => {
          const stateMatch = targetStates.some(s => wi.state.toLowerCase() === s);
          const noPRs = !wi.development?.hasPullRequests;
          const noCommits = !wi.development?.hasCommits;
          const noBranches = !wi.development?.hasBranches;
          // Missing if lacks ALL THREE (PRs AND commits AND branches)
          return stateMatch && (noPRs && noCommits && noBranches);
        });
        
        if (filtered.length === 0) {
          console.log(`\nNone of them are completely missing all three, so the list is empty.`);
        } else {
          console.log(`\nFound ${filtered.length} tickets in specified states without any development artifacts:\n`);
          console.log(`Specified states: "In ACC", "UAT Approved", "Testing in INTG", "Ready for Testing"`);
          console.log(`Filter: Tickets must be missing ALL THREE: PRs, Commits, and Branches\n`);
          filtered.forEach((wi, idx) => {
            console.log(`${idx + 1}. #${wi.id} - ${wi.title}`);
            console.log(`   State: ${wi.state}`);
            console.log(`   Assigned: ${wi.assignedTo || 'Unassigned'}`);
            console.log(`   Tags: ${wi.tags || 'none'}`);
            console.log(`   PRs: ❌ | Commits: ❌ | Branches: ❌`);
            console.log('');
          });
        }
        break;
      }
      
      // Query tickets without PRs
      if (query.includes('no pr') || query.includes('without pr') || query.includes('missing pr')) {
        const testingStates = ['in acc', 'uat approved', 'testing in intg', 'ready for testing'];
        const filtered = cache.workItems.filter(wi => 
          testingStates.some(s => wi.state.toLowerCase() === s || wi.state.toLowerCase().includes(s)) && 
          !wi.development?.hasPullRequests
        );
        
        console.log(`\nFound ${filtered.length} tickets in testing states without PRs:\n`);
        filtered.forEach((wi, idx) => {
          console.log(`${idx + 1}. #${wi.id} - ${wi.title}`);
          console.log(`   State: ${wi.state}`);
          console.log(`   Assigned: ${wi.assignedTo || 'Unassigned'}`);
          console.log(`   Has Commits: ${wi.development?.hasCommits || false}`);
          console.log('');
        });
        break;
      }
      
      console.log('Query not recognized. Try:');
      console.log('  - "summarize ticket <id>"');
      console.log('  - "tickets without commits"');
      console.log('  - "tickets without PRs"');
      break;
      
    default:
      console.log('Azure DevOps Cache Query');
      console.log('\nCommands:');
      console.log('  node query-cache.js list           - List all cached work items');
      console.log('  node query-cache.js item <id>      - Get work item details from cache');
      console.log('  node query-cache.js by-state <st>  - Get items by state from cache');
      console.log('  node query-cache.js info           - Show cache information');
      console.log('  node query-cache.js query <text>   - Natural language query');
      console.log('\nQuery examples:');
      console.log('  node query-cache.js query summarize ticket 13301');
      console.log('  node query-cache.js query tickets without commits');
      console.log('  node query-cache.js query tickets without PRs in testing states');
      console.log('\nTo refresh cache: node refresh-cache.js');
  }
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
