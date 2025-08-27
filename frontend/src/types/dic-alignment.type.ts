export class DicAlignment {
  id: number;
  word: string;
  pos: string;
  id_target: number[];

  constructor() {
    this.id = 0;
    this.word = '';
    this.pos = '';
    this.id_target = [];
  }
}

export interface DicSentenceAlignment {
  sentence_1: DicAlignment[];
  sentence_2: DicAlignment[];
}