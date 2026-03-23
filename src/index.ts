#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import * as dotenv from 'dotenv';
import { refreshCacheJira, refreshCacheADO } from "./refresh-cache.js";
import { loadCache } from "./utils.js";

dotenv.config();

// Define tools
const TOOLS: Tool[] = [
  {
    name: "refresh_cache_ado",
    description: "Refresh the Azure DevOps cache by fetching the latest data from the API. This should be run periodically to keep the cache up to date.",
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
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
  },
  {
    name: 'list_all_current_sprint_tickets',
    description: 'List all work items in the current sprint with summary information',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'query_tickets',
    description: 'Query tickets using natural language. Supports filtering by state, development links (commits, pull requests), assignee, tags, and combinations. Examples: "tickets in ACC without commits", "testing tickets missing PRs", "active tickets assigned to John"',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Natural language query to filter tickets'
        }
      },
      required: ['query']
    }
  },
];

const JIRA_TOOLS: Tool[] = [
  {
    name: "refresh_cache_jira",
    description: "Refresh the Jira cache by fetching the latest data from the API. This should be run periodically to keep the cache up to date.",
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
  {
    name: 'get_my_current_sprint_issues',
    description: 'Get all issues assigned to me in the current sprint',
    inputSchema: {
      type: 'object',
      properties: {
        userEmail: {
          type: 'string',
          description: 'User email address in Jira'
        }
      },
      required: ['userEmail']
    }
  },
  {
    name: 'get_issues_by_status',
    description: 'Get all issues filtered by status (e.g., "To Do", "In Progress", "Done")',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Status of issues (e.g., "To Do", "In Progress", "Done")'
        }
      },
      required: ['status']
    }
  },
  {
    name: 'get_issue_details',
    description: 'Get detailed information about a specific issue by key or ID',
    inputSchema: {
      type: 'object',
      properties: {
        issueKey: {
          type: 'string',
          description: 'Issue key (e.g., "PROJ-123") or ID'
        }
      },
      required: ['issueKey']
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
  },
  {
    name: 'list_all_current_sprint_issues',
    description: 'List all issues in the current sprint with summary information',
    inputSchema: {
      type: 'object',
      properties: {},
      required: []
    }
  },
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
  return { tools: [...TOOLS, JIRA_TOOLS] };
});

