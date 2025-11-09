# Research Pipeline Documentation

## Overview

The research pipeline converts user input (protein IDs or natural language) into optimized medical queries for comprehensive protein research using AI agents.

## Pipeline Flow

```
User Input (SearchBar)
    ↓
[Query Converter Service] ← Uses Gemini API to convert to medical query
    ↓
Medical Query + Protein ID
    ↓
[Research Endpoint] (/research_protein)
    ↓
[AgenticResearchService]
    ├─ Fetch Protein Info (UniProt)
    ├─ Convert to Medical Query (if not provided)
    ├─ Search PubMed (with medical query terms)
    └─ Build Research Prompt (with medical query)
    ↓
[Dedalus Labs AI Agent]
    ├─ Uses medical query terms for searches
    ├─ Searches academic databases
    └─ Generates comprehensive research
    ↓
Structured Research Results
```

## Components

### 1. Query Converter Service (`services/query_converter.py`)

**Purpose**: Converts user input into medical/biological query terms optimized for research.

**Input**: 
- User input (e.g., "P01308" or "human insulin")
- Optional protein info from UniProt

**Output**:
```json
{
  "medical_query": "insulin hormone glucose metabolism diabetes mellitus",
  "protein_id": "P01308",
  "keywords": ["insulin", "glucose", "diabetes", "metabolism"],
  "search_terms": "insulin AND (glucose OR diabetes OR metabolism)",
  "protein_name": "Insulin"
}
```

**Features**:
- Uses Gemini 2.0 Flash Exp for fast conversion
- Extracts medical terminology
- Identifies biological processes
- Finds disease associations
- Optimizes for PubMed/search engines

### 2. Research Endpoint (`/research_protein`)

**Request**:
```json
{
  "protein_id": "P01308" or "human insulin",
  "model": "google/gemini-2.0-flash-lite",
  "include_novel": true,
  "months_recent": 6,
  "medical_query": "optional - auto-generated if not provided"
}
```

**Process**:
1. Validates input
2. Converts user input to medical query (if not provided)
3. Resolves protein ID (if natural language input)
4. Calls AgenticResearchService with medical query

### 3. AgenticResearchService

**Enhanced with Medical Query**:

1. **Protein Identification**:
   - Fetches protein info from UniProt
   - Uses protein name, gene, function, keywords

2. **PubMed Search** (`_search_pubmed`):
   - Uses medical query terms in search
   - Combines with protein-specific terms
   - Optimized for medical/biological research

3. **Research Prompt** (`_build_research_prompt`):
   - Includes medical query section
   - Instructs agent to use medical terms
   - Combines with protein-specific information

## Medical Query Integration

### In PubMed Search

The medical query terms are added to PubMed searches:
```python
# Example: medical_query = "insulin glucose diabetes metabolism"
# Adds to search: "insulin"[Title/Abstract] OR "glucose"[Title/Abstract] OR ...
```

### In Research Prompt

The medical query is included in the prompt:
```
MEDICAL/BIOLOGICAL QUERY TERMS:
The following medical and biological terms have been optimized for research:
"insulin hormone glucose metabolism diabetes mellitus"

Use these terms when searching PubMed, academic databases, and scientific sources.
```

## Benefits

1. **Better Search Results**: Medical queries find more relevant papers
2. **Natural Language Support**: Users can enter "human insulin" instead of just "P01308"
3. **Optimized for Research**: Terms are specifically chosen for medical/biological databases
4. **Comprehensive Coverage**: Finds papers using various medical terminologies

## Example Usage

**Input**: "human insulin"
**Converted Medical Query**: "insulin hormone glucose metabolism diabetes mellitus type 1 type 2"
**PubMed Search**: Uses both protein-specific terms AND medical query terms
**Research Results**: More comprehensive and relevant to medical research

## Configuration

- **Query Converter**: Requires `GEMINI_API_KEY`
- **PubMed Search**: Optional `NCBI_API_KEY` for higher rate limits
- **Research Agent**: Requires `DEDALUS_API_KEY`

## Error Handling

- Falls back to original input if conversion fails
- Uses protein ID pattern matching as fallback
- Logs conversion process for debugging

