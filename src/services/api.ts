// API Service Layer for Backend Communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface RowWord {
  ID: string;
  ID_sen: string;
  Word: string;
  Lemma: string;
  Links: string;
  Morph: string;
  POS: string;
  Phrase: string;
  Grm: string;
  NER: string;
  Semantic: string;
}

export interface RowWordCreate {
  ID: string;
  ID_sen: string;
  Word: string;
  Lemma: string;
  Links: string;
  Morph: string;
  POS: string;
  Phrase: string;
  Grm: string;
  NER: string;
  Semantic: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async _request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Public method for custom requests
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    return this._request<T>(endpoint, options);
  }

  // Row Words API
  async getAllRowWords(): Promise<ApiResponse<RowWord[]>> {
    return this._request<RowWord[]>('/api/words/');
  }

  async createRowWord(word: RowWordCreate): Promise<ApiResponse<RowWord>> {
    return this._request<RowWord>('/api/words/', {
      method: 'POST',
      body: JSON.stringify(word),
    });
  }

  async createBatchRowWords(words: RowWordCreate[]): Promise<ApiResponse<any>> {
    return this._request<any>('/api/words/batch/', {
      method: 'POST',
      body: JSON.stringify({ words }),
    });
  }

  async autoFillAnalysis(words: any[]): Promise<ApiResponse<any>> {
    return this._request<any>('/api/auto-fill-analysis/', {
      method: 'POST',
      body: JSON.stringify({ words }),
    });
  }

  async importRowWords(file: File): Promise<ApiResponse<{ message: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/api/import-rowwords/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      };
    }
  }

  async importCorpusFile(file: File): Promise<ApiResponse<{ message: string }>> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${this.baseUrl}/api/import-corpus-file/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Import failed',
      };
    }
  }

  async exportRowWordsExcel(): Promise<Blob | null> {
    try {
      const response = await fetch(`${this.baseUrl}/api/export-rowwords-excel/`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.blob();
    } catch (error) {
      console.error('Export failed:', error);
      return null;
    }
  }

  // Health check
  async healthCheck(): Promise<ApiResponse<{ status: string; message: string }>> {
    return this._request<{ status: string; message: string }>('/health');
  }

  // Text Analysis
  async analyzeText(text: string, language: string = 'vi', tab: string = 'analysis'): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('text', text);
    formData.append('language', language);
    formData.append('tab', tab);

    try {
      const response = await fetch(`${this.baseUrl}/api/analyze-text/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Text analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Text analysis failed',
      };
    }
  }

  // File Analysis
  async analyzeFile(file: File): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${this.baseUrl}/api/analyze-file/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('File analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File analysis failed',
      };
    }
  }

  // AI Chat
  async aiChat(question: string, data?: any, chatHistory?: any[]): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('question', question);
    if (data) formData.append('data', JSON.stringify(data));
    if (chatHistory) formData.append('chat_history', JSON.stringify(chatHistory));

    try {
      const response = await fetch(`${this.baseUrl}/api/ai-chat/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('AI chat failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'AI chat failed',
      };
    }
  }

  // Data Analysis
  async dataAnalysis(message: string, dataInfo?: any): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('message', message);
    if (dataInfo) formData.append('data_info', JSON.stringify(dataInfo));

    try {
      const response = await fetch(`${this.baseUrl}/api/data-analysis/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Data analysis failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Data analysis failed',
      };
    }
  }

  // Semantic Alignment
  async semanticAlignment(text1: string, text2: string): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('text1', text1);
    formData.append('text2', text2);

    try {
      const response = await fetch(`${this.baseUrl}/api/semantic-alignment/`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('Semantic alignment failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Semantic alignment failed',
      };
    }
  }

  // Analysis Update API
  async updateAnalysisRow(rowData: any): Promise<ApiResponse<any>> {
    return this._request<any>('/api/analysis/update-analysis-row/', {
      method: 'PUT',
      body: JSON.stringify(rowData),
    });
  }

  async updateAnalysisRows(rowsData: any[]): Promise<ApiResponse<any>> {
    return this._request<any>('/api/analysis/update-analysis-data/', {
      method: 'PUT',
      body: JSON.stringify({ rows: rowsData }),
    });
  }


}

export const apiService = new ApiService(); 