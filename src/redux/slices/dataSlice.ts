import { RowWord } from '@/types/row-word.type';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DataState {
  rows_1: RowWord[];
  rows_2: RowWord[];
}

const initialState: DataState = {
  rows_1: [],
  rows_2: [],
};

const dataSlice = createSlice({
  name: 'data',
  initialState,
  reducers: {
    setRows_1(state, action: PayloadAction<RowWord[]>) {
      state.rows_1 = action.payload;
    },
    setRows_2(state, action: PayloadAction<RowWord[]>) {
      state.rows_2 = action.payload;
    },
  },
});

export const { setRows_1, setRows_2 } = dataSlice.actions;
export default dataSlice.reducer;
