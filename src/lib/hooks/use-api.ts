import { 
  useMutation, 
  useQuery, 
  useQueryClient, 
  UseQueryOptions,
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  UseMutationOptions,
  QueryKey,
  InfiniteData
} from '@tanstack/react-query';
import { handleApiError } from '@/lib/api';
import { ApiError } from '@/lib/types';

// Generic query hook with error handling
export const useApiQuery = <T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'> & {
    onSuccess?: (data: T) => void;
    onError?: (error: ApiError) => void;
  }
) => {
  const { onSuccess, onError, ...restOptions } = options || {};
  
  return useQuery<T, ApiError>({
    queryKey,
    queryFn: async () => {
      try {
        return await queryFn();
      } catch (error) {
        const message = handleApiError(error);
        throw new Error(message);
      }
    },
    ...(onSuccess ? { onSuccess } : {}),
    ...(onError ? { onError } : {}),
    ...restOptions,
  });
};

// Simplified mutation hook that works with v5
export const useApiMutation = <TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: {
    invalidateQueries?: QueryKey[];
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: Error, variables: TVariables) => void;
    mutationKey?: QueryKey;
  }
) => {
  const queryClient = useQueryClient();

  const mutation = useMutation<TData, Error, TVariables>({
    mutationKey: options?.mutationKey,
    mutationFn: async (variables) => {
      try {
        return await mutationFn(variables);
      } catch (error) {
        const message = handleApiError(error);
        throw new Error(message);
      }
    },
    onSuccess: (data, variables) => {
      try {
        // Invalidate related queries
        if (options?.invalidateQueries) {
          options.invalidateQueries.forEach((queryKey) => {
            queryClient.invalidateQueries({ queryKey });
          });
        }
        
        // Call custom success handler
        if (options?.onSuccess) {
          options.onSuccess(data, variables);
        }
      } catch (error) {
        console.error('Error in mutation onSuccess handler:', error);
      }
    },
    onError: (error, variables) => {
      console.error('Mutation error:', error);
      if (options?.onError) {
        try {
          options.onError(error, variables);
        } catch (handlerError) {
          console.error('Error in mutation onError handler:', handlerError);
        }
      }
    },
  });

  return mutation;
};

// Simple paginated query helper
export const usePaginatedQuery = <T>(
  queryKey: QueryKey,
  queryFn: (params: any) => Promise<{ data: T[]; count: number }>,
  params: any = {},
  options?: Omit<UseQueryOptions<{ data: T[]; count: number }, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useApiQuery(
    [...queryKey, params],
    () => queryFn(params),
    options
  );
};

// Simple infinite query hook
export const useInfiniteScrollQuery = <T>(
  queryKey: QueryKey,
  queryFn: (page: number) => Promise<{ data: T[]; hasMore: boolean }>
) => {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam = 0 }: { pageParam?: number }) => queryFn(pageParam),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? undefined : null;
    },
    initialPageParam: 0,
  });
};

// Type-safe query hook builder
export const buildQueryHook = <T, TParams = any>(
  key: string,
  queryFn: (params?: TParams) => Promise<T>,
  defaultOptions?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return (params?: TParams, options?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>) => {
    return useApiQuery(
      [key, params],
      () => queryFn(params),
      { ...defaultOptions, ...options }
    );
  };
};

// Common query configurations
export const queryConfigs = {
  // Cache for 5 minutes, stale after 1 minute
  default: {
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  },
  // For frequently changing data
  realtime: {
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 60 * 1000, // Refetch every minute
  },
  // For rarely changing data
  static: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  },
};

// Utility to create query with config
export const createQuery = <T>(
  queryKey: QueryKey,
  queryFn: () => Promise<T>,
  config: keyof typeof queryConfigs = 'default',
  customOptions?: Omit<UseQueryOptions<T, ApiError>, 'queryKey' | 'queryFn'>
) => {
  return useApiQuery(queryKey, queryFn, { ...queryConfigs[config], ...customOptions });
};

// Export query client utilities
export { useQueryClient };