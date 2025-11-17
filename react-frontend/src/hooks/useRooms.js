import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../services/apiClient';

/**
 * React Query hooks for Room operations
 */

export const roomKeys = {
  all: ['rooms'],
  lists: () => [...roomKeys.all, 'list'],
  list: (filters) => [...roomKeys.lists(), filters],
  details: () => [...roomKeys.all, 'detail'],
  detail: (id) => [...roomKeys.details(), id],
};

export const useRooms = (filters = {}) => {
  return useQuery({
    queryKey: roomKeys.list(filters),
    queryFn: async () => {
      const response = await apiClient.getRooms(filters);
      return response.data;
    },
    staleTime: 3 * 60 * 1000, // 3 minutes
    select: (data) => {
      if (Array.isArray(data)) return data;
      if (data?.rooms && Array.isArray(data.rooms)) return data.rooms;
      if (data?.data && Array.isArray(data.data)) return data.data;
      return [];
    },
  });
};

export const useRoom = (id) => {
  return useQuery({
    queryKey: roomKeys.detail(id),
    queryFn: async () => {
      const response = await apiClient.getRoomById(id);
      return response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.createRoom(data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    },
  });
};

export const useUpdateRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }) => {
      const response = await apiClient.updateRoom(id, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: roomKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: roomKeys.lists() });
    },
  });
};

export const useDeleteRoom = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id) => {
      const response = await apiClient.deleteRoom(id);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: roomKeys.all });
    },
  });
};

export default {
  useRooms,
  useRoom,
  useCreateRoom,
  useUpdateRoom,
  useDeleteRoom,
};

