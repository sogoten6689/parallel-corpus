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
import { uploadMaterDataFileApi } from '@/services/import/import-api';
import { info } from 'console';

export default function FileUploaderMaster() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [file, setFile] = useState<File | null>(null);

  // const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   if (e.target.files) {
  //     setFile(e.target.files[0]);
  //   }
  // };
  
  // const handleUpload = async (info) => {
  //   console.log("11111");
    
  //   if (!file) return;

  //   const formData = new FormData();
  //   formData.append("file", file);
  //   const res = await uploadMaterDataFileApi(file);

  //   if (res.status !== 200) {
  //     message.error("error");
  //     return;
  //   } else {
  //     message.success("success");
  //   }

  //   // const res = await fetch("http://localhost:8000/upload", {
  //   //   method: "POST",
  //   //   body: formData,
  //   // });

  //   // const data = await res.json();
  //   // console.log("Upload response:", data);
  // };
  

  const handleChange = async (file: any) => {
    try {
      const res = await uploadMaterDataFileApi(file.originFileObj);
      message.success("Upload thành công!");
      console.log("Upload response:", res.data);
    } catch (err) {
      message.error("Upload thất bại!");
      console.error(err);
    }
  };

  const uploadProps: UploadProps = {
    accept: ".txt, .csv, .excel, .xlsx",
    fileList,
    showUploadList: false,
    beforeUpload: () => false, // ngăn auto upload
    onChange: (info) => {
      const files = info.fileList.slice(-1); // chỉ giữ file mới nhất
      setFileList(files);

      if (files[0]?.originFileObj) {
        handleChange(files[0]);
      }
    },
  };


  return (
    <>
      {loading && (
        <><Spin /><p className="text-gray-500 text-center">{t('loading_data')}</p></>
      )}
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>
          {t('master_data1')}
        </Button>
      </Upload>
    </>
  );
}

