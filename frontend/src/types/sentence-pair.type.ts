export interface SentencePair {
  id?: string;
  sentenceId: string;
  vietnameseText: string;
  englishText: string;
  langPair: string;
  vietnameseAnalysis?: WordAnalysis[];
  englishAnalysis?: WordAnalysis[];
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  createdBy?: number;
  approvalBy?: number;
  createdAt?: string;
  updatedAt?: string;
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
