# Smart Connections MCP Content Retrieval Bug Report

**Issue Date**: 2025-09-24
**Reporter**: Claude Code Analysis
**Priority**: High
**Status**: Open

## 🚨 Problem Summary

The Smart Connections MCP server is consistently returning **empty content fields (`""`)** for all search results, despite successfully finding and ranking relevant documents. Users receive only structural/metadata information (paths, scores, keys) but no actual document content.

## 📋 Bug Details

### **Symptoms**
- ✅ MCP search functionality works correctly
- ✅ Relevance scoring and document ranking works
- ✅ Path and metadata information is returned
- ✅ Enhanced query capabilities (lexical, direct vector) function properly
- ❌ **All `content` fields are empty strings (`""`)**
- ❌ No actual document text is accessible via MCP

### **Expected Behavior**
```json
{
  "key": "document.md",
  "score": 0.85,
  "content": "This is the actual content from the document...",
  "path": "document.md",
  "type": "source"
}
```

### **Actual Behavior**
```json
{
  "key": "document.md",
  "score": 0.85,
  "content": "",
  "path": "document.md",
  "type": "source"
}
```

## 🔍 Investigation Results

### **MCP Test Results**
- **Sources Collection**: All content fields empty
- **Blocks Collection**: All content fields empty
- **Vector Search**: Metadata works, content missing
- **Lexical Search**: Metadata works, content missing
- **Direct Vector**: Metadata works, content missing

### **Affected Areas**
- **File**: `src/mcp/tools/lookup.js`
- **Methods**: `searchCollection()`, `performVectorSearch()`, `performLexicalSearch()`
- **Collections**: Both `smart_sources` and `smart_blocks`

## 🔧 Root Cause Analysis

### **Potential Causes**

#### 1. **Content Property Mapping Issue**
The MCP tool might be looking for content in the wrong property path:
```javascript
// Current mapping in formatResults
content: result.content || result.data?.content || result.text || ''
```
**Issue**: Smart Collections might store content in a different property

#### 2. **Collection Lookup Response Structure**
The `collection.lookup()` method might not return content by default:
```javascript
const results = await collection.lookup(lookupParams);
```
**Issue**: May need additional parameters to include content

#### 3. **Content Loading Configuration**
Smart Connections might require explicit content loading:
```javascript
// Might need content-specific parameters
const lookupParams = {
  hypotheticals,
  include_content: true,  // Missing?
  load_content: true,     // Missing?
};
```

#### 4. **Async Content Loading**
Content might be loaded asynchronously after initial lookup:
```javascript
// Might need additional step
const results = await collection.lookup(lookupParams);
for (let result of results) {
  result.content = await result.loadContent(); // Missing?
}
```

#### 5. **Plugin Environment Issue**
Content might not be available when MCP server initializes or processes requests.

## 🛠️ Proposed Fixes

### **Fix 1: Investigate Content Property Paths**
**Priority**: High
**Effort**: Low

```javascript
// Debug actual result structure
console.log('DEBUG - Raw result structure:', JSON.stringify(result, null, 2));

// Try different content property paths
content: result.content ||
         result.data?.content ||
         result.text ||
         result.raw_content ||
         result.file_content ||
         result.source_content ||
         result.block_content ||
         ''
```

### **Fix 2: Add Content-Specific Lookup Parameters**
**Priority**: High
**Effort**: Medium

```javascript
const lookupParams = {
  ...params,
  include_content: true,
  load_full_content: true,
  return_content: true,
  content_length: 2000, // Limit content size
};
```

### **Fix 3: Explicit Content Loading**
**Priority**: Medium
**Effort**: Medium

```javascript
// After getting results, load content explicitly
for (let result of results) {
  if (result.loadContent) {
    result.content = await result.loadContent();
  } else if (result.getContent) {
    result.content = await result.getContent();
  } else if (result.source) {
    result.content = await result.source.getContent();
  }
}
```

### **Fix 4: Direct Smart Environment Access**
**Priority**: Medium
**Effort**: High

```javascript
// Bypass collection lookup and access files directly
const entity = this.plugin.env.smart_sources.get(result.key);
if (entity && entity.data && entity.data.content) {
  result.content = entity.data.content;
}
```

### **Fix 5: Plugin State Verification**
**Priority**: Low
**Effort**: Low

```javascript
// Verify plugin environment state
console.log('Plugin env status:', {
  sources_loaded: !!this.plugin.env.smart_sources,
  sources_items_count: Object.keys(this.plugin.env.smart_sources.items).length,
  first_source_has_content: !!Object.values(this.plugin.env.smart_sources.items)[0]?.data?.content
});
```

## 🧪 Testing Plan

### **Phase 1: Diagnosis**
1. **Add debug logging** to see raw result structures from `collection.lookup()`
2. **Inspect Smart Collections items** directly to verify content exists
3. **Test different lookup parameters** to see if content can be retrieved

### **Phase 2: Fix Implementation**
1. **Implement most promising fix** based on diagnosis results
2. **Test with various document types** (markdown, text, etc.)
3. **Verify both sources and blocks collections**

### **Phase 3: Validation**
1. **Test all query types**: vector, lexical, direct vector
2. **Verify content length limits** and truncation
3. **Test with large and small documents**
4. **Confirm backward compatibility**

## 📝 Reproduction Steps

1. Start Smart Connections plugin with MCP server
2. Use any MCP lookup query:
   ```javascript
   mcp__smart_connections_lookup({
     "hypotheticals": ["test"],
     "filter": {"limit": 5}
   })
   ```
3. Observe all `content` fields in results are empty (`""`)
4. Verify that paths and scores are populated correctly

## 🔗 Related Issues

- **Enhanced Query Capabilities**: Working correctly (implemented in v3.0.81)
- **MCP Server Functionality**: Core functionality working
- **Smart Collections Integration**: Metadata retrieval working

## 💡 Next Steps

1. **Implement debug logging** to diagnose root cause
2. **Test proposed fixes** starting with Fix 1 (lowest effort)
3. **Validate solution** across all query types
4. **Update documentation** once resolved

---

**Files to Modify**:
- `src/mcp/tools/lookup.js` - Main content retrieval logic
- `test-mcp-server.js` - Add content retrieval tests

**Testing Environment**:
- Obsidian with Smart Connections plugin
- MCP server running
- Test documents with known content