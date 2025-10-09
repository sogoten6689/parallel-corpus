import { axiosInstance } from '../axios';
import { fullTextAnalysis, vietnameseFullAnalysis, namedEntityRecognition } from '../nlp/nlp-api';
import type { SentencePair, CreateSentencePairRequest, SaveSentencePairRequest } from '@/types/sentence-pair.type';

// Create a new sentence pair for analysis
export const createSentencePair = async (data: CreateSentencePairRequest): Promise<SentencePair> => {
  const response = await axiosInstance.post('/api/sentence-pairs/', data);
  return response.data;
};

// Analyze sentences using existing NLP API
export const analyzeSentences = async (vietnameseText: string, englishText: string, langPair: string) => {
  const results = {};
  
  // Analyze Vietnamese text
  try {
    const vietnameseResult = await vietnameseFullAnalysis(vietnameseText);
    // Get Vietnamese NER separately
    const vietnameseNer = await axiosInstance.post('/nlp/vietnamese/ner', { text: vietnameseText });
    
    // Combine analysis with NER
    results["vietnamese"] = {
      ...vietnameseResult,
      entities: vietnameseNer.data
    };
  } catch (error) {
    results["vietnamese"] = { error: `Vietnamese analysis failed: ${error}` };
  }
  
  // Analyze English text
  try {
    const englishResult = await fullTextAnalysis(englishText);
    // Get English NER separately
    const englishNer = await namedEntityRecognition(englishText);
    
    // Combine analysis with NER
    results["english"] = {
      ...englishResult,
      entities: englishNer
    };
  } catch (error) {
    results["english"] = { error: `English analysis failed: ${error}` };
  }
  
  return results;
};

// Save sentence pair with analysis results
export const saveSentencePair = async (data: SaveSentencePairRequest): Promise<void> => {
  await axiosInstance.post('/api/sentence-pairs/save', data);
};

// Get all sentence pairs for current user
export const getSentencePairs = async (page: number = 1, limit: number = 10): Promise<{ data: SentencePair[], total: number, page: number, limit: number }> => {
  const response = await axiosInstance.get('/api/sentence-pairs/', {
    params: { page, limit }
  });
  return response.data;
};

// Delete a sentence pair
export const deleteSentencePair = async (id: string): Promise<void> => {
  await axiosInstance.delete(`/api/sentence-pairs/${id}`);
};

// Approve a sentence pair (admin only)
export const approveSentencePair = async (id: string): Promise<void> => {
  await axiosInstance.post(`/api/sentence-pairs/${id}/approve`);
};

// Reject a sentence pair (admin only)
export const rejectSentencePair = async (id: string): Promise<void> => {
  await axiosInstance.post(`/api/sentence-pairs/${id}/reject`);
};

// Get sentence pairs pending approval (admin only)
export const getPendingSentencePairs = async (page: number = 1, limit: number = 10): Promise<{ data: SentencePair[], total: number, page: number, limit: number }> => {
  const response = await axiosInstance.get('/api/sentence-pairs/pending', {
    params: { page, limit }
  });
  return response.data;
};

// Load analyzed tokens from backend storage
export const getSentencePairAnalysis = async (sentenceId: string): Promise<{ vietnameseAnalysis: any[]; englishAnalysis: any[] }> => {
  const res = await axiosInstance.get(`/api/sentence-pairs/${sentenceId}/analysis`);
  return res.data;
};
