import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Typography, IconButton, InputAdornment } from '@mui/material';
import { useSelector } from "react-redux";
import { useUpdatePasswordAltMutation } from '../auth/authAPI';
import { RootState } from '../../store';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import useMutationAlert from '../../hooks/useMutationAlert';

const ChangePasswordAlt: React.FC = () => {

    const [currentPw, setCurrentPw] = useState<string>('');
    const [newPw, setNewPw] = useState<string>('');
    const [newPwRep, setNewPwRep] = useState<string>('');
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
    const [passwordsMatch, setPasswordsMatch] = useState<boolean>(true); // Para validar se as senhas coincidem

    useEffect(() => {
        setCurrentPw(''); // Força o currentPw a iniciar com uma string vazia quando o componente é montado
    }, []);

    const { user } = useSelector((state: RootState) => state.auth);

    const [updatePassword, result] = useUpdatePasswordAltMutation();

    console.log(result)

    useMutationAlert(result)

    
    const handleSave = () => {
        if (!user) {
            setError('Usuário não autenticado.');
            return;
        }

        if (newPw !== newPwRep) {
            setError('As senhas novas não correspondem.');
            return;
        }

        console.log('ds',user)
        updatePassword({
            email: user.email,
            password: currentPw,
            newpw: newPw,
            newpwrep: newPwRep,
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

    return (
        <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            p={2}
            mt={4}
            maxWidth="400px"
            margin="auto"
        >
            <Typography variant="h6" gutterBottom>
                Alterar Senha
            </Typography>

            {/* Campo de Senha Atual */}
            <TextField
                margin="normal"
                id="currentPw"
                label="Senha Atual"
                type={showCurrentPw ? 'text' : 'password'}
                fullWidth
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={() => setShowCurrentPw(!showCurrentPw)}
                                edge="end"
                            >
                                {showCurrentPw ? <VisibilityOff /> : <Visibility />}
                            </IconButton>
                        </InputAdornment>
                    )
                }}
            />

            {/* Campo de Nova Senha */}
            <TextField
                margin="normal"
                id="newPw"
                label="Nova Senha"
                type={showNewPw ? 'text' : 'password'}
                fullWidth
                value={newPw}
                onChange={(e) => handlePasswordChange(e.target.value)}
                InputProps={{
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
            />

            <Button
                variant="contained"
                color="primary"
                onClick={handleSave}
                style={{ marginTop: '16px' }}
                disabled={ !isPasswordValid}
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
};

export default ChangePasswordAlt;
