import { Point } from '@/types/point.type';
import { RowWord } from '@/types/row-word.type';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface DataState {
  rows_1: RowWord[];
  rows_2: RowWord[];
  dicId_1: Record<string, Point>;
  dicId_2: Record<string, Point>;
}

const initialState: DataState = {
  rows_1: [],
  rows_2: [],
  dicId_1: {},
  dicId_2: {},
};

interface UpdateDicIdPayload {
  key: string;
  point: Point;
}

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
    setDicId_1(state, action: PayloadAction<Record<string, Point>>) {
      state.dicId_1 = action.payload;
    },
    setDicId_2(state, action: PayloadAction<Record<string, Point>>) {
      state.dicId_2 = action.payload;
    },
    addToDicId_1(state, action: PayloadAction<UpdateDicIdPayload>) {
      const { key, point } = action.payload;
      state.dicId_1[key] = point;
    },
    addToDicId_2(state, action: PayloadAction<UpdateDicIdPayload>) {
      const { key, point } = action.payload;
      state.dicId_2[key] = point;
    }
  }
});

export const {
  setRows_1,
  setRows_2,
  setDicId_1,
  setDicId_2,
  addToDicId_1,
  addToDicId_2
} = dataSlice.actions;
export default dataSlice.reducer;
