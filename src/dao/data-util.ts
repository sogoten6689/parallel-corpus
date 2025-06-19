import { Point } from "@/types/point.type";
import { addToDicId_1, addToDicId_2, setDicId_1, setDicId_2 } from "@/redux/slices/dataSlice";

export function initDictSenID(rows_1: any[], rows_2: any[], dispatch: any) {
  dispatch(setDicId_1({})); // Initialize dicId_1
  dispatch(setDicId_2({})); // Initialize dicId_2
  // Initialize the dictionary for sentence IDs in rows_1
  let idSen = "", start = 0;
  for (let i = 0; i < rows_1.length; i++) {
    if (i == 0) {
      idSen = rows_1[i].ID_sen;
    }
    else if (i == rows_1.length - 1) {
      let p: Point = { start: start, end: i };
      dispatch(addToDicId_1(
        { key: idSen, point: p }));
    }
    if (idSen !== rows_1[i].ID_sen) {
      let p: Point = { start: start, end: i - 1 };
      dispatch(addToDicId_1(
        { key: idSen, point: p }
      ));
      idSen = rows_1[i].ID_sen;
      start = i;
    }
  }

  // Initialize the dictionary for sentence IDs in rows_2
  idSen = "";
  start = 0;
  for (let i = 0; i < rows_2.length; i++) {
    if (i == 0) {
      idSen = rows_2[i].ID_sen;
    }
    else if (i == rows_2.length - 1) {
      let p: Point = { start: start, end: i };
      dispatch(addToDicId_2(
        { key: idSen, point: p }
      ));
    }
    if (idSen !== rows_2[i].ID_sen) {
      let p: Point = { start: start, end: i - 1 };
      dispatch(addToDicId_2(
        { key: idSen, point: p }
      ));
      idSen = rows_2[i].ID_sen;
      start = i;
    }
  }
}