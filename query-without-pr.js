import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cacheFile = path.join(__dirname, 'cache', 'work-items.json');

// Read cache
const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));

console.log('================================================================================');
console.log('Sprint 154 - User Stories WITHOUT Pull Requests');
console.log('================================================================================\n');

// Filter tickets without pull requests
const ticketsWithoutPR = cache.workItems.filter(item => !item.development?.hasPullRequests);

// Group by state
const byState = ticketsWithoutPR.reduce((acc, item) => {
  if (!acc[item.state]) {
    acc[item.state] = [];
  }
  acc[item.state].push(item);
  return acc;
}, {});

// Display summary
console.log(`Total tickets without Pull Requests: ${ticketsWithoutPR.length} of ${cache.workItems.length}\n`);

// Display by state
Object.keys(byState).sort().forEach(state => {
  console.log(`\n${state} (${byState[state].length} tickets)`);
  console.log('-'.repeat(80));
  
  byState[state].forEach(item => {
    console.log(`  #${item.id} - ${item.title}`);
    console.log(`           Assigned: ${item.assignedTo || 'Unassigned'}`);
    if (item.tags) {
      console.log(`           Tags: ${item.tags}`);
    }
  });
});

// Also show tickets WITH pull requests for comparison
console.log('\n\n================================================================================');
console.log('Sprint 154 - User Stories WITH Pull Requests (for reference)');
console.log('================================================================================\n');

const ticketsWithPR = cache.workItems.filter(item => item.development?.hasPullRequests);
console.log(`Total tickets with Pull Requests: ${ticketsWithPR.length} of ${cache.workItems.length}\n`);

ticketsWithPR.forEach(item => {
  console.log(`#${item.id} - ${item.title}`);
  console.log(`  State: ${item.state}`);
  console.log(`  Assigned: ${item.assignedTo || 'Unassigned'}`);
  console.log(`  Pull Requests: ${item.development.pullRequests.length}`);
  console.log(`  Commits: ${item.development.commits.length}`);
  console.log('');
});
