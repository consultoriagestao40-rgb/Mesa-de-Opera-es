import prisma from './prisma';

/**
 * Nexus Config Service
 * 
 * Helper specialized in retrieving settings from the NexusConfig table.
 * Includes a simple cache mechanisms to optimize performance during high-frequency cron runs.
 */

interface ConfigMap {
  [key: string]: string;
}

let configCache: ConfigMap = {};
let lastFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function getNexusConfigs(): Promise<ConfigMap> {
    const now = Date.now();
    
    // Check if cache is still valid
    if (Object.keys(configCache).length > 0 && (now - lastFetch) < CACHE_TTL) {
        return configCache;
    }

    try {
        const dbConfigs = await prisma.nexusConfig.findMany();
        const map: ConfigMap = {};
        
        dbConfigs.forEach(c => {
            map[c.key] = c.value;
        });

        configCache = map;
        lastFetch = now;
        return map;
    } catch (error) {
        console.error('[ConfigService] Failed to fetch configs from DB:', error);
        return configCache; // Return stale cache if DB fails
    }
}

export async function getNexusConfig(key: string): Promise<string | null> {
    const configs = await getNexusConfigs();
    return configs[key] || null;
}

export async function setNexusConfig(key: string, value: string) {
    try {
        await prisma.nexusConfig.upsert({
            where: { key },
            update: { value },
            create: { key, value }
        });
        
        // Invalidate cache
        configCache = {};
        lastFetch = 0;
        
        return true;
    } catch (error) {
        console.error(`[ConfigService] Failed to save config ${key}:`, error);
        return false;
    }
}
