# DataLoader Input/Output Flow

## Overview: How Data Flows Through the System

```
INPUT (Your Parameters)
    ↓
FETCH (UniProt API)
    ↓
PROCESS (Convert & Tokenize)
    ↓
OUTPUT (PyTorch DataLoader)
```

---

## Step-by-Step Breakdown

### 1. **INPUT: What You Provide**

#### `fetch_uniprot()` Input:
```python
fetch_uniprot(
    query="reviewed:true AND length:[50 TO 1000]",  # UniProt search query
    size=200,                                        # How many proteins to fetch
    fields=["accession", "sequence", "cc_function"] # What data to get
)
```

#### `create_protein_dataset()` Input:
```python
create_protein_dataset(
    query="reviewed:true AND length:[50 TO 1000]",  # Same UniProt query
    size=500,                                        # Number of proteins
    cache_dir="./cache"                              # Optional: save dataset
)
```

#### `create_dataloader()` Input:
```python
create_dataloader(
    dataset=dataset,                                 # Hugging Face Dataset
    tokenizer=tokenizer,                             # Pre-trained tokenizer
    batch_size=8,                                    # Batch size
    max_length=512,                                  # Max sequence length
    task="generation",                               # "generation" or "classification"
    shuffle=True                                     # Shuffle data
)
```

---

### 2. **HOW IT GRABS DATA**

#### Process:
1. **Builds API URL**: 
   ```
   https://rest.uniprot.org/uniprotkb/search?
   query=reviewed:true%20AND%20length:%5B50%20TO%201000%5D&
   format=tsv&
   fields=accession,sequence,cc_function&
   size=200
   ```

2. **Makes HTTP Request**: Uses `requests.get()` to fetch data

3. **Parses Response**: Converts TSV (tab-separated) text into pandas DataFrame

4. **Cleans Data**: 
   - Renames columns to standard names
   - Removes rows with missing data
   - Keeps only 'function' and 'sequence' columns

---

### 3. **OUTPUT: What You Get**

#### `fetch_uniprot()` Output:
```python
# Returns: pandas DataFrame
DataFrame with columns:
  - 'function': str  # Protein function description
  - 'sequence': str  # Amino acid sequence (e.g., "MKTAYIAKQR...")
  - 'id': str        # UniProt accession ID
```

**Example:**
```python
df = fetch_uniprot(size=10)
print(df.head())
#   function                    sequence              id
# 0 "Catalyzes..."            "MKTAYIAKQR..."      "P12345"
# 1 "Binds to DNA..."          "ACDEFGHIKL..."      "Q67890"
```

#### `create_protein_dataset()` Output:
```python
# Returns: Hugging Face Dataset
Dataset({
    features: ['function', 'sequence'],
    num_rows: 500
})
```

**Example:**
```python
dataset = create_protein_dataset(size=100)
print(dataset[0])
# {
#   'function': 'Catalyzes the hydrolysis of...',
#   'sequence': 'MKTAYIAKQRQISFVKSHFSRQLEERLGLIEVQAPILSRVGDGTQDNLSGAEKAVQVKVKALPDAQFEVVHSLAKWKRQTLGQHDFSAGEGLYTHMKALRPDEDRLSPLHSVYVDQWDWERVMGDGERQFSTLKSTVEAIWAGIKATEAAVSEEFGLAPFLPDQIHGHSVEV'
# }
```

#### `create_dataloader()` Output:
```python
# Returns: PyTorch DataLoader
DataLoader that yields batches of:
{
    'input_ids': torch.Tensor,      # Shape: [batch_size, max_length]
    'attention_mask': torch.Tensor, # Shape: [batch_size, max_length]
    'labels': torch.Tensor          # Shape: [batch_size, max_length]
}
```

**Example Usage:**
```python
for batch in dataloader:
    input_ids = batch['input_ids']      # [8, 512] - tokenized input
    attention_mask = batch['attention_mask']  # [8, 512] - padding mask
    labels = batch['labels']            # [8, 512] - tokenized labels
    
    # Use in training loop
    outputs = model(input_ids=input_ids, attention_mask=attention_mask)
    loss = compute_loss(outputs, labels)
```

---

## Complete Example Flow

```python
from bioDesignModel.dataloader import (
    fetch_uniprot,
    create_protein_dataset,
    create_dataloader
)
from transformers import AutoTokenizer

# STEP 1: INPUT - Define what you want
query = "reviewed:true AND length:[50 TO 1000]"
size = 100

# STEP 2: GRAB - Fetch from UniProt API
df = fetch_uniprot(query=query, size=size)
# Output: DataFrame with function & sequence columns

# OR: Create dataset directly
dataset = create_protein_dataset(query=query, size=size)
# Output: Hugging Face Dataset

# STEP 3: PROCESS - Tokenize and create DataLoader
tokenizer = AutoTokenizer.from_pretrained("facebook/esm2_t6_8M_UR50D")
dataloader = create_dataloader(
    dataset=dataset,
    tokenizer=tokenizer,
    batch_size=8,
    max_length=512,
    task="generation"  # function -> sequence
)

# STEP 4: OUTPUT - Use in training
for batch in dataloader:
    # batch['input_ids']: tokenized function descriptions
    # batch['labels']: tokenized sequences
    # Ready for model training!
    pass
```

---

## Task Types Explained

### Task: "generation" (Function → Sequence)
- **Input**: Function description text
- **Output**: Amino acid sequence
- **Use Case**: Generate protein sequences from functional descriptions

### Task: "classification" (Sequence → Function)
- **Input**: Amino acid sequence
- **Output**: Function description
- **Use Case**: Predict what a protein does from its sequence

---

## Data Source Details

**UniProt API**: https://rest.uniprot.org/uniprotkb/search

**What it contains:**
- Millions of protein sequences
- Function annotations
- Experimentally verified data
- Computationally predicted data

**Query Examples:**
- `"reviewed:true"` - Only manually reviewed proteins
- `"length:[50 TO 1000]"` - Proteins 50-1000 amino acids long
- `"organism_id:9606"` - Human proteins only
- `"ec:*"` - All enzymes
- `"keyword:KW-0472"` - Membrane proteins

