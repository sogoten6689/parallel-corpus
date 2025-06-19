'use client';

import { useDispatch, useSelector } from 'react-redux';
import { setRows_1, setRows_2 } from '@/redux/slices/dataSlice';
import { RowWord } from '@/types/row-word.type';
import { useState } from 'react';
import { Button, Upload, App, Spin, Dropdown } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { initDictSenID } from '@/dao/data-util';
import { RootState } from "@/redux";

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
    if (fields.length !== 10) {
      return {} as RowWord;
    }
    return {
      ID: fields[0],
      ID_sen: fields[0].slice(2, -2),
      Word: fields[1],
      Lemma: fields[2],
      Links: fields[3],
      Morph: fields[4],
      POS: fields[5],
      Phrase: fields[6],
      Grm: fields[7],
      NER: fields[8],
      Semantic: fields[9],
    };
  };

  const uploadProps: UploadProps = {
    accept: '.txt',
    fileList,
    multiple: true,
    showUploadList: false,
    beforeUpload: () => false,
    onChange: (info) => {
      let files = info.fileList.slice(-2);

      if (files.length < 2) {
        setFileList([]);
        message.warning(t('please_upload_two_files'));
        return;
      }

      setFileList(files);

      let loadedRows: RowWord[][] = [];

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
              loadedRows[idx] = rows;
              if (idx === 0) {
                dispatch(setRows_1(rows));
              } else {
                dispatch(setRows_2(rows));
              }

              // Initialize dictionary only after both files are processed
              if (loadedRows[0] && loadedRows[1]) {
                initDictSenID(loadedRows[0], loadedRows[1], dispatch);
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

  const handleLoadSample = async () => {
    setLoading(true);
    const idx = Number(selectedSample);
    const file_1 = sampleFiles[idx].value_1,
      file_2 = sampleFiles[idx].value_2;
    try {
      const [response_dt1, response_dt2] = await Promise.all([
        fetch('/data/' + file_1),
        fetch('/data/' + file_2)
      ]);

      if (!response_dt1.ok || !response_dt2.ok) {
        message.error(t('failed_to_load_sample_files'));
        return;
      }

      const [text_1, text_2] = await Promise.all([
        response_dt1.text(),
        response_dt2.text()
      ]);

      const rows1 = text_1.split('\n').filter(l => l.trim()).map(parseLine);
      const rows2 = text_2.split('\n').filter(l => l.trim()).map(parseLine);

      dispatch(setRows_1(rows1));
      dispatch(setRows_2(rows2));
      
      // Initialize dictionary with actual loaded rows
      initDictSenID(rows1, rows2, dispatch);
    } catch (error) {
      message.error(t('error_loading_files'));
    } finally {
      setLoading(false);
    }
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

