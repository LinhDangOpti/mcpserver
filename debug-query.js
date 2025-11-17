#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { AzureDevOpsClient } from './dist/azure-devops-client.js';

dotenv.config();

const azureClient = new AzureDevOpsClient(
  process.env.AZURE_DEVOPS_ORG_URL,
  process.env.AZURE_DEVOPS_TOKEN,
  process.env.AZURE_DEVOPS_PROJECT
);

async function debugQuery() {
  try {
    console.log('Testing WIQL query for Sprint 154...\n');
    
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.IterationPath] = 'ericssondotcom-vnext\\Sprint 154'
        AND [System.WorkItemType] = 'User Story'
      ORDER BY [System.State] ASC, [System.Id] ASC
    `;
    
    const items = await azureClient.getWorkItemsByQuery(wiql);
    console.log(`Found ${items.length} user stories`);
    console.log('\nTicket IDs:');
    items.forEach(item => {
      const state = item.fields['System.State'];
      const id = item.id;
      console.log(`  #${id} - ${state}`);
    });
    
    // Check if specific tickets are included
    const hasTicket12632 = items.some(item => item.id === 12632);
    const hasTicket12938 = items.some(item => item.id === 12938);
    
    console.log(`\nTicket #12632 included: ${hasTicket12632}`);
    console.log(`Ticket #12938 included: ${hasTicket12938}`);
    
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

debugQuery();
