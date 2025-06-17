import { RowWord } from '@/types/row-word.type';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DataState {
  rows: RowWord[];
}

const initialState: DataState = {
  rows: [],
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setRows(state, action: PayloadAction<RowWord[]>) {
      state.rows = action.payload;
    },
  },
});

export const { setRows } = dataSlice.actions;
export default dataSlice.reducer;
