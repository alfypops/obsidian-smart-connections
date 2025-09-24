#!/usr/bin/env node
/**
 * Smart Connections MCP Server
 *
 * Provides programmatic access to Smart Connections' vector database
 * via Model Context Protocol tools using their exact libraries.
 */
export declare class SmartConnectionsMCPServer {
    private server;
    private envAdapters;
    private embedService;
    private cacheManager;
    constructor();
    private getEnvAdapter;
    private getEmbedService;
    private setupHandlers;
    private handleLookup;
    private handleEmbed;
    run(): Promise<void>;
}
