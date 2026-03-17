import path from "path";
import os from "os";
import { fileURLToPath } from 'url';

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
