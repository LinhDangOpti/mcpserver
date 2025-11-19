import * as azdev from 'azure-devops-node-api';
import type { WorkItem } from 'azure-devops-node-api/interfaces/WorkItemTrackingInterfaces.js';
import type { TeamSettingsIteration } from 'azure-devops-node-api/interfaces/WorkInterfaces.js';

export class AzureDevOpsClient {
  private connection: azdev.WebApi;
  private orgUrl: string;
  private project: string;

  constructor(orgUrl: string, token: string, project: string) {
    this.orgUrl = orgUrl;
    this.project = project;
    
    const authHandler = azdev.getPersonalAccessTokenHandler(token);
    this.connection = new azdev.WebApi(orgUrl, authHandler);
  }

  // Get all work items by query
  async getWorkItemsByQuery(wiql: string): Promise<WorkItem[]> {
    const witApi = await this.connection.getWorkItemTrackingApi();
    const queryResult = await witApi.queryByWiql({ query: wiql }, { project: this.project });
    
    if (!queryResult.workItems || queryResult.workItems.length === 0) {
      return [];
    }

    const ids = queryResult.workItems.map(wi => wi.id!);
    
    // Azure DevOps API has a limit of 200 work items per request, so batch the requests
    const batchSize = 200;
    const workItems: WorkItem[] = [];
    
    for (let i = 0; i < ids.length; i += batchSize) {
      const batchIds = ids.slice(i, i + batchSize);
      const batchWorkItems = await witApi.getWorkItems(batchIds, undefined, undefined, undefined, 1);
      workItems.push(...batchWorkItems);
    }
    
    return workItems;
  }

  // Get work items for current user in current sprint
  async getMyCurrentSprintItems(userEmail: string): Promise<WorkItem[]> {
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.AssignedTo] = '${userEmail}'
        AND [System.IterationPath] = @currentIteration
      ORDER BY [System.ChangedDate] DESC
    `;
    return this.getWorkItemsByQuery(wiql);
  }

  // Get all tickets by state
  async getWorkItemsByState(state: string): Promise<WorkItem[]> {
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.State] = '${state}'
      ORDER BY [System.ChangedDate] DESC
    `;
    return this.getWorkItemsByQuery(wiql);
  }

  // Get current sprint information
  async getCurrentSprint(): Promise<TeamSettingsIteration> {
    const workApi = await this.connection.getWorkApi();
    const teamContext = { project: this.project, team: this.project };
    
    const iterations = await workApi.getTeamIterations(teamContext, 'current');
    return iterations[0];
  }

  // Get work item details
  async getWorkItem(id: number): Promise<WorkItem> {
    const witApi = await this.connection.getWorkItemTrackingApi();
    return await witApi.getWorkItem(id);
  }

  // Get work item comments
  async getWorkItemComments(id: number): Promise<any> {
    const witApi = await this.connection.getWorkItemTrackingApi();
    try {
      return await witApi.getComments(this.project, id);
    } catch (error) {
      return { comments: [] };
    }
  }

  // Get all work items in current sprint
  async getAllCurrentSprintItems(): Promise<WorkItem[]> {
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.IterationPath] = @currentIteration
      ORDER BY [System.State] ASC, [System.ChangedDate] DESC
    `;
    return this.getWorkItemsByQuery(wiql);
  }

  // Get all user stories in current sprint
  async getAllCurrentSprintUserStories(): Promise<WorkItem[]> {
    const wiql = `
      SELECT [System.Id], [System.Title], [System.State], [System.AssignedTo]
      FROM WorkItems
      WHERE [System.IterationPath] = @currentIteration
        AND [System.WorkItemType] = 'User Story'
      ORDER BY [System.State] ASC, [System.ChangedDate] DESC
    `;
    return this.getWorkItemsByQuery(wiql);
  }

  // Get child tasks for a work item
  async getChildTasks(parentId: number): Promise<WorkItem[]> {
    const witApi = await this.connection.getWorkItemTrackingApi();
    const workItem = await witApi.getWorkItem(parentId, undefined, undefined, 1);
    
    if (!workItem.relations) {
      return [];
    }

    // Filter child relations
    const childIds = workItem.relations
      .filter(rel => rel.rel === 'System.LinkTypes.Hierarchy-Forward')
      .map(rel => {
        const url = rel.url!;
        const id = parseInt(url.substring(url.lastIndexOf('/') + 1));
        return id;
      });

    if (childIds.length === 0) {
      return [];
    }

    const children = await witApi.getWorkItems(childIds, undefined, undefined, undefined, 1);
    return children;
  }

  // Get user stories with my verify tasks
  async getUserStoriesWithMyVerifyTasks(userEmail: string): Promise<WorkItem[]> {
    // First get all user stories
    const userStories = await this.getAllCurrentSprintUserStories();
    
    // For each user story, get child tasks
    const storiesWithVerifyTasks: WorkItem[] = [];
    
    for (const story of userStories) {
      const children = await this.getChildTasks(story.id!);
      
      // Check if any child task is assigned to user and title starts with "Verify"
      const hasMyVerifyTask = children.some(child => {
        const title = child.fields?.['System.Title'] || '';
        const assignedTo = child.fields?.['System.AssignedTo']?.uniqueName || '';
        const workItemType = child.fields?.['System.WorkItemType'] || '';
        
        return workItemType === 'Task' && 
               title.startsWith('Verify') && 
               assignedTo === userEmail;
      });
      
      if (hasMyVerifyTask) {
        storiesWithVerifyTasks.push(story);
      }
    }
    
    return storiesWithVerifyTasks;
  }
}