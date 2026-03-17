#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { AzureDevOpsClient } from './azure-devops-client.js';
import fs from 'fs';
import { WorkItem } from "azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js";
import { JiraClient, JiraIssue, JiraSprint } from "./jira-client.js";
import { getCacheDir } from "./utils.js";
import type { TeamSettingsIteration } from "azure-devops-node-api/interfaces/WorkInterfaces.js";

dotenv.config();

const azureClient = new AzureDevOpsClient(
    process.env.AZURE_DEVOPS_ORG_URL!,
    process.env.AZURE_DEVOPS_TOKEN!,
    process.env.AZURE_DEVOPS_PROJECT!,
    process.env.AZURE_DEVOPS_TEAM ?? process.env.AZURE_DEVOPS_PROJECT!
);

const jiraClient = new JiraClient(
    process.env.JIRA_BASE_URL!,
    process.env.JIRA_EMAIL!,
    process.env.JIRA_API_TOKEN!,
    process.env.JIRA_PROJECT!,
    process.env.JIRA_BOARD_ID
);

interface WorkItemCache {
    id?: number | string;
    key?: string;
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
    relations?: any[];
    development: {
        pullRequests: any[];
        commits: any[];
        branches: any[];
        hasPullRequests: boolean;
        hasCommits: boolean;
        hasBranches: boolean;
    };
    subtasks?: Array<{
        id?: string | number;
        key?: string;
        title?: string;
        type?: string;
        state?: string;
        assignedTo?: string;
        parentId?: string | number;
        parentKey?: string;
    }>;
}

interface CacheData {
    lastUpdated: string;
    sprint: {
        name: string;
        path?: string;
        startDate?: string;
        finishDate?: string;
        state?: string;
    } | null;
    userEmail?: string;
    workItems: WorkItemCache[];
}

