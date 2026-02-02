import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useConfirmEmailMutation } from "./authAPI";
import { Box, Typography, Button, CircularProgress } from "@mui/material";

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const navigate = useNavigate();
  const [confirmEmail, { isLoading, isSuccess, error }] =
    useConfirmEmailMutation();

  useEffect(() => {
    if (token) confirmEmail({ token });
  }, [token, confirmEmail]);

  if (isLoading)
    return (
      <Box textAlign="center" mt={10}>
        <CircularProgress />
      </Box>
    );

  if (isSuccess)
    return (
      <Box textAlign="center" mt={10}>
        <Typography variant="h5" gutterBottom>
          E-mail confirmado!
        </Typography>
        <Button variant="contained" onClick={() => navigate("/login")}>
          Fazer Login
        </Button>
      </Box>
    );

  return (
    <Box textAlign="center" mt={10}>
      <Typography variant="h6" color="error">
        {(error as any)?.data?.message ||
          "O token é inválido ou expirou."}
      </Typography>
      <Button variant="outlined" onClick={() => navigate("/register")}>
        Tentar novamente
      </Button>
    </Box>
  );
}
