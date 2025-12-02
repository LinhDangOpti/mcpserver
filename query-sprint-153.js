import { AzureDevOpsClient } from './dist/azure-devops-client.js';
import fs from 'fs';
import 'dotenv/config';

const orgUrl = process.env.AZURE_DEVOPS_ORG_URL;
const token = process.env.AZURE_DEVOPS_TOKEN;
const project = process.env.AZURE_DEVOPS_PROJECT;
const userEmail = process.env.AZURE_DEVOPS_USER_EMAIL;

if (!orgUrl || !token || !project || !userEmail) {
  console.error('Missing required environment variables');
  process.exit(1);
}

async function querySprint153() {
  const client = new AzureDevOpsClient(orgUrl, token, project);
  
  console.log('Querying Sprint 153 for ticket 13083...\n');
  
  try {
    // Query for ticket 13083 in Sprint 153
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.Description]
      FROM WorkItems
      WHERE [System.Id] = 13083
        AND [System.IterationPath] = 'ericssondotcom-vnext\\Sprint 153'
    `;
    
    const workItems = await client.getWorkItemsByQuery(wiql);
    
    if (workItems.length === 0) {
      console.log('Ticket 13083 not found in Sprint 153');
      return;
    }
    
    const ticket = workItems[0];
    const fields = ticket.fields;
    
    console.log('='.repeat(80));
    console.log(`Ticket #${ticket.id}: ${fields['System.Title']}`);
    console.log('='.repeat(80));
    console.log(`Status: ${fields['System.State']}`);
    console.log(`Assigned to: ${fields['System.AssignedTo']?.displayName || 'Unassigned'}`);
    console.log(`Created: ${new Date(fields['System.CreatedDate']).toLocaleDateString()}`);
    console.log(`Changed: ${new Date(fields['System.ChangedDate']).toLocaleDateString()}`);
    console.log(`Iteration: ${fields['System.IterationPath']}`);
    console.log(`Type: ${fields['System.WorkItemType']}`);
    if (fields['System.Tags']) {
      console.log(`Tags: ${fields['System.Tags']}`);
    }
    console.log('\nDescription:');
    console.log('-'.repeat(80));
    console.log(fields['System.Description'] || 'No description');
    console.log('-'.repeat(80));
    
    // Get comments
    const comments = await client.getWorkItemComments(ticket.id);
    if (comments.comments && comments.comments.length > 0) {
      console.log('\nComments:');
      console.log('-'.repeat(80));
      comments.comments.forEach(comment => {
        console.log(`[${new Date(comment.createdDate).toLocaleDateString()}] ${comment.createdBy.displayName}:`);
        console.log(comment.text);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('Error querying Sprint 153:', error.message);
  }
}

querySprint153();
