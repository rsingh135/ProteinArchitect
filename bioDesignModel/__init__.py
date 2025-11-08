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

# Query generator functions have been moved to backend/services/query_generator.py
# Import them from there if needed:
# from backend.services.query_generator import (
#     UniProtQueryGenerator,
#     search_proteins_from_natural_language,
#     search_and_get_sequence
# )

__all__ = [
    # Data loading functions
    "fetch_uniprot",
    "create_protein_dataset",
    "create_dataloader",
    "create_sequence_dataloader",
]