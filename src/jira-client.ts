export interface JiraIssue {
  id: string;
  key: string;
  fields: {
    summary: string;
    description?: any;
    status: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    labels?: string[];
    comment?: {
      comments: any[];
    };
    issuetype: {
      name: string;
    };
    [key: string]: any,
  };
}

export interface JiraSprint {
  id: number;
  name: string;
  state: string;
  startDate?: string;
  endDate?: string;
  originBoardId?: number;
}

export class JiraClient {
  private readonly baseUrl: string;
  private readonly email: string;
  private readonly apiToken: string;
  private readonly project: string;
  private boardId?: string;

  constructor(baseUrl: string, email: string, apiToken: string, project: string, boardId?: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.email = email;
    this.apiToken = apiToken;
    this.project = project;
    this.boardId = boardId;
  }

  private getAuthHeader(): string {
    return 'Basic ' + Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
  }

  private async fetchJira(url: string, options: RequestInit = {}): Promise<any> {
    const headers = {
      'Authorization': this.getAuthHeader(),
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Jira API error (${response.status}): ${errorText}`);
    }

    return response.json();
  }

  // Execute JQL query
  async searchByJql(jql: string, fields?: string[], maxResults: number = 100): Promise<JiraIssue[]> {
    const url = `${this.baseUrl}/rest/api/3/search/jql`;
    const body = {
      jql,
      maxResults,
      fields: fields || ['*all'],
    };

    const result = await this.fetchJira(url, {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return result.issues || [];
  }

  // Get issues assigned to user in current sprint
  async getMyCurrentSprintIssues(userEmail: string): Promise<JiraIssue[]> {
    const jql = `assignee = "${userEmail}" AND sprint in openSprints() AND project = "${this.project}" ORDER BY updated DESC`;
    return this.searchByJql(jql);
  }

  // Get issues by status
  async getIssuesByStatus(status: string): Promise<JiraIssue[]> {
    const jql = `status = "${status}" AND sprint in openSprints() AND project = "${this.project}" ORDER BY updated DESC`;
    return this.searchByJql(jql);
  }

  // Get current sprint information
  async getCurrentSprint(): Promise<JiraSprint | null> {
    try {
      if (!this.boardId) {
        // Try to find board by project
        const boardsUrl = `${this.baseUrl}/rest/agile/1.0/board?projectKeyOrId=${this.project}`;
        const boardsResult = await this.fetchJira(boardsUrl);
        
        if (boardsResult?.values && boardsResult?.values.length > 0) {
          this.boardId = boardsResult.values[0].id.toString();
        } else {
          throw new Error('No board found for project');
        }
      }

      // Get active sprints for the board
      const sprintUrl = `${this.baseUrl}/rest/agile/1.0/board/${this.boardId}/sprint?state=active`;
      const sprintResult = await this.fetchJira(sprintUrl);

      if (sprintResult?.values && sprintResult?.values?.length > 0) {
        return sprintResult.values[0];
      }

      return null;
    } catch (error) {
      console.error('Error getting current sprint:', error);
      return null;
    }
  }

  // Get issue details
  async getIssue(issueKeyOrId: string): Promise<JiraIssue> {
    const url = `${this.baseUrl}/rest/api/3/issue/${issueKeyOrId}`;
    return this.fetchJira(url);
  }

  // Get issue comments
  async getIssueComments(issueKeyOrId: string): Promise<any[]> {
    try {
      const url = `${this.baseUrl}/rest/api/3/issue/${issueKeyOrId}/comment`;
      const result = await this.fetchJira(url);
      return result.comments || [];
    } catch (error) {
      return [];
    }
  }

  // Get issue development information (commits, PRs, branches)
  async getIssueDevelopmentLinks(issueKeyOrId: string): Promise<any> {
    try {
      // Get issue with development info
      const url = `${this.baseUrl}/rest/dev-status/latest/issue/detail?issueId=${issueKeyOrId}&applicationType=GitHub&dataType=repository`;
      
      try {
        const devStatus = await this.fetchJira(url);
        
        const pullRequests = devStatus?.detail?.[0]?.pullRequests || [];
        const branches = devStatus?.detail?.[0]?.branches || [];
        const commits = devStatus?.detail?.[0]?.repositories?.[0]?.commits || [];

        return {
          pullRequests,
          commits,
          branches,
          hasPullRequests: pullRequests.length > 0,
          hasCommits: commits.length > 0,
          hasBranches: branches.length > 0,
        };
      } catch (error) {
        return {
          pullRequests: [],
          commits: [],
          branches: [],
          hasPullRequests: false,
          hasCommits: false,
          hasBranches: false,
        };
      }
    } catch (error) {
      return {
        pullRequests: [],
        commits: [],
        branches: [],
        hasPullRequests: false,
        hasCommits: false,
        hasBranches: false,
      };
    }
  }

  // Get all issues in current sprint
  async getAllCurrentSprintIssues(): Promise<JiraIssue[]> {
    const jql = `sprint in openSprints() AND project = "${this.project}" ORDER BY status ASC, updated DESC`;
    return this.searchByJql(jql, undefined, 1000);
  }

  // Get all user stories and bugs in current sprint
  async getAllCurrentSprintUserStories(): Promise<JiraIssue[]> {
    const jql = `sprint in openSprints() AND project = "${this.project}" AND (type = "Story" OR type = "Bug") ORDER BY status ASC, updated DESC`;
    return this.searchByJql(jql, undefined, 1000);
  }

  // Get child issues (subtasks)
  async getChildIssues(parentKey: string): Promise<JiraIssue[]> {
    const jql = `parent = "${parentKey}" ORDER BY created ASC`;
    return this.searchByJql(jql);
  }

  // Get user stories with my verify subtasks
  async getUserStoriesWithMyVerifySubtasks(userEmail: string): Promise<JiraIssue[]> {
    // First get all user stories in current sprint
    const userStories = await this.getAllCurrentSprintUserStories();

    // For each user story, check if it has verify subtasks assigned to user
    const storiesWithVerifyTasks: JiraIssue[] = [];

    for (const story of userStories) {
      const subtasks = await this.getChildIssues(story.key);

      // Check if any subtask is assigned to user and summary starts with "Verify"
      const hasMyVerifyTask = subtasks.some(subtask => {
        const summary = subtask.fields?.summary || '';
        const assigneeEmail = subtask.fields?.assignee?.emailAddress || '';
        const isSubtask = subtask.fields?.issuetype?.name === 'Sub-task';

        return isSubtask &&
          summary.startsWith('Verify') &&
          assigneeEmail === userEmail;
      });

      if (hasMyVerifyTask) {
        storiesWithVerifyTasks.push(story);
      }
    }

    return storiesWithVerifyTasks;
  }

  async queryIssuesByJql(naturalQuery: string): Promise<JiraIssue[]> {
    // Convert natural language to JQL
    let jql = `project = "${this.project}" AND sprint in openSprints()`;

    const queryLower = naturalQuery.toLowerCase();

    // Parse status filters
    const statuses = ['to do', 'in progress', 'done', 'testing', 'review', 'blocked'];
    const matchedStatuses = statuses.filter(s => queryLower.includes(s));
    
    if (matchedStatuses.length > 0) {
      const statusConditions = matchedStatuses.map(s => `status = "${s}"`).join(' OR ');
      jql += ` AND (${statusConditions})`;
    }

    // Parse development filters
    if (queryLower.includes('no commit') || queryLower.includes('without commit')) {
      jql += ` AND development[commits].count = 0`;
    }
    if (queryLower.includes('no pr') || queryLower.includes('without pr')) {
      jql += ` AND development[pullrequests].count = 0`;
    }
    if (queryLower.includes('has commit') || queryLower.includes('with commit')) {
      jql += ` AND development[commits].count > 0`;
    }
    if (queryLower.includes('has pr') || queryLower.includes('with pr')) {
      jql += ` AND development[pullrequests].count > 0`;
    }

    // Parse assignee
    const assigneeMatch = naturalQuery.match(/assign(?:ed)?\s+to\s+(\w+)/i);
    if (assigneeMatch) {
      const assignee = assigneeMatch[1];
      jql += ` AND assignee = "${assignee}"`;
    }

    jql += ' ORDER BY updated DESC';

    return this.searchByJql(jql, undefined, 1000);
  }
}
