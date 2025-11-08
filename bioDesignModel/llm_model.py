# biogenesis_model/llm_model.py
import json, torch, logging
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline

logger = logging.getLogger(__name__)

class BioDesignModel:
    """LLM component that generates organism blueprints and protein sequences."""

    def __init__(self, model_name="microsoft/biogpt", device=None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"Loading model {model_name} on {self.device}")
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model = AutoModelForCausalLM.from_pretrained(model_name).to(self.device)
        self.generator = pipeline("text-generation", model=self.model, tokenizer=self.tokenizer,
                                  device=0 if self.device == "cuda" else -1)

    def generate_blueprint(self, prompt: str, max_length: int = 512):
        response = self.generator(f"Generate JSON blueprint: {prompt}\nJSON:", 
                                  max_length=max_length, temperature=0.7)[0]["generated_text"]
        try:
            return json.loads(response.split("JSON:")[-1])
        except json.JSONDecodeError:
            return {"raw_output": response}

    def generate_sequences(self, blueprint, max_length: int = 1024):
        results = {}
        for p in blueprint.get("key_proteins", []):
            prompt = f"Generate an amino acid FASTA for {p}:"
            out = self.generator(prompt, max_length=max_length, temperature=0.8)[0]["generated_text"]
            if not out.startswith(">"): out = f">{p}\n" + out
            results[p] = out
        return results
