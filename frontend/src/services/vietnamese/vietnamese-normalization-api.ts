import { axiosInstance } from '../axios';

export interface TextRequest {
  text: string;
}

export interface NormalizationResponse {
  original_text: string;
  normalized_text: string;
  success: boolean;
}

export interface SyllableNormalizationResponse {
  original_syllable: string;
  normalized_syllable: string;
  success: boolean;
}

// Normalize Vietnamese text
export const normalizeVietnameseText = async (text: string): Promise<NormalizationResponse> => {
  const response = await axiosInstance.post('/vietnamese/normalize', { text });
  return response.data;
};

// Normalize Vietnamese syllable
export const normalizeVietnameseSyllable = async (text: string): Promise<SyllableNormalizationResponse> => {
  const response = await axiosInstance.post('/vietnamese/normalize-syllable', { text });
  return response.data;
};

// Health check
export const vietnameseNormalizationHealthCheck = async () => {
  const response = await axiosInstance.get('/vietnamese/health');
  return response.data;
};

