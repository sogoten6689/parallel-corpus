'use client';

import { useDispatch } from 'react-redux';
import { useEffect, useMemo, useState } from 'react';
import { Button, Upload, App, Spin, Form, Modal, Select, Space, Typography } from 'antd';
import { InboxOutlined, UploadOutlined } from '@ant-design/icons';
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

  useEffect(() => {
    // console.log("open", open);
  }, [open]);
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

  const langOptions = useMemo(
    () => [
      { label: "Việt Nam (vi)", value: "vi" },
      { label: "English (en)", value: "en" },
      { label: "Hán (zh)", value: "zh" },
    ],
    []
  );

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
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
      const res = await uploadMaterDataFileApi(file, values.lang);
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
            <Form.Item
              name="lang"
              label="Ngôn ngữ"
              rules={[{ required: true, message: "Vui lòng chọn ngôn ngữ" }]}
            >
              <Select
                placeholder="Chọn ngôn ngữ"
                options={langOptions}

                showSearch
                optionFilterProp="label"
              />
            </Form.Item>


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

