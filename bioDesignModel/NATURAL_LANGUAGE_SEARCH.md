# Natural Language to Protein Search

This guide shows how to use LLM-powered natural language queries to search for proteins in UniProt.

## Overview

Convert natural language descriptions into UniProt queries and automatically fetch relevant proteins:

```
Natural Language → LLM → UniProt Query → Protein Dataset
```

## Quick Start

### Option 1: Simple One-Line Search

```python
from bioDesignModel.query_generator import search_proteins_from_natural_language

# Search using natural language
uniprot_query, dataset = search_proteins_from_natural_language(
    "Find proteins that can survive in extreme heat",
    size=50
)

print(f"Generated Query: {uniprot_query}")
print(f"Found {len(dataset)} proteins")
print(dataset[0])  # View first result
```

### Option 2: Step-by-Step Control

```python
from bioDesignModel.query_generator import UniProtQueryGenerator
from bioDesignModel.dataloader import create_protein_dataset

# Step 1: Initialize query generator
query_gen = UniProtQueryGenerator(use_openai=False)  # Use local model
# OR
query_gen = UniProtQueryGenerator(use_openai=True, api_key="your-key")  # Use OpenAI

# Step 2: Convert natural language to UniProt query
natural_language = "Find human enzymes that break down proteins"
uniprot_query = query_gen.natural_language_to_query(natural_language)

print(f"UniProt Query: {uniprot_query}")
# Output: "organism_id:9606 AND ec:* AND reviewed:true"

# Step 3: Fetch proteins using the query
dataset = create_protein_dataset(query=uniprot_query, size=100)

# Step 4: Use the dataset
for protein in dataset:
    print(f"Function: {protein['function']}")
    print(f"Sequence: {protein['sequence'][:50]}...")
```

## Example Queries

### Heat-Resistant Proteins
```python
query, dataset = search_proteins_from_natural_language(
    "Find proteins that can survive in extreme heat",
    size=50
)
# Generates: "keyword:KW-0809 AND reviewed:true"
```

### Human Enzymes
```python
query, dataset = search_proteins_from_natural_language(
    "Find human enzymes that break down proteins",
    size=100
)
# Generates: "organism_id:9606 AND ec:* AND reviewed:true"
```

### Membrane Proteins with Size Filter
```python
query, dataset = search_proteins_from_natural_language(
    "Find membrane proteins between 100 and 500 amino acids",
    size=50
)
# Generates: "keyword:KW-0472 AND length:[100 TO 500] AND reviewed:true"
```

### Specific Organism
```python
query, dataset = search_proteins_from_natural_language(
    "Find yeast proteins involved in DNA repair",
    size=50
)
# Generates: "organism_id:559292 AND keyword:KW-0044 AND reviewed:true"
```

## Integration with DataLoader

Once you have the dataset, you can use it with the dataloader for training:

```python
from bioDesignModel.query_generator import search_proteins_from_natural_language
from bioDesignModel.dataloader import create_dataloader
from transformers import AutoTokenizer

# Step 1: Natural language search
query, dataset = search_proteins_from_natural_language(
    "Find thermostable enzymes",
    size=200
)

# Step 2: Create tokenizer
tokenizer = AutoTokenizer.from_pretrained("facebook/esm2_t6_8M_UR50D")

# Step 3: Create DataLoader for training
dataloader = create_dataloader(
    dataset=dataset,
    tokenizer=tokenizer,
    batch_size=8,
    max_length=512,
    task="generation"  # Train model to generate sequences from functions
)

# Step 4: Use in training loop
for batch in dataloader:
    input_ids = batch['input_ids']  # Function descriptions
    labels = batch['labels']        # Sequences
    # ... training code ...
```

## Complete Example: End-to-End Pipeline

```python
from bioDesignModel.query_generator import search_proteins_from_natural_language
from bioDesignModel.dataloader import create_dataloader
from transformers import AutoTokenizer

# User provides natural language query
user_input = "Find proteins that can survive in extreme heat and are between 200-400 amino acids"

# Step 1: Convert to UniProt query and fetch proteins
uniprot_query, dataset = search_proteins_from_natural_language(
    user_input,
    size=100
)

print(f"Generated UniProt Query: {uniprot_query}")
print(f"Found {len(dataset)} matching proteins")

# Step 2: Prepare for model training
tokenizer = AutoTokenizer.from_pretrained("facebook/esm2_t6_8M_UR50D")
dataloader = create_dataloader(
    dataset=dataset,
    tokenizer=tokenizer,
    batch_size=8,
    task="generation"
)

# Step 3: Train or use the model
print(f"Created {len(dataloader)} batches for training")
```

## Supported Natural Language Patterns

The LLM can understand various query types:

### Organism Queries
- "human proteins"
- "yeast enzymes"
- "bacterial proteins"
- "mouse proteins"

### Function Queries
- "heat-resistant proteins"
- "membrane proteins"
- "DNA-binding proteins"
- "enzymes"
- "signal peptides"

### Size Queries
- "proteins between 100 and 500 amino acids"
- "small proteins under 200 residues"
- "large proteins over 1000 amino acids"

### Combined Queries
- "Find human enzymes that break down proteins"
- "Find heat-resistant membrane proteins from bacteria"
- "Find small DNA-binding proteins in yeast"

## Configuration Options

### Using OpenAI (Better Quality)
```python
import os
os.environ["OPENAI_API_KEY"] = "your-api-key"

query_gen = UniProtQueryGenerator(use_openai=True)
query = query_gen.natural_language_to_query("Find thermostable enzymes")
```

### Using Local Model (No API Key Needed)
```python
query_gen = UniProtQueryGenerator(
    use_openai=False,
    model_name="microsoft/biogpt"  # or other model
)
query = query_gen.natural_language_to_query("Find heat-resistant proteins")
```

### Custom Options
```python
query, dataset = search_proteins_from_natural_language(
    "Find human enzymes",
    size=200,                    # Number of proteins to fetch
    use_openai=True,             # Use OpenAI API
    api_key="your-key",          # OpenAI API key
    reviewed_only=True           # Only search reviewed proteins
)
```

## Fallback Behavior

If the LLM fails or is unavailable, the system uses keyword-based fallback:

```python
# Natural language: "Find heat-resistant proteins"
# Fallback query: "keyword:KW-0809 AND reviewed:true"
```

This ensures the system always returns results, even if LLM generation fails.

## Error Handling

```python
try:
    query, dataset = search_proteins_from_natural_language(
        "Find proteins that do X",
        size=50
    )
except Exception as e:
    print(f"Error: {e}")
    # System will use fallback query generation
```

## Tips for Best Results

1. **Be Specific**: "Find human enzymes" is better than "find proteins"
2. **Use Biological Terms**: "thermostable", "membrane", "enzyme" work well
3. **Combine Filters**: "Find human membrane proteins between 100-500 amino acids"
4. **Review Generated Queries**: Check the UniProt query to ensure it matches your intent

## Next Steps

After getting your dataset:
1. Use `create_dataloader()` to prepare for training
2. Train a model to generate sequences from functions
3. Use the model to design new proteins based on natural language descriptions

