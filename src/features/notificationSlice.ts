// src/features/auth/authSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../store";

export interface NotificationState {
  openAlert: boolean;
  alertLevel: "success" | "info" | "warning" | "error";
  message: string;
}

const initialState: NotificationState = {
  openAlert: false,
  alertLevel: "info",
  message: "",
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    sendSuccess: (state, action: PayloadAction<string>) => {
      state.openAlert = true;
      state.alertLevel = "success";
      state.message = action.payload;
    },
    sendError: (state, action: PayloadAction<string>) => {
      state.openAlert = true;
      state.alertLevel = "error";
      state.message = action.payload;
    },
    sendInfo: (state, action: PayloadAction<string>) => {
      state.openAlert = true;
      state.alertLevel = "info";
      state.message = action.payload;
    },
    sendWarn: (state, action: PayloadAction<string>) => {
      state.openAlert = true;
      state.alertLevel = "warning";
      state.message = action.payload;
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    cleanAlert: (state, _action: PayloadAction<void>) => {
      state.openAlert = false;
      state.alertLevel = "info";
      state.message = "";
    },
  },
});

export const { sendSuccess, sendError, sendInfo, sendWarn, cleanAlert } =
  notificationsSlice.actions;
export const selectNotification = (state: RootState) => state.notifications;

export default notificationsSlice.reducer;
