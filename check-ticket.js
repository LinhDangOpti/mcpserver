#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { AzureDevOpsClient } from './dist/azure-devops-client.js';

dotenv.config();

const azureClient = new AzureDevOpsClient(
  process.env.AZURE_DEVOPS_ORG_URL,
  process.env.AZURE_DEVOPS_TOKEN,
  process.env.AZURE_DEVOPS_PROJECT
);

async function checkTicket(id) {
  try {
    const wi = await azureClient.getWorkItem(parseInt(id));
    console.log(`Ticket #${id}:`);
    console.log(`  Title: ${wi.fields['System.Title']}`);
    console.log(`  Type: ${wi.fields['System.WorkItemType']}`);
    console.log(`  State: ${wi.fields['System.State']}`);
    console.log(`  Iteration: ${wi.fields['System.IterationPath']}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

const ticketId = process.argv[2];
if (!ticketId) {
  console.error('Usage: node check-ticket.js <ticket-id>');
  process.exit(1);
}

checkTicket(ticketId);
