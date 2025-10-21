'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from './api';

type FetchState<T> = {
  data: T | null;
  loading: boolean;
  error: string | null;
};

export function useFetch<T>(endpoint: string | null) {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: !!endpoint, // Only show loading if endpoint is provided
    error: null,
  });

  const fetchData = useCallback(async () => {
    if (!endpoint) {
      // Skip fetching if endpoint is null
      setState({ data: null, loading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const data = await apiClient.get<T>(endpoint);
      setState({ data, loading: false, error: null });
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }, [endpoint]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { ...state, refetch: fetchData };
}

export function usePost<T, U = unknown>() {
  const [state, setState] = useState<FetchState<T> & { isPosting: boolean }>({
    data: null,
    loading: false,
    error: null,
    isPosting: false,
  });

  const post = useCallback(async (endpoint: string, data?: U) => {
    setState(prev => ({ ...prev, isPosting: true, error: null }));
    
    try {
      const result = await apiClient.post<T>(endpoint, data);
      setState({
        data: result,
        loading: false,
        error: null,
        isPosting: false,
      });
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        isPosting: false,
      }));
      throw error;
    }
  }, []);

  return { ...state, post };
}

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}