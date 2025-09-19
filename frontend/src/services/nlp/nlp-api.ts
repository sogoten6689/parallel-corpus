import { axiosInstance } from '../axios';

export interface TextRequest {
  text: string;
}

export interface TokenInfo {
  text: string;
  pos: string;
  pos_explanation: string;
  lemma: string;
  dep: string;
  head: string;
}

export interface EntityInfo {
  text: string;
  label: string;
  label_explanation: string;
  start: number;
  end: number;
}

export interface SentenceInfo {
  text: string;
  tokens: TokenInfo[];
}

export interface NLPResponse {
  original_text: string;
  sentences: SentenceInfo[];
  entities: EntityInfo[];
  token_count: number;
  sentence_count: number;
}

export interface VietnameseTokenInfo {
  text: string;
  pos: string;
  lemma: string;
  dep: string;
  head: string;
}

export interface VietnameseEntityInfo {
  text: string;
  label: string;
  start: number;
  end: number;
}

export interface VietnameseSentenceInfo {
  text: string;
  tokens: VietnameseTokenInfo[];
}

export interface VietnameseNLPResponse {
  original_text: string;
  sentences: VietnameseSentenceInfo[];
  entities: VietnameseEntityInfo[];
  token_count: number;
  sentence_count: number;
}

// Tokenize text
export const tokenizeText = async (text: string) => {
  const response = await axiosInstance.post('/nlp/tokenize', { text });
  return response.data;
};

// POS tagging
export const posTagging = async (text: string) => {
  const response = await axiosInstance.post('/nlp/pos-tagging', { text });
  return response.data;
};

// Lemmatization
export const lemmatizeText = async (text: string) => {
  const response = await axiosInstance.post('/nlp/lemmatize', { text });
  return response.data;
};

// Named Entity Recognition
export const namedEntityRecognition = async (text: string) => {
  const response = await axiosInstance.post('/nlp/ner', { text });
  return response.data;
};

// Full text analysis
export const fullTextAnalysis = async (text: string): Promise<NLPResponse> => {
  const response = await axiosInstance.post('/nlp/analyze', { text });
  return response.data;
};

// Vietnamese full analysis
export const vietnameseFullAnalysis = async (text: string): Promise<VietnameseNLPResponse> => {
  const response = await axiosInstance.post('/nlp/vietnamese/analyze', { text });
  return response.data;
};

// Get supported languages
export const getSupportedLanguages = async () => {
  const response = await axiosInstance.get('/nlp/supported-languages');
  return response.data;
};

// Health check
export const nlpHealthCheck = async () => {
  const response = await axiosInstance.get('/nlp/health');
  return response.data;
};

// Get POS tags for a language
export const getPosTags = async (language: string) => {
  const response = await axiosInstance.get(`/nlp/pos-tags/${language}`);
  return response.data;
};

// Get NER labels for a language
export const getNerLabels = async (language: string) => {
  const response = await axiosInstance.get(`/nlp/ner-labels/${language}`);
  return response.data;
};
