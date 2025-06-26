import { RowWord } from "@/types/row-word.type";

export const SEARCH_POS = 1;
export const SEARCH_NER = 2;
export const SEARCH_SEM = 3;

export function search(key: string, tag: number, corpus: RowWord[]) {
  const list: Record<string, RowWord> = {};

  switch (tag) {
    case SEARCH_POS:
      for (let i = 0; i < corpus.length; i++) {
        if (corpus[i].POS.toLowerCase() === key) {
          const id = corpus[i].ID_sen!;
          if (!(id in list)) {
            list[id] = corpus[i];
          }
        }
      }
      break;
    case SEARCH_NER:
      for (let i = 0; i < corpus.length; i++) {
        if (corpus[i].NER.toLowerCase() === key) {
          const id = corpus[i].ID_sen!;
          if (!(id in list)) {
            list[id] = corpus[i];
          }
        }
      }
      break;
    case SEARCH_SEM:
      for (let i = 0; i < corpus.length; i++) {
        if (corpus[i].Semantic.toLowerCase() === key) {
          const id = corpus[i].ID_sen!;
          if (!(id in list)) {
            list[id] = corpus[i];
          }
        }
      }
      break;
  }
  return list;
}
