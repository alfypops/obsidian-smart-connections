export declare class SmartCacheManager {
    private lastModifiedTimes;
    private ttlSeconds;
    constructor(ttlSeconds?: number);
    /**
     * Check if Smart Connections data should be reloaded
     */
    shouldReload(vaultPath: string): Promise<boolean>;
    /**
     * Update cache timestamp for vault
     */
    updateCache(vaultPath: string): void;
    /**
     * Get cache statistics for debugging
     */
    getCacheStats(vaultPath: string): {
        last_loaded: number;
        cache_age_seconds: number;
        vault_path: string;
    };
}
