export interface SentencePair {
  id?: string;
  sentence_id: string;
  vietnamese_text: string;
  english_text: string;
  lang_pair: string;
  vietnamese_analysis?: WordAnalysis[];
  english_analysis?: WordAnalysis[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  created_by?: number;
  approval_by?: number;
  created_at?: string;
  updated_at?: string;
}

export interface WordAnalysis {
  id?: string;
  word: string;
  lemma: string;
  links: string;
  morph: string;
  pos: string;
  phrase: string;
  grm: string;
  ner: string;
  semantic: string;
  langCode: string;
}

export interface CreateSentencePairRequest {
  vietnameseText: string;
  englishText: string;
  langPair: string;
}

export interface SaveSentencePairRequest {
  sentenceId: string;
  vietnameseAnalysis: WordAnalysis[];
  englishAnalysis: WordAnalysis[];
  langPair: string;
}
