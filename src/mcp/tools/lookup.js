/**
 * Smart Connections Lookup MCP Tool
 *
 * Provides vector search using Smart Connections exact algorithms
 * Direct access to plugin's SmartEnv and collections
 */

// Simple statistical filtering without external dependency
function get_nearest_until_next_dev_exceeds_std_dev(results) {
  if (results.length <= 2) return results;

  // Calculate mean and standard deviation of scores
  const scores = results.map(r => r.score || r.sim || 0);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const stdDev = Math.sqrt(variance);

  // Return results until the next deviation exceeds one standard deviation
  const filtered = [];
  for (let i = 0; i < results.length - 1; i++) {
    filtered.push(results[i]);
    const currentScore = scores[i];
    const nextScore = scores[i + 1];
    if (Math.abs(currentScore - nextScore) > stdDev) {
      break;
    }
  }

  return filtered.length > 0 ? filtered : results.slice(0, Math.min(10, results.length));
}

export class SmartConnectionsLookupTool {
  constructor(plugin) {
    this.plugin = plugin;
  }

  getToolDefinition() {
    return {
      name: "smart_connections_lookup",
      description: "Search Smart Connections knowledge base using vector similarity, lexical search, or direct vector operations",
      inputSchema: {
        type: "object",
        properties: {
          hypotheticals: {
            type: "array",
            items: { type: "string" },
            description: "Search queries or hypothetical relevant content (for vector search)"
          },
          filter: {
            type: "object",
            properties: {
              limit: {
                type: "number",
                default: 10,
                maximum: 50,
                description: "Maximum number of results to return"
              },
              key_starts_with: {
                type: "string",
                description: "Filter results to keys starting with this string"
              },
              exclude_key_starts_with: {
                type: "string",
                description: "Exclude results with keys starting with this string"
              },
              collection: {
                type: "string",
                enum: ["sources", "blocks", "both"],
                default: "both",
                description: "Which Smart Connections collection to search"
              }
            }
          },
          query_type: {
            type: "string",
            enum: ["vector", "lexical"],
            default: "vector",
            description: "Type of search: vector (semantic) or lexical (keyword)"
          },
          keywords: {
            type: "array",
            items: { type: "string" },
            description: "Keywords for lexical search (required when query_type is lexical)"
          },
          direct_vector: {
            type: "array",
            items: { type: "number" },
            description: "Direct vector for similarity search (bypasses hypotheticals)"
          },
          vector_operation: {
            type: "string",
            enum: ["nearest", "furthest", "nearest_to"],
            default: "nearest",
            description: "Vector operation type when using direct_vector"
          }
        }
      }
    };
  }

  async execute(args) {
    // DEBUG: Log all incoming parameters
    console.log('MCP Lookup Tool - Received args:', JSON.stringify(args, null, 2));

    const {
      query_type = "vector",
      keywords,
      direct_vector,
      vector_operation = "nearest",
      hypotheticals,
      filter = {}
    } = args;

    // Validate plugin environment
    if (!this.plugin.env) {
      throw new Error('Smart Connections environment not ready. Please wait for plugin to fully load.');
    }

    // Default filter values
    const searchFilter = {
      limit: filter.limit || 10,
      collection: filter.collection || 'both',
      ...filter
    };

    try {
      let results = [];

      // Route to lexical search
      if (query_type === "lexical" && keywords) {
        results = await this.performLexicalSearch(keywords, searchFilter);
      }
      // Route to direct vector operations
      else if (direct_vector) {
        results = await this.performDirectVectorSearch(direct_vector, vector_operation, searchFilter);
      }
      // Default: existing vector lookup with hypotheticals
      else if (hypotheticals && hypotheticals.length > 0) {
        results = await this.performVectorSearch(hypotheticals, searchFilter);
      }
      else {
        // Fallback: if no valid search parameters, return empty results
        console.log('No valid search parameters provided, returning empty results');
        results = [];
      }

      // Apply Smart Connections statistical filtering
      if (results.length > 0) {
        results = get_nearest_until_next_dev_exceeds_std_dev(results);
      }

      // Apply limit
      results = results.slice(0, searchFilter.limit);

      // Format results
      const formattedResults = results.map(result => ({
        key: result.key || result.id,
        score: result.score || result.sim || 0,
        content: result.content || result.data?.content || result.text || '',
        path: result.path || result.key,
        type: result.collection_type || 'unknown',
        // Include Smart Connections specific fields
        breadcrumbs: result.breadcrumbs,
        size: result.size,
        last_modified: result.last_modified,
      }));

      return {
        results: formattedResults,
        count: formattedResults.length,
        total_before_limit: results.length,
        search_params: {
          query_type,
          hypotheticals,
          keywords,
          direct_vector: direct_vector ? `[${direct_vector.length} dimensions]` : undefined,
          vector_operation,
          filter: searchFilter,
        },
        plugin_info: {
          vault_name: this.plugin.app.vault.getName(),
          sources_available: !!this.plugin.env.smart_sources,
          blocks_available: !!this.plugin.env.smart_blocks,
          sources_count: this.plugin.env.smart_sources?.items ? Object.keys(this.plugin.env.smart_sources.items).length : 0,
          blocks_count: this.plugin.env.smart_blocks?.items ? Object.keys(this.plugin.env.smart_blocks.items).length : 0,
        }
      };

    } catch (error) {
      console.error('Smart Connections lookup error:', error);
      throw new Error(`Lookup failed: ${error.message}`);
    }
  }

