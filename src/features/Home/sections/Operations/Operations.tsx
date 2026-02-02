// src/features/Home/sections/Tools/Tools.tsx
import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  styled,
  Divider,
  Button,
} from '@mui/material';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import HistoryIcon from '@mui/icons-material/History';
import ListIcon from '@mui/icons-material/List';

const NEON = '#3CFCD9';
const GRADIENT_DOTTED = `
  linear-gradient(135deg, #0f2027 0%, #2c5364 100%),
  radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
`;

// Wrapper com mesmo fundo pontilhado e 100% da altura da viewport
const StyledToolsSection = styled('section')(({ theme }) => ({
  backgroundImage: GRADIENT_DOTTED,
  backgroundSize: '100% 100%, 20px 20px',
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  padding: theme.spacing(8, 0),
  color: theme.palette.common.white,
}));

const StyledCard = styled(Box)(({ theme }) => ({
  backgroundColor: 'rgba(0,0,0,0.6)',
  background: `linear-gradient(135deg, rgba(57, 255, 20, 0.05) 0%, rgba(0,0,0,0.8) 100%)`,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(5),
  position: 'relative',
  overflow: 'hidden',
  border: `1px solid ${NEON}33`,
  boxShadow: `0 8px 30px ${NEON}22`,
  transition: 'all 0.3s ease',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '3px',
    background: `linear-gradient(90deg, transparent, ${NEON}, transparent)`,
  },
}));

const IconWrapper = styled(Box)(() => ({
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${NEON}dd, ${NEON}aa)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: `0 4px 15px ${NEON}66, 0 0 20px ${NEON}44`,
  marginRight: 20,
  flexShrink: 0,
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.1) rotate(5deg)',
    boxShadow: `0 6px 20px ${NEON}88`,
  },
}));

const StyledPhone = styled('img')(() => ({
  width: '100%',
  maxWidth: 400,
  borderRadius: 24,
  boxShadow: `0 8px 40px ${NEON}66, 0 0 60px ${NEON}44`,
  border: `2px solid ${NEON}33`,
  transition: 'all 0.3s ease',
  animation: 'float 6s ease-in-out infinite',
  '@keyframes float': {
    '0%, 100%': {
      transform: 'translateY(0px)',
    },
    '50%': {
      transform: 'translateY(-20px)',
    },
  },
  '&:hover': {
    transform: 'scale(1.05)',
    boxShadow: `0 12px 50px ${NEON}88, 0 0 80px ${NEON}66`,
  },
}));

const features = [
  {
    icon: <MonetizationOnIcon sx={{ color: 'common.black' }} />,
    title: 'CONFIGURE O SEU PERFIL',
    description:
      'A binance fonece chaves para operações automáticas',
  },
  {
    icon: <HistoryIcon sx={{ color: 'common.black' }} />,
    title: 'SEGURANÇA',
    description:
      'A sua chave é utilizada na plataforma  de forma criptografada, só você tem acesso a ela',
  },
  {
    icon: <ListIcon sx={{ color: 'common.black' }} />,
    title: '',
    description:
      'Personalize sua estratégias e opere na Binance, seja de forma simulada ou em ambiente real',
  },
];

const Operations: React.FC = () => (
  <StyledToolsSection id="operations">
    <Container maxWidth="lg">
      {/* Título */}
      <Box mb={8} textAlign="center">
        <Typography
          variant="h3"
          fontWeight={700}
          sx={{
            color: NEON,
            fontSize: { xs: '1.75rem', md: '2.5rem' },
            textShadow: `0 0 20px ${NEON}44`,
            mb: 2,
            lineHeight: 1.3,
            textTransform: 'uppercase',
            letterSpacing: 1,
          }}
        >
          Opere de forma automática e personalizada na maior corretora de criptomoedas do mundo
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 300,
            maxWidth: '700px',
            mx: 'auto',
          }}
        >
          Integração direta com Binance para operações seguras e automatizadas
        </Typography>
      </Box>

      {/* Conteúdo principal: esquerda = lista, direita = mockup */}
      <Grid container spacing={4} alignItems="center">
        {/* Lista de features */}
        <Grid item xs={12} md={6}>
          <StyledCard>
            <Typography
              variant="h5"
              fontWeight={700}
              gutterBottom
              sx={{
                color: 'white',
                mb: 4,
                fontSize: '1.75rem',
                '& span': {
                  color: NEON,
                  textShadow: `0 0 10px ${NEON}44`,
                },
              }}
            >
              Ferramentas avançadas para{' '}
              <Box component="span">traders automatizados</Box>
            </Typography>

            <Box mt={3} mb={4}>
              {features.map(({ icon, title, description }, index) => (
                <Box
                  display="flex"
                  alignItems="flex-start"
                  mb={4}
                  key={title || index}
                  sx={{
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateX(5px)',
                    },
                  }}
                >
                  <IconWrapper>{icon}</IconWrapper>
                  <Box flex={1}>
                    {title && (
                      <Typography
                        variant="h6"
                        fontWeight={700}
                        gutterBottom
                        sx={{
                          color: NEON,
                          mb: 1,
                          fontSize: '1.1rem',
                        }}
                      >
                        {title}
                      </Typography>
                    )}
                    <Typography
                      variant="body1"
                      sx={{
                        color: 'rgba(255,255,255,0.85)',
                        lineHeight: 1.8,
                      }}
                    >
                      {description}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>

            <Divider
              sx={{
                borderColor: `${NEON}44`,
                mb: 4,
                borderWidth: 1,
              }}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                const element = document.getElementById('plans');
                element?.scrollIntoView({ behavior: 'smooth' });
              }}
              sx={{
                background: `linear-gradient(135deg, ${NEON}, #2cd2aa)`,
                color: 'common.black',
                fontWeight: 700,
                py: 1.75,
                fontSize: '1.1rem',
                boxShadow: `0 4px 20px ${NEON}66, 0 0 30px ${NEON}44`,
                textTransform: 'uppercase',
                letterSpacing: 1,
                transition: 'all 0.3s ease',
                '&:hover': {
                  background: `linear-gradient(135deg, #2cd2aa, ${NEON})`,
                  transform: 'translateY(-2px)',
                  boxShadow: `0 6px 30px ${NEON}88, 0 0 40px ${NEON}66`,
                },
              }}
            >
              CONHEÇA NOSSOS PLANOS PRO
            </Button>
          </StyledCard>
        </Grid>

        {/* Mockup de celular */}
        <Grid item xs={12} md={6} textAlign="center">
          <Box
            sx={{
              position: 'relative',
              display: 'inline-block',
              '&::before': {
                content: '""',
                position: 'absolute',
                inset: -20,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${NEON}22, transparent 70%)`,
                filter: 'blur(20px)',
                zIndex: -1,
              },
            }}
          >
            <StyledPhone src="/src/assets/images/cel.jpg" alt="App Mockup" />
          </Box>
        </Grid>
      </Grid>
    </Container>
  </StyledToolsSection>
);

export default Operations;
