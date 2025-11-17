# Azure DevOps MCP Server

A **Model Context Protocol (MCP)** server that integrates Azure DevOps with GitHub Copilot Chat, allowing you to query work items naturally through conversation 

## 🚀 What is MCP?

**Model Context Protocol (MCP)** is an open standard that connects AI assistants like GitHub Copilot to external data sources. This tool implements an MCP server that:

- 🔌 **Connects GitHub Copilot** to your Azure DevOps project
- 💬 **Enables natural language queries** - just ask Copilot about your tickets
- ⚡ **Provides instant responses** from cached data
- 🔒 **Keeps your data local** - no third-party services involved

Instead of switching between VS Code and Azure DevOps web portal, you can ask Copilot directly:
- "Show my sprint tickets"
- "Summarize ticket 13080"
- "What tickets are in ACC?"

## 🎯 What This Does

This tool helps you:
- **Instantly view** all User Stories where you have verification tasks assigned
- **Query cached data** without API rate limits or permission prompts
- **Summarize tickets** with full details including comments and descriptions
- **Track your sprint work** efficiently
- **Stay in your IDE** - no context switching needed

## ✨ Key Features

- 🔌 **MCP Protocol Implementation** - Native integration with GitHub Copilot via Model Context Protocol
- 🚀 **Cache-based queries** - Instant responses from local cache
- 🔍 **Smart filtering** - Automatically finds User Stories with your query
- 💬 **Full ticket details** - Descriptions, comments, state, assignees, tags
- 📊 **Sprint tracking** - Focused on current sprint items only
- 🤖 **Natural language interface** - Ask Copilot in plain English, no special syntax needed

## 🛠️ Setup

### 1. Prerequisites
- Node.js installed
- Azure DevOps personal access token

### 2. Configuration

Create a `.env` file with your credentials:

```env
AZURE_DEVOPS_ORG_URL=https://your-org.visualstudio.com
AZURE_DEVOPS_TOKEN=your-personal-access-token
AZURE_DEVOPS_PROJECT=your-project-name
AZURE_DEVOPS_USER_EMAIL=your.email@company.com
```

### 3. Install Dependencies

```bash
npm install
npm run build
```

## 📖 How to Use

### Step 1: Refresh Cache (Once per day or when needed)

```bash
npm run refresh
```

This fetches all User Stories from the current sprint where you have a "Verify" task assigned. Takes ~10-30 seconds depending on the number of stories.

**Output example:**
```
Found 12 user stories with your verify tasks
✓ Cache updated successfully!
  Work items: 12
  Last updated: 2025-11-17T07:33:36.435Z
```

### Step 2: Query Your Tickets (Instant, no prompts!)

After caching, you can query instantly using GitHub Copilot Chat in VS Code:

**In Copilot Chat, ask:**
- `show all my sprint user stories`
- `summarize ticket 13080`
- `show all tickets in status "In ACC"`
- `show tickets with tag "HIGHPRIO"`

**Or use the CLI:**

```bash
# List all your verify stories
node cli.js my-verify

# Get details of a specific ticket
node cli.js item 13080

# Query cached data
npm run query
```

### Query Cache Commands

```bash
npm run query
```

Available commands:
- `list` - List all cached user stories
- `item <id>` - Show details for a specific ticket
- `by-state <state>` - Filter by state (Active, "In ACC", New, etc.)
- `info` - Show cache information

## 🎨 MCP Server Integration with GitHub Copilot

### What Makes This Special?

This tool implements the **Model Context Protocol (MCP)**, which means:

1. **🔌 Direct Integration** - Copilot can access your Azure DevOps data as if it's a native feature
2. **💬 Natural Conversation** - No special commands or syntax needed
3. **⚡ Real-time Context** - Copilot knows about your tickets while you code
4. **🔒 Secure & Local** - Your data stays on your machine, accessed via your personal token

### How It Works

```
┌─────────────────┐
│  GitHub Copilot │  "Show my sprint tickets"
│   in VS Code    │
└────────┬────────┘
         │ MCP Protocol
         ▼
┌─────────────────┐
│   MCP Server    │  Queries local cache
│   (This Tool)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Cached Data    │  Your sprint tickets
│  work-items.json│  (refreshed from Azure DevOps)
└─────────────────┘
```
```

### MCP Configuration

The MCP server is configured in `.vscode/settings.json`:

```json
{
  "github.copilot.chat.codeGeneration.instructions": [
    {
      "file": "azure-devops-mcp-server"
    }
  ],
  "mcp.servers": {
    "azure-devops": {
      "command": "node",
      "args": ["dist/index.js"],
      "cwd": "${workspaceFolder}/azure-devops-mcp-server"
    }
  }
}
```

This tells VS Code to run the MCP server when Copilot needs Azure DevOps data.

## 📁 Project Structure

```
azure-devops-mcp-server/
├── src/
│   ├── azure-devops-client.ts    # Azure DevOps API client
│   └── index.ts                  # MCP server implementation
├── cache/
│   └── work-items.json           # Cached sprint data
├── cli.js                        # Command-line interface
├── refresh-cache.js              # Cache refresh script
├── query-cache.js               # Cache query script
├── .env                          # Your credentials (gitignored)
└── package.json                  # Project configuration
```

## 🔄 Typical Workflow

1. **Morning:** Run `npm run refresh` to get today's sprint data
2. **During work:** Ask Copilot about tickets - instant responses from cache
3. **Need updates?** Run `npm run refresh` again

## 🎯 Why This Matters

**Before this tool:**
- Every query required clicking "Allow" button
- Interrupts your flow
- Slow responses

**With this tool:**
- Cache once, query unlimited times
- No permission prompts
- Instant responses in Copilot Chat

## 🚀 Quick Start for Team Members

1. **Clone/copy this folder** to your machine
2. **Create `.env` file** with your Azure DevOps credentials
3. **Install dependencies:** `npm install && npm run build`
4. **Refresh cache:** `npm run refresh`
5. **Configure VS Code** to enable MCP server (see MCP Configuration above)
6. **Start chatting with Copilot** about your tickets!

> 💡 **Pro Tip:** Once the MCP server is running, Copilot becomes your Azure DevOps assistant. Just ask questions naturally!

## 💡 Tips

- Refresh cache at the start of your workday
- Cache includes all comments and descriptions
- Works offline once cached
- Cache file is human-readable JSON (check `cache/work-items.json`)

## 🔧 Troubleshooting

**"Error: azureClient.getUserStoriesWithMyVerifyTasks is not a function"**
- Run `npm run build` to recompile TypeScript

**"Found 0 user stories"**
- Check your email in `.env` matches Azure DevOps
- Verify you have "Verify" tasks assigned in current sprint

**Cache is outdated**
- Run `npm run refresh` to update

## 📝 License

ISC
