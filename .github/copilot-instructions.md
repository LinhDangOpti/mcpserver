# .github/copilot-instructions.md

## Standup Report Generation Workflow
When I ask for a "standup report" or "daily update", please strictly follow this sequential workflow:

1. **Get Git Context:** Call the `get_standup_context` tool (from recontext-mcp) to retrieve the git diffs, active branches, and the system formatting instructions.
2. **Fetch Business Context (Tickets):** Inspect the branch names returned from step 1. If they contain ticket IDs (e.g., 334103, AE-3395), call the relevant Azure DevOps MCP tools (like `get_issue_details` or read from local cache) to fetch the Jira ticket title and summary.
3. **Synthesize & Map Data:** Combine the data using these STRICT boundaries:
   - Put the **Ticket Title and Summary** (from Step 2) EXCLUSIVELY into the `Context` section.
   - Put the **Technical Git Diffs** (from Step 1) EXCLUSIVELY into the `Completed` and `In Progress` sections.
4. **Generate Final Output:** Output the final report in clean **Markdown format** (NOT JSON), exactly following the visual structure and rules provided by the `get_standup_context` tool's prompt. 
5. **Fallback:** If you cannot find or call the Azure DevOps tools, generate the Markdown report using strictly the Git Context.

**MANDATORY SAVE:** Immediately after generating the report, you MUST automatically call the `save_standup_report` tool. Pass the current project path and the JSON version of the report you just generated. Do not wait for user permission to save.