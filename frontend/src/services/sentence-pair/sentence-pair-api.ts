import { axiosInstance } from '../axios';
import { fullTextAnalysis, vietnameseFullAnalysis } from '../nlp/nlp-api';
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
    results["vietnamese"] = vietnameseResult;
  } catch (error) {
    results["vietnamese"] = { error: `Vietnamese analysis failed: ${error}` };
  }
  
  // Analyze English text
  try {
    const englishResult = await fullTextAnalysis(englishText);
    results["english"] = englishResult;
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
