export class RowStat {
  Word: string;
  Count: number;
  Percent: number;
  F: number;

  constructor(word: string, count: number, percent: number, f: number) {
    this.Word = word;
    this.Count = count;
    this.Percent = percent;
    this.F = f;
  }
}