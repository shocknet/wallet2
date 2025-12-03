import { createAsyncThunk } from "@reduxjs/toolkit";
import { AppDispatch, State } from "./store/store";

export const appCreateAsyncThunk = createAsyncThunk.withTypes<{ state: State, dispatch: AppDispatch }>();
