'use client';

import { useEffect, useState } from 'react';
import { Button, Upload, App, Spin, Form, Modal, Typography, Dropdown, Col, Row, Space } from 'antd';
import { DownOutlined, InboxOutlined, UploadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';
import { uploadMaterDataFileApi } from '@/services/master/master-api';
import { useAuth } from '@/contexts/AuthContext';

export default function FileUploaderMaster() {
  const { message } = App.useApp();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();
  const { logout } = useAuth();
  const [languagePair, setLanguagePair] = useState<string>('vi_en');
  const [langCode, setLangCode] = useState<string>('vi');
  const [langOptions, setLangOptions] = useState<{ key: string; label: string, onClick?: () => void }[]>([]);

  const handleSetLanguageGroup = (languageGroup: string) => {
    setLanguagePair(languageGroup);
  };

  useEffect(() => {
    const lang_1 = languagePair.split('_')[0];
    const lang_2 = languagePair.split('_')[1];
    const langOptions = [
      { key: lang_1, label: t(lang_1), onClick: () => {setLangCode(lang_1)} },
      { key: lang_2, label: t(lang_2), onClick: () => {setLangCode(lang_2)} },
    ];
    setLangOptions(langOptions);
    setLangCode(lang_1);
  }, [languagePair]);

  const languageGroupItems = [
    {
      key: 'vi_en',
      label: t('vi_en'),
      onClick: () => {
        handleSetLanguageGroup('vi_en');
      },
    },
    {
      key: 'vi_zh',
      label: t('vi_zh'),
      onClick: () => {
        handleSetLanguageGroup('vi_zh');
      },
    },
    {
      key: 'vi_ja',
      label: t('vi_ja'),
      onClick: () => {
        handleSetLanguageGroup('vi_ja');
      },
    },
    {
      key: 'vi_ru',
      label: t('vi_ru'),
      onClick: () => {
        handleSetLanguageGroup('vi_ru');
      },
    },

    {
      key: 'vi_ko',
      label: t('vi_ko'),
      onClick: () => {
        handleSetLanguageGroup('vi_ko');
      },
    },
  ];

  const accept = ".txt, .csv, .excel, .xlsx";

  const uploadProps: UploadProps = {
    accept: accept,
    fileList,
    showUploadList: true,
    beforeUpload: () => false, // ngăn auto upload
    onChange: (info) => {
      const files = info.fileList.slice(-1); // chỉ giữ file mới nhất
      setFileList(files);
    },
  };

  const handleSubmit = async () => {
    try {
      if (fileList.length === 0) {
        message.warning("Hãy chọn 1 file cần upload");
        return;
      }

      const file = fileList[0].originFileObj as File | undefined;
      if (!file) {
        message.error("File không hợp lệ");
        return;
      }

      setLoading(true);
      const res = await uploadMaterDataFileApi(file, langCode, languagePair);
      // console.log(res);

      if (res.status !== 200) {
        message.error("Upload thất bại!");
        if (res.status === 401) {
          logout();
        }
        return;
      } else {
        message.success("Upload thành công!");
        console.log("Upload response:", res.data);
        // reset
        form.resetFields();
        setFileList([]);
      }
    } catch (err: any) {
      if (err?.errorFields) {
        // lỗi validate form của antd
        return;
      }
      console.error(err);
      message.error(err?.message || "Có lỗi khi upload");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {loading && (
        <><Spin /><p className="text-gray-500 text-center">{t('loading_data')}</p></>
      )}
      <Button icon={<UploadOutlined />} type="dashed" onClick={() => setOpen(true)}>
        {t('master_data')}
      </Button>

      <Modal
        title="Upload dữ liệu & chọn ngôn ngữ"
        open={open}
        onCancel={() => {
          if (!loading) {
            setOpen(false);
          }
        }}
        onOk={handleSubmit}

      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
            Hỗ trợ định dạng: {accept}
          </Typography.Paragraph>


          <Form form={form} layout="vertical" requiredMark>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="lang_pair"
                  label="Cặp ngôn ngữ"
                  rules={[{ required: true, message: "Vui lòng chọn cặp ngôn ngữ" }]}
                >
                  <Dropdown menu={{ items: languageGroupItems }} trigger={['click']}>
                    <Space style={{ cursor: 'pointer' }}>
                      {languagePair ? t(languagePair) : t('en_vi')}
                      <DownOutlined />
                    </Space>
                  </Dropdown>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lang_code"
                  label="Ngôn ngữ"
                  rules={[{ required: true, message: "Vui lòng chọn ngôn ngữ" }]}
                >
                  <Dropdown menu={{ items: langOptions }} trigger={['click']}>
                    <Space style={{ cursor: 'pointer' }}>
                      {langCode ? t(langCode) : t('en')}
                      <DownOutlined />
                    </Space>
                  </Dropdown>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item label="File">

              <Upload.Dragger {...uploadProps}>
                <p className="ant-upload-drag-icon">
                  <InboxOutlined />
                </p>
                <p className="ant-upload-text">Kéo thả file vào đây hoặc bấm để chọn</p>
                <p className="ant-upload-hint">Chỉ 1 file, dữ liệu sẽ được gửi khi bấm nút OK</p>
              </Upload.Dragger>

            </Form.Item>
          </Form>


          <Typography.Paragraph type="secondary">
            Lưu ý: Nếu file CSV có BOM (UTF-8 with BOM), hãy xử lý trên server (ví dụ đọc với
            encoding \"utf-8-sig\") để tránh lỗi ID dạng \"\ufeff...\".
          </Typography.Paragraph>
        </Space>
      </Modal>
    </>
  );
}

