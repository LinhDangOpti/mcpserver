# Quick Setup Guide for Team Members

## 🚀 Getting Started (5 minutes)

### Step 1: Clone the Repository
```bash
git clone https://github.com/LinhDangOpti/mcpserver.git
cd mcpserver
```

### Step 2: Install Dependencies
```bash
npm install
npm run build
```

### Step 3: Configure Your Credentials

Create a `.env` file (copy from `.env.example`):
```bash
cp .env.example .env
```

Then edit `.env` with your details:
```env
AZURE_DEVOPS_ORG_URL=https://ericsson-web.visualstudio.com
AZURE_DEVOPS_TOKEN=your-personal-access-token
AZURE_DEVOPS_PROJECT=ericssondotcom-vnext
AZURE_DEVOPS_USER_EMAIL=your.email@ericsson.com
```

**To get your Personal Access Token:**
1. Go to Azure DevOps → User Settings → Personal Access Tokens
2. Click "New Token"
3. Name it "MCP Server"
4. Select scope: "Work Items (Read)"
5. Copy the token and paste it in `.env`

### Step 4: Refresh Cache
```bash
npm run refresh
```

You should see:
```
Found X user stories with your verify tasks
✓ Cache updated successfully!
```

### Step 5: Test It
Ask GitHub Copilot in VS Code:
```
show my sprint user stories
```

## 🎯 Daily Usage

**Morning routine:**
```bash
npm run refresh
```

**Query anytime:**
- Just ask Copilot in VS Code
- Or use CLI: `node cli.js my-verify`

## ❓ Troubleshooting

**Issue:** "Found 0 user stories"
- Check your email in `.env` matches Azure DevOps exactly
- Make sure you have "Verify" tasks assigned in current sprint

**Issue:** "Error connecting to Azure DevOps"
- Verify your Personal Access Token is valid
- Check the ORG_URL and PROJECT name

**Issue:** Copilot doesn't respond
- Make sure MCP server is configured in `.vscode/settings.json`
- Restart VS Code

## 💡 Tips

- Refresh cache once per day (morning)
- Cache includes all comments and descriptions
- Works offline once cached
- Use `npm run query` for CLI-based queries

## 📞 Need Help?

Contact the tool creator or check the main [README.md](README.md) for detailed documentation.
