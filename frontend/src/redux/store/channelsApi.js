import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import io from 'socket.io-client';

const apiUrl = import.meta.env.VITE_API_BASE_URL;

export const channelsApi = createApi({
  reducerPath: 'channelsApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${apiUrl}/api/v1/channels` }),
  endpoints(build) {
    return {
      getChannels: build.query({
        query: () => {
          const storedUser = localStorage.getItem('user');
          const token = JSON.parse(storedUser)?.token;
          return {
            url: '',
            headers: { Authorization: `Bearer ${token}` },
          };
        },
        async onCacheEntryAdded(arg, { updateCachedData, cacheDataLoaded, cacheEntryRemoved }) {
          const socket = io(`${apiUrl}`);
          try {
            await cacheDataLoaded;
            socket.on('newChannel', (payload) => { updateCachedData((draft) => { draft.push(payload); }); });
            socket.on('removeChannel', (payload) => {
              updateCachedData((draft) => draft.filter((item) => item.id !== payload.id));
            });
            socket.on('renameChannel', (payload) => {
              updateCachedData((draft) => draft
                .map((item) => ((item.id === payload.id) ? { ...payload } : item)));
            });
          } catch (error) {
            console.error('Socket connection error:', error);
          }
          await cacheEntryRemoved;
          socket.off('newChannel');
          socket.off('removeChannel');
          socket.off('renameChannel');
        },
      }),
      addChannel: build.mutation({
        query: (name) => {
          const storedUser = localStorage.getItem('user');
          const token = JSON.parse(storedUser)?.token;
          return {
            url: '',
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: { name },
          };
        },
      }),
      removeChannel: build.mutation({
        query: (id) => {
          const storedUser = localStorage.getItem('user');
          const token = JSON.parse(storedUser)?.token;
          return {
            url: `/${id}`,
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          };
        },
      }),
      renameChannel: build.mutation({
        query: ({ id, name }) => {
          const storedUser = localStorage.getItem('user');
          const token = JSON.parse(storedUser)?.token;
          return {
            url: `/${id}`,
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` },
            body: { name },
          };
        },
      }),
    };
  },
});

export const {
  useGetChannelsQuery, useAddChannelMutation, useRemoveChannelMutation, useRenameChannelMutation,
} = channelsApi;
