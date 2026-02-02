import { Alert, Snackbar, SnackbarCloseReason } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { cleanAlert } from "../features/notificationSlice";
import { RootState } from "../store";
import React from "react";

const Notification = () => {
  const dispatch = useDispatch();
  const { openAlert, message, alertLevel } = useSelector(
    (state: RootState) => state.notifications
  );

  // Debug: log para verificar se o estado está sendo atualizado
  React.useEffect(() => {
    console.log('🔔 Notification - Estado atualizado:', {
      openAlert,
      message,
      alertLevel,
    });
  }, [openAlert, message, alertLevel]);

  const handleClose = (
    _event: React.SyntheticEvent | Event,
    reason?: SnackbarCloseReason
  ) => {
    if (reason === "clickaway") {
      dispatch(cleanAlert());
      return;      
    }
    
    dispatch(cleanAlert());
  };

  return (
        <Snackbar
          open={openAlert}
      autoHideDuration={5000}
          onClose={handleClose}
          anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{ zIndex: 9999 }}
        >
          <Alert
            onClose={handleClose}
            severity={alertLevel}
            sx={{ width: "100%" }}
            variant="filled"
            elevation={6}
          >
            {message}
          </Alert>
        </Snackbar>
  );
};

export default Notification;
