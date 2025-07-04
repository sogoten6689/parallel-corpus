'use client';

import { useDispatch } from 'react-redux';
import { setRows_1, setRows_2, setLang_1, setLang_2 } from '@/redux/slices/dataSlice';
import { RowWord } from '@/types/row-word.type';
import { useState } from 'react';
import { Button, Upload, App, Spin, Dropdown } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { initDictSenID } from '@/dao/data-utils';
import { parseLine } from '@/dao/utils';

const sampleFiles = [
  { label: 'Tiếng Anh-Việt (sample)', value_1: 'sample_en.txt', value_2: 'sample_vn.txt', name_1: 'en', name_2: 'vn' },
  { label: 'Tiếng Trung-Việt', value_1: 'Book301_cn.txt', value_2: 'Book301_vn.txt', name_1: 'cn', name_2: 'vn' },
];

export default function FileUploader() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [selectedSample, setSelectedSample] = useState("0");
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const uploadProps: UploadProps = {
    accept: '.txt',
    fileList,
    multiple: true,
    showUploadList: false,
    beforeUpload: () => false,
    onChange: (info) => {
      const files = info.fileList.slice(-2);

      if (files.length < 2 || files.length > 2) {
        setFileList([]);
        message.warning(t('please_upload_two_files'));
        return;
      }

      setFileList(files);

      const loadedRows: RowWord[][] = [];

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
      
      dispatch(setLang_1(sampleFiles[idx].name_1));
      dispatch(setLang_2(sampleFiles[idx].name_2));

      initDictSenID(rows1, rows2, dispatch);
    } catch (error) {
      console.error(error);
      message.error(t('error_loading_files'));
    } finally {
      setLoading(false);
    }
  };

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

