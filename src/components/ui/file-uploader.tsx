'use client';

import { useDispatch } from 'react-redux';
import { setRows_1, setRows_2 } from '@/redux/slices/dataSlice';
import { RowWord } from '@/types/row-word.type';
import { useState } from 'react';
import { Button, Upload, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const sampleFiles = [
  { label: 'Tiếng Anh-Việt (sample)', value_1: 'sample_en.txt', value_2: 'sample_vn.txt' },
];

export default function FileUploader() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedSample, setSelectedSample] = useState("0");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

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

  const handleUpload = (file: File): Promise<void> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const text = reader.result as string;
          const lines = text.split('\n').filter((l) => l.trim() !== '');
          const rows: RowWord[] = lines.map(parseLine);
          if (rows.length === 0) {
            message.error(t('no_valid_data'));
            reject(new Error('No valid data'));
            return;
          }
          // Dispatch based on file order
          if (fileList.length === 0) {
            dispatch(setRows_1(rows));
          } else {
            dispatch(setRows_2(rows));
          }
          resolve();
        } catch (error) {
          message.error(t('error_parsing_file'));
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  };

  const uploadProps: UploadProps = {
    accept: '.txt',
    fileList,
    multiple: true,
    beforeUpload: (file) => {
      if (fileList.length >= 2) {
        message.error(t('max_two_files'));
        return false;
      }
      handleUpload(file);
      setFileList(prev => [...prev, { ...file, status: 'done' } as UploadFile]);
      return false; // Prevent default upload behavior
    },
    onRemove: (file) => {
      setFileList(prev => prev.filter(item => item.uid !== file.uid));
      // Clear corresponding data
      if (fileList.indexOf(file) === 0) {
        dispatch(setRows_1([]));
      } else {
        dispatch(setRows_2([]));
      }
    },
  };

  const parseTextAndDispatch = (text: string, action: any) => {
    const lines = text.split('\n').filter((l) => l.trim() !== '');
    const rows: RowWord[] = lines.map(parseLine);
    dispatch(action(rows));
  };

  const handleLoadSample = async () => {
    setLoading(true);
    const idx = Number(selectedSample);
    const file_1 = sampleFiles[idx].value_1,
      file_2 = sampleFiles[idx].value_2;
    const response_dt1 = await fetch('/data/' + file_1),
      response_dt2 = await fetch('/data/' + file_2);
    if (!response_dt1.ok || !response_dt2.ok) {
      alert('Failed to load sample files');
      setLoading(false);
      return;
    }
    const text_1 = await response_dt1.text(),
      text_2 = await response_dt2.text();
    parseTextAndDispatch(text_1, setRows_1);
    parseTextAndDispatch(text_2, setRows_2);
    setLoading(false);
  };

  return (
    <div className="flex w-full justify-center items-center">
      {loading && (
        <p className="text-gray-500 text-center">{t('loading_data')}</p>
      )}
      {/* Sample Files Section */}
      <div className="flex flex-row items-center space-x-2">
        <select
          value={selectedSample}
          onChange={(e) => setSelectedSample(e.target.value)}
          className="border px-2 py-1 rounded"
        >
          {sampleFiles.map((file, idx) => (
            <option key={idx} value={idx}>
              {file.label}
            </option>
          ))}
        </select>
        <Button
          onClick={handleLoadSample}
          className="px-3 py-1 rounded"
          type="primary"
          loading={loading}
        >
          {t("view_sample")}
        </Button>
      </div>

      {/* File Upload Section */}
      <div className="flex flex-row items-center space-x-2 ml-4">
        <label className="font-semibold">{t("machine_upload")}:</label>
        <Upload {...uploadProps}>
          <Button icon={<UploadOutlined />}>
            {t('selected_files')} (Max: 2)
          </Button>
        </Upload>
      </div>
    </div>
  );
}
