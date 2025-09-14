"""
Vietnamese NLP Service using VnCoreNLP
Provides word segmentation, POS tagging, NER, and dependency parsing for Vietnamese text
"""

import os
import logging
from typing import List, Dict, Any, Optional
import py_vncorenlp

logger = logging.getLogger(__name__)

class VietnameseNLPService:
    def __init__(self, model_dir: str = "/app/vncorenlp"):
        """
        Initialize Vietnamese NLP service with VnCoreNLP
        
        Args:
            model_dir: Directory where VnCoreNLP models are stored
        """
        self.model_dir = model_dir
        self.rdrsegmenter = None
        self._initialize_model()
    
    def _initialize_model(self):
        """Initialize VnCoreNLP model"""
        try:
            # Create directory if it doesn't exist
            os.makedirs(self.model_dir, exist_ok=True)
            
            # Download model if not exists
            if not os.path.exists(os.path.join(self.model_dir, "VnCoreNLP-1.2.jar")):
                logger.info("Downloading VnCoreNLP model...")
                py_vncorenlp.download_model(save_dir=self.model_dir)
            
            # Load VnCoreNLP
            self.rdrsegmenter = py_vncorenlp.VnCoreNLP(save_dir=self.model_dir)
            logger.info("Vietnamese NLP model loaded successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Vietnamese NLP model: {str(e)}")
            self.rdrsegmenter = None
    
    def is_available(self) -> bool:
        """Check if Vietnamese NLP service is available"""
        return self.rdrsegmenter is not None
    
    def word_segmentation(self, text: str) -> List[str]:
        """
        Perform word segmentation on Vietnamese text
        
        Args:
            text: Input Vietnamese text
            
        Returns:
            List of segmented words
        """
        if not self.is_available():
            raise RuntimeError("Vietnamese NLP service not available")
        
        try:
            annotated_output = self.rdrsegmenter.annotate_text(text)
            words = []
            
            for sentence in annotated_output.values():
                for word_info in sentence:
                    words.append(word_info['wordForm'])
            
            return words
        except Exception as e:
            logger.error(f"Error in word segmentation: {str(e)}")
            raise
    
    def pos_tagging(self, text: str) -> List[Dict[str, str]]:
        """
        Perform POS tagging on Vietnamese text
        
        Args:
            text: Input Vietnamese text
            
        Returns:
            List of dictionaries containing word, POS tag, and explanations
        """
        if not self.is_available():
            raise RuntimeError("Vietnamese NLP service not available")
        
        try:
            annotated_output = self.rdrsegmenter.annotate_text(text)
            pos_tags = []
            
            for sentence in annotated_output.values():
                for word_info in sentence:
                    pos_tags.append({
                        "text": word_info['wordForm'],
                        "pos": word_info['posTag'],
                        "pos_explanation": self._get_pos_explanation(word_info['posTag']),
                        "tag": word_info['posTag'],
                        "tag_explanation": self._get_pos_explanation(word_info['posTag'])
                    })
            
            return pos_tags
        except Exception as e:
            logger.error(f"Error in POS tagging: {str(e)}")
            raise
    
    def named_entity_recognition(self, text: str) -> List[Dict[str, Any]]:
        """
        Perform Named Entity Recognition on Vietnamese text
        
        Args:
            text: Input Vietnamese text
            
        Returns:
            List of dictionaries containing entity information
        """
        if not self.is_available():
            raise RuntimeError("Vietnamese NLP service not available")
        
        try:
            annotated_output = self.rdrsegmenter.annotate_text(text)
            entities = []
            current_entity = None
            entity_start = 0
            char_offset = 0
            
            for sentence in annotated_output.values():
                for word_info in sentence:
                    word = word_info['wordForm']
                    ner_tag = word_info['nerLabel']
                    word_start = char_offset
                    word_end = char_offset + len(word)
                    
                    if ner_tag.startswith('B-'):
                        # Start of new entity
                        if current_entity:
                            entities.append(current_entity)
                        
                        current_entity = {
                            "text": word,
                            "label": ner_tag[2:],  # Remove B- prefix
                            "label_explanation": self._get_ner_explanation(ner_tag[2:]),
                            "start": word_start,
                            "end": word_end
                        }
                    elif ner_tag.startswith('I-') and current_entity and current_entity["label"] == ner_tag[2:]:
                        # Continue current entity
                        current_entity["text"] += " " + word
                        current_entity["end"] = word_end
                    else:
                        # End of entity or no entity
                        if current_entity:
                            entities.append(current_entity)
                            current_entity = None
                    
                    char_offset = word_end + 1  # +1 for space
                
                # Add any remaining entity
                if current_entity:
                    entities.append(current_entity)
                    current_entity = None
                
                char_offset += 1  # +1 for sentence separator
            
            return entities
        except Exception as e:
            logger.error(f"Error in NER: {str(e)}")
            raise
    
    def dependency_parsing(self, text: str) -> List[Dict[str, Any]]:
        """
        Perform dependency parsing on Vietnamese text
        
        Args:
            text: Input Vietnamese text
            
        Returns:
            List of dictionaries containing dependency information
        """
        if not self.is_available():
            raise RuntimeError("Vietnamese NLP service not available")
        
        try:
            annotated_output = self.rdrsegmenter.annotate_text(text)
            dependencies = []
            
            for sentence in annotated_output.values():
                sentence_deps = []
                for word_info in sentence:
                    sentence_deps.append({
                        "text": word_info['wordForm'],
                        "pos": word_info['posTag'],
                        "head": word_info['head'],
                        "dep_label": word_info['depLabel'],
                        "index": word_info['index']
                    })
                dependencies.append(sentence_deps)
            
            return dependencies
        except Exception as e:
            logger.error(f"Error in dependency parsing: {str(e)}")
            raise
    
    def full_analysis(self, text: str) -> Dict[str, Any]:
        """
        Perform complete analysis including all NLP tasks
        
        Args:
            text: Input Vietnamese text
            
        Returns:
            Dictionary containing all analysis results
        """
        if not self.is_available():
            raise RuntimeError("Vietnamese NLP service not available")
        
        try:
            annotated_output = self.rdrsegmenter.annotate_text(text)
            
            # Process sentences
            sentences = []
            all_tokens = []
            entities = []
            char_offset = 0
            
            for sentence in annotated_output.values():
                sentence_tokens = []
                current_entity = None
                
                for word_info in sentence:
                    word = word_info['wordForm']
                    word_start = char_offset
                    word_end = char_offset + len(word)
                    
                    token_info = {
                        "text": word,
                        "pos": word_info['posTag'],
                        "pos_explanation": self._get_pos_explanation(word_info['posTag']),
                        "lemma": word,  # VnCoreNLP doesn't provide lemmatization
                        "dep": word_info['depLabel'],
                        "head": word_info['head'],
                        "index": word_info['index']
                    }
                    
                    sentence_tokens.append(token_info)
                    all_tokens.append(token_info)
                    
                    # Process NER
                    ner_tag = word_info['nerLabel']
                    if ner_tag.startswith('B-'):
                        if current_entity:
                            entities.append(current_entity)
                        
                        current_entity = {
                            "text": word,
                            "label": ner_tag[2:],
                            "label_explanation": self._get_ner_explanation(ner_tag[2:]),
                            "start": word_start,
                            "end": word_end
                        }
                    elif ner_tag.startswith('I-') and current_entity and current_entity["label"] == ner_tag[2:]:
                        current_entity["text"] += " " + word
                        current_entity["end"] = word_end
                    else:
                        if current_entity:
                            entities.append(current_entity)
                            current_entity = None
                    
                    char_offset = word_end + 1
                
                if current_entity:
                    entities.append(current_entity)
                
                sentences.append({
                    "text": " ".join([token["text"] for token in sentence_tokens]),
                    "tokens": sentence_tokens
                })
                
                char_offset += 1  # Sentence separator
            
            return {
                "original_text": text,
                "sentences": sentences,
                "entities": entities,
                "token_count": len(all_tokens),
                "sentence_count": len(sentences)
            }
            
        except Exception as e:
            logger.error(f"Error in full analysis: {str(e)}")
            raise
    
    def _get_pos_explanation(self, pos_tag: str) -> str:
        """Get explanation for POS tag"""
        pos_explanations = {
            "N": "Noun",
            "Np": "Proper noun",
            "Nc": "Noun classifier",
            "Nu": "Unit noun",
            "V": "Verb",
            "A": "Adjective",
            "P": "Pronoun",
            "R": "Adverb",
            "L": "Determiner",
            "M": "Numeral",
            "E": "Preposition",
            "C": "Conjunction",
            "I": "Interjection",
            "T": "Auxiliary",
            "Y": "Abbreviation",
            "S": "Subordinating conjunction",
            "X": "Unknown",
            "CH": "Punctuation"
        }
        return pos_explanations.get(pos_tag, f"Unknown POS tag: {pos_tag}")
    
    def _get_ner_explanation(self, ner_label: str) -> str:
        """Get explanation for NER label"""
        ner_explanations = {
            "PER": "Person",
            "LOC": "Location",
            "ORG": "Organization",
            "MISC": "Miscellaneous"
        }
        return ner_explanations.get(ner_label, f"Unknown NER label: {ner_label}")

# Global instance
vietnamese_nlp_service = VietnameseNLPService()
