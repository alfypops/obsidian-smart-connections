import { SmartEnvAdapter } from '../smart-env/smart-env-adapter.js';
export declare class SmartConnectionsLookup {
    private envAdapter;
    constructor(envAdapter: SmartEnvAdapter);
    /**
     * Perform lookup using Smart Connections' exact lookup method
     */
    lookup(params: {
        hypotheticals: string[];
        filter?: {
            limit?: number;
            key_starts_with?: string;
            key_starts_with_any?: string[];
        };
    }): Promise<any[]>;
    /**
     * Calculate cosine similarity using Smart Connections' exact function
     */
    static cosineSimilarity(vecA: number[], vecB: number[]): number;
    /**
     * Search both sources and blocks collections
     */
    searchAll(params: {
        hypotheticals: string[];
        filter?: {
            limit?: number;
            key_starts_with?: string;
            key_starts_with_any?: string[];
        };
    }): Promise<any[]>;
    /**
     * Helper method to lookup in a specific collection
     */
    private lookupInCollection;
}
export declare const SMART_CONNECTIONS_LOOKUP_TOOL: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            hypotheticals: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
                minItems: number;
            };
            vault_path: {
                type: string;
                description: string;
            };
            filter: {
                type: string;
                properties: {
                    limit: {
                        type: string;
                        default: number;
                        maximum: number;
                    };
                    key_starts_with: {
                        type: string;
                    };
                    key_starts_with_any: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                };
            };
            search_both: {
                type: string;
                default: boolean;
                description: string;
            };
        };
        required: string[];
    };
};
