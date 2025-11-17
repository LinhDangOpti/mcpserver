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
      
    default:
      console.log('Azure DevOps Cache Query');
      console.log('\nCommands:');
      console.log('  node query-cache.js list           - List all cached work items');
      console.log('  node query-cache.js item <id>      - Get work item details from cache');
      console.log('  node query-cache.js by-state <st>  - Get items by state from cache');
      console.log('  node query-cache.js info           - Show cache information');
      console.log('\nTo refresh cache: node refresh-cache.js');
  }
} catch (error) {
  console.error('Error:', error instanceof Error ? error.message : String(error));
  process.exit(1);
}
