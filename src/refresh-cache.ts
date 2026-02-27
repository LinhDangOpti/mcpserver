#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { AzureDevOpsClient } from './azure-devops-client.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const azureClient = new AzureDevOpsClient(
  process.env.AZURE_DEVOPS_ORG_URL!,
  process.env.AZURE_DEVOPS_TOKEN!,
  process.env.AZURE_DEVOPS_PROJECT!,
  process.env.AZURE_DEVOPS_TEAM ?? process.env.AZURE_DEVOPS_PROJECT!
);

const userEmail = process.env.AZURE_DEVOPS_USER_EMAIL;
// Use project root cache directory, not dist/cache
const cacheDir = path.join(__dirname, '..', 'cache');
const cacheFile = path.join(cacheDir, 'work-items.json');

interface WorkItemCache {
  id: number;
  title: string;
  type: string;
  state: string;
  assignedTo?: string;
  description?: string;
  createdDate: string;
  changedDate: string;
  tags?: string;
  reproSteps?: string;
  comments: Array<{
    author?: string;
    date: string;
    text: string;
  }>;
  relations: any[];
  development: {
    pullRequests: any[];
    commits: any[];
    branches: any[];
    hasPullRequests: boolean;
    hasCommits: boolean;
    hasBranches: boolean;
  };
}

interface CacheData {
  lastUpdated: string;
  sprint: {
    name: string;
    path: string;
    startDate?: string;
    finishDate?: string;
  } | null;
  userEmail?: string;
  workItems: WorkItemCache[];
}

async function refreshCache(): Promise<void> {
  try {
    console.log('Fetching data from Azure DevOps...');
    
    // Get current sprint info first
    let sprint = null;
    let sprintName = 'current sprint';
    try {
      sprint = await azureClient.getCurrentSprint();
      if (sprint && sprint.name) {
        sprintName = sprint.name;
      }
    } catch (error) {
      console.warn('Could not fetch sprint info:', error instanceof Error ? error.message : String(error));
    }
    
    // Get all user stories in current sprint
    const allItems = await azureClient.getAllCurrentSprintUserStories();
    console.log(`Found ${allItems.length} user stories in ${sprintName}`);
    
    // Get detailed information for each item with retry logic
    const detailedItems = await Promise.all(
      allItems.map(async (item): Promise<WorkItemCache | null> => {
        if (!item.id) return null;
        
        // Retry logic for transient errors
        const maxRetries = 3;
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const workItem = await azureClient.getWorkItem(item.id);
            const comments = await azureClient.getWorkItemComments(item.id);
            const devLinks = await azureClient.getWorkItemDevelopmentLinks(item.id);
            
            return {
              id: workItem.id!,
              title: workItem.fields?.['System.Title'],
              type: workItem.fields?.['System.WorkItemType'],
              state: workItem.fields?.['System.State'],
              assignedTo: workItem.fields?.['System.AssignedTo']?.displayName,
              description: workItem.fields?.['System.Description'],
              createdDate: workItem.fields?.['System.CreatedDate'],
              changedDate: workItem.fields?.['System.ChangedDate'],
              tags: workItem.fields?.['System.Tags'],
              reproSteps: workItem.fields?.['Microsoft.VSTS.TCM.ReproSteps'],
              comments: comments?.comments?.map((c: any) => ({
                author: c.createdBy?.displayName,
                date: c.createdDate,
                text: c.text
              })) || [],
              relations: workItem.relations || [],
              development: {
                pullRequests: devLinks.pullRequests || [],
                commits: devLinks.commits || [],
                branches: devLinks.branches || [],
                hasPullRequests: devLinks.hasPullRequests || false,
                hasCommits: devLinks.hasCommits || false,
                hasBranches: devLinks.hasBranches || false
              }
            };
          } catch (error) {
            if (attempt === maxRetries) {
              console.error(`✗ Failed to fetch item ${item.id} after ${maxRetries} attempts:`, error instanceof Error ? error.message : String(error));
              return null;
            } else {
              console.warn(`⚠ Retry ${attempt}/${maxRetries} for item ${item.id}...`);
              // Wait before retrying (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            }
          }
        }
        return null;
      })
    );
    
    // Filter out any failed items
    const validItems = detailedItems.filter((item): item is WorkItemCache => item !== null);
    const failedCount = allItems.length - validItems.length;
    
    if (failedCount > 0) {
      console.warn(`⚠ Warning: ${failedCount} item(s) failed to fetch and were excluded from cache`);
    }
    
    const cacheData: CacheData = {
      lastUpdated: new Date().toISOString(),
      sprint: sprint ? {
        name: sprint.name!,
        path: sprint.path!,
        startDate: sprint.attributes?.startDate?.toString(),
        finishDate: sprint.attributes?.finishDate?.toString()
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
    console.log(`  Work items: ${validItems.length}${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
    console.log(`  Last updated: ${cacheData.lastUpdated}`);
    
  } catch (error) {
    console.error('Error refreshing cache:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

refreshCache();
