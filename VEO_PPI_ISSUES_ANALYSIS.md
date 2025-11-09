# 🔍 Veo PPI Video Generation - Issues Analysis

## Overview
After analyzing the code and comparing it with the [Veo 3.1 API documentation](https://ai.google.dev/gemini-api/docs/video?example=dialogue#veo-3.1-fast-preview), I've identified **multiple critical issues** preventing video generation.

---

## 🚨 Issue #1: Wrong SDK and API Implementation (CRITICAL)

### Problem
The current code uses the **WRONG SDK** (`google.generativeai`) and **WRONG API pattern**. Veo 3.1 requires:
1. **New SDK**: `google.genai` (not `google.generativeai`)
2. **New Client API**: `genai.Client()` (not `genai.GenerativeModel()`)
3. **Different method**: `generate_videos()` (not `generate_content()`)
4. **Asynchronous operation polling** (not immediate response)
5. **Different model name format**: `veo-3.1-fast-generate-preview` (not `veo-3.1-fast-preview`)

### Current Code (WRONG):
```python
# backend/services/veo_video_service.py
import google.generativeai as genai  # ❌ WRONG SDK

genai.configure(api_key=api_key)
self.model = genai.GenerativeModel('veo-3.1-fast-preview')  # ❌ WRONG MODEL NAME
response = self.model.generate_content(parts, generation_config=generation_config)  # ❌ WRONG METHOD
```

### Correct Implementation (from documentation):
```python
# ✅ CORRECT: Use new google.genai SDK
from google import genai  # Note: different import!

client = genai.Client(api_key=api_key)  # ✅ Use Client, not GenerativeModel
operation = client.models.generate_videos(  # ✅ Use generate_videos, not generate_content
    model="veo-3.1-fast-generate-preview",  # ✅ Correct model name format
    prompt=prompt,
    # Images passed differently - see docs
)
```

### Correct Implementation (from documentation):
```python
# Veo 3.1 uses generate_videos() method, not generate_content()
from google import genai

client = genai.Client()
operation = client.models.generate_videos(
    model="veo-3.1-fast-generate-preview",  # Note: different model name format
    prompt=prompt,
    # Images are passed differently
)

# Poll until done
while not operation.done:
    time.sleep(10)
    operation = client.operations.get(operation)

# Download video
generated_video = operation.response.generated_videos[0]
```

### Key Differences:
1. **Model Name**: `veo-3.1-fast-generate-preview` (not `veo-3.1-fast-preview`)
2. **Method**: `generate_videos()` (not `generate_content()`)
3. **Response**: Returns an **operation** that must be polled (not immediate response)
4. **Image Input**: Images are passed differently (see documentation)

---

## 🚨 Issue #2: Missing PDB Data (CRITICAL)

### Problem
The error "Could not get valid PDB data (got 0 chars)" indicates:
1. `predictionResult.protein_a.structure_data` is empty or missing
2. `fetchPDBFromAlphaFold()` is failing
3. AlphaFold URL might be incorrect or protein doesn't exist

### Root Causes:

#### A. AlphaFold URL Format Issue
```javascript
// Current code (frontend/src/components/PPIPrediction.jsx:769)
const pdbUrl = `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v4.pdb`;
```

**Potential Issues:**
- Some proteins might not have `v4` models (might be `v3` or `v2`)
- URL might be case-sensitive
- Some UniProt IDs might not exist in AlphaFold

#### B. Prediction Result Missing Structure Data
The `predict_ppi_from_sequences` endpoint might not be returning `structure_data` in the response.

**Check:** Does `predictionResult.protein_a.structure_data` exist and contain valid PDB data?

#### C. CORS/Network Issues
AlphaFold API might be blocking requests from the frontend.

---

## 🚨 Issue #3: Image Generation Failing

### Problem
Even if PDB data is fetched, the image generation from PDB might be failing:
- `generateImageFromPDB()` might not be working correctly
- 3Dmol.js viewer might not be rendering properly
- Screenshot capture might be failing

---

## 🚨 Issue #4: Veo API Request Format Mismatch

### Current Code Structure:
```python
parts = [
    prompt,
    {"inline_data": {"mime_type": "image/png", "data": final_image_a}},
    {"inline_data": {"mime_type": "image/png", "data": final_image_b}},
    {"inline_data": {"mime_type": "image/png", "data": final_image_complex}}
]
```

### According to Documentation:
Veo 3.1 supports **image-to-video** generation, but the format might be different. The documentation shows:
- Text-to-video: Just a prompt
- Image-to-video: Uses reference images (up to 3)

**Need to verify:** How exactly are multiple images passed to Veo 3.1?

---

## 🔧 Recommended Fixes

### Fix #1: Update Veo API Implementation

**File:** `backend/services/veo_video_service.py`

**Changes Needed:**
1. Use the new `google.genai.Client()` API
2. Use `generate_videos()` method
3. Implement operation polling
4. Update model name to `veo-3.1-fast-generate-preview`

**Example Fix:**
```python
from google import genai  # ✅ NEW SDK
import time
import asyncio
import base64

class VeoVideoService:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required")
        
        # ✅ Use new Client API
        self.client = genai.Client(api_key=api_key)
        logger.info("Veo 3.1 Fast Preview service initialized")
    
    async def generate_interaction_video(
        self,
        protein_a_image: Optional[str] = None,
        protein_b_image: Optional[str] = None,
        complex_image: Optional[str] = None,
        protein_a_name: str = "Protein A",
        protein_b_name: str = "Protein B"
    ) -> Dict:
        try:
            # Construct prompt
            prompt = (
                f"Generate a scientifically accurate molecular dynamics simulation video showing the protein-protein "
                f"interaction between {protein_a_name} (shown in red) and {protein_b_name} (shown in blue). "
                f"The video should demonstrate: initial state, approach phase, orientation search, docking phase, "
                f"and complex formation. Maintain realistic molecular motion and show proteins as 3D molecular structures."
            )
            
            # ✅ Use generate_videos() method with correct model name
            operation = self.client.models.generate_videos(
                model="veo-3.1-fast-generate-preview",  # ✅ Correct model name
                prompt=prompt,
                # Note: Image-to-video format may differ - check latest docs
                # For now, using text-to-video. If images are needed, format may be:
                # reference_images=[image_a, image_b, complex_image] or similar
            )
            
            # ✅ Poll until done (Veo API is async)
            logger.info("Video generation started, polling for completion...")
            while not operation.done:
                await asyncio.sleep(10)
                operation = self.client.operations.get(operation)
                logger.info(f"Operation status: {operation.done}")
            
            # ✅ Get video from operation response
            if not operation.response or not operation.response.generated_videos:
                raise ValueError("No video in operation response")
            
            generated_video = operation.response.generated_videos[0]
            
            # ✅ Download video file
            video_file = self.client.files.download(file=generated_video.video)
            
            # Convert to base64 for JSON response
            video_data_b64 = base64.b64encode(video_file).decode('utf-8')
            
            return {
                "video_data": video_data_b64,
                "mime_type": "video/mp4",
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error generating video with Veo API: {e}")
            raise
```

**⚠️ Important:** You may also need to update `requirements.txt`:
```txt
# Update to new SDK (check latest version)
google-genai>=0.2.0  # or whatever the latest version is
# OR keep both if other services use old SDK
google-generativeai>=0.3.0  # For other Gemini services
```

### Fix #2: Improve PDB Fetching

**File:** `frontend/src/components/PPIPrediction.jsx`

**Changes Needed:**
1. Add fallback for different AlphaFold model versions
2. Better error handling
3. Try alternative PDB sources

**Example Fix:**
```javascript
const fetchPDBFromAlphaFold = async (uniprotId) => {
  if (!uniprotId) return null;
  
  // Try multiple model versions
  const versions = ['v4', 'v3', 'v2'];
  
  for (const version of versions) {
    try {
      const pdbUrl = `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_${version}.pdb`;
      const response = await fetch(pdbUrl);
      
      if (response.ok) {
        const pdbData = await response.text();
        if (pdbData && pdbData.length > 100) {
          console.log(`✅ Fetched PDB for ${uniprotId} (${version})`);
          return pdbData;
        }
      }
    } catch (err) {
      console.warn(`Failed to fetch ${version} for ${uniprotId}`);
    }
  }
  
  // Fallback: Try AlphaFold API
  try {
    const apiUrl = `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`;
    const response = await fetch(apiUrl);
    if (response.ok) {
      const data = await response.json();
      if (data[0]?.pdbUrl) {
        const pdbResponse = await fetch(data[0].pdbUrl);
        if (pdbResponse.ok) {
          return await pdbResponse.text();
        }
      }
    }
  } catch (err) {
    console.error(`Could not fetch PDB for ${uniprotId}:`, err);
  }
  
  return null;
};
```

### Fix #3: Ensure Structure Data in Prediction Response

**File:** `backend/services/alphafold_ppi_service.py`

**Check:** Make sure the `predict_from_sequences()` method returns `structure_data` for both proteins:

```python
return {
    "protein_a": {
        "name": protein_a_name,
        "sequence": sequence_a,
        "structure_data": pdb_data_a,  # Make sure this is included!
        # ...
    },
    "protein_b": {
        "name": protein_b_name,
        "sequence": sequence_b,
        "structure_data": pdb_data_b,  # Make sure this is included!
        # ...
    },
    # ...
}
```

---

## 📋 Action Items

### Priority 1 (Critical):
1. ✅ **Update Veo API implementation** to use new `generate_videos()` method
2. ✅ **Implement operation polling** for async video generation
3. ✅ **Fix model name** to `veo-3.1-fast-generate-preview`

### Priority 2 (High):
4. ✅ **Improve PDB fetching** with version fallbacks
5. ✅ **Verify structure_data** is returned from prediction endpoint
6. ✅ **Add better error messages** to identify which step is failing

### Priority 3 (Medium):
7. ✅ **Add retry logic** for PDB fetching
8. ✅ **Cache PDB data** to avoid repeated fetches
9. ✅ **Add logging** to track video generation progress

---

## 🔍 Debugging Steps

1. **Check PDB Data:**
   ```javascript
   console.log('Prediction result:', predictionResult);
   console.log('Protein A structure_data:', predictionResult.protein_a?.structure_data?.length);
   console.log('Protein B structure_data:', predictionResult.protein_b?.structure_data?.length);
   ```

2. **Check Veo API Response:**
   ```python
   logger.info(f"Veo API response: {response}")
   logger.info(f"Operation status: {operation.done}")
   ```

3. **Test PDB URLs Manually:**
   - Try: `https://alphafold.ebi.ac.uk/files/AF-P01308-F1-model_v4.pdb`
   - Try: `https://alphafold.ebi.ac.uk/files/AF-P04637-F1-model_v4.pdb`

---

## 📚 References

- [Veo 3.1 API Documentation](https://ai.google.dev/gemini-api/docs/video?example=dialogue#veo-3.1-fast-preview)
- [AlphaFold API](https://alphafold.ebi.ac.uk/api-docs)
- [AlphaFold PDB Files](https://alphafold.ebi.ac.uk/files/)

---

## Summary

The main issues are:
1. **❌ WRONG SDK**: Using `google.generativeai` instead of `google.genai`
2. **❌ WRONG API**: Using `GenerativeModel.generate_content()` instead of `Client.models.generate_videos()`
3. **❌ WRONG MODEL NAME**: Should be `veo-3.1-fast-generate-preview` not `veo-3.1-fast-preview`
4. **❌ MISSING OPERATION POLLING**: Veo API is async and requires polling
5. **❌ MISSING PDB DATA**: PDB fetching is failing or returning empty data

**Priority Fix Order:**
1. Update to new `google.genai` SDK
2. Change to `Client.models.generate_videos()` API
3. Fix model name
4. Implement operation polling
5. Fix PDB data fetching

Fix these issues and the video generation should work!

