#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { AzureDevOpsClient } from './dist/azure-devops-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const azureClient = new AzureDevOpsClient(
  process.env.AZURE_DEVOPS_ORG_URL,
  process.env.AZURE_DEVOPS_TOKEN,
  process.env.AZURE_DEVOPS_PROJECT
);

const userEmail = process.env.AZURE_DEVOPS_USER_EMAIL;
const cacheDir = path.join(__dirname, 'cache');
const cacheFile = path.join(cacheDir, 'work-items.json');

async function refreshCache() {
  try {
    console.log('Fetching data from Azure DevOps...');
    
    // Get user stories with my verify tasks
    const allItems = await azureClient.getUserStoriesWithMyVerifyTasks(userEmail);
    console.log(`Found ${allItems.length} user stories with your verify tasks`);
    
    // Get detailed information for each item
    const detailedItems = await Promise.all(
      allItems.map(async (item) => {
        try {
          const workItem = await azureClient.getWorkItem(item.id);
          const comments = await azureClient.getWorkItemComments(item.id);
          return {
            id: workItem.id,
            title: workItem.fields?.['System.Title'],
            type: workItem.fields?.['System.WorkItemType'],
            state: workItem.fields?.['System.State'],
            assignedTo: workItem.fields?.['System.AssignedTo']?.displayName,
            description: workItem.fields?.['System.Description'],
            createdDate: workItem.fields?.['System.CreatedDate'],
            changedDate: workItem.fields?.['System.ChangedDate'],
            tags: workItem.fields?.['System.Tags'],
            reproSteps: workItem.fields?.['Microsoft.VSTS.TCM.ReproSteps'],
            comments: comments?.comments?.map(c => ({
              author: c.createdBy?.displayName,
              date: c.createdDate,
              text: c.text
            })) || [],
            relations: workItem.relations || []
          };
        } catch (error) {
          console.error(`Error fetching details for item ${item.id}:`, error.message);
          return null;
        }
      })
    );
    
    // Filter out any failed items
    const validItems = detailedItems.filter(item => item !== null);
    
    // Get current sprint info
    let sprint = null;
    try {
      sprint = await azureClient.getCurrentSprint();
    } catch (error) {
      console.warn('Could not fetch sprint info:', error.message);
    }
    
    const cacheData = {
      lastUpdated: new Date().toISOString(),
      sprint: sprint ? {
        name: sprint.name,
        path: sprint.path,
        startDate: sprint.attributes?.startDate,
        finishDate: sprint.attributes?.finishDate
      } : null,
      userEmail: userEmail,
      workItems: validItems
    };
    
    // Ensure cache directory exists
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    
    // Write cache file
    fs.writeFileSync(cacheFile, JSON.stringify(cacheData, null, 2));
    
    console.log(`✓ Cache updated successfully!`);
    if (sprint) {
      console.log(`  Sprint: ${sprint.name}`);
    }
    console.log(`  Work items: ${validItems.length}`);
    console.log(`  Last updated: ${cacheData.lastUpdated}`);
    
  } catch (error) {
    console.error('Error refreshing cache:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

refreshCache();
