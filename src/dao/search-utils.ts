import { RowWord } from "@/types/row-word.type";
import { containsSublistUnordered } from "@/dao/utils";
import { Point } from "@/types/point.type";
import { CorpusAlignment, SentenceAlignment } from "@/types/alignment.type";

export function searchWord(key: string, isMorph: boolean, corpus: RowWord[]): Record<string, RowWord> {
  key = key.trim().replace(' ', '_');
  const result: Record<string, RowWord> = {};

  if (!isMorph) { // Match CASE
    for (let i = 0; corpus && i < corpus.length; i++) {
      const word = corpus[i].Word;
      if (word && word === key) {
        if (!Object.keys(result).includes(corpus[i].ID_sen)) {
          result[corpus[i].ID_sen] = corpus[i];
        }
      }

    }
  } else { // MORPH CASE
    for (let i = 0; corpus && i < corpus.length; i++) {
      const word = corpus[i].Morph.toLowerCase();
      if (word && word === key) {
        if (!Object.keys(result).includes(corpus[i].ID_sen)) {
          result[corpus[i].ID_sen] = corpus[i];
        }
      }
    }
  }
  return result;
}

export function createPharse(key: string) {
  const result: string[] = [],
    words = key.split(' ');

  if (words.length >= 2) {
    let num_word = 2;
    while (num_word <= 4) {
      for (let k = 0; k < words.length; k++) {
        const temp: string[] = [];
        let h: number, i: number;

        for (h = 0; h < k; h++) {
          temp.push(words[h]);
        }

        for (i = k; i < words.length - num_word + 1; i += num_word) {
          let j = 0, phrase = '';
          while (j < num_word) {
            if (i + j < words.length) {
              phrase += words[i + j] + ' ';
              j++;
            }
            else {
              break;
            }
          }
          temp.push(phrase.trim());
        }

        while (i < words.length) {
          temp.push(words[i]);
          i++;
        }

        if (!containsSublistUnordered(result, temp)) {
          result.push(...temp);
        }
      }
      num_word++;
    }
  }
  else {
    result.push(key);
  }
  return result;
}

export function searchPhrase(key: string, corpus: RowWord[]) {
  const result: Record<string, RowWord[]> = {};

  const phrases = createPharse(key);

  phrases.forEach(phrase => {
    for (let i = 0; corpus && i < corpus.length; i++) {
      for (let j = 0; j < phrase.length; j++) {
        if (corpus[i + j].Word.toLowerCase() !== phrase[j].toLowerCase()) {
          break;
        }
        if (j === phrase.length - 1) {
          const list: RowWord[] = [];
          for (let h = i; h <= i + j; h++) {
            list.push(corpus[h]);
          }
          if (!Object.keys(result).includes(corpus[i].ID_sen)) {
            result[corpus[i].ID_sen] = list;
          }
        }
      }
    }
  });
  return result;
}

export function alignSentence(idSentence: string, rows_1: RowWord[], rows_2: RowWord[], dict_1: Record<string, Point>, dict_2: Record<string, Point>) {
  const lang_1: Point = dict_1[idSentence],
    lang_2: Point = dict_2[idSentence];
  const sentence_1: CorpusAlignment[] = [],
    sentence_2: CorpusAlignment[] = [];

  for (let i = lang_1.start, idx = 0; i <= lang_1.end; i++, idx++) {
    const corpus = new CorpusAlignment();
    corpus.id = idx;
    corpus.word = rows_1[i].Word;
    corpus.tag_pos = rows_1[i].POS;
    sentence_1.push(corpus);
  }

  for (let i = lang_2.start, idx = 0; i <= lang_2.end; i++, idx++) {
    const corpus = new CorpusAlignment();
    corpus.id = idx;
    corpus.word = rows_2[i].Word;
    corpus.tag_pos = rows_2[i].POS;
    sentence_2.push(corpus);
  }

  for (let i = lang_1.start; i <= lang_1.end; i++) {
    const row = rows_1[i];
    if (row.Links !== '-') {
      const aligned_indices = row.Links.split(',');
      aligned_indices.forEach(aligned_index => {
        const idx_target = Number(aligned_index) - 1;
        if (idx_target >= 0 && idx_target < sentence_2.length) {
          const id_target = sentence_2[idx_target].id;
          const idx_source = i - lang_1.start;
          if (
            sentence_1[idx_source] &&
            Array.isArray(sentence_1[idx_source].id_target)
          ) {
            sentence_1[idx_source].id_target.push(id_target);
          }
        }
      });
    }
  }

  const result: SentenceAlignment = {
    sentence_1: sentence_1,
    sentence_2: sentence_2
  };
  return result;
}