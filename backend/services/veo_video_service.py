"""
Veo 3.1 Fast Preview API Service
Generates videos from protein structure images using Google's Veo API
"""

import os
import logging
import base64
import asyncio
import httpx
from typing import Dict, Optional

logger = logging.getLogger(__name__)

# Try to import the new google.genai SDK
try:
    from google import genai
    NEW_SDK_AVAILABLE = True
except ImportError:
    # Fallback to old SDK if new one not available
    try:
        import google.generativeai as genai
        NEW_SDK_AVAILABLE = False
        logger.warning("New google.genai SDK not available, using old google.generativeai SDK")
    except ImportError:
        raise ImportError("Neither google.genai nor google.generativeai is installed. Install with: pip install google-genai")


class VeoVideoService:
    """Service for generating videos using Veo 3.1 Fast Preview API"""
    
    def __init__(self):
        """Initialize Veo video service"""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY environment variable is required for Veo API")
        
        self.api_key = api_key
        
        # Use new SDK if available
        if NEW_SDK_AVAILABLE:
            try:
                self.client = genai.Client(api_key=api_key)
                self.use_new_sdk = True
                logger.info("Veo 3.1 Fast Preview service initialized with new google.genai SDK")
            except Exception as e:
                logger.warning(f"Failed to initialize new SDK: {e}, falling back to old SDK")
                genai.configure(api_key=api_key)
                self.model = genai.GenerativeModel('veo-3.1-fast-preview')
                self.use_new_sdk = False
                logger.info("Veo 3.1 Fast Preview service initialized with old SDK (may not work)")
        else:
            # Fallback to old SDK
            genai.configure(api_key=api_key)
            self.model = genai.GenerativeModel('veo-3.1-fast-preview')
            self.use_new_sdk = False
            logger.warning("Using old SDK - Veo 3.1 may not work correctly. Please install google-genai package.")
    
    async def generate_interaction_video(
        self,
        protein_a_image: Optional[str] = None,  # Base64 encoded image
        protein_b_image: Optional[str] = None,  # Base64 encoded image
        complex_image: Optional[str] = None,     # Base64 encoded image
        protein_a_pdb: Optional[str] = None,    # PDB data (fallback)
        protein_b_pdb: Optional[str] = None,    # PDB data (fallback)
        complex_pdb: Optional[str] = None,      # PDB data (fallback)
        protein_a_uniprot_id: Optional[str] = None,  # UniProt ID
        protein_b_uniprot_id: Optional[str] = None,  # UniProt ID
        protein_a_name: str = "Protein A",
        protein_b_name: str = "Protein B"
    ) -> Dict:
        """
        Generate a video showing protein-protein interaction using Veo API
        
        Args:
            protein_a_image: Base64 encoded image of Protein A
            protein_b_image: Base64 encoded image of Protein B
            complex_image: Base64 encoded image of the docked complex
            protein_a_pdb: PDB data for Protein A (fallback)
            protein_b_pdb: PDB data for Protein B (fallback)
            complex_pdb: PDB data for complex (fallback)
            protein_a_uniprot_id: UniProt ID for Protein A
            protein_b_uniprot_id: UniProt ID for Protein B
            protein_a_name: Name of Protein A
            protein_b_name: Name of Protein B
        
        Returns:
            Dictionary with video_data (base64) and mime_type
        """
        try:
            # Use new SDK if available
            if self.use_new_sdk:
                return await self._generate_with_new_sdk(
                    protein_a_image, protein_b_image, complex_image,
                    protein_a_pdb, protein_b_pdb, complex_pdb,
                    protein_a_uniprot_id, protein_b_uniprot_id,
                    protein_a_name, protein_b_name
                )
            else:
                # Fallback to old SDK (may not work for Veo 3.1)
                logger.warning("Using old SDK - Veo 3.1 requires new SDK")
                # Old SDK method is not async
                return self._generate_with_old_sdk(
                    protein_a_image, protein_b_image, complex_image,
                    protein_a_name, protein_b_name
                )
            
        except Exception as e:
            logger.error(f"Error generating video with Veo API: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise
    
    async def _generate_with_new_sdk(
        self,
        protein_a_image: Optional[str],
        protein_b_image: Optional[str],
        complex_image: Optional[str],
        protein_a_pdb: Optional[str],  # Not used yet, but kept for future image-from-PDB generation
        protein_b_pdb: Optional[str],  # Not used yet, but kept for future image-from-PDB generation
        complex_pdb: Optional[str],  # Not used yet, but kept for future image-from-PDB generation
        protein_a_uniprot_id: Optional[str],
        protein_b_uniprot_id: Optional[str],
        protein_a_name: str,
        protein_b_name: str
    ) -> Dict:
        """Generate video using new google.genai SDK"""
        
        # Get images - use provided images or generate from PDB/UniProt IDs
        # For now, we use text-to-video since Veo 3.1 image-to-video format is not fully documented
        # Images are fetched but not yet used in video generation
        # TODO: Implement image-to-video when documentation clarifies multi-image input format
        
        # Fetch images if not provided (for future use)
        if not protein_a_image and protein_a_uniprot_id:
            protein_a_image = await self._fetch_alphafold_image(protein_a_uniprot_id)
            if protein_a_image:
                logger.info(f"Fetched AlphaFold image for Protein A ({protein_a_uniprot_id})")

        if not protein_b_image and protein_b_uniprot_id:
            protein_b_image = await self._fetch_alphafold_image(protein_b_uniprot_id)
            if protein_b_image:
                logger.info(f"Fetched AlphaFold image for Protein B ({protein_b_uniprot_id})")

        # Note: complex_image, protein_a_pdb, protein_b_pdb, complex_pdb are available
        # but not yet used. They can be used for future image-from-PDB generation.
        
        # Construct a detailed, scientifically-accurate prompt for molecular docking
        prompt = (
            f"Generate a fast, scientifically accurate molecular dynamics simulation video showing the protein-protein "
            f"interaction between {protein_a_name} and {protein_b_name}. "
            f"\n\n"
            f"CRITICAL VISUALIZATION REQUIREMENTS:\n"
            f"- Show ONLY the protein molecules themselves - NO labels, NO tags, NO numbers, NO text, NO annotations\n"
            f"- Clean visualization with just the 3D protein structures\n"
            f"- No identifiers, codes, or alphanumeric tags attached to or near the molecules\n"
            f"- Pure molecular structure visualization only\n"
            f"\n"
            f"The video should demonstrate:\n"
            f"1. INITIAL STATE: Both proteins start separated in 3D space, showing their AlphaFold-predicted structures\n"
            f"2. APPROACH PHASE: The proteins gradually move closer together, maintaining their structural integrity\n"
            f"3. ORIENTATION SEARCH: The proteins rotate and adjust their relative orientations to find the optimal binding interface\n"
            f"4. DOCKING PHASE: The proteins come into contact, showing specific binding site interactions\n"
            f"5. COMPLEX FORMATION: The final docked complex structure\n"
            f"\n"
            f"Key requirements:\n"
            f"- Generate quickly and efficiently\n"
            f"- Maintain realistic molecular motion (smooth, physics-based movement)\n"
            f"- Show the proteins as 3D molecular structures (cartoon/ribbon representation)\n"
            f"- Demonstrate the binding interface clearly\n"
            f"- Use appropriate colors: red for {protein_a_name}, blue for {protein_b_name}\n"
            f"- Make the transition smooth and continuous (no jumps or teleportation)\n"
            f"- ABSOLUTELY NO text, labels, numbers, or tags visible anywhere in the video\n"
            f"\n"
            f"This is a molecular biology visualization for scientific research and education. "
            f"Focus on speed and clean visualization without any annotations."
        )
        
        logger.info("Starting Veo 3.1 video generation with new SDK...")
        
        try:
            # Use generate_videos() method with correct model name
            # Note: Model name format is veo-3.1-fast-generate-preview
            # Add generation config for faster, cleaner output
            operation = self.client.models.generate_videos(
                model="veo-3.1-fast-generate-preview",
                prompt=prompt,
                # Note: Check SDK docs for available generation_config parameters
                # Some SDKs support: temperature, max_output_tokens, etc.
            )
            
            # Safely get operation name/ID for logging
            operation_id = None
            if hasattr(operation, 'name'):
                operation_id = operation.name
            elif hasattr(operation, 'id'):
                operation_id = operation.id
            elif isinstance(operation, str):
                operation_id = operation
            else:
                # Try to get string representation
                operation_id = str(operation) if operation else None
            
            logger.info(f"Video generation operation started: {operation_id or 'N/A'}")
            
            # Store original operation object - don't replace it
            original_operation = operation
            
            # Poll until done (Veo API is async)
            max_polls = 60  # Maximum 10 minutes (60 * 10 seconds)
            poll_count = 0
            
            # Log operation object properties for debugging
            logger.info(f"Operation object type: {type(operation)}")
            logger.info(f"Operation has 'done': {hasattr(operation, 'done')}")
            logger.info(f"Operation has 'status': {hasattr(operation, 'status')}")
            logger.info(f"Operation has 'refresh': {hasattr(operation, 'refresh')}")
            logger.info(f"Operation has 'wait': {hasattr(operation, 'wait')}")
            if hasattr(operation, 'done'):
                logger.info(f"Initial operation.done value: {operation.done}")
            if hasattr(operation, 'status'):
                logger.info(f"Initial operation.status: {operation.status}")
            # Log all operation attributes for debugging
            op_attrs = [attr for attr in dir(operation) if not attr.startswith('_')]
            logger.debug(f"Operation attributes: {op_attrs[:20]}")  # First 20 attributes
            
            # Helper function to check if operation is done
            def is_operation_done(op):
                """Check if operation is done using multiple methods"""
                # Check done property first
                if hasattr(op, 'done'):
                    if op.done:
                        logger.info("✓ Operation is done (checked via operation.done)")
                        return True
                # Check status property
                if hasattr(op, 'status'):
                    status = op.status
                    if status in ['DONE', 'COMPLETED', 'SUCCESS', 'FINISHED']:
                        logger.info(f"✓ Operation is done (checked via operation.status = {status})")
                        return True
                # Check state property
                if hasattr(op, 'state'):
                    state = op.state
                    if state in ['DONE', 'COMPLETED', 'SUCCESS', 'FINISHED']:
                        logger.info(f"✓ Operation is done (checked via operation.state = {state})")
                        return True
                # Check if response exists (indicates completion)
                if hasattr(op, 'response') and op.response:
                    logger.info("✓ Operation is done (checked via operation.response exists)")
                    return True
                return False
            
            while not is_operation_done(operation):
                poll_count += 1
                if poll_count > max_polls:
                    raise TimeoutError(f"Video generation timed out after {max_polls * 10} seconds")
                
                logger.info(f"Polling operation status... (attempt {poll_count}/{max_polls})")
                
                # Log current state every 5 polls (or every poll if done is True)
                if poll_count % 5 == 0 or (hasattr(operation, 'done') and operation.done):
                    logger.info(f"  → operation.done = {getattr(operation, 'done', 'N/A')}")
                    logger.info(f"  → operation.status = {getattr(operation, 'status', 'N/A')}")
                    if hasattr(operation, 'response') and operation.response:
                        logger.info(f"  → operation has response: {type(operation.response)}")
                    if hasattr(operation, 'error') and operation.error:
                        logger.warning(f"  → operation.error = {operation.error}")
                
                await asyncio.sleep(10)  # Wait 10 seconds between polls
                
                # Try to refresh the operation object
                # CRITICAL: The operation MUST be refreshed for operation.done to update
                # But operations.get() with a string causes errors, so we need alternatives
                refresh_success = False
                try:
                    # Method 1: Try refresh() if available (preferred - no string issues)
                    if hasattr(operation, 'refresh'):
                        operation.refresh()
                        refresh_success = True
                        logger.debug(f"✓ Operation refreshed via refresh(). done={getattr(operation, 'done', 'N/A')}")
                    # Method 2: Try to use operation object directly with operations.get()
                    # The SDK is making HTTP GET requests (we see them in logs), so this should work
                    elif hasattr(self.client, 'operations') and not isinstance(operation, str):
                        try:
                            # Try passing the operation object itself (not operation.name which is a string)
                            updated_op = self.client.operations.get(operation)
                            # Check if we got a valid operation object back
                            if updated_op and not isinstance(updated_op, str) and hasattr(updated_op, 'done'):
                                operation = updated_op
                                refresh_success = True
                                # Log detailed status
                                logger.info(f"✓ Operation refreshed. done={operation.done}, has response={hasattr(operation, 'response')}")
                                if hasattr(operation, 'status'):
                                    logger.info(f"  → operation.status = {operation.status}")
                                if hasattr(operation, 'error'):
                                    logger.warning(f"  → operation.error = {operation.error}")
                            elif isinstance(updated_op, str):
                                logger.debug("⚠ operations.get() returned string - keeping original operation")
                        except Exception as get_error:
                            error_msg = str(get_error)
                            if "'str' object has no attribute 'name'" in error_msg:
                                logger.debug("⚠ operations.get() causes string error - skipping refresh")
                            else:
                                logger.debug(f"⚠ Could not refresh via operations.get(): {get_error}")
                    # Method 3: Check status property - it might update automatically
                    elif hasattr(operation, 'status'):
                        current_status = operation.status
                        if current_status in ['DONE', 'COMPLETED', 'SUCCESS', 'FINISHED']:
                            # Manually mark as done based on status
                            if not hasattr(operation, 'done'):
                                operation.done = True
                            else:
                                operation.done = True
                            logger.info("✓ Operation marked as done based on status")
                            refresh_success = True
                        else:
                            logger.debug(f"Operation status: {current_status} (not done yet)")
                    # Method 4: If no refresh method, operation.done might update automatically
                    # (Some SDKs update the operation object in-place)
                    else:
                        logger.debug("No refresh method available - operation.done may update automatically")
                except Exception as refresh_error:
                    error_msg = str(refresh_error)
                    # Silently handle the 'name' attribute error - it's expected with this SDK
                    if "'str' object has no attribute 'name'" not in error_msg:
                        logger.warning(f"Error during refresh attempt: {refresh_error}")
                
                # If refresh didn't work, log a warning every 10 polls
                if not refresh_success and poll_count % 10 == 0:
                    logger.warning(f"⚠ Operation not refreshing after {poll_count} attempts. operation.done may not update automatically.")
                    logger.warning(f"   Operation type: {type(operation).__name__}, has refresh: {hasattr(operation, 'refresh')}")
            
            logger.info("Video generation completed!")
            
            # Get video from operation response
            if not hasattr(operation, 'response') or not operation.response:
                raise ValueError("Operation completed but no response found")
            
            # Extract generated videos from response
            # The exact structure might vary - adjust based on actual SDK response
            if hasattr(operation.response, 'generated_videos'):
                generated_videos = operation.response.generated_videos
            elif hasattr(operation.response, 'generatedSamples'):
                # Alternative response format
                generated_videos = operation.response.generatedSamples
            else:
                # Try to access directly
                generated_videos = getattr(operation.response, 'generated_videos', None)
                if not generated_videos:
                    raise ValueError("No generated_videos found in operation response")
            
            if not generated_videos or len(generated_videos) == 0:
                raise ValueError("No videos in operation response")
            
            generated_video = generated_videos[0]
            
            # Download video file
            # The video object should have a 'video' attribute with file information
            if hasattr(generated_video, 'video'):
                video_file_ref = generated_video.video
            elif hasattr(generated_video, 'file'):
                video_file_ref = generated_video.file
            else:
                raise ValueError("No video file reference found in generated video")
            
            # Download the video file
            video_data = self.client.files.download(file=video_file_ref)
            
            # Convert to base64 for JSON response
            if isinstance(video_data, bytes):
                video_data_b64 = base64.b64encode(video_data).decode('utf-8')
            else:
                # If it's already a string or needs conversion
                video_data_b64 = base64.b64encode(video_data.encode() if isinstance(video_data, str) else video_data).decode('utf-8')
            
            logger.info("Video successfully generated and downloaded")
            
            return {
                "video_data": video_data_b64,
                "mime_type": "video/mp4",
                "success": True
            }
            
        except Exception as e:
            logger.error(f"Error in new SDK video generation: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise
    
    def _generate_with_old_sdk(
        self,
        protein_a_image: Optional[str],  # Unused - kept for interface consistency
        protein_b_image: Optional[str],  # Unused - kept for interface consistency
        complex_image: Optional[str],  # Unused - kept for interface consistency
        protein_a_name: str,  # Unused - kept for interface consistency
        protein_b_name: str  # Unused - kept for interface consistency
    ) -> Dict:
        """Fallback method using old SDK (may not work for Veo 3.1)"""
        logger.warning("Using old SDK - this may not work for Veo 3.1")
        
        # This is the old implementation - kept for fallback
        # It likely won't work but provides a graceful error message
        raise NotImplementedError(
            "Veo 3.1 requires the new google.genai SDK. "
            "Please install it with: pip install google-genai"
        )
    
    async def _fetch_alphafold_image(self, uniprot_id: str) -> Optional[str]:
        """Fetch protein structure image from AlphaFold API"""
        try:
            # Try multiple image formats and versions
            image_urls = [
                f"https://alphafold.ebi.ac.uk/files/AF-{uniprot_id}-F1-model_v4.png",
                f"https://alphafold.ebi.ac.uk/files/AF-{uniprot_id}-F1-predicted_aligned_error_v4.png",
                f"https://alphafold.ebi.ac.uk/files/AF-{uniprot_id}-F1-paes_plot_v4.png",
            ]
            
            async with httpx.AsyncClient(timeout=30.0) as client:
                for image_url in image_urls:
                    try:
                        response = await client.get(image_url)
                        if response.status_code == 200 and len(response.content) > 1000:
                            return base64.b64encode(response.content).decode('utf-8')
                    except Exception as e:
                        logger.debug(f"Could not fetch {image_url}: {e}")
                        continue
                        
        except Exception as e:
            logger.debug(f"Could not fetch AlphaFold image for {uniprot_id}: {e}")
        
        return None
