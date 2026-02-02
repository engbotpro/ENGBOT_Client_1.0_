import React, { useEffect } from 'react';
import { styled, Box } from '@mui/material';
import { Outlet, Navigate, useLocation,useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { selectAuth, login } from './authSlice';
import { sendError } from '../notificationSlice';
import AnimatedBackground from '../../components/AnimatedBackground'; // ajuste o caminho conforme necessário
import overlayImage1 from '../../assets/Brasão_CASOP.png';
import overlayImage2 from '../../assets/Nova_Marca_MB.png';
import WorldMapWithContours from '../../components/WorldMapWithContours';
import PortfolioDesktop from '../../../src/assets/images/op.jpg';
import Notification from '../../components/Notification';

export default function LoginPage() {
  const { isAuthenticated } = useSelector(selectAuth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { search } = useLocation();

  // Extrai o googleToken **APENAS UMA VEZ**
  const params = new URLSearchParams(search);
  const googleToken = params.get('googleToken');
  const error = params.get('error');
  console.log('🔍 LoginPage montado. query=', search, '→ googleToken=', googleToken, '→ error=', error);

  // Trata erros do Google OAuth
  useEffect(() => {
    if (error) {
      const errorMessages: Record<string, string> = {
        'no_user': 'Erro ao fazer login com Google: usuário não encontrado.',
        'user_not_found': 'Erro ao fazer login com Google: usuário não encontrado no sistema.',
        'token_error': 'Erro ao gerar token de autenticação. Tente novamente.',
        'default': 'Erro ao fazer login com Google. Tente novamente ou use email e senha.'
      };
      const errorMessage = errorMessages[error] || errorMessages['default'];
      dispatch(sendError(errorMessage));
      // Remove o parâmetro de erro da URL
      navigate('/login', { replace: true });
    }
  }, [error, dispatch, navigate]);

  useEffect(() => {
    console.log('📦 useEffect disparou. googleToken=', googleToken);
    if (googleToken) {
      console.log('💾 Salvando token no localStorage e dispatch(login)');
      localStorage.setItem('authToken', googleToken);
      dispatch(login({ token: googleToken }));
      console.log('🔄 Navegando para /home');
      navigate('/home', { replace: true });
    }
  }, [googleToken, dispatch, navigate]);

  // Se já estiver autenticado (via outro fluxo) e **não** veio do Google, vai pra /home
  if (isAuthenticated && !googleToken) {
    console.log('🔄 Already authenticated → redirect /home');
    return <Navigate to="/home" replace />;
  }

  // === estilo do container de fundo ===
  const StyledHero = styled(Box)(({ theme }) => ({
    background: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)',
    color: theme.palette.common.white,
    paddingTop: theme.spacing(4),
    paddingBottom: theme.spacing(4),
    [theme.breakpoints.up('sm')]: {
      paddingTop: theme.spacing(6),
      paddingBottom: theme.spacing(6),
    },
    [theme.breakpoints.up('md')]: {
      paddingTop: theme.spacing(8),
      paddingBottom: theme.spacing(8),
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
  }));

 

  return (
    <StyledHero>
      <Notification />
      <Box sx={{ display: 'flex', flexDirection: 'column' }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            width: '100vw',
            position: 'relative',
          }}
        >
          {/* Onde seu fluxo de login será renderizado */}
          <Outlet />

          {/* Exemplo de uso das imagens de background */}
         
        </Box>
      </Box>
    </StyledHero>
  );
}
