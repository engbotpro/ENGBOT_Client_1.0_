import { useEffect, useState } from "react";
import { useUpdatePasswordMutation } from "./authAPI";
import { Button, Typography, Box, Stack, Divider, TextField, IconButton, InputAdornment } from "@mui/material";
import { Send } from "@mui/icons-material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTheme } from '@mui/material/styles';
import PasswordField from "../../components/PasswordField";
import useMutationAlert from "../../hooks/useMutationAlert";
import { RootState } from "../../store";
import { Visibility, VisibilityOff } from '@mui/icons-material';

export default function ChangePassword() {
    const { email } = useSelector((state: RootState) => state.auth);
    const [updatePassword, updateResult] = useUpdatePasswordMutation();
    const [newPwRep, setNewPwRep] = useState<string>('');
    const [password, setPassword] = useState<string>('');
    const [repeat, setRepeat] = useState<string>('');
    const [newPw, setNewPw] = useState<string>('');
    const [showCurrentPw, setShowCurrentPw] = useState<boolean>(false); // Visibilidade da senha atual
    const [showNewPw, setShowNewPw] = useState<boolean>(false);         // Visibilidade da nova senha
    const [showNewPwRep, setShowNewPwRep] = useState<boolean>(false);   // Visibilidade da repetição da nova senha
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [passwordRequirements, setPasswordRequirements] = useState({
        hasUpperCase: false,
        hasLowerCase: false,
        hasNumber: false,
        hasSpecialChar: false,
        hasMinLength: false,
    });
    const [passwordsMatch, setPasswordsMatch] = useState<boolean>(true);
    const navigate = useNavigate();
    const theme = useTheme();

     const NEON = "#39FF14";

    useMutationAlert(updateResult);

    useEffect(() => {
        
        setPassword('');
        setRepeat('');

        if (updateResult.isSuccess) {
            navigate("/home");
        }
        if (updateResult.isError) {
            console.error("Erro ao atualizar senha:", updateResult.error);
        }
    }, [updateResult, navigate]);

    // Validação e atualização da senha
    const validatePassword = (value: string) => {
        const upperCaseRegex = /[A-Z]/;
        const lowerCaseRegex = /[a-z]/;
        const numberRegex = /[0-9]/;
        const specialCharRegex = /[^A-Za-z0-9]/;

        setPasswordRequirements({
            hasUpperCase: upperCaseRegex.test(value),
            hasLowerCase: lowerCaseRegex.test(value),
            hasNumber: numberRegex.test(value),
            hasSpecialChar: specialCharRegex.test(value),
            hasMinLength: value.length >= 8,
        });
    };

    const handlePasswordChange = (value: string) => {
        setNewPw(value);

        const upperCaseRegex = /[A-Z]/;
        const lowerCaseRegex = /[a-z]/;
        const numberRegex = /[0-9]/;
        const specialCharRegex = /[^A-Za-z0-9]/;

        setPasswordRequirements({
            hasUpperCase: upperCaseRegex.test(value),
            hasLowerCase: lowerCaseRegex.test(value),
            hasNumber: numberRegex.test(value),
            hasSpecialChar: specialCharRegex.test(value),
            hasMinLength: value.length >= 8,
        });

        // Atualiza se as senhas são iguais
        setPasswordsMatch(value === newPwRep);
    };

    const handleRepeatPasswordChange = (value: string) => {
        setNewPwRep(value);
        setPasswordsMatch(newPw === value); // Atualiza se as senhas são iguais
    };

    const isPasswordValid = Object.values(passwordRequirements).every(Boolean) && passwordsMatch;

    const handleChangePassword = () => {
        if (email) {
            updatePassword({
                email: email,           
                password: newPw,
                newpassword: newPwRep,
            });
        } else {
            console.error("NIP não está definido");
        }
    };

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

           
            <TextField
                margin="normal"
                id="newPw"
                label="Nova Senha"
                type={showNewPw ? 'text' : 'password'}
                fullWidth
                value={newPw}
                onChange={(e) => handlePasswordChange(e.target.value)}
                InputProps={{
                     sx: { color: "rgba(255,255,255,0.7)" },
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowNewPw(!showNewPw)}
                                edge="end"
                            >
                                {showNewPw ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    )
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

            {/* Requisitos da Senha */}
            

            {/* Campo de Repetir Nova Senha */}
            <TextField
                margin="normal"
                id="newPwRep"
                label="Repita a Nova Senha"
                type={showNewPwRep ? 'text' : 'password'}
                fullWidth
                value={newPwRep}
                onChange={(e) => handleRepeatPasswordChange(e.target.value)}
                error={!passwordsMatch} // Mostra erro se as senhas não coincidirem
                helperText={!passwordsMatch ? 'As senhas não correspondem' : ''}
                InputProps={{
                     sx: { color: "rgba(255,255,255,0.7)" },
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowNewPwRep(!showNewPwRep)}
                                edge="end"
                            >
                                {showNewPwRep ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    )
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

            <Button
                variant="contained"                
                onClick={handleChangePassword}
                style={{ marginTop: '16px' }}
                disabled={!isPasswordValid}
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
                Alterar
            </Button>

            <Box mt={2} textAlign="left">
                <Typography variant="subtitle1">A senha deve conter:</Typography>
                <Typography color={passwordRequirements.hasMinLength ? 'green' : 'red'}>
                    • No mínimo 8 caracteres
                </Typography>
                <Typography color={passwordRequirements.hasUpperCase ? 'green' : 'red'}>
                    • Uma letra maiúscula
                </Typography>
                <Typography color={passwordRequirements.hasLowerCase ? 'green' : 'red'}>
                    • Uma letra minúscula
                </Typography>
                <Typography color={passwordRequirements.hasNumber ? 'green' : 'red'}>
                    • Um número
                </Typography>
                <Typography color={passwordRequirements.hasSpecialChar ? 'green' : 'red'}>
                    • Um caractere especial
                </Typography>
            </Box>

            {error && (
                <Typography color="error" variant="body2" style={{ marginTop: '16px' }}>
                    {error}
                </Typography>
            )}
            {success && (
                <Typography color="success" variant="body2" style={{ marginTop: '16px' }}>
                    {success}
                </Typography>
            )}
        </Box>
    );
}
