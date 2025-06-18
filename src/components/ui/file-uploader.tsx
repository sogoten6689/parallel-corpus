'use client';

import { useDispatch } from 'react-redux';
import { setRows_1, setRows_2 } from '@/redux/slices/dataSlice';
import { RowWord } from '@/types/row-word.type';
import { useState } from 'react';
import { Button, Upload, App, Spin, Dropdown } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const sampleFiles = [
  { label: 'Tiếng Anh-Việt (sample)', value_1: 'sample_en.txt', value_2: 'sample_vn.txt' },
];

export default function FileUploader() {
  const { message } = App.useApp(); // Add this line to get message from App context
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
    showUploadList: false,
    beforeUpload: () => false, // Prevent auto upload
    onChange: (info) => {
      let files = info.fileList.slice(-2);

      if (files.length < 2) {
        setFileList([]); // Clear fileList so next selection is fresh
        message.warning(t('please_upload_two_files'));
        // Optionally clear redux state here if needed
        return;
      }

      setFileList(files);

      // Process files only if exactly two are selected
      files.forEach((file, idx) => {
        if (file.originFileObj) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const text = reader.result as string;
              const lines = text.split('\n').filter((l) => l.trim() !== '');
              const rows: RowWord[] = lines.map(parseLine);
              if (rows.length === 0) {
                message.error(t('no_valid_data'));
                return;
              }
              if (idx === 0) {
                dispatch(setRows_1(rows));
              } else {
                dispatch(setRows_2(rows));
              }
            } catch {
              message.error(t('error_parsing_file'));
            }
          };
          reader.readAsText(file.originFileObj);
        }
      });
    }
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
      message.error(t('failed_to_load_sample_files') || 'Failed to load sample files');
      setLoading(false);
      return;
    }
    const text_1 = await response_dt1.text(),
      text_2 = await response_dt2.text();
    parseTextAndDispatch(text_1, setRows_1);
    parseTextAndDispatch(text_2, setRows_2);
    setLoading(false);
  };

  // Dropdown menu for sample files
  const sampleMenuItems = sampleFiles.map((file, idx) => ({
    key: String(idx),
    label: file.label,
  }));

  return (
    <>
      {loading && (
        <><Spin /><p className="text-gray-500 text-center">{t('loading_data')}</p></>
      )}
      <Dropdown
        menu={{
          items: sampleMenuItems,
          onClick: ({ key }) => setSelectedSample(key),
          selectedKeys: [selectedSample],
        }}
        arrow
        trigger={['click']}
      >
        <Button className="rounded">
          {sampleFiles[Number(selectedSample)].label}
        </Button>
      </Dropdown>
      <Button
        onClick={handleLoadSample}
        className="rounded"
        type="primary"
        loading={loading}
      >
        {t("view_sample")}
      </Button>
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>
          {t('select_files')}
        </Button>
      </Upload>
    </>
  );
}
