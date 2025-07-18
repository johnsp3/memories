import { useState } from 'react';

export interface FormState {
  isLoading: boolean;
  error: string | null;
  isDirty: boolean;
}

export interface UseFormStateOptions {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  resetOnSuccess?: boolean;
}

export function useFormState(options: UseFormStateOptions = {}) {
  const [state, setState] = useState<FormState>({
    isLoading: false,
    error: null,
    isDirty: false,
  });

  const setLoading = (loading: boolean) => {
    setState(prev => ({ ...prev, isLoading: loading }));
  };

  const setError = (error: string | null) => {
    setState(prev => ({ ...prev, error }));
  };

  const setDirty = (dirty: boolean) => {
    setState(prev => ({ ...prev, isDirty: dirty }));
  };

  const reset = () => {
    setState({
      isLoading: false,
      error: null,
      isDirty: false,
    });
  };

  const executeAsync = async <T>(
    asyncFn: () => Promise<T>
  ): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await asyncFn();
      
      if (options.resetOnSuccess) {
        reset();
      } else {
        setLoading(false);
        setDirty(false);
      }
      
      options.onSuccess?.();
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setError(errorMessage);
      setLoading(false);
      
      options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      
      return null;
    }
  };

  return {
    ...state,
    setLoading,
    setError,
    setDirty,
    reset,
    executeAsync,
  };
} 