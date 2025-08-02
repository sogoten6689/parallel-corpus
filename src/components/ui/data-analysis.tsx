'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Input, Button, Upload, Card, Row, Col, Statistic, Progress, Spin, Table, Tag, App, Tooltip as AntTooltip } from 'antd';
import { SendOutlined, UploadOutlined, BarChartOutlined, LineChartOutlined, PieChartOutlined, FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { apiService } from '@/services/api';
import dynamic from 'next/dynamic';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Pie, Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Chart components will be implemented later
const { TextArea } = Input;

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface DataInfo {
  rows: number;
  columns: number;
  fileSize: string;
  fileName: string;
  preview: any[];
  columnNames: string[];
}

interface AnalysisResult {
  summary: string;
  trends: string[];
  predictions: string[];
  charts: ChartData[];
  statistics: StatisticData[];
  languageAnalysis: LanguageAnalysis;
}

interface LanguageAnalysis {
  totalWords: number;
  uniqueWords: number;
  avgSentenceLength: number;
  languageDistribution: { [key: string]: number };
  posDistribution: { [key: string]: number };
  commonWords: { word: string; count: number }[];
  sentiment: 'positive' | 'negative' | 'neutral';
  readability: number;
}

interface ChartData {
  type: 'line' | 'bar' | 'pie' | 'doughnut' | 'scatter';
  title: string;
  data: any;
  options?: any;
}

interface StatisticData {
  title: string;
  value: number | string;
  prefix?: string;
  suffix?: string;
  precision?: number;
  color?: string;
}

// Thêm hàm đếm tổng số từ từ dataInfo
function countTotalWords(dataInfo: any) {
  if (!dataInfo || !dataInfo.columnNames || !Array.isArray(dataInfo.columnNames)) return 0;
  const rows = dataInfo.fullData || dataInfo.fullRows || dataInfo.preview || [];
  let totalWords = 0;
  for (const row of rows) {
    for (const col of dataInfo.columnNames) {
      let text = row[col];
      if (typeof text === 'object' && text !== null && '_' in text) text = text._;
      if (typeof text === 'string') {
        const words = text.split(/\s+/).filter(Boolean);
        totalWords += words.length;
      }
    }
  }
  return totalWords;
}

const DataAnalysis: React.FC = () => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [dataInfo, setDataInfo] = useState<DataInfo | null>(null);
  const [xaiResult, setXaiResult] = useState<any[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { message } = App.useApp();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hàm lấy nội dung dòng nếu người dùng hỏi về dòng cụ thể (ví dụ: "dòng 5").
  function extractRowDataFromQuestion(question: string, dataInfo: DataInfo | null): any | null {
    const match = question.match(/dòng\s*(\d+)/i);
    if (match && dataInfo && dataInfo.preview) {
      const rowIdx = parseInt(match[1], 10) - 1;
      if (rowIdx >= 0 && rowIdx < dataInfo.preview.length) {
        return dataInfo.preview[rowIdx];
      }
    }
    return null;
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Check if this is an auto-generated analysis message
    const isAutoAnalysis = inputValue.startsWith("Phân tích dữ liệu") && 
                          inputValue.includes("hàng và") && 
                          inputValue.includes("cột");

    // Only add user message to chat if it's NOT auto-analysis
    if (!isAutoAnalysis) {
      const userMessage: Message = {
        id: (messages.length + 1).toString(),
        type: 'user',
        content: inputValue,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, userMessage]);
    }

    setInputValue('');
    setIsAnalyzing(true);

    // Lấy filename từ uploadedFiles nếu có
    let filename = '';
    if (uploadedFiles.length > 0) {
      filename = uploadedFiles[0].filename || uploadedFiles[0].response?.filename || uploadedFiles[0].name;
    }
    // Gắn filename vào dataInfo
    const dataInfoWithFilename = { ...dataInfo, filename };

    try {
      // Always call data analysis API
      const response = await apiService.dataAnalysis(inputValue, dataInfoWithFilename);

      if (response.success) {
        setAnalysisResult(response.data.result);
        setXaiResult(response.data.xai || []);
      }

      // Only call AI chat for user-generated questions (not auto-analysis)
      if (!isAutoAnalysis) {
        try {
          const aiResponse = await apiService.aiChat(
            inputValue, 
            dataInfo,
            messages.slice(-10) // Send last 10 messages for context
          );
          
          if (aiResponse.success) {
            setMessages(prev => [...prev, {
              id: (prev.length + 1).toString(),
              type: 'assistant',
              content: aiResponse.data.answer,
              timestamp: new Date(),
            }]);
          }
        } catch (aiError) {
          console.error('AI Chat Error:', aiError);
          // Don't block the analysis if AI chat fails
        }
      }
    } catch (error) {
      console.error('Analysis Error:', error);
      if (!isAutoAnalysis) {
        const errorMessage: Message = {
          id: (messages.length + 2).toString(),
          type: 'assistant',
          content: 'Xin lỗi, có lỗi xảy ra khi kết nối với server.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileUpload = async (info: any) => {
    if (info.file.status === 'done') {
      // Clear old data when uploading new file
      setDataInfo(null);
      setAnalysisResult(null);
      setXaiResult([]);
      setMessages([]); // Clear chat history for new file
      
      // Merge response filename vào file object nếu có
      if (info.file.response && info.file.response.filename) {
        info.file.filename = info.file.response.filename;
      }
      message.success(`${info.file.name} file uploaded successfully`);
      setUploadedFiles([info.file]); // Replace old files with new one
      
      // Analyze uploaded file
      await analyzeUploadedFile(info.file);
    } else if (info.file.status === 'error') {
      message.error(`${info.file.name} file upload failed.`);
    }
  };

  const analyzeUploadedFile = async (file: any) => {
    try {
      const response = await apiService.analyzeFile(file.originFileObj);
      
      if (response.success) {
        // Thêm _rowId cho mỗi dòng preview để Table có key ổn định
        const previewWithId = response.data.dataInfo.preview.map((row: any, idx: number) => ({ ...row, _rowId: idx }));
        setDataInfo({ ...response.data.dataInfo, preview: previewWithId });
        
        // Auto-generate analysis message
        const analysisMessage = `Phân tích dữ liệu ${response.data.dataInfo.fileName} với ${response.data.dataInfo.rows} hàng và ${response.data.dataInfo.columns} cột`;
        setInputValue(analysisMessage);
      }
    } catch (error) {
      console.error('Error analyzing file:', error);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: true,
    action: '/api/upload',
    onChange: handleFileUpload,
    beforeUpload: (file: any) => {
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv');
      const isExcel = file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                     file.type === 'application/vnd.ms-excel' ||
                     file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
      const isXML = file.type === 'text/xml' || file.name.endsWith('.xml');
      const isTXT = file.type === 'text/plain' || file.name.endsWith('.txt');
      if (!isCSV && !isExcel && !isXML && !isTXT) {
        message.error(t('file_format_error') || 'Chỉ hỗ trợ file CSV, Excel, XML hoặc TXT!');
        return false;
      }
      return true;
    },
  };

  const previewColumns = dataInfo?.columnNames.map(col => ({
    title: col,
    dataIndex: col,
    key: col,
    width: 200,
    render: (text: any) => {
      // Nếu là object, lấy trường _ hoặc #text hoặc stringify
      if (typeof text === 'object' && text !== null) {
        if ('_' in text) return text._;
        if ('#text' in text) return text['#text'];
        return JSON.stringify(text);
      }
      if (typeof text === 'string' && text.length > 30) {
        return <span title={text}>{text.substring(0, 30)}...</span>;
      }
      return text;
    }
  })) || [];

  // Tạo dữ liệu cho biểu đồ XAI
  const xaiBarData = {
    labels: xaiResult.map(item => item.feature),
    datasets: [
      {
        label: t('importance') || 'Tầm quan trọng',
        data: xaiResult.map(item => item.importance),
        backgroundColor: '#faad14',
        borderColor: '#d48806',
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-white shadow-sm p-4 border-b flex-shrink-0">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            {t('data_analysis') || 'Phân tích dữ liệu'}
          </h1>
          <p className="text-gray-600">
            {t('data_analysis_description') || 'Upload dữ liệu và chat để phân tích, dự đoán xu hướng'}
          </p>
        </div>

        {/* Chat and Upload Area */}
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
          {/* File Upload */}
          <Card title={t('upload_data') || 'Upload dữ liệu'} className="mb-4">
            <Upload {...uploadProps} listType="text">
              <AntTooltip title={t('upload_tooltip') || 'Định dạng hỗ trợ: CSV, Excel (.xlsx, .xls), XML, TXT'}>
                <Button icon={<UploadOutlined />} size="large">
                  {t('click_to_upload') || 'Click để upload file'}
                </Button>
              </AntTooltip>
            </Upload>
            {uploadedFiles.length > 0 && (
              <div className="mt-4">
                <h4 className="font-medium mb-2">{t('uploaded_files') || 'Files đã upload:'}</h4>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {uploadedFiles.map((file, index) => (
                    <li key={index}>{file.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Data Information */}
          {dataInfo && (
            <Card title="Thông tin dữ liệu" className="mb-4">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic title="Số hàng" value={dataInfo.rows} />
                </Col>
                <Col span={6}>
                  <Statistic title="Số cột" value={dataInfo.columns} />
                </Col>
                <Col span={8}>
                  <Statistic title="Kích thước file" value={dataInfo.fileSize} />
                </Col>
                <Col span={8}>
                  <Statistic 
                    title="Tên file" 
                    value={dataInfo.fileName.length > 25 ? dataInfo.fileName.substring(0, 25) + '...' : dataInfo.fileName}
                    valueStyle={{ 
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: 'block',
                      maxWidth: '100%'
                    }}
                  />
                </Col>
                <Col span={8}>
                  {/* Cột trống thay thế "Tổng từ (frontend)" đã bị xóa */}
                </Col>
              </Row>
              
              {/* Data Preview */}
              <div className="mt-4">
                <h4 className="font-medium mb-2">Xem trước dữ liệu (5 dòng đầu):</h4>
                <div className="border rounded overflow-hidden">
                  <Table 
                    dataSource={dataInfo.preview} 
                    columns={previewColumns}
                    pagination={false}
                    size="small"
                    scroll={{ x: 'max-content', y: 200 }}
                    style={{ maxHeight: '300px' }}
                    rowKey={(row) => row._rowId}
                  />
                </div>
              </div>
            </Card>
          )}

          {/* Chat Messages */}
          <Card 
            title={t('chat_analysis') || 'Chat phân tích'} 
            className="flex-1 flex flex-col"
            styles={{ body: { flex: 1, display: 'flex', flexDirection: 'column', height: '100%' } }}
          >
            <div className="flex-1 overflow-y-auto mb-4 space-y-4" style={{ maxHeight: '400px' }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
              {isAnalyzing && (
                <div className="flex justify-start">
                  <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
                    <Spin size="small" className="mr-2" />
                    {t('analyzing') || 'Đang phân tích...'}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="flex space-x-2">
              <TextArea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={t('ask_analysis_question') || 'Hỏi về phân tích dữ liệu...'}
                autoSize={{ minRows: 1, maxRows: 4 }}
                onPressEnter={(e) => {
                  if (!e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isAnalyzing}
              >
                {t('send') || 'Gửi'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="w-96 bg-white shadow-lg overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            {t('analysis_results') || 'Kết quả phân tích'}
          </h2>
        </div>

        <div className="p-4 space-y-6">
          {analysisResult ? (
            <>
              {/* Summary */}
              <Card title={t('summary') || 'Tóm tắt'} size="small">
                <p className="text-sm text-gray-700">
                  {analysisResult.summary || t('analysis_summary_text') || 'No summary available'}
                </p>
              </Card>

              {/* Language Analysis */}
              {analysisResult.languageAnalysis && (
                <Card title={t('language_analysis_title') || 'Phân tích ngôn ngữ'} size="small">
                                      <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">{t('total_words') || 'Tổng từ'}:</span>
                        <span className="font-medium">{analysisResult.languageAnalysis.totalWords.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">{t('unique_words') || 'Từ duy nhất'}:</span>
                        <span className="font-medium">{analysisResult.languageAnalysis.uniqueWords.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">{t('avg_sentence_length') || 'Độ dài câu TB'}:</span>
                        <span className="font-medium">{analysisResult.languageAnalysis.avgSentenceLength} {t('words') || 'từ'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">{t('readability') || 'Độ dễ đọc'}:</span>
                        <span className="font-medium">{analysisResult.languageAnalysis.readability}/10</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{t('sentiment') || 'Cảm xúc'}:</span>
                        <Tag color={
                          analysisResult.languageAnalysis.sentiment === 'positive' ? 'green' :
                          analysisResult.languageAnalysis.sentiment === 'negative' ? 'red' : 'blue'
                        }>
                          {analysisResult.languageAnalysis.sentiment === 'positive' ? (t('positive') || 'Tích cực') :
                           analysisResult.languageAnalysis.sentiment === 'negative' ? (t('negative') || 'Tiêu cực') : (t('neutral') || 'Trung tính')}
                        </Tag>
                      </div>
                    
                                          {/* Common Words */}
                      {analysisResult.languageAnalysis.commonWords.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium mb-2">{t('common_words') || 'Từ thường gặp'}:</h5>
                        <div className="flex flex-wrap gap-1">
                          {analysisResult.languageAnalysis.commonWords.slice(0, 5).map((word, index) => (
                            <Tag key={index} color="blue">
                              {word.word} ({word.count})
                            </Tag>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              )}

              {/* Detailed Analysis Table */}
              {analysisResult.languageAnalysis && (
                <Card title={t('detailed_analysis_table') || 'Bảng phân tích chi tiết'} size="small">
                  <Table
                    dataSource={[
                      {
                        key: '1',
                        metric: t('total_vocabulary') || 'Tổng từ vựng',
                        value: analysisResult.languageAnalysis.totalWords.toLocaleString(),
                        description: t('total_vocabulary_desc') || 'Tổng số từ trong toàn bộ dữ liệu'
                      },
                      {
                        key: '2',
                        metric: t('unique_words') || 'Từ duy nhất',
                        value: analysisResult.languageAnalysis.uniqueWords.toLocaleString(),
                        description: t('unique_words_desc') || 'Số từ không trùng lặp'
                      },
                      {
                        key: '3',
                        metric: t('avg_sentence_length') || 'Độ dài câu TB',
                        value: `${analysisResult.languageAnalysis.avgSentenceLength} ${t('words') || 'từ'}`,
                        description: t('avg_sentence_length_desc') || 'Trung bình từ mỗi câu'
                      },
                      {
                        key: '4',
                        metric: t('readability') || 'Độ dễ đọc',
                        value: `${analysisResult.languageAnalysis.readability}/10`,
                        description: t('readability_desc') || 'Chỉ số khả năng đọc hiểu'
                      },
                      {
                        key: '5',
                        metric: t('unique_word_ratio') || 'Tỷ lệ từ duy nhất',
                        value: `${Math.round((analysisResult.languageAnalysis.uniqueWords / analysisResult.languageAnalysis.totalWords) * 100)}%`,
                        description: t('unique_word_ratio_desc') || 'Phần trăm từ không lặp lại'
                      },
                      {
                        key: '6',
                        metric: t('sentiment') || 'Cảm xúc',
                        value: analysisResult.languageAnalysis.sentiment === 'positive' ? (t('positive') || 'Tích cực') :
                               analysisResult.languageAnalysis.sentiment === 'negative' ? (t('negative') || 'Tiêu cực') : (t('neutral') || 'Trung tính'),
                        description: t('sentiment_desc') || 'Tone tổng thể của nội dung'
                      }
                    ]}
                    columns={[
                      {
                        title: t('metric') || 'Chỉ số',
                        dataIndex: 'metric',
                        key: 'metric',
                        width: '30%',
                        render: (text: string) => <span className="font-medium text-sm">{text}</span>
                      },
                      {
                        title: t('value') || 'Giá trị',
                        dataIndex: 'value',
                        key: 'value',
                        width: '25%',
                        render: (text: string) => <span className="text-blue-600 font-semibold">{text}</span>
                      },
                      {
                        title: t('description') || 'Mô tả',
                        dataIndex: 'description',
                        key: 'description',
                        width: '45%',
                        render: (text: string) => <span className="text-gray-600 text-sm">{text}</span>
                      }
                    ]}
                    pagination={false}
                    size="small"
                    className="text-xs"
                  />
                </Card>
              )}

              {/* XAI Feature Importance */}
              {xaiResult && xaiResult.length > 0 && (
                <Card title={t('xai_analysis') || 'Phân tích XAI (Feature Importance)'} size="small">
                  <Table
                    dataSource={xaiResult.map((item, idx) => ({ ...item, key: idx }))}
                    columns={[
                      { title: t('feature') || 'Đặc trưng', dataIndex: 'feature', key: 'feature' },
                      { title: t('importance') || 'Tầm quan trọng', dataIndex: 'importance', key: 'importance', render: (v: number) => v.toFixed(3) }
                    ]}
                    pagination={false}
                    size="small"
                  />
                  <div className="mt-4" style={{ height: 220 }}>
                    <Bar
                      data={xaiBarData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: { display: false },
                          title: { display: false }
                        },
                        scales: {
                          y: { beginAtZero: true, title: { display: true, text: t('importance') || 'Tầm quan trọng' } },
                          x: { title: { display: true, text: t('feature') || 'Đặc trưng' } }
                        }
                      }}
                      height={220}
                    />
                  </div>
                </Card>
              )}

              {/* Statistics */}
              {analysisResult.statistics.length > 0 && (
                <Card title={t('language_statistics') || 'Thống kê ngôn ngữ'} size="small">
                  <Row gutter={[16, 16]}>
                    {analysisResult.statistics.map((stat, index) => (
                      <Col span={12} key={index}>
                        <Statistic
                          title={stat.title}
                          value={stat.value}
                          prefix={stat.prefix}
                          suffix={stat.suffix}
                          precision={stat.precision}
                          valueStyle={{ color: stat.color }}
                        />
                      </Col>
                    ))}
                  </Row>
                </Card>
              )}

              {/* Trends */}
              {analysisResult.trends.length > 0 && (
                <Card title={t('language_characteristics') || 'Đặc điểm ngôn ngữ'} size="small">
                  <ul className="space-y-2">
                    {analysisResult.trends.map((trend, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-green-500 mr-2">✓</span>
                        {trend}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Predictions */}
              {analysisResult.predictions.length > 0 && (
                <Card title={t('potential_applications') || 'Ứng dụng tiềm năng'} size="small">
                  <ul className="space-y-2">
                    {analysisResult.predictions.map((prediction, index) => (
                      <li key={index} className="text-sm text-gray-700 flex items-start">
                        <span className="text-blue-500 mr-2">🚀</span>
                        {prediction}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Charts */}
              {analysisResult.charts.length > 0 && (
                <Card title={t('analysis_charts') || 'Biểu đồ phân tích'} size="small">
                  <div className="space-y-6">
                    {analysisResult.charts.map((chart, index) => {
                      // Loại bỏ tiếng Trung khỏi dữ liệu biểu đồ nếu có
                      let filteredChart = chart;
                      if (chart.data && chart.data.labels && Array.isArray(chart.data.labels)) {
                        let labels = chart.data.labels as string[];
                        let datasets = chart.data.datasets;
                        // If it's a language distribution chart, convert labels to friendly names
                        if (chart.title && (chart.title.toLowerCase().includes('ngôn ngữ') || chart.title.toLowerCase().includes('language'))) {
                          labels = labels.map((code) => {
                            if (code === 'vi') return t('vietnamese_lang') || 'Tiếng Việt';
                            if (code === 'en') return t('english_lang') || 'Tiếng Anh';
                            if (code === 'other') return t('other_lang') || 'Khác';
                            return code;
                          });
                        }
                        // Linter fix: khai báo kiểu cho destructuring
                        type LabelIndex = { label: string; i: number };
                        const filtered = (chart.data.labels as string[])
                          .map((label: string, i: number) => ({ label, i }))
                          .filter(({ label }: LabelIndex) => label !== 'zh');
                        const indices = filtered.map(({ i }: LabelIndex) => i);
                        const newLabels = filtered.map(({ i }: LabelIndex) => labels[i]);
                        const newDatasets = datasets.map((ds: any) => ({
                          ...ds,
                          data: indices.map((idx: number) => ds.data[idx])
                        }));
                        filteredChart = {
                          ...chart,
                          data: {
                            ...chart.data,
                            labels: newLabels,
                            datasets: newDatasets
                          }
                        };
                      }
                      return (
                        <div key={index} className="border rounded p-4">
                          <h4 className="font-medium text-sm mb-3 text-center">{filteredChart.title}</h4>
                          <div className="h-48 flex items-center justify-center">
                            {filteredChart.type === 'pie' && (
                              <div className="w-full h-full">
                                <Pie 
                                  data={filteredChart.data}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: 'bottom',
                                        labels: {
                                          font: { size: 10 },
                                          padding: 10
                                        }
                                      }
                                    }
                                  }}
                                />
                              </div>
                            )}
                            {filteredChart.type === 'bar' && (
                              <div className="w-full h-full">
                                <Bar 
                                  data={filteredChart.data}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        display: false
                                      }
                                    },
                                    scales: {
                                      y: {
                                        beginAtZero: true,
                                        ticks: { font: { size: 10 } }
                                      },
                                      x: {
                                        ticks: { font: { size: 10 } }
                                      }
                                    }
                                  }}
                                />
                              </div>
                            )}
                            {filteredChart.type === 'doughnut' && (
                              <div className="w-full h-full">
                                <Doughnut 
                                  data={filteredChart.data}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        position: 'bottom',
                                        labels: {
                                          font: { size: 10 },
                                          padding: 8
                                        }
                                      }
                                    }
                                  }}
                                />
                              </div>
                            )}
                            {filteredChart.type === 'line' && (
                              <div className="w-full h-full">
                                <Line 
                                  data={filteredChart.data}
                                  options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                    plugins: {
                                      legend: {
                                        display: false
                                      }
                                    },
                                    scales: {
                                      y: {
                                        beginAtZero: true,
                                        ticks: { font: { size: 10 } }
                                      },
                                      x: {
                                        ticks: { font: { size: 10 } }
                                      }
                                    }
                                  }}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              )}
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <BarChartOutlined className="text-4xl mb-4" />
              <p>{t('no_analysis_yet') || 'Chưa có kết quả phân tích'}</p>
              <p className="text-sm mt-2">
                {t('upload_and_chat') || 'Upload dữ liệu và chat để bắt đầu phân tích'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DataAnalysis; 