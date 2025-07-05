import { Point } from "@/types/point.type";
import { addToDicId_1, addToDicId_2, setDicId_1, setDicId_2 } from "@/redux/slices/dataSlice";
import { RowWord } from "@/types/row-word.type";
import { UnknownAction } from "@reduxjs/toolkit";
import { Dispatch } from "react";
import { Sentence } from "@/types/sentence.type";

export function initDictSenID(rows_1: RowWord[], rows_2: RowWord[], dispatch: Dispatch<UnknownAction>) {
  dispatch(setDicId_1({}));
  dispatch(setDicId_2({}));

  let idSen = "", start = 0;
  for (let i = 0; i < rows_1.length; i++) {
    if (i == 0) {
      idSen = rows_1[i].ID_sen;
    }
    else if (i == rows_1.length - 1) {
      const p: Point = { start: start, end: i };
      dispatch(addToDicId_1(
        { key: idSen, point: p }));
    }
    if (idSen !== rows_1[i].ID_sen) {
      const p: Point = { start: start, end: i - 1 };
      dispatch(addToDicId_1(
        { key: idSen, point: p }
      ));
      idSen = rows_1[i].ID_sen;
      start = i;
    }
  }

  idSen = "";
  start = 0;
  for (let i = 0; i < rows_2.length; i++) {
    if (i == 0) {
      idSen = rows_2[i].ID_sen;
    }
    else if (i == rows_2.length - 1) {
      const p: Point = { start: start, end: i };
      dispatch(addToDicId_2(
        { key: idSen, point: p }
      ));
    }
    if (idSen !== rows_2[i].ID_sen) {
      const p: Point = { start: start, end: i - 1 };
      dispatch(addToDicId_2(
        { key: idSen, point: p }
      ));
      idSen = rows_2[i].ID_sen;
      start = i;
    }
  }
}

export function getPoint(idSentence: string, dicId: Record<string, Point>) {
  return dicId[idSentence];
}

export function getSentence(row: RowWord, corpus: RowWord[], dicId: Record<string, Point>) {
  const p: Point = getPoint(row.ID_sen, dicId),
    sentence: Sentence = new Sentence();

  for (let i = p.start; i <= p.end; i++) {
    const word = corpus[i];
    if (word.ID_sen === row.ID_sen) {
      sentence.ID_sen = word.ID_sen;
      if (word.ID.localeCompare(row.ID) < 0) {
        sentence.Left += word.Word + ' ';
      }
      if (word.ID === row.ID) {
        sentence.Center = word.Word;
      }
      if (word.ID.localeCompare(row.ID) > 0) {
        sentence.Right += word.Word + ' ';
      }
    }
  }
  sentence.formatSpace();
  return sentence;
}

export function getSentenceOther(row: RowWord, corpus: RowWord[], dicId: Record<string, Point>) {
  const p: Point = getPoint(row.ID_sen, dicId),
    sentence: Sentence = new Sentence();

  if (!p) {
    return sentence;
  }

  sentence.ID_sen = row.ID_sen;
  if (row.Links === '-') {
    for (let i = p.start; i <= p.end; i++) {
      const r: RowWord = corpus[i];
      sentence.Left = '';
      sentence.Center = '-';
      sentence.Right = r.Word + ' ';
    }
  } else {
    const links: string[] = row.Links.split(',').filter(s => s.length > 0);
    for (let i = p.start; i <= p.end; i++) {
      const r: RowWord = corpus[i];
      const num: string = r.ID.slice(-2);

      const firstLink = links[0].padStart(2, '0');
      const lastLink = links[links.length - 1].padStart(2, '0');

      if (num < firstLink) {
        sentence.Left += r.Word + " ";
      } else if (num > lastLink) {
        sentence.Right += r.Word + " ";
      } else {
        sentence.Center += r.Word + " ";
      }
    }
  }
  sentence.formatSpace();
  return sentence;
}

export function getPOSSet(corpus: RowWord[]): string[] {
  const POSSet: string[] = [];

  for (const rw of corpus) {
    if (rw.POS !== "-") {
      if (!POSSet.includes(rw.POS)) {
        POSSet.push(rw.POS);
      }
    }
  }

  return POSSet.sort();
}

export function getNERSet(corpus: RowWord[]): string[] {
  const NERSet: string[] = [];

  for (const rw of corpus) {
    if (rw.NER !== "-") {
      if (!NERSet.includes(rw.NER)) {
        NERSet.push(rw.NER);
      }
    }
  }

  return NERSet.sort();
}

export function getSEMSet(corpus: RowWord[]): string[] {
  const SEMSet: string[] = [];

  for (const rw of corpus) {
    if (rw.Semantic !== "-") {
      if (!SEMSet.includes(rw.Semantic)) {
        SEMSet.push(rw.Semantic);
      }
    }
  }

  return SEMSet.sort();
}
