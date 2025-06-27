export class CorpusAlignment {
  id: number;
  word: string;
  tag_pos: string;
  id_target: number;

  constructor() {
    this.id = 0;
    this.word = '';
    this.tag_pos = '';
    this.id_target = 0;
  }
}

export interface SentenceAlignment {
  sentence_1: CorpusAlignment[];
  sentence_2: CorpusAlignment[];
}