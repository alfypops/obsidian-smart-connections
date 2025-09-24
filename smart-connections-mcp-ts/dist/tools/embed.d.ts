export declare class SmartConnectionsEmbed {
    private embedModel;
    constructor();
    /**
     * Initialize the embedding model using Smart Connections' exact model
     */
    initialize(): Promise<void>;
    /**
     * Generate embeddings using Smart Connections' exact model and preprocessing
     */
    embed(content: string): Promise<number[]>;
    /**
     * Check if model is ready
     */
    isReady(): boolean;
}
export declare const SMART_CONNECTIONS_EMBED_TOOL: {
    name: string;
    description: string;
    inputSchema: {
        type: string;
        properties: {
            content: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
};