async function runCacheRefresh<TSprint extends JiraSprint | TeamSettingsIteration, TRaw extends WorkItem | JiraIssue>
({
     platformName,
     fetchSprint,
     fetchSprintItems,
     transformItems,
     cacheFilePath,
     cacheDir,
     buildCachePayload
 }: {
    platformName: string;
    fetchSprint: () => Promise<TSprint | null>,
    fetchSprintItems: () => Promise<TRaw[]>,
    transformItems: (item: TRaw) => Promise<WorkItemCache | null>,
    cacheFilePath: string,
    cacheDir: string,
    buildCachePayload: (items: WorkItemCache[], sprint: TSprint | null) => CacheData;
}){
    try {
        console.log(`Fetching data from ${platformName}...`);

        // Get current sprint info first
        let sprint = null;
        let sprintName = 'current sprint';
        try {
            sprint = await fetchSprint();
            if (sprint && sprint?.name) {
                sprintName = sprint.name;
            }
        } catch (error) {
            console.warn('Could not fetch sprint info:', error instanceof Error ? error.message : String(error));
        }

        const allItems = await fetchSprintItems();
        console.log(`Found ${allItems.length} user stories in ${sprintName}`);

        const detailedItems = await Promise.all(
            allItems.map(async (item: any): Promise<WorkItemCache | null> => {
                if (!item.id) return null;

                // Retry logic for transient errors
                const maxRetries = 3;
                for (let attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        return await transformItems(item);
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
        const validItems = detailedItems.filter((item: any): item is WorkItemCache => item !== null);
        const failedCount = allItems.length - validItems.length;

        if (failedCount > 0) {
            console.warn(`⚠ Warning: ${failedCount} item(s) failed to fetch and were excluded from cache`);
        }

        const payload = buildCachePayload(validItems, sprint);

        // Ensure cache directory exists
        if (!fs.existsSync(cacheDir)) {
            fs.mkdirSync(cacheDir, {recursive: true});
        }

        // Write cache file
        fs.writeFileSync(cacheFilePath, JSON.stringify(payload, null, 2));

        console.log(`✓ Cache updated successfully!`);
        if (sprint) {
            console.log(`  Sprint: ${sprint.name}`);
        }
        console.log(`  Work items: ${validItems.length}${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
        console.log(`  Last updated: ${payload.lastUpdated}`);

    } catch (error) {
        console.error('Error refreshing cache:', error instanceof Error ? error.message : String(error));
        process.exit(1);

    }
}

async function refreshCacheADO(){
    const { cacheFilePath, cacheDir } = getCacheDir('work-items');
    const userEmail = process.env.AZURE_DEVOPS_USER_EMAIL;

    await runCacheRefresh<TeamSettingsIteration, WorkItem>({
        platformName: "Azure DevOps",
        fetchSprint: () => azureClient.getCurrentSprint(),
        cacheDir,
        cacheFilePath,
        fetchSprintItems: () => azureClient.getAllCurrentSprintUserStories(),
        transformItems: async (item) => {
            if (!item.id) return null;

            const [comments, devLinks, subtasks] = await Promise.all([
                azureClient.getWorkItemComments(item.id),
                azureClient.getWorkItemDevelopmentLinks(item.id),
                azureClient.getChildTasks(item.id)
            ]);

            return {
                id: item.id,
                title: item.fields?.['System.Title'],
                type: item.fields?.['System.WorkItemType'],
                state: item.fields?.['System.State'],
                assignedTo: item.fields?.['System.AssignedTo']?.displayName,
                description: item.fields?.['System.Description'],
                createdDate: item.fields?.['System.CreatedDate'],
                changedDate: item.fields?.['System.ChangedDate'],
                tags: item.fields?.['System.Tags'],
                reproSteps: item.fields?.['Microsoft.VSTS.TCM.ReproSteps'],
                comments: comments?.comments?.map((c: any) => ({
                    author: c.createdBy?.displayName,
                    date: c.createdDate,
                    text: c.text
                })) || [],
                relations: item.relations || [],
                development: {
                    pullRequests: devLinks.pullRequests || [],
                    commits: devLinks.commits || [],
                    branches: devLinks.branches || [],
                    hasPullRequests: devLinks.hasPullRequests || false,
                    hasCommits: devLinks.hasCommits || false,
                    hasBranches: devLinks.hasBranches || false
                },
                subtasks: subtasks.map((subtask) => ({
                    id: subtask.id,
                    title: subtask.fields?.['System.Title'],
                    type: subtask.fields?.['System.WorkItemType'],
                    state: subtask.fields?.['System.State'],
                    assignedTo: subtask.fields?.['System.AssignedTo']?.displayName,
                    parentId: item.id,
                }))
            }
        },
        buildCachePayload: (items, sprint) => ({
            lastUpdated: new Date().toISOString(),
            sprint: sprint ? {
                name: sprint.name!,
                path: sprint.path!,
                startDate: sprint.attributes?.startDate?.toString(),
                finishDate: sprint.attributes?.finishDate?.toString()
            } : null,
            userEmail: userEmail,
            workItems: items
        }),
    })
}

async function refreshCacheJira(){
    const { cacheFilePath, cacheDir } = getCacheDir('jira-issues');
    const userEmail = process.env.JIRA_USER_EMAIL;

    await runCacheRefresh<JiraSprint, JiraIssue>({
        platformName: "Jira",
        fetchSprint: () => jiraClient.getCurrentSprint(),
        fetchSprintItems: () => jiraClient.getAllCurrentSprintUserStories(),
        cacheDir,
        cacheFilePath,
        transformItems: async (item) => {
            if (!item.id) return null;

            const [comments, devLinks, subtasks] = await Promise.all([
                jiraClient.getIssueComments(item.key),
                jiraClient.getIssueDevelopmentLinks(item.id),
                jiraClient.getChildIssues(item.key)
            ]);

            return {
                id: item.id,
                key: item?.key,
                title: item?.fields?.summary,
                type: item?.fields?.issuetype?.name,
                state: item?.fields?.status?.name,
                assignedTo: item?.fields?.assignee?.displayName,
                description: typeof item?.fields?.description === 'string'
                    ? item?.fields?.description
                    : JSON.stringify(item?.fields?.description),
                createdDate: item?.fields?.created,
                changedDate: item?.fields?.updated,
                labels: item?.fields?.labels?.join?.(', '),
                comments: comments?.map((c: any) => ({
                    author: c.author?.displayName,
                    date: c.created,
                    text: typeof c.body === 'string' ? c.body : JSON.stringify(c.body)
                })) || [],
                development: {
                    pullRequests: devLinks?.pullRequests || [],
                    commits: devLinks?.commits || [],
                    branches: devLinks?.branches || [],
                    hasPullRequests: devLinks?.hasPullRequests || false,
                    hasCommits: devLinks?.hasCommits || false,
                    hasBranches: devLinks?.hasBranches || false
                },
                subtasks: subtasks?.map?.((subtask) => ({
                    id: subtask.id,
                    key: subtask.key,
                    title: subtask.fields?.summary,
                    type: subtask.fields?.issuetype?.name,
                    state: subtask.fields?.status?.name,
                    assignedTo: subtask.fields?.assignee?.displayName,
                    parentId: item.id,
                    parentKey: item?.key
                }))
            };
        },
        buildCachePayload: (items, sprint) => ({
            lastUpdated: new Date().toISOString(),
            sprint: sprint ? {
                name: sprint.name,
                state: sprint.state,
                startDate: sprint.startDate?.toString(),
                finishDate: sprint.endDate?.toString(),
            } : null,
            userEmail: userEmail,
            workItems: items
        }),
    })
}

async function main(){
    console.log('Starting concurrent cache refresh for ADO and Jira...\n');

    try {
        const results = await Promise.allSettled([
            refreshCacheADO(),
            refreshCacheJira()
        ]);

        results.forEach((result, index) => {
            if (result.status === 'rejected') {
                const system = index === 0 ? 'Azure DevOps' : 'Jira';
                console.error(`\n ${system} refresh failed:`, result.reason);
            }
        });

        console.log('\n Cache refresh operations finished!');
    } catch (error) {
        console.error('\n Unexpected critical error during cache refresh:', error);
        process.exit(1);
    }
}

main();
