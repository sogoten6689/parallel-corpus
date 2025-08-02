import { useState, useCallback } from 'react';
import { message } from 'antd';
import { apiService, ApiResponse } from '@/services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options?: {
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
    showMessage?: boolean;
  }
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (...args: any[]) => {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        const response = await apiFunction(...args);
        
        if (response.success && response.data) {
          setState({
            data: response.data,
            loading: false,
            error: null,
          });
          
          options?.onSuccess?.(response.data);
          
          if (options?.showMessage !== false) {
            message.success('Operation completed successfully');
          }
        } else {
          const errorMessage = response.error || 'Operation failed';
          setState({
            data: null,
            loading: false,
            error: errorMessage,
          });
          
          options?.onError?.(errorMessage);
          
          if (options?.showMessage !== false) {
            message.error(errorMessage);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState({
          data: null,
          loading: false,
          error: errorMessage,
        });
        
        options?.onError?.(errorMessage);
        
        if (options?.showMessage !== false) {
          message.error(errorMessage);
        }
      }
    },
    [apiFunction, options]
  );

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
}

// Specific hooks for common operations
export function useRowWords() {
  return useApi(apiService.getAllRowWords);
}

export function useCreateRowWord() {
  return useApi(apiService.createRowWord);
}

export function useWordStats() {
  return useApi(() => apiService.request('/api/words/stats/'));
}

export function useHealthCheck() {
  return useApi(apiService.healthCheck, { showMessage: false });
} 