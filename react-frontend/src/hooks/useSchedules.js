import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

/**
 * React Query hooks for Schedule operations
 * Provides caching, background refetching, and optimistic updates
 */

// Query key factory
export const scheduleKeys = {
  all: ['schedules'],
  lists: () => [...scheduleKeys.all, 'list'],
  list: (filters) => [...scheduleKeys.lists(), filters],
  details: () => [...scheduleKeys.all, 'detail'],
  detail: (id) => [...scheduleKeys.details(), id],
  byCourse: (course, year) => [...scheduleKeys.all, 'course', course, year],
  bySection: (sectionName) => [...scheduleKeys.all, 'section', sectionName],
};

/**
 * Get schedules with optional filters
 */
export const useSchedules = (filters = {}) => {
  return useQuery({
    queryKey: scheduleKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.getSchedules(filters);
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    select: (data) => {
      // Ensure we always return an array
      if (Array.isArray(data)) return data;
      if (data?.schedules && Array.isArray(data.schedules)) return data.schedules;
      if (data?.data && Array.isArray(data.data)) return data.data;
      return [];
    },
  });
};

/**
 * Get schedule by ID
 */
export const useSchedule = (id) => {
  return useQuery({
    queryKey: scheduleKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.getScheduleById(id);
      return response.data;
    },
    enabled: !!id, // Only fetch if id exists
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Create schedule mutation
 */
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.createSchedule(data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate and refetch schedules list
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
      
      // If we have course/year info, invalidate that specific query
      if (variables.course && variables.year) {
        queryClient.invalidateQueries({
          queryKey: scheduleKeys.byCourse(variables.course, variables.year),
        });
      }
    },
    onError: (error) => {
      console.error('Error creating schedule:', error);
    },
  });
};

/**
 * Update schedule mutation
 */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.updateSchedule(id, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      // Invalidate specific schedule
      queryClient.invalidateQueries({
        queryKey: scheduleKeys.detail(variables.id),
      });
      
      // Invalidate schedules list
      queryClient.invalidateQueries({ queryKey: scheduleKeys.lists() });
    },
    onError: (error) => {
      console.error('Error updating schedule:', error);
    },
  });
};

/**
 * Delete schedule mutation
 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.deleteSchedule(id);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate all schedule queries
      queryClient.invalidateQueries({ queryKey: scheduleKeys.all });
    },
    onError: (error) => {
      console.error('Error deleting schedule:', error);
    },
  });
};

export default {
  useSchedules,
  useSchedule,
  useCreateSchedule,
  useUpdateSchedule,
  useDeleteSchedule,
};

