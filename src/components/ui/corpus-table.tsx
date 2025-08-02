'use client';

import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, message, Modal, Form, Select, Tag } from 'antd';
import { SearchOutlined, PlusOutlined, EditOutlined, DeleteOutlined, DownloadOutlined, UploadOutlined, EditFilled, SaveOutlined, RobotOutlined } from '@ant-design/icons';
import { apiService, RowWord, RowWordCreate } from '@/services/api';
import { useTranslation } from 'react-i18next';

const { Search } = Input;
const { Option } = Select;

interface CorpusTableProps {
  onWordSelect?: (word: RowWord) => void;
  data?: RowWord[];
  sentences?: Record<string, any>;
}

const CorpusTable: React.FC<CorpusTableProps> = ({ onWordSelect, data: propData, sentences }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<RowWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingWord, setEditingWord] = useState<RowWord | null>(null);
  const [form] = Form.useForm();
  const [editMode, setEditMode] = useState(false);
  const [autoFilling, setAutoFilling] = useState(false);

  const fetchData = async (page = 1, pageSize = 20, search = '') => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize;
      const response = await apiService.getAllRowWords();
      
      if (response.success && response.data) {
        const result = response.data as any;
        setData(result.data || result);
        setPagination(prev => ({
          ...prev,
          current: page,
          pageSize,
          total: result.total || result.data?.length || 0,
        }));
      } else {
        message.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If propData is provided, use it (from Redux store)
    if (propData && propData.length > 0) {
      setData(propData);
      setPagination(prev => ({
        ...prev,
        total: propData.length,
      }));
      setLoading(false);
      setEditMode(false); // Reset edit mode when sample data changes
    } else {
      // Otherwise fetch from backend
      fetchData();
    }
  }, [propData]);

  const handleSearch = (value: string) => {
    setSearchText(value);
    if (propData && propData.length > 0) {
      // Filter data locally if using Redux store data
      const filteredData = propData.filter(item => 
        item.Word?.toLowerCase().includes(value.toLowerCase()) ||
        item.Lemma?.toLowerCase().includes(value.toLowerCase()) ||
        item.POS?.toLowerCase().includes(value.toLowerCase())
      );
      setData(filteredData);
      setPagination(prev => ({
        ...prev,
        current: 1,
        total: filteredData.length,
      }));
    } else {
      // Fetch from backend if no propData
      fetchData(1, pagination.pageSize, value);
    }
  };

  const handleTableChange = (pagination: any) => {
    if (propData && propData.length > 0) {
      // Handle pagination locally if using Redux store data
      setPagination(prev => ({
        ...prev,
        current: pagination.current,
        pageSize: pagination.pageSize,
      }));
    } else {
      // Fetch from backend if no propData
      fetchData(pagination.current, pagination.pageSize, searchText);
    }
  };

  // Calculate data to display based on pagination
  const getDisplayData = () => {
    if (propData && propData.length > 0) {
      // For Redux store data, handle pagination locally
      const startIndex = (pagination.current - 1) * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      return data.slice(startIndex, endIndex);
    }
    // For backend data, return as is (backend handles pagination)
    return data;
  };

  const handleAdd = () => {
    setEditingWord(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: RowWord) => {
    setEditingWord(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'Are you sure you want to delete this word?',
      content: 'This action cannot be undone.',
      okText: 'Yes',
      okType: 'danger',
      cancelText: 'No',
      onOk: async () => {
        try {
          if (propData) {
            // For sample data, update local state
            const updatedData = data.filter(item => item.ID !== id);
            setData(updatedData);
            setPagination(prev => ({
              ...prev,
              total: updatedData.length,
            }));
            message.success('Word deleted from sample data');
          } else {
            // For database data, call API
            const response = await apiService.request(`/api/words/${id}`, {
              method: 'DELETE',
            });
            
            if (response.success) {
              message.success('Word deleted successfully');
              fetchData(pagination.current, pagination.pageSize, searchText);
            } else {
              message.error('Failed to delete word');
            }
          }
        } catch (error) {
          console.error('Error deleting word:', error);
          message.error('Error deleting word');
        }
      },
    });
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingWord) {
        if (propData) {
          // For sample data, update local state
          const updatedData = data.map(item => 
            item.ID === editingWord.ID 
              ? { ...item, ...values }
              : item
          );
          setData(updatedData);
          message.success('Word updated in sample data');
        } else {
          // For database data, call API
          const updateData = {
            ID: editingWord.ID,
            ID_sen: editingWord.ID_sen,
            ...values
          };
          const response = await apiService.request(`/api/words/${editingWord.ID}`, {
            method: 'PUT',
            body: JSON.stringify(updateData),
          });
          
          if (response.success) {
            message.success('Word updated successfully');
          } else {
            message.error('Failed to update word');
          }
        }
      } else {
        // Create new word - only for database data
        if (!propData) {
          const response = await apiService.createRowWord(values);
          
          if (response.success) {
            message.success('Word created successfully');
          } else {
            message.error('Failed to create word');
          }
        } else {
          message.warning('Cannot create new words in sample data');
        }
      }
      
      setIsModalVisible(false);
      if (!propData) {
        fetchData(pagination.current, pagination.pageSize, searchText);
      }
    } catch (error) {
      console.error('Error saving word:', error);
      message.error('Error saving word');
    }
  };

  const handleExport = async () => {
    try {
      const blob = await apiService.exportRowWordsExcel();
      if (blob) {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'row_words.xlsx';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        message.success('Export successful');
      } else {
        message.error('Export failed');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      message.error('Error exporting data');
    }
  };

  const handleImport = async (file: File) => {
    try {
      const response = await apiService.importCorpusFile(file);
      
      if (response.success) {
        message.success(response.data?.message || 'Import successful');
        if (!propData) {
          fetchData(pagination.current, pagination.pageSize, searchText);
        }
      } else {
        message.error(response.error || 'Import failed');
      }
    } catch (error) {
      console.error('Error importing:', error);
      message.error('Error importing data');
    }
  };

  const handleSaveToDatabase = async () => {
    if (!propData || data.length === 0) {
      message.warning('No data to save');
      return;
    }

    Modal.confirm({
      title: 'Save Sample Data to Database',
      content: `Are you sure you want to save ${data.length} words to the database? This action cannot be undone.`,
      okText: 'Yes, Save',
      okType: 'primary',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          setLoading(true);
          
          // Use batch API to save all words at once
          const response = await apiService.createBatchRowWords(data);
          
          if (response.success) {
            const result = response.data;
            if (result.error_count === 0) {
              const messageText = `Successfully saved ${result.success_count} words and ${result.corpus_success_count || 0} sentences to database`;
              message.success(messageText);
            } else {
              const messageText = `Saved ${result.success_count} words, ${result.corpus_success_count || 0} sentences, ${result.error_count} failed`;
              message.warning(messageText);
              if (result.errors) {
                console.error('Batch save errors:', result.errors);
              }
            }
          } else {
            message.error('Failed to save to database');
          }
        } catch (error) {
          console.error('Error saving to database:', error);
          message.error('Error saving to database');
        } finally {
          setLoading(false);
        }
      },
    });
  };

  const handleAutoFill = async () => {
    if (!propData || data.length === 0) {
      message.warning('No data to auto-fill. Please load sample data first.');
      return;
    }

    setAutoFilling(true);
    try {
      const response = await apiService.autoFillAnalysis(data);
      if (response.success) {
        const updatedWords = response.data.updated_words;
        setData(updatedWords);
        message.success(`Successfully auto-filled ${updatedWords.length} words with NER, Phrase, and Semantic data`);
      } else {
        message.error('Failed to auto-fill analysis data');
      }
    } catch (error) {
      console.error('Error auto-filling analysis:', error);
      message.error('Error auto-filling analysis data');
    } finally {
      setAutoFilling(false);
    }
  };

  const columns = [
    {
      title: 'ID',
      dataIndex: 'ID',
      key: 'ID',
      width: 100,
    },
    {
      title: 'Word',
      dataIndex: 'Word',
      key: 'Word',
      width: 150,
      render: (text: string, record: RowWord) => (
        <a onClick={() => onWordSelect?.(record)}>{text}</a>
      ),
    },
    {
      title: 'Lemma',
      dataIndex: 'Lemma',
      key: 'Lemma',
      width: 150,
    },
    {
      title: 'POS',
      dataIndex: 'POS',
      key: 'POS',
      width: 100,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: 'NER',
      dataIndex: 'NER',
      key: 'NER',
      width: 100,
      render: (text: string) => <Tag color="green">{text}</Tag>,
    },
    {
      title: 'Phrase',
      dataIndex: 'Phrase',
      key: 'Phrase',
      width: 150,
    },
    {
      title: 'Semantic',
      dataIndex: 'Semantic',
      key: 'Semantic',
      width: 200,
    },
    // Show Actions column based on edit mode for Redux store data
    ...(propData && !editMode ? [] : [{
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_: any, record: RowWord) => (
        <Space size="small">
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            size="small"
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.ID)}
            size="small"
          />
        </Space>
      ),
    }]),
  ];

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <Space>
          <Search
            placeholder="Search words..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            style={{ width: 300 }}
          />
          {/* Show edit mode toggle and save button for Redux store data (sample data) */}
          {propData && (
            <>
              <Button
                type={editMode ? "primary" : "default"}
                icon={<EditFilled />}
                onClick={() => setEditMode(!editMode)}
              >
                {editMode ? "Exit Edit Mode" : "Enable Edit Mode"}
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={handleSaveToDatabase}
                loading={loading}
              >
                Save to Database
              </Button>
              <Button
                type="default"
                icon={<RobotOutlined />}
                onClick={handleAutoFill}
                loading={autoFilling}
              >
                Auto Fill Analysis
              </Button>
            </>
          )}
          
          {/* Only show CRUD buttons when not using Redux store data */}
          {!propData && (
            <>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAdd}
              >
                Add Word
              </Button>
              <Button
                icon={<DownloadOutlined />}
                onClick={handleExport}
              >
                Export
              </Button>
              <input
                type="file"
                accept=".csv,.xlsx"
                style={{ display: 'none' }}
                id="import-file"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImport(file);
                  }
                }}
              />
              <Button
                icon={<UploadOutlined />}
                onClick={() => document.getElementById('import-file')?.click()}
              >
                Import
              </Button>
            </>
          )}
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={getDisplayData()}
        rowKey="ID"
        loading={loading}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) =>
            `${range[0]}-${range[1]} of ${total} items`,
        }}
        onChange={handleTableChange}
        scroll={{ x: 1200 }}
      />

      <Modal
        title={editingWord ? 'Edit Word' : 'Add Word'}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={() => setIsModalVisible(false)}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="ID"
            label="ID"
            rules={[{ required: true, message: 'Please input ID!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Word"
            label="Word"
            rules={[{ required: true, message: 'Please input word!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Lemma"
            label="Lemma"
            rules={[{ required: true, message: 'Please input lemma!' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="POS"
            label="POS"
            rules={[{ required: true, message: 'Please select POS!' }]}
          >
            <Select placeholder="Select POS">
              <Option value="N">Noun</Option>
              <Option value="V">Verb</Option>
              <Option value="ADJ">Adjective</Option>
              <Option value="ADV">Adverb</Option>
              <Option value="PREP">Preposition</Option>
              <Option value="CONJ">Conjunction</Option>
              <Option value="PRON">Pronoun</Option>
              <Option value="DET">Determiner</Option>
              <Option value="NUM">Number</Option>
              <Option value="PUNCT">Punctuation</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="NER"
            label="NER"
          >
            <Select placeholder="Select NER" allowClear>
              <Option value="PERSON">Person</Option>
              <Option value="ORG">Organization</Option>
              <Option value="LOC">Location</Option>
              <Option value="DATE">Date</Option>
              <Option value="TIME">Time</Option>
              <Option value="MONEY">Money</Option>
              <Option value="PERCENT">Percent</Option>
              <Option value="O">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="Phrase"
            label="Phrase"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="Semantic"
            label="Semantic"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>


    </div>
  );
};

export default CorpusTable;