// Handler: Call ADO tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const cache = await loadCache('ado');

  try {
    if (!args) {
      throw new Error('Arguments are required');
    }

    const platform = 'ado';

    switch (name) {
      case 'get_my_current_sprint_tickets': {
        const userEmail = args.userEmail as string;
        const workItems = cache.workItems.filter((wi: any) =>
          wi.assignedTo && wi.assignedTo.toLowerCase().includes(userEmail.toLowerCase().split('@')[0])
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workItems.map((wi: any) => ({
                id: wi.id,
                title: wi.title,
                state: wi.state,
                assignedTo: wi.assignedTo,
                type: wi.type
              })), null, 2)
            }
          ]
        };
      }

      case 'get_tickets_by_state': {
        const cache = await loadCache(platform);
        const state = args.state as string;
        const workItems = cache.workItems.filter((wi: any) =>
          wi.state.toLowerCase() === state.toLowerCase()
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(workItems.map((wi: any) => ({
                id: wi.id,
                title: wi.title,
                state: wi.state,
                assignedTo: wi.assignedTo
              })), null, 2)
            }
          ]
        };
      }

      case 'get_work_item_details': {
        const cache = await loadCache(platform);
        const id = args.id as number;
        const workItem = cache.workItems.find((wi: any) => wi.id === id);

        if (!workItem) {
          throw new Error(`Work item ${id} not found in cache. Run "npm run refresh" to update.`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                id: workItem.id,
                title: workItem.title,
                description: workItem.description,
                state: workItem.state,
                assignedTo: workItem.assignedTo,
                createdDate: workItem.createdDate,
                changedDate: workItem.changedDate,
                tags: workItem.tags,
                comments: workItem.comments
              }, null, 2)
            }
          ]
        };
      }

      case 'get_current_sprint_info': {
        const cache = await loadCache(platform);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                name: cache.sprint?.name || 'Sprint 154',
                path: cache.sprint?.path,
                startDate: cache.sprint?.startDate,
                finishDate: cache.sprint?.finishDate,
                lastUpdated: cache.lastUpdated,
                totalItems: cache.workItems.length
              }, null, 2)
            }
          ]
        };
      }

      case 'list_all_current_sprint_tickets': {
        const cache = await loadCache(platform);
        const summary = cache.workItems.map((wi: any, idx: number) => ({
          number: idx + 1,
          id: wi.id,
          title: wi.title,
          state: wi.state,
          assignedTo: wi.assignedTo || 'Unassigned',
          tags: wi.tags || 'none'
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Sprint: ${cache.sprint?.name || 'Unknown'}\nLast Updated: ${cache.lastUpdated}\nTotal Work Items: ${cache.workItems.length}\n\n${JSON.stringify(summary, null, 2)}`
            }
          ]
        };
      }

      case 'query_tickets': {
        const cache = await loadCache(platform);
        const query = (args.query as string).toLowerCase();

        // Parse query for filters
        const states = ['in acc', 'uat approved', 'testing in intg', 'ready for testing', 'active', 'done', 'closed', 'new'];
        const matchedStates = states.filter(s => query.includes(s));

        const noCommits = query.includes('no commit') || query.includes('without commit') || query.includes('missing commit');
        const noPRs = query.includes('no pr') || query.includes('no pull request') || query.includes('without pr') || query.includes('missing pr');
        const hasCommits = query.includes('has commit') || query.includes('with commit');
        const hasPRs = query.includes('has pr') || query.includes('has pull request') || query.includes('with pr');

        let filtered = cache.workItems;

        // Filter by states
        if (matchedStates.length > 0) {
          filtered = filtered.filter((wi: any) =>
            matchedStates.some(s => wi.state.toLowerCase().includes(s) || s.includes(wi.state.toLowerCase()))
          );
        }

        // Filter by commits
        if (noCommits) {
          filtered = filtered.filter((wi: any) => !wi.development?.hasCommits);
        }
        if (hasCommits) {
          filtered = filtered.filter((wi: any) => wi.development?.hasCommits);
        }

        // Filter by PRs
        if (noPRs) {
          filtered = filtered.filter((wi: any) => !wi.development?.hasPullRequests);
        }
        if (hasPRs) {
          filtered = filtered.filter((wi: any) => wi.development?.hasPullRequests);
        }

        // Extract assignee if mentioned
        const assigneeMatch = query.match(/assign(?:ed)?\s+to\s+(\w+)/i);
        if (assigneeMatch) {
          const assignee = assigneeMatch[1];
          filtered = filtered.filter((wi: any) =>
            wi.assignedTo?.toLowerCase().includes(assignee.toLowerCase())
          );
        }

        const results = filtered.map((wi: any) => ({
          id: wi.id,
          title: wi.title,
          state: wi.state,
          assignedTo: wi.assignedTo || 'Unassigned',
          hasCommits: wi.development?.hasCommits || false,
          hasPRs: wi.development?.hasPullRequests || false,
          tags: wi.tags || 'none'
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Query: "${args.query}"\nMatched ${results.length} ticket(s)\n\n${JSON.stringify(results, null, 2)}`
            }
          ]
        };
      }

      case "refresh_cache_ado": {
        await refreshCacheADO();
        return {
          content: [
            {
              type: 'text',
              text: 'Azure DevOps cache refreshed successfully.'
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

// Handler: Call Jira tools
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    if (!args) {
      throw new Error('Arguments are required');
    }

    const platform = 'jira';

    switch (name) {
      case 'get_my_current_sprint_issues': {
        const cache = await loadCache(platform);
        const userEmail = args.userEmail as string;
        const issues = cache.workItems.filter((issue: any) =>
            issue.assignedTo && issue.assignedTo.toLowerCase().includes(userEmail.toLowerCase().split('@')[0])
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issues.map((issue: any) => ({
                key: issue.key,
                id: issue.id,
                title: issue.title,
                state: issue.state,
                assignedTo: issue.assignedTo,
                type: issue.type
              })), null, 2)
            }
          ]
        };
      }

      case 'get_issues_by_status': {
        const cache = await loadCache(platform);
        const status = args.status as string;
        const issues = cache.workItems.filter((issue: any) =>
            issue.state.toLowerCase() === status.toLowerCase()
        );
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(issues.map((issue: any) => ({
                key: issue.key,
                id: issue.id,
                title: issue.title,
                state: issue.state,
                assignedTo: issue.assignedTo
              })), null, 2)
            }
          ]
        };
      }

      case 'get_issue_details': {
        const cache = await loadCache(platform);
        const issueKey = args.issueKey as string;
        const issue = cache.workItems.find((issue: any) =>
            issue.key === issueKey || issue.id === issueKey
        );

        if (!issue) {
          throw new Error(`Issue ${issueKey} not found in cache. Run "npm run refresh:jira" to update.`);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                key: issue.key,
                id: issue.id,
                title: issue.title,
                description: issue.description,
                state: issue.state,
                assignedTo: issue.assignedTo,
                createdDate: issue.createdDate,
                changedDate: issue.changedDate,
                labels: issue.labels,
                comments: issue.comments
              }, null, 2)
            }
          ]
        };
      }

      case 'get_current_sprint_info': {
        const cache = await loadCache(platform);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                name: cache.sprint?.name || 'Unknown Sprint',
                id: cache.sprint?.id,
                state: cache.sprint?.state,
                startDate: cache.sprint?.startDate,
                endDate: cache.sprint?.endDate,
                lastUpdated: cache.lastUpdated,
                totalIssues: cache.workItems.length
              }, null, 2)
            }
          ]
        };
      }

      case 'list_all_current_sprint_issues': {
        const cache = await loadCache(platform);
        const summary = cache.workItems.map((issue: any, idx: number) => ({
          number: idx + 1,
          key: issue.key,
          id: issue.id,
          title: issue.title,
          state: issue.state,
          assignedTo: issue.assignedTo || 'Unassigned',
          labels: issue.labels || 'none'
        }));

        return {
          content: [
            {
              type: 'text',
              text: `Sprint: ${cache.sprint?.name || 'Unknown'}\nLast Updated: ${cache.lastUpdated}\nTotal Issues: ${cache.workItems.length}\n\n${JSON.stringify(summary, null, 2)}`
            }
          ]
        };
      }

      case "refresh_cache_jira": {
        await refreshCacheJira();
        return {
          content: [
            {
              type: 'text',
              text: 'Jira cache refreshed successfully.'
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
