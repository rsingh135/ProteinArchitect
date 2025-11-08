"""
BioDesignModel - Natural Language to UniProt Protein Search
-----------------------------------------------------------
Provides functionality to search UniProt protein database using natural language queries.

Flow: Natural Language → LLM Processing → UniProt Query → Protein Data
"""

# Import dataloader functions (used by query_generator)
from .dataloader import (
    fetch_uniprot,
    create_protein_dataset,
    create_dataloader,
    create_sequence_dataloader
)

# Import query generator functions
try:
    from .query_generator import (
        UniProtQueryGenerator,
        search_proteins_from_natural_language,
        search_and_get_sequence
    )
except (ImportError, ModuleNotFoundError, AttributeError) as e:
    UniProtQueryGenerator = None
    search_proteins_from_natural_language = None
    search_and_get_sequence = None

__all__ = [
    # Core search functions
    "UniProtQueryGenerator",
    "search_proteins_from_natural_language",
    "search_and_get_sequence",
    # Data loading functions (used by search)
    "fetch_uniprot",
    "create_protein_dataset",
    "create_dataloader",
    "create_sequence_dataloader",
]