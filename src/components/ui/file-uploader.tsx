'use client';

import { useDispatch } from 'react-redux';
import { setRows } from '@/redux/slices/dataSlice';
import { RowWord } from '@/types/row-word.type';

export default function FileUploader() {
  const dispatch = useDispatch();

  const parseLine = (line: string): RowWord => {
    const fields = line.split('\t');
    return {
      ID: fields[0],
      ID_sen: fields[1],
      Word: fields[2],
      Lemma: fields[3],
      Links: fields[4],
      Morph: fields[5],
      POS: fields[6],
      Phrase: fields[7],
      Grm: fields[8],
      NER: fields[9],
      Semantic: fields[10],
    };
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      const lines = text.split('\n').filter((l) => l.trim() !== '');
      const rows: RowWord[] = lines.map(parseLine);
      console.log(rows.length);
      
      dispatch(setRows(rows));
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <input type="file" accept=".txt" onChange={handleUpload} />
    </div>
  );
}
