import path from "path";
import os from "os";
import { fileURLToPath } from 'url';
import fs from "fs";

export function getCacheDir(cacheFileName: string): { cacheDir: string, cacheFilePath: string }{
    if (process.env.CLIENT_CACHE_NAME) {
        // To save cache in the user's home directory under a specific folder for the project
        const projectName = process.env.CLIENT_CACHE_NAME || path.basename(process.cwd());
        const cacheDir = path.join(os.homedir(), '.ado-mcpserver', 'cache');
        const cacheFilePath = path.join(cacheDir, `${projectName}.${cacheFileName}.json`);

        return { cacheDir, cacheFilePath };
    } else {
        //  To save cache in the same directory as the script
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = path.dirname(__filename);
        const cacheDir = path.join(__dirname, '..', 'cache');
        const cacheFilePath = path.join(cacheDir, `${cacheFileName}.json`);

        return { cacheDir, cacheFilePath };
    }
}

export async function loadCache(platform: 'ado' | 'jira') {
    const { cacheFilePath } = getCacheDir(platform === 'ado' ? 'work-items' : 'jira-issues');

    if (!fs.existsSync(cacheFilePath)) {
        throw new Error('Cache file not found. Finding and running refresh_cache_jira or refresh_cache_ado tool will populate the cache.');
    }

    const data = fs.readFileSync(cacheFilePath, 'utf8');
    return JSON.parse(data);
}
