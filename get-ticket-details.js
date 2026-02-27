#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { AzureDevOpsClient } from './dist/azure-devops-client.js';

dotenv.config();

const azureClient = new AzureDevOpsClient(
  process.env.AZURE_DEVOPS_ORG_URL,
  process.env.AZURE_DEVOPS_TOKEN,
  process.env.AZURE_DEVOPS_PROJECT
);

async function getTicketDetails(id) {
  try {
    const wi = await azureClient.getWorkItem(parseInt(id));
    const fields = wi.fields;
    
    console.log('═'.repeat(80));
    console.log(`TICKET #${id} SUMMARY`);
    console.log('═'.repeat(80));
    console.log(`Title: ${fields['System.Title']}`);
    console.log(`Type: ${fields['System.WorkItemType']}`);
    console.log(`State: ${fields['System.State']}`);
    console.log(`Assigned To: ${fields['System.AssignedTo']?.displayName || 'Unassigned'}`);
    console.log(`Iteration: ${fields['System.IterationPath']}`);
    console.log(`Created: ${new Date(fields['System.CreatedDate']).toLocaleDateString()}`);
    console.log(`Changed: ${new Date(fields['System.ChangedDate']).toLocaleDateString()}`);
    
    if (fields['System.Tags']) {
      console.log(`Tags: ${fields['System.Tags']}`);
    }
    
    console.log('\n' + '─'.repeat(80));
    console.log('DESCRIPTION:');
    console.log('─'.repeat(80));
    const description = fields['System.Description'] || 'No description';
    // Strip HTML tags for basic display
    const plainText = description.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    console.log(plainText || 'No description');
    
    if (fields['Microsoft.VSTS.TCM.ReproSteps']) {
      console.log('\n' + '─'.repeat(80));
      console.log('ACCEPTANCE CRITERIA / REPRO STEPS:');
      console.log('─'.repeat(80));
      const reproSteps = fields['Microsoft.VSTS.TCM.ReproSteps'];
      const plainSteps = reproSteps.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
      console.log(plainSteps);
    }
    
    // Get comments
    const comments = await azureClient.getWorkItemComments(parseInt(id));
    if (comments && comments.comments && comments.comments.length > 0) {
      console.log('\n' + '─'.repeat(80));
      console.log(`COMMENTS (${comments.comments.length}):`);
      console.log('─'.repeat(80));
      comments.comments.slice(-5).forEach(comment => {
        const date = new Date(comment.createdDate).toLocaleString();
        console.log(`\n[${comment.createdBy.displayName}] - ${date}`);
        const plainComment = comment.text.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
        console.log(plainComment);
      });
    }
    
    console.log('\n' + '═'.repeat(80));
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

const ticketId = process.argv[2];
if (!ticketId) {
  console.error('Usage: node get-ticket-details.js <ticket-id>');
  process.exit(1);
}

getTicketDetails(ticketId);
