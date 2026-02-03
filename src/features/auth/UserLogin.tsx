import { useEffect, useState } from "react";
import {
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  TextField,
  Link as MuiLink,
} from "@mui/material";
import { Send, Google as GoogleIcon } from "@mui/icons-material";
import { useTheme } from "@mui/material/styles";
import PasswordField from "../../components/PasswordField";
import useMutationAlert from "../../hooks/useMutationAlert";
import { useLoginMutation } from "./authAPI";
import { useDispatch, useSelector } from "react-redux";
import { login } from "./authSlice";
import { RootState } from "../../store";
import { useNavigate, Link as RouterLink } from "react-router-dom";



export default function UserLogin() {
  console.log('🚀 UserLogin component renderizado');
  const dispatch = useDispatch();
  const NEON = "#39FF14";
  const { needsPasswordChange } = useSelector((state: RootState) => state.auth);
  const [loginUser, loginResult] = useLoginMutation();
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();
  const theme = useTheme();

  // Debug: log do resultado da mutation
  useEffect(() => {
    if (loginResult.isError || loginResult.error) {
      console.log('🔴 UserLogin - Erro detectado no loginResult:', {
        isError: loginResult.isError,
        status: loginResult.status,
        error: loginResult.error,
        errorData: loginResult.error?.data,
      });
    }
  }, [loginResult.isError, loginResult.error, loginResult.status]);

  useMutationAlert(loginResult);

  useEffect(() => {
    console.log('🔍 Verificando parâmetros da URL...');
    const params = new URLSearchParams(window.location.search);
    const gToken = params.get("googleToken");
    console.log('🔑 Google Token encontrado:', gToken ? 'SIM' : 'NÃO');
    console.log('📍 URL atual:', window.location.href);
    
    if (gToken) {
      console.log('✅ Processando login com Google...');
      dispatch(login({ token: gToken, name: "GoogleUser" }));
      navigate("/home");
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    if (!loginResult.isSuccess) return;

    /* dados do backend */
    const { token, primeiroAcesso, name } = loginResult.data;

    if (primeiroAcesso) {
      // token: true  ➜ authSlice marca needsPasswordChange = true
      dispatch(
        login({
          token: true,
          email: username,          // salva para usar na tela de troca
          name: name ?? username,   // cumpre o tipo (obrigatório)
        })
      );
      navigate("/login/password");
    } else {
      dispatch(
        login({
          token,                    // JWT string
          name: name ?? username,
        })
      );
      navigate("/home");
    }
  }, [loginResult, dispatch, navigate, username]);

  /** ------------- handlers ------------- */
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      loginUser({ email: username, password });
    }
  };

  const handleGoogleSignIn = () => {
    /* Ajuste esta rota conforme seu backend/OAuth */
   
    window.location.href = `${import.meta.env.VITE_SERVER_URL ?? ''}/auth/google`;
  };

  /** ------------- render ------------- */
  return (
    <Box
  maxWidth="350px"
  width="90%"
  p={4}
  display="flex"
  flexDirection="column"
  alignItems="center"
  gap={3}
  bgcolor="#0a1b2a"                        // fundo escuro
  border="1px solid rgba(255,255,255,0.2)" // borda suave
  boxShadow={`0 0 20px ${NEON}`}           // brilho neon
  borderRadius="8px"                       // cantos arredondados
>
  {/* TITULO NEON COM DIVISOR */}
  <Box display="flex" alignItems="center" width="100%" mb={2}>
    <Typography
      variant="h4"
      sx={{
        flex: 1,
        textAlign: "center",
        color: NEON,
        textShadow: `0 0 8px ${NEON}`,
      }}
    >
      Eng
    </Typography>

    <Divider
      orientation="vertical"
      flexItem
      sx={{ mx: 2, borderColor: "rgba(255,255,255,0.4)" }}
    />

    <Typography
      variant="h4"
      sx={{
        flex: 1,
        textAlign: "center",
        color: NEON,
        textShadow: `0 0 8px ${NEON}`,
      }}
    >
      Bot
    </Typography>
  </Box>

  <Stack direction="column" alignItems="center" gap={2} width="100%">
    {/* NIP */}
    <TextField
      label="NIP"
      variant="outlined"
      fullWidth
      value={username}
      onChange={(e) => setUsername(e.target.value)}
      onKeyDown={handleKeyDown}
      InputProps={{
        sx: {
          color: "#fff",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(255,255,255,0.4)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: NEON,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: NEON,
          },
        },
      }}
      InputLabelProps={{
        sx: { color: "rgba(255,255,255,0.7)" },
      }}
    />

    {/* SENHA */}
  <Box
  width="100%"
  sx={{
    color: "#fff",
    // faz o input ocupar 100%
    "& .MuiOutlinedInput-root": {
      width: "142%",
    },
    // cor do texto digitado
    "& .MuiOutlinedInput-input": {
      color: "rgba(255,255,255,0.7)",
    },
    // rótulo "Password" em branco semitransparente
    "& .MuiInputLabel-root": {
      color: "rgba(255,255,255,0.7)",
    },
    // contorno normal
    "& .MuiOutlinedInput-notchedOutline": {
      borderColor: "rgba(255,255,255,0.4)",
    },
    // contorno ao hover
    "&:hover .MuiOutlinedInput-notchedOutline": {
      borderColor: NEON,
    },
    // contorno ao foco
    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
      borderColor: NEON,
    },
    // ícone do olho em branco
    "& .MuiInputAdornment-root .MuiIconButton-root": {
      color: "#fff",
    },
  }}
>
  <PasswordField
    password={password}
    setPassword={setPassword}
    onKeyDown={handleKeyDown}
  />
</Box>
    {/* ENTRAR */}
    <Button
      variant="outlined"
      fullWidth
      endIcon={<Send />}
      onClick={() => loginUser({ email: username, password })}
      sx={{
        color: "#fff",
        borderColor: "#fff",
        "&:hover": {
          color: NEON,
          borderColor: NEON,
          backgroundColor: "rgba(57,255,20,0.1)",
        },
      }}
    >
      Entrar
    </Button>

    {/* GOOGLE */}
    <Button
      variant="outlined"
      fullWidth
      startIcon={<GoogleIcon />}
      onClick={handleGoogleSignIn}
      sx={{
        color: NEON,
        borderColor: NEON,
        boxShadow: `0 0 8px ${NEON}`,
        "&:hover": {
          backgroundColor: "rgba(57,255,20,0.1)",
        },
      }}
    >
      Entrar com Google
    </Button>

    {/* CADASTRO */}
    <MuiLink
      component={RouterLink}
      to="register"
      variant="body2"
      sx={{ color: "rgba(255,255,255,0.7)" }}
    >
      Não tem conta? Cadastre-se aqui
    </MuiLink>
  </Stack>
</Box>
  );
}
