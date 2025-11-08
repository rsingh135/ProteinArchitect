# How to Run the Natural Language Flow Test

## Problem
When running from `bioDesignModel` directory, Python can't find the module because you're already inside it.

## Solution: Run from GenLab Directory

### Option 1: Run as Module (Recommended)

```powershell
# Navigate to GenLab directory (parent of bioDesignModel)
cd "D:\My Projects\HackPrinceton2025\GenLab"

# Run the test
python -m bioDesignModel.test_natural_language_flow
```

### Option 2: Run Script Directly

```powershell
# From GenLab directory
cd "D:\My Projects\HackPrinceton2025\GenLab"

# Run directly
python bioDesignModel\test_natural_language_flow.py
```

### Option 3: Run from Anywhere (with full path)

```powershell
# From anywhere
python "D:\My Projects\HackPrinceton2025\GenLab\bioDesignModel\test_natural_language_flow.py"
```

## Quick Fix for Current Directory

If you're currently in `bioDesignModel` directory:

```powershell
# Go up one directory
cd ..

# Then run
python -m bioDesignModel.test_natural_language_flow
```

## Expected Output

You should see:
```
======================================================================
NATURAL LANGUAGE -> UNIPROT -> PROTEIN DATA VERIFICATION
======================================================================
======================================================================
TESTING: Natural Language -> UniProt Query -> Protein Data Flow
======================================================================

TEST 1: Find proteins that can survive in extreme heat
----------------------------------------------------------------------

[STEP 1] Converting natural language to UniProt query...
  Input: 'Find proteins that can survive in extreme heat'
  ✓ Generated UniProt Query: keyword:KW-0809 AND reviewed:true
...
```

## Troubleshooting

**If you get "ModuleNotFoundError":**
- Make sure you're in the `GenLab` directory (not `bioDesignModel`)
- Check that `bioDesignModel` folder exists in current directory: `ls bioDesignModel` or `dir bioDesignModel`

**If you get encoding errors:**
- The Unicode arrows have been replaced with ASCII (`->`)
- Should work on Windows PowerShell now

