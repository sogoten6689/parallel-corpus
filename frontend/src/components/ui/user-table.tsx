'use client';

import React, { useEffect, useState } from 'react';
import { Table, Tooltip, Modal, Form, Input, DatePicker, Button, Space } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import useApp from 'antd/es/app/useApp';
import dayjs from 'dayjs';
import 'dayjs/locale/vi';
import 'dayjs/locale/en';
// RowWord removed – defining a dedicated User interface instead
import { getMachineLocale } from '@/dao/utils';
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { getUser, updateUserApi } from '@/services/user/user-api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface User {
  id: number;
  full_name: string;
  email: string;
  organization?: string;
  role: string;
  date_of_birth?: string; // ISO date (YYYY-MM-DD)
}

const fetchUsers = async (
  page: number,
  limit: number,
  search?: string,
): Promise<{ data: User[]; total: number }> => {
  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });

  if (search) params.append("search", search);

  const res = await getUser(page, limit, search);
  
  return res.data; 

};

type ColumnKey = keyof User | 'action';

export default function UserTable() {
  const { t } = useTranslation();
  const [machineLocale, setMachineLocale] = useState<'vi' | 'en'>(() => getMachineLocale('en'));
  const { message } = useApp();
  useEffect(() => { setMachineLocale(getMachineLocale('en')); }, []);
  useEffect(() => { dayjs.locale(machineLocale); }, [machineLocale]);
  const dateFormat = machineLocale === 'vi' ? 'DD/MM/YYYY' : 'YYYY-MM-DD';

  const getColumnWithTooltip = (key: ColumnKey) => ({
    title: <Tooltip title={t(`${String(key)}_tooltip`)}>{t(String(key))}</Tooltip>,
    dataIndex: key === 'action' ? undefined : key,
    key: String(key),
  });

  // Unified column keys list including action like master-row-word-table pattern
  const columnKeys: ColumnKey[] = ['id', 'full_name', 'email', 'organization', 'role', 'date_of_birth', 'action'];

  const columns: ColumnsType<User> = columnKeys.map((key) => {
    const base = getColumnWithTooltip(key);
    if (key === 'date_of_birth') {
      return {
        ...base,
        render: (value: User['date_of_birth']) => {
          if (!value) return <span>-</span>;
            const format = machineLocale === 'vi' ? 'DD/MM/YYYY' : 'YYYY-MM-DD';
            const d = dayjs(value);
            return d.isValid() ? d.format(format) : value;
        }
      };
    }
    if (key === 'action') {
      return {
        ...base,
        render: (_: unknown, record: User) => (
          <Space>
            <Button size="small" onClick={() => openEdit(record)}>{t('edit')}</Button>
          </Space>
        )
      };
    }
    return base;
  });

  // Edit modal state & form
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm] = Form.useForm();

  const openEdit = (record: User) => {
    setEditingUser(record);
    editForm.setFieldsValue({
      full_name: record.full_name,
      organization: record.organization,
      role: record.role,
      date_of_birth: record.date_of_birth ? dayjs(record.date_of_birth) : null,
      email: record.email,
    });
    setEditOpen(true);
  };

  interface FormValues { full_name: string; organization?: string; role?: string; date_of_birth?: dayjs.Dayjs | null; email: string }
  interface UpdatePayload { full_name?: string; date_of_birth?: string; organization?: string; role?: string }
  const handleEditOk = () => {
    editForm.validateFields().then((values: FormValues) => {
      if (!editingUser) return;
      const payload: UpdatePayload = {
        full_name: values.full_name?.trim() || undefined,
        date_of_birth: values.date_of_birth ? values.date_of_birth.format('YYYY-MM-DD') : undefined,
        organization: values.organization || undefined,
        role: values.role || editingUser.role,
      };
      mutationUpdate.mutate({ id: editingUser.id, payload, formValues: values });
    });
  };

  const handleEditCancel = () => {
    setEditOpen(false);
    setEditingUser(null);
  };

  // (Action column already included in dynamic columns mapping above)
  // Removed modal state (no detail modal on click)
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });


  const { data, isLoading, error } = useQuery<{ data: User[]; total: number }, Error>({
    queryKey: ['users', pagination.current, pagination.pageSize],
    queryFn: () => fetchUsers(pagination.current, pagination.pageSize),
  });

  const queryClient = useQueryClient();
  interface UpdateVars { id: number; payload: UpdatePayload; formValues: FormValues }
  const mutationUpdate = useMutation({
    mutationFn: async ({ id, payload }: UpdateVars) => updateUserApi(id, payload),
    onSuccess: (_res, variables: UpdateVars) => {
      // Update cache: refetch or manual patch
      queryClient.invalidateQueries({ queryKey: ['users'] });
      // Also close modal
      setEditOpen(false);
      if (editingUser) {
        setEditingUser({ ...editingUser, ...variables.formValues, date_of_birth: variables.formValues.date_of_birth ? variables.formValues.date_of_birth.format('YYYY-MM-DD') : '' });
      }
      message.success(t('edit_success'));
    },
    onError: () => {
      message.error(t('edit_failed'));
    }
  });

  useEffect(() => {
    if (data) {
      setPagination(prev => ({ ...prev, total: data.total }));
    }
  }, [data]);
  
  const handleTableChange = (pager: TablePaginationConfig) => {
    setPagination(prev => ({
      ...prev,
      current: pager.current || 1,
      pageSize: pager.pageSize || prev.pageSize,
    }));
  };
  // Removed showModal and handleCancel (modal deleted)

  return (
    <div>
      <div className="mb-4">
      </div>
      {isLoading && <p>{t('loading')}</p>}
      {error && <p>{t('error')}: {error.message}</p>}
      {data && (
        <>
          <Table<User>
            dataSource={data.data}
            columns={columns}
            rowKey={(record) => record.id}
            scroll={{ x: 'max-content' }}
            className='w-full'
            bordered
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
            }}
            onChange={(pager: TablePaginationConfig) => handleTableChange(pager)}
          />
          <Modal
            title={t('edit')}
            open={editOpen}
            onOk={handleEditOk}
            onCancel={handleEditCancel}
            okText={t('save')}
            cancelText={t('cancel')}
            confirmLoading={mutationUpdate.isPending}
          >
            <Form layout='vertical' form={editForm}>
              <Form.Item label={t('email')} name='email'>
                <Input disabled />
              </Form.Item>
              <Form.Item label={t('full_name')} name='full_name' rules={[{ required: true }]}> 
                <Input />
              </Form.Item>
              <Form.Item label={t('organization')} name='organization'>
                <Input />
              </Form.Item>
              <Form.Item label={t('role')} name='role'>
                <Input />
              </Form.Item>
              <Form.Item label={t('date_of_birth')} name='date_of_birth'>
                <DatePicker
                  style={{ width: '100%' }}
                  format={dateFormat}
                  disabledDate={(d) => d && d.isAfter(dayjs())}
                />
              </Form.Item>
            </Form>
          </Modal>
        </>
      )}
  {/* Modal removed as per request (ID click no longer opens details) */}
    </div>
  );
}
