"""
Medical Metric Extractor
"""
import re
from typing import List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class MetricStatus(str, Enum):
    NORMAL = "NORMAL"
    LOW = "LOW"
    HIGH = "HIGH"
    CRITICAL_LOW = "CRITICAL_LOW"
    CRITICAL_HIGH = "CRITICAL_HIGH"


@dataclass
class ExtractedMetric:
    """Extracted medical metric"""
    name: str
    value: float
    unit: str
    normal_range: Tuple[Optional[float], Optional[float]]
    status: MetricStatus
    category: str
    raw_text: str


# Medical metric patterns and reference ranges
METRIC_PATTERNS = {
    # Blood Count
    "hemoglobin": {
        "patterns": [
            r"h(?:ae)?moglobin[:\s]*(\d+\.?\d*)\s*(g/dl|g/l)?",
            r"hb[:\s]*(\d+\.?\d*)\s*(g/dl|g/l)?",
        ],
        "unit": "g/dL",
        "normal_range": (12.0, 17.5),
        "critical_low": 7.0,
        "critical_high": 20.0,
        "category": "Blood Count",
    },
    "rbc": {
        "patterns": [
            r"r\.?b\.?c\.?[:\s]*(\d+\.?\d*)\s*(million/cumm|10\^6/ul)?",
            r"red blood cell[s]?[:\s]*(\d+\.?\d*)",
        ],
        "unit": "million/cumm",
        "normal_range": (4.5, 5.5),
        "category": "Blood Count",
    },
    "wbc": {
        "patterns": [
            r"w\.?b\.?c\.?[:\s]*(\d+\.?\d*)\s*(/cumm|10\^3/ul)?",
            r"white blood cell[s]?[:\s]*(\d+\.?\d*)",
        ],
        "unit": "/cumm",
        "normal_range": (4000, 11000),
        "category": "Blood Count",
    },
    "platelets": {
        "patterns": [
            r"platelet[s]?[:\s]*(\d+\.?\d*)\s*(/cumm|10\^3/ul)?",
            r"plt[:\s]*(\d+\.?\d*)",
        ],
        "unit": "/cumm",
        "normal_range": (150000, 400000),
        "category": "Blood Count",
    },
    
    # Lipid Profile
    "total_cholesterol": {
        "patterns": [
            r"total cholesterol[:\s]*(\d+\.?\d*)\s*(mg/dl)?",
            r"cholesterol[,\s]+total[:\s]*(\d+\.?\d*)",
        ],
        "unit": "mg/dL",
        "normal_range": (0, 200),
        "category": "Lipid Profile",
    },
    "ldl_cholesterol": {
        "patterns": [
            r"ldl[- ]?cholesterol[:\s]*(\d+\.?\d*)\s*(mg/dl)?",
            r"ldl[:\s]*(\d+\.?\d*)",
        ],
        "unit": "mg/dL",
        "normal_range": (0, 100),
        "category": "Lipid Profile",
    },
    "hdl_cholesterol": {
        "patterns": [
            r"hdl[- ]?cholesterol[:\s]*(\d+\.?\d*)\s*(mg/dl)?",
            r"hdl[:\s]*(\d+\.?\d*)",
        ],
        "unit": "mg/dL",
        "normal_range": (40, 60),
        "category": "Lipid Profile",
    },
    "triglycerides": {
        "patterns": [
            r"triglyceride[s]?[:\s]*(\d+\.?\d*)\s*(mg/dl)?",
        ],
        "unit": "mg/dL",
        "normal_range": (0, 150),
        "category": "Lipid Profile",
    },
    
    # Blood Sugar
    "fasting_glucose": {
        "patterns": [
            r"fasting[- ]?(?:blood[- ]?)?glucose[:\s]*(\d+\.?\d*)\s*(mg/dl)?",
            r"fbs[:\s]*(\d+\.?\d*)",
            r"glucose[,\s]+fasting[:\s]*(\d+\.?\d*)",
        ],
        "unit": "mg/dL",
        "normal_range": (70, 100),
        "critical_high": 400,
        "category": "Blood Sugar",
    },
    "hba1c": {
        "patterns": [
            r"hba1c[:\s]*(\d+\.?\d*)\s*%?",
            r"glycated hemoglobin[:\s]*(\d+\.?\d*)",
        ],
        "unit": "%",
        "normal_range": (4.0, 5.6),
        "category": "Blood Sugar",
    },
    
    # Kidney Function
    "creatinine": {
        "patterns": [
            r"creatinine[:\s]*(\d+\.?\d*)\s*(mg/dl)?",
        ],
        "unit": "mg/dL",
        "normal_range": (0.7, 1.3),
        "category": "Kidney Function",
    },
    "bun": {
        "patterns": [
            r"b\.?u\.?n\.?[:\s]*(\d+\.?\d*)\s*(mg/dl)?",
            r"blood urea nitrogen[:\s]*(\d+\.?\d*)",
        ],
        "unit": "mg/dL",
        "normal_range": (7, 20),
        "category": "Kidney Function",
    },
    
    # Liver Function
    "alt": {
        "patterns": [
            r"alt[:\s]*(\d+\.?\d*)\s*(u/l|iu/l)?",
            r"sgpt[:\s]*(\d+\.?\d*)",
        ],
        "unit": "U/L",
        "normal_range": (7, 56),
        "category": "Liver Function",
    },
    "ast": {
        "patterns": [
            r"ast[:\s]*(\d+\.?\d*)\s*(u/l|iu/l)?",
            r"sgot[:\s]*(\d+\.?\d*)",
        ],
        "unit": "U/L",
        "normal_range": (10, 40),
        "category": "Liver Function",
    },
    
    # Thyroid
    "tsh": {
        "patterns": [
            r"tsh[:\s]*(\d+\.?\d*)\s*(miu/l|uiu/ml)?",
            r"thyroid stimulating hormone[:\s]*(\d+\.?\d*)",
        ],
        "unit": "mIU/L",
        "normal_range": (0.4, 4.0),
        "category": "Thyroid",
    },
    
    # Vitals
    "systolic_bp": {
        "patterns": [
            r"(?:systolic|bp)[:\s]*(\d+)/\d+\s*(?:mmhg)?",
            r"blood pressure[:\s]*(\d+)/\d+",
        ],
        "unit": "mmHg",
        "normal_range": (90, 120),
        "critical_high": 180,
        "category": "Vitals",
    },
    "diastolic_bp": {
        "patterns": [
            r"(?:diastolic|bp)[:\s]*\d+/(\d+)\s*(?:mmhg)?",
            r"blood pressure[:\s]*\d+/(\d+)",
        ],
        "unit": "mmHg",
        "normal_range": (60, 80),
        "critical_high": 120,
        "category": "Vitals",
    },
}


