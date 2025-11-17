#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import { AzureDevOpsClient } from './azure-devops-client.js';
import type { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js';

dotenv.config();

// Initialize Azure DevOps client
const azureClient = new AzureDevOpsClient(
  process.env.AZURE_DEVOPS_ORG_URL!,
  process.env.AZURE_DEVOPS_TOKEN!,
  process.env.AZURE_DEVOPS_PROJECT!
);

// Define tools
const TOOLS: Tool[] = [
  {
    name: 'get_my_current_sprint_tickets',
    description: 'Get all work items assigned to me in the current sprint',
    inputSchema: {
      type: 'object',
      properties: {
        userEmail: {
          type: 'string',
          description: 'User email address in Azure DevOps'
        }
      },
      required: ['userEmail']
    }
  },
  {
    name: 'get_tickets_by_state',
    description: 'Get all tickets filtered by state (e.g., "In ACC", "Active", "Closed")',
    inputSchema: {
      type: 'object',
      properties: {
        state: {
          type: 'string',
          description: 'State/status of tickets (e.g., "In ACC", "Active", "Done")'
        }
      },
      required: ['state']
    }
  },
  {
    name: 'get_work_item_details',
    description: 'Get detailed information about a specific work item by ID',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Work item ID'
        }
      },
      required: ['id']
    }
  },
  {
    name: 'get_current_sprint_info',
    description: 'Get information about the current sprint',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  }
];

// Create MCP server
const server = new Server(
  {
    name: 'azure-devops-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handler: List tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

// Handler: Call tool
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!args) {
      throw new Error('Arguments are required');
    }

    switch (name) {
      case 'get_my_current_sprint_tickets': {
        const workItems = await azureClient.getMyCurrentSprintItems(args.userEmail as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workItems.map((wi: WorkItem) => ({
                id: wi.id,
                title: wi.fields?.['System.Title'],
                state: wi.fields?.['System.State'],
                assignedTo: wi.fields?.['System.AssignedTo']?.displayName,
                type: wi.fields?.['System.WorkItemType']
              })), null, 2)
            }
          ]
        };
      }

      case 'get_tickets_by_state': {
        const workItems = await azureClient.getWorkItemsByState(args.state as string);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workItems.map((wi: WorkItem) => ({
                id: wi.id,
                title: wi.fields?.['System.Title'],
                state: wi.fields?.['System.State'],
                assignedTo: wi.fields?.['System.AssignedTo']?.displayName
              })), null, 2)
            }
          ]
        };
      }

      case 'get_work_item_details': {
        const workItem = await azureClient.getWorkItem(args.id as number);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                id: workItem.id,
                title: workItem.fields?.['System.Title'],
                description: workItem.fields?.['System.Description'],
                state: workItem.fields?.['System.State'],
                assignedTo: workItem.fields?.['System.AssignedTo']?.displayName,
                createdDate: workItem.fields?.['System.CreatedDate'],
                tags: workItem.fields?.['System.Tags']
              }, null, 2)
            }
          ]
        };
      }

      case 'get_current_sprint_info': {
        const sprint = await azureClient.getCurrentSprint();
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                name: sprint.name,
                path: sprint.path,
                startDate: sprint.attributes?.startDate,
                finishDate: sprint.attributes?.finishDate
              }, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`
        }
      ],
      isError: true
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Azure DevOps MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});