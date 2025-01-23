"""
OCR Processor for PDF and Image files
"""
import io
from typing import Optional
from pathlib import Path

import httpx
from PIL import Image

# Conditional imports for OCR
try:
    import pytesseract
    from pdf2image import convert_from_bytes
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False
    print("Warning: OCR dependencies not installed. Install pytesseract and pdf2image.")


class OCRProcessor:
    """Process PDF and image files to extract text"""
    
    def __init__(self):
        if not OCR_AVAILABLE:
            raise RuntimeError("OCR dependencies not available")
    
    async def process(self, file_url: str, file_type: str) -> str:
        """
        Process a file and extract text
        
        Args:
            file_url: URL to the file in storage
            file_type: Type of file ("PDF", "IMAGE", "TEXT")
            
        Returns:
            Extracted text content
        """
        # Download file
        file_bytes = await self._download_file(file_url)
        
        if file_type == "PDF":
            return await self.process_pdf(file_bytes)
        elif file_type == "IMAGE":
            return await self.process_image(file_bytes)
        elif file_type == "TEXT":
            return file_bytes.decode("utf-8")
        else:
            raise ValueError(f"Unsupported file type: {file_type}")
    
    async def _download_file(self, url: str) -> bytes:
        """Download file from URL"""
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content
    
    async def process_pdf(self, pdf_bytes: bytes) -> str:
        """
        Extract text from PDF using OCR
        
        Args:
            pdf_bytes: PDF file content as bytes
            
        Returns:
            Extracted text
        """
        # Convert PDF to images
        images = convert_from_bytes(pdf_bytes, dpi=300)
        
        # Extract text from each page
        text_parts = []
        for i, image in enumerate(images):
            page_text = pytesseract.image_to_string(image, lang='eng')
            text_parts.append(f"--- Page {i + 1} ---\n{page_text}")
        
        return "\n\n".join(text_parts)
    
    async def process_image(self, image_bytes: bytes) -> str:
        """
        Extract text from image using OCR
        
        Args:
            image_bytes: Image file content as bytes
            
        Returns:
            Extracted text
        """
        image = Image.open(io.BytesIO(image_bytes))
        
        # Preprocess image for better OCR results
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Extract text
        text = pytesseract.image_to_string(image, lang='eng')
        
        return text
    
    def preprocess_image(self, image: Image.Image) -> Image.Image:
        """
        Preprocess image for better OCR accuracy
        
        - Convert to grayscale
        - Increase contrast
        - Remove noise
        """
        import cv2
        import numpy as np
        
        # Convert PIL to OpenCV format
        img_array = np.array(image)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img_array, cv2.COLOR_RGB2GRAY)
        
        # Apply thresholding
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Denoise
        denoised = cv2.fastNlMeansDenoising(thresh)
        
        return Image.fromarray(denoised)


# Singleton instance
ocr_processor: Optional[OCRProcessor] = None


def get_ocr_processor() -> OCRProcessor:
    """Get or create OCR processor instance"""
    global ocr_processor
    if ocr_processor is None:
        ocr_processor = OCRProcessor()
    return ocr_processor
