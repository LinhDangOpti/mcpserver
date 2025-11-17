#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { AzureDevOpsClient } from './dist/azure-devops-client.js';
dotenv.config();
const azureClient = new AzureDevOpsClient(process.env.AZURE_DEVOPS_ORG_URL, process.env.AZURE_DEVOPS_TOKEN, process.env.AZURE_DEVOPS_PROJECT);
const command = process.argv[2];
const arg1 = process.argv[3];
function cleanHtml(text) {
    if (!text)
        return '';
    return text
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
}
async function main() {
    try {
        switch (command) {
            case 'my-sprint':
                if (!arg1) {
                    console.error('Usage: node cli.js my-sprint <email>');
                    process.exit(1);
                }
                const myItems = await azureClient.getMyCurrentSprintItems(arg1);
                console.log(`\nFound ${myItems.length} work items:\n`);
                myItems.forEach((wi, i) => {
                    console.log(`${i + 1}. [${wi.id}] ${wi.fields?.['System.Title']}`);
                    console.log(`   State: ${wi.fields?.['System.State']}, Type: ${wi.fields?.['System.WorkItemType']}`);
                });
                break;
            case 'active-stories':
                const wiql = `
          SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo], [System.Tags]
          FROM WorkItems
          WHERE [System.WorkItemType] = 'User Story'
            AND [System.State] = 'Active'
            AND [System.IterationPath] = @currentIteration
          ORDER BY [System.ChangedDate] DESC
        `;
                const stories = await azureClient.getWorkItemsByQuery(wiql);
                console.log(`\nFound ${stories.length} Active user stories:\n`);
                stories.forEach((wi, i) => {
                    console.log(`${i + 1}. [${wi.id}] ${wi.fields?.['System.Title']}`);
                    console.log(`   Assigned: ${wi.fields?.['System.AssignedTo']?.displayName || 'Unassigned'}`);
                });
                break;
            case 'item':
                if (!arg1) {
                    console.error('Usage: node cli.js item <id>');
                    process.exit(1);
                }
                const id = parseInt(arg1);
                const workItem = await azureClient.getWorkItem(id);
                console.log('\n' + '='.repeat(80));
                console.log(`[${workItem.id}] ${workItem.fields?.['System.Title']}`);
                console.log('='.repeat(80));
                console.log(`Type: ${workItem.fields?.['System.WorkItemType']}`);
                console.log(`State: ${workItem.fields?.['System.State']}`);
                console.log(`Assigned: ${workItem.fields?.['System.AssignedTo']?.displayName || 'Unassigned'}`);
                if (workItem.fields?.['Microsoft.VSTS.TCM.ReproSteps']) {
                    console.log('\nRepro Steps:');
                    console.log(cleanHtml(workItem.fields?.['Microsoft.VSTS.TCM.ReproSteps']));
                }
                const comments = await azureClient.getWorkItemComments(id);
                if (comments?.comments?.length > 0) {
                    console.log('\nComments:');
                    console.log('-'.repeat(80));
                    comments.comments.forEach((c, i) => {
                        console.log(`\n[${i + 1}] ${c.createdBy?.displayName} - ${new Date(c.createdDate).toLocaleString()}`);
                        console.log(cleanHtml(c.text));
                    });
                }
                console.log('\n' + '='.repeat(80));
                break;
            case 'by-state':
                if (!arg1) {
                    console.error('Usage: node cli.js by-state <state>');
                    process.exit(1);
                }
                const items = await azureClient.getWorkItemsByState(arg1);
                console.log(`\nFound ${items.length} items with state "${arg1}":\n`);
                items.forEach((wi, i) => {
                    console.log(`${i + 1}. [${wi.id}] ${wi.fields?.['System.Title']}`);
                });
                break;
            case 'my-verify':
                const email = arg1 || process.env.AZURE_DEVOPS_USER_EMAIL;
                if (!email) {
                    console.error('Usage: node cli.js my-verify [email]');
                    console.error('Or set AZURE_DEVOPS_USER_EMAIL in .env');
                    process.exit(1);
                }
                const verifyStories = await azureClient.getUserStoriesWithMyVerifyTasks(email);
                console.log(`\nFound ${verifyStories.length} user stories with your verify tasks:\n`);
                verifyStories.forEach((wi, i) => {
                    console.log(`${i + 1}. [${wi.id}] ${wi.fields?.['System.Title']}`);
                    console.log(`   State: ${wi.fields?.['System.State']}, Assigned: ${wi.fields?.['System.AssignedTo']?.displayName || 'Unassigned'}`);
                });
                break;
            default:
                console.log('Azure DevOps CLI');
                console.log('\nCommands:');
                console.log('  node cli.js my-sprint <email>     - Get your current sprint items');
                console.log('  node cli.js active-stories        - Get active user stories');
                console.log('  node cli.js item <id>             - Get work item details with comments');
                console.log('  node cli.js by-state <state>      - Get items by state');
                console.log('  node cli.js my-verify [email]     - Get user stories with your verify tasks');
        }
    }
    catch (error) {
        console.error('Error:', error instanceof Error ? error.message : String(error));
        process.exit(1);
    }
}
main();