class MetricExtractor:
    """Extract medical metrics from report text"""
    
    def extract(self, text: str) -> List[ExtractedMetric]:
        """
        Extract all medical metrics from text
        
        Args:
            text: Raw text from medical report
            
        Returns:
            List of extracted metrics with status
        """
        metrics = []
        text_lower = text.lower()
        
        for metric_name, config in METRIC_PATTERNS.items():
            for pattern in config["patterns"]:
                matches = re.finditer(pattern, text_lower, re.IGNORECASE)
                for match in matches:
                    try:
                        value = float(match.group(1))
                        status = self._classify_status(value, config)
                        
                        metrics.append(ExtractedMetric(
                            name=metric_name,
                            value=value,
                            unit=config["unit"],
                            normal_range=config["normal_range"],
                            status=status,
                            category=config["category"],
                            raw_text=match.group(0),
                        ))
                        break  # Only take first match per metric
                    except (ValueError, IndexError):
                        continue
        
        return metrics
    
    def _classify_status(self, value: float, config: dict) -> MetricStatus:
        """Classify metric value as normal, high, low, or critical"""
        low, high = config["normal_range"]
        critical_low = config.get("critical_low")
        critical_high = config.get("critical_high")
        
        if critical_low and value <= critical_low:
            return MetricStatus.CRITICAL_LOW
        if critical_high and value >= critical_high:
            return MetricStatus.CRITICAL_HIGH
        if value < low:
            return MetricStatus.LOW
        if value > high:
            return MetricStatus.HIGH
        return MetricStatus.NORMAL


# Singleton
metric_extractor = MetricExtractor()
