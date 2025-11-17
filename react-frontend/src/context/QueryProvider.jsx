import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache data for 10 minutes
      cacheTime: 10 * 60 * 1000,
      // Don't refetch on window focus (better UX)
      refetchOnWindowFocus: false,
      // Retry failed requests once
      retry: 1,
      // Retry delay with exponential backoff
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // Refetch on reconnect
      refetchOnReconnect: true,
      // Don't refetch on mount if data is fresh
      refetchOnMount: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
      // Retry delay
      retryDelay: 1000,
    },
  },
});

/**
 * QueryProvider - Wraps the app with React Query
 * Provides global state management for server state
 */
export const QueryProvider = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* React Query Devtools - install @tanstack/react-query-devtools to enable */}
      {process.env.NODE_ENV === 'development' && typeof window !== 'undefined' && (
        // Devtools will be available if installed
        // To install: npm install @tanstack/react-query-devtools
        // Then uncomment the import and component below
        null
      )}
    </QueryClientProvider>
  );
};

export default QueryProvider;

