export class Sentence {
  ID_sen: string;
  Left: string;
  Center: string;
  Right: string;

  constructor() {
    this.ID_sen = "";
    this.Left = "";
    this.Center = "";
    this.Right = "";
  }

  formatSpace(): void {
    this.Left = this.Left.replace(/_/g, " ");
    this.Center = this.Center.replace(/_/g, " ");
    this.Right = this.Right.replace(/_/g, " ");

    const punc1s = [".", ",", "?", "/", ":", ";", "\\", "!", "%", ")", "}", "]"];
    for (const punc of punc1s) {
      const regex = new RegExp(` \\${punc}`, 'g');
      this.Left = this.Left.replace(regex, punc);
      this.Center = this.Center.replace(regex, punc);
      this.Right = this.Right.replace(regex, punc);
    }

    const punc2s = ["(", "[", "{"];
    for (const punc of punc2s) {
      const regex = new RegExp(`\\${punc} `, 'g');
      this.Left = this.Left.replace(regex, punc);
      this.Center = this.Center.replace(regex, punc);
      this.Right = this.Right.replace(regex, punc);
    }
  }
}