  async performVectorSearch(hypotheticals, searchFilter) {
    let results = [];

    // Search based on collection preference
    if (searchFilter.collection === 'sources' || searchFilter.collection === 'both') {
      if (this.plugin.env.smart_sources) {
        const sourceResults = await this.searchCollection(
          this.plugin.env.smart_sources,
          { hypotheticals },
          searchFilter,
          'source'
        );
        results = results.concat(sourceResults);
      }
    }

    if (searchFilter.collection === 'blocks' || searchFilter.collection === 'both') {
      if (this.plugin.env.smart_blocks) {
        const blockResults = await this.searchCollection(
          this.plugin.env.smart_blocks,
          { hypotheticals },
          searchFilter,
          'block'
        );
        results = results.concat(blockResults);
      }
    }

    return results;
  }

  async performLexicalSearch(keywords, searchFilter) {
    let results = [];

    // Search based on collection preference
    if (searchFilter.collection === 'sources' || searchFilter.collection === 'both') {
      if (this.plugin.env.smart_sources && this.plugin.env.smart_sources.search) {
        try {
          const sourceResults = await this.plugin.env.smart_sources.search({
            keywords,
            limit: searchFilter.limit,
            key_starts_with: searchFilter.key_starts_with,
            exclude_key_starts_with: searchFilter.exclude_key_starts_with
          });
          results = results.concat(sourceResults.map(result => ({
            ...result,
            collection_type: 'source'
          })));
        } catch (error) {
          console.warn('Lexical search not available for sources:', error);
        }
      }
    }

    if (searchFilter.collection === 'blocks' || searchFilter.collection === 'both') {
      if (this.plugin.env.smart_blocks && this.plugin.env.smart_blocks.search) {
        try {
          const blockResults = await this.plugin.env.smart_blocks.search({
            keywords,
            limit: searchFilter.limit,
            key_starts_with: searchFilter.key_starts_with,
            exclude_key_starts_with: searchFilter.exclude_key_starts_with
          });
          results = results.concat(blockResults.map(result => ({
            ...result,
            collection_type: 'block'
          })));
        } catch (error) {
          console.warn('Lexical search not available for blocks:', error);
        }
      }
    }

    // Fallback to vector search if lexical search is not available
    if (results.length === 0) {
      console.log('Lexical search returned no results, falling back to vector search with keywords as hypotheticals');
      results = await this.performVectorSearch(keywords, searchFilter);
    }

    return results;
  }

  async performDirectVectorSearch(direct_vector, vector_operation, searchFilter) {
    const targetCollection = this.getTargetCollection(searchFilter);
    let results = [];

    try {
      switch(vector_operation) {
        case "nearest":
          if (targetCollection.nearest) {
            results = await targetCollection.nearest(direct_vector, {
              limit: searchFilter.limit,
              key_starts_with: searchFilter.key_starts_with,
              exclude_key_starts_with: searchFilter.exclude_key_starts_with
            });
          }
          break;
        case "furthest":
          if (targetCollection.furthest) {
            results = await targetCollection.furthest(direct_vector, {
              limit: searchFilter.limit,
              key_starts_with: searchFilter.key_starts_with,
              exclude_key_starts_with: searchFilter.exclude_key_starts_with
            });
          }
          break;
        case "nearest_to":
          // This would require an entity key to find similar items to
          // For now, fallback to nearest
          if (targetCollection.nearest) {
            results = await targetCollection.nearest(direct_vector, {
              limit: searchFilter.limit,
              key_starts_with: searchFilter.key_starts_with,
              exclude_key_starts_with: searchFilter.exclude_key_starts_with
            });
          }
          break;
      }

      // Add collection type to results
      const collection_type = searchFilter.collection === 'sources' ? 'source' :
                             searchFilter.collection === 'blocks' ? 'block' : 'unknown';
      results = results.map(result => ({
        ...result,
        collection_type
      }));

    } catch (error) {
      console.warn(`Direct vector ${vector_operation} operation failed:`, error);
      // Fallback to regular vector search
      results = await this.performVectorSearch([`vector search with ${direct_vector.length} dimensions`], searchFilter);
    }

    return results;
  }

  getTargetCollection(searchFilter) {
    const collection = searchFilter.collection || 'sources';
    if (collection === 'sources') return this.plugin.env.smart_sources;
    if (collection === 'blocks') return this.plugin.env.smart_blocks;
    return this.plugin.env.smart_sources; // default
  }

  async searchCollection(collection, params, filter, collectionType) {
    try {
      // Use Smart Connections exact lookup method
      const lookupParams = {
        ...params,
      };

      // Apply key filters
      if (filter.key_starts_with) {
        lookupParams.key_starts_with = filter.key_starts_with;
      }
      if (filter.exclude_key_starts_with) {
        lookupParams.exclude_key_starts_with = filter.exclude_key_starts_with;
      }

      const results = await collection.lookup(lookupParams);

      // Ensure results is an array before mapping
      if (!Array.isArray(results)) {
        console.warn(`Collection lookup returned non-array:`, results);
        return [];
      }

      // Add collection type to results
      return results.map(result => ({
        ...result,
        collection_type: collectionType
      }));

    } catch (error) {
      console.warn(`Failed to search ${collectionType} collection:`, error);
      return [];
    }
  }
}