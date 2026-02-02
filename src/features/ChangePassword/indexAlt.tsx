import React, { useState, useEffect } from 'react';
import { Button, TextField, Box, Typography, Paper } from '@mui/material';
import {  useSelector } from "react-redux";
import { useUpdatePasswordAltMutation } from '../auth/authAPI'; // Atualize o caminho conforme necessário
import { RootState } from '../../store';

const ChangePw: React.FC = () => {

    const { user } = useSelector((state: RootState) => state.auth);     


    return (
        <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="100vh" // Centraliza verticalmente
    >
        <Paper
            sx={{
                padding: 3,
                maxWidth: '400px', // Limita a largura
                width: '100%', // Garante que use 100% do espaço disponível até 400px
                margin: 'auto', // Centraliza horizontalmente
                textAlign: 'center', // Centraliza o texto
            }}
            elevation={3}
        >
            <Typography variant="h6" gutterBottom>
                Alterar Senha
            </Typography>

            <TextField
             margin="normal"
             id="currentPw"
             label="Senha Atual"
            
             >

            </TextField>
            <TextField
             margin="normal"
             id="currentPw"
             label="Senha Atual"
            
             >

            </TextField>
            <TextField
             margin="normal"
             id="currentPw"
             label="Senha Atual"
             
            
             >

            </TextField>


           
        </Paper>
    </Box>
        
    );
};

export default ChangePw;
