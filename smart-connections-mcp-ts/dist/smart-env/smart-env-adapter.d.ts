import { SmartEnv } from 'obsidian-smart-env';
export declare class SmartEnvAdapter {
    private env;
    private vaultPath;
    constructor(vaultPath: string);
    /**
     * Initialize Smart Connections environment using their exact libraries
     */
    initialize(): Promise<void>;
    /**
     * Get Smart Connections environment (direct access to their collections)
     */
    getEnv(): SmartEnv;
    /**
     * Access smart_sources collection directly
     */
    get smartSources(): any;
    /**
     * Access smart_blocks collection directly
     */
    get smartBlocks(): any;
    /**
     * Get collection stats
     */
    getStats(): {
        error: string;
        vault_path?: undefined;
        sources_count?: undefined;
        blocks_count?: undefined;
        total_items?: undefined;
        initialized?: undefined;
    } | {
        vault_path: string;
        sources_count: number;
        blocks_count: number;
        total_items: number;
        initialized: boolean;
        error?: undefined;
    };
    /**
     * Check if environment is initialized and ready
     */
    isReady(): boolean;
}
