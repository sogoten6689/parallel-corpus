import { RowWord } from "@/types/row-word.type";
import { containsSublistUnordered } from "@/utils/util";

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
      // iterate through the number of words
      for (let k = 0; k < words.length; k++) {
        const temp: string[] = [];
        let h: number, i: number;
        // if the word is stand alone then add it to the temp
        for (h = 0; h < k; h++) {
          temp.push(words[h]);
        }
        // create pharse with number of words in pharse equal to num_word and start from k
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
          temp.push(phrase.trim()); // add the phrase to the temp
        }
        // add the remaining words to the temp
        while (i < words.length) {
          temp.push(words[i]);
          i++;
        }
        // check if the temp already exists in the result
        if (!containsSublistUnordered(result, temp)) {
          result.push(...temp); // add the temp to the result
        }
      }
      num_word++; // increase the number of words in pharse
    }
  }
  else {
    result.push(key); // if the key is a single word, add it to the result
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
          break; // If any word does not match, break the inner loop
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