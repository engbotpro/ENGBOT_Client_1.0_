import { useEffect, useState } from "react";
import {
  Button,
  Typography,
  Box,
  Stack,
  Divider,
  TextField,
  IconButton,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useRegisterMutation } from "./authAPI";
import useMutationAlert from "../../hooks/useMutationAlert";

export default function Register() {
  const [registerUser, registerResult] = useRegisterMutation();
  useMutationAlert(registerResult);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPw, setRepeatPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [requirements, setRequirements] = useState({
    up: false,
    low: false,
    num: false,
    special: false,
  });
  const [emailSent, setEmailSent] = useState(false);
  const NEON = "#39FF14";

  const passwordsMatch = password === repeatPw;
  const isValid = Object.values(requirements).every(Boolean) && passwordsMatch;

  useEffect(() => {
    if (registerResult.isSuccess) {
      // ao receber sucesso, apenas sinaliza que o e-mail foi enviado
      setEmailSent(true);
    }
  }, [registerResult.isSuccess]);

  const calcRequirements = (value: string) => ({
    up: /[A-Z]/.test(value),
    low: /[a-z]/.test(value),
    num: /[0-9]/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  });

  const handlePassword = (val: string) => {
    setPassword(val);
    setRequirements(calcRequirements(val));
  };

  const submitForm = () => {

    
    registerUser({
      perfil: "usuario",
      name,
      email,
      password,
      active: true,
    });
  };

  // Se já enviamos o e-mail, mostramos só a mensagem
  if (emailSent) {
    return (
      <Box maxWidth="400px" width="90%" p={4} textAlign="center">
        <Typography variant="h5" gutterBottom>
          Quase lá!
        </Typography>
        <Typography>
          Enviamos um e-mail para <strong>{email}</strong> com instruções
          para confirmar sua conta.{" "}
          <br />
          Verifique sua caixa de entrada (ou spam) e siga o link.
        </Typography>
      </Box>
    );
  }

  // Caso contrário, renderiza o form normalmente
  return (
    <Box
      maxWidth="400px"
      width="90%"
      p={4}
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={3}
      bgcolor="#0a1b2a"
      border="1px solid rgba(255,255,255,0.2)"
      boxShadow={`0 0 20px ${NEON}`}
      borderRadius="8px"
      color="rgba(255,255,255,0.7)"
      
    >
      {/* título */}
      <Typography
        variant="h4"
        sx={{
          color: NEON,
          textShadow: `0 0 8px ${NEON}`,
          textAlign: "center",
          width: "100%",
        }}
      >
        Cadastro
      </Typography>

      <Stack spacing={2} width="100%">
        {/* Nome */}
        <TextField
          label="Nome"
          fullWidth
          value={name}
          onChange={(e) => setName(e.target.value)}
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
          // … sua estilização neon
        />

        {/* E-mail */}
        <TextField
          label="E-mail"
          type="email"
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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

        {/* Senha */}
        <TextField
          label="Senha"
          type={showPw ? "text" : "password"}
          fullWidth
          value={password}
          onChange={(e) => handlePassword(e.target.value)}
          InputProps={{
            sx: { color: "rgba(255,255,255,0.7)" },
            endAdornment: (
              <InputAdornment position="end">
                <IconButton onClick={() => setShowPw(!showPw)} edge="end">
                  {showPw ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
           sx={{
    // força o input ocupar 100%
    "& .MuiOutlinedInput-root": {
      width: "100%",
    },
    // rótulo "Password" em branco
    "& .MuiInputLabel-root": {
      color: "#fff",
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
        />

        {/* Repetir Senha */}
        <TextField
          label="Repetir senha"
          type={showRepeat ? "text" : "password"}
          fullWidth
          value={repeatPw}
          onChange={(e) => setRepeatPw(e.target.value)}
          error={!passwordsMatch && repeatPw.length > 0}
          helperText={
            !passwordsMatch && repeatPw.length > 0
              ? "As senhas não coincidem"
              : ""
          }
          InputProps={{
            sx: { color: "rgba(255,255,255,0.7)" },
            
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowRepeat(!showRepeat)}
                  edge="end"
                >
                  {showRepeat ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
          InputLabelProps={{
        
      }}
           sx={{
    // força o input ocupar 100%
    "& .MuiOutlinedInput-root": {
      width: "100%",
    },
    // rótulo "Password" em branco
    "& .MuiInputLabel-root": {
      color: "#fff",
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
        />

        {/* requisitos da senha */}
        <Box>
          <Typography variant="subtitle2">A senha deve conter:</Typography>
          <Typography color={requirements.up ? NEON : "red"}>
            • Uma letra maiúscula
          </Typography>
          <Typography color={requirements.low ? NEON : "red"}>
            • Uma letra minúscula
          </Typography>
          <Typography color={requirements.num ? NEON : "red"}>
            • Um número
          </Typography>
          <Typography color={requirements.special ? NEON : "red"}>
            • Um caractere especial
          </Typography>
        </Box>

        {/* botão */}
        <Button
          variant="outlined"
          fullWidth
          onClick={submitForm}
          disabled={!isValid || registerResult.isLoading}
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
          {registerResult.isLoading ? (
            <CircularProgress size={20} />
          ) : (
            "Registrar"
          )}
        </Button>
      </Stack>
    </Box>
  );
}
