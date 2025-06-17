'use client';

import { useDispatch } from 'react-redux';
import { setRows } from '@/redux/slices/dataSlice';
import { RowWord } from '@/types/row-word.type';
import { useState } from 'react';
import { Button } from 'antd';
import { useTranslation } from 'react-i18next';


const sampleFiles = [
  { label: 'Tiếng Anh (sample_en.txt)', value: 'sample_en.txt' },
  { label: 'Tiếng Việt (sample_vn.txt)', value: 'sample_vn.txt' },
];

export default function FileUploader() {
    const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedSample, setSelectedSample] = useState('sample_en.txt');

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

  const parseTextAndDispatch = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim() !== '');
    const rows: RowWord[] = lines.map(parseLine);
    dispatch(setRows(rows));
  };

  const handleLoadSample = async () => {
    setLoading(true);
    const response = await fetch('/data/' + selectedSample); // public/data/sample_en.txt
    const text = await response.text();
    parseTextAndDispatch(text);
    setLoading(false);
  };

  return (
    <div className="flex">
        <div className="flex items-center space-x-2 mt-1">
          <select
            value={selectedSample}
            onChange={(e) => setSelectedSample(e.target.value)}
            className="border px-2 py-1 rounded"
          >
            {sampleFiles.map((file) => (
              <option key={file.value} value={file.value}>
                {file.label}
              </option>
            ))}
          </select>
          <Button
            onClick={handleLoadSample}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Tải lên
          </Button>
        </div>

      <div className="ml-4">
        <label className="font-semibold">{t("machine_upload")}: </label>
        <input type="file" accept=".txt" onChange={handleUpload} className="mt-1" placeholder=''/>
      </div>


      {/* {loading && <p className="text-gray-500">Đang tải dữ liệu...</p>} */}
    </div>
  );
}
