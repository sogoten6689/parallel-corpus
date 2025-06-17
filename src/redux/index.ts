import { configureStore } from '@reduxjs/toolkit';
import dataSlice from './slices/dataSlice';

export const store = configureStore({
  reducer: {
    dataSlice: dataSlice,
  },
});

// 👇 Đây là kiểu RootState
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
