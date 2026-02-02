// src/features/Home/sections/Features/Features.tsx
import React from 'react';
import {
  Box,
  Card,
  Container,
  Grid,
  Typography,
  styled,
  Divider,
} from '@mui/material';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import SettingsIcon from '@mui/icons-material/Settings';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import HistoryIcon from '@mui/icons-material/History';
import PieChartIcon from '@mui/icons-material/PieChart';
import CalculateIcon from '@mui/icons-material/Calculate';

const NEON = '#3CFCD9';
const GRADIENT_DOTTED = `
  linear-gradient(135deg, #0f2027 0%, #2c5364 100%),
  radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
`;

// wrapper com fundo pontilhado e altura total da viewport
const StyledFeaturesSection = styled('section')(({ theme }) => ({
  backgroundImage: GRADIENT_DOTTED,
  backgroundSize: '100% 100%, 20px 20px',
  color: theme.palette.common.white,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
}));

const IconWrapper = styled(Box)(({ theme }) => ({
  width: 72,
  height: 72,
  borderRadius: '50%',
  background: `linear-gradient(135deg, ${NEON}dd, ${NEON}aa)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 20px',
  boxShadow: `0 4px 20px ${NEON}66, 0 0 30px ${NEON}44`,
  transition: 'all 0.3s ease',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    inset: -2,
    borderRadius: '50%',
    background: `linear-gradient(135deg, ${NEON}, transparent)`,
    opacity: 0,
    transition: 'opacity 0.3s ease',
  },
  '&:hover::before': {
    opacity: 0.3,
  },
}));

const StyledCard = styled(Card)(({ theme }) => ({
  backgroundColor: 'rgba(0,0,0,0.6)',
  background: `linear-gradient(135deg, rgba(57, 255, 20, 0.03) 0%, rgba(0,0,0,0.8) 100%)`,
  color: theme.palette.common.white,
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4),
  textAlign: 'center',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
  border: `1px solid ${NEON}22`,
  height: '100%',
  cursor: 'pointer',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: '-100%',
    width: '100%',
    height: '100%',
    background: `linear-gradient(90deg, transparent, ${NEON}11, transparent)`,
    transition: 'left 0.5s ease',
  },
  '&:hover': {
    transform: 'translateY(-8px) scale(1.02)',
    borderColor: `${NEON}66`,
    boxShadow: `0 12px 40px ${NEON}33, 0 0 20px ${NEON}22`,
    backgroundColor: 'rgba(57, 255, 20, 0.05)',
    '&::before': {
      left: '100%',
    },
    '& .icon-wrapper': {
      transform: 'scale(1.1) rotate(5deg)',
      boxShadow: `0 0 25px ${NEON}88`,
    },
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '3px',
    background: `linear-gradient(90deg, transparent, ${NEON}, transparent)`,
    transform: 'scaleX(0)',
    transition: 'transform 0.3s ease',
  },
  '&:hover::after': {
    transform: 'scaleX(1)',
  },
}));

const features = [
  {
    icon: <WorkspacePremiumIcon fontSize="large" />,
    title: 'Estratégias Vencedoras',
    description:
      'Escolha entre milhares de estratégias comprovadamente ganhadoras* para automatizar seu trading.',
  },
  {
    icon: <SettingsIcon fontSize="large" />,
    title: 'Crie seus próprios Robôs',
    description:
      'Desenvolva robôs de day trade com ferramentas exclusivas para criação e análise de estratégias.',
  },
  {
    icon: <ShoppingBagIcon fontSize="large" />,
    title: 'Marketplace de Robôs Pro',
    description:
      'Encontre robôs profissionais para assinar ou encare o desafio e venda seus robôs na SmarttBot.',
  },
  {
    icon: <HistoryIcon fontSize="large" />,
    title: 'Backtesting SmarttBot',
    description:
      'Utilize dados de mercado reais para validar a performance das suas estratégias, sem precisar programar.',
  },
  {
    icon: <PieChartIcon fontSize="large" />,
    title: 'Gerencie seu Portfolio',
    description:
      'Negocie com múltiplos robôs e diversifique seu day trade automatizado em uma só plataforma.',
  },
  {
    icon: <CalculateIcon fontSize="large" />,
    title: 'Calculadora Inteligente',
    description:
      'Importe seus gastos do cartão de crédito e organize seu planejamento financeiro com base em seus gastos. Além disso, simule investimentos e projete seus lucros futuros.',
  },
];

const AboutSection: React.FC = () => (
  <StyledFeaturesSection id="about">
    <Container maxWidth="lg">
      <Box pt={5} mb={6} textAlign="center">
        <Typography
          variant="h2"
          fontWeight={700}
          sx={{
            fontSize: { xs: '2rem', md: '3rem' },
            color: NEON,
            textShadow: `0 0 20px ${NEON}44`,
            mb: 2,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          Nossas Soluções
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 300,
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          Descubra ferramentas poderosas para automatizar e otimizar seus trades
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        {features.map(({ icon, title, description }) => (
          <Grid key={title} item xs={12} sm={6} md={4}>
            <StyledCard elevation={0}>
              <IconWrapper className="icon-wrapper">{icon}</IconWrapper>
              <Divider
                sx={{
                  borderColor: `${NEON}44`,
                  mb: 2.5,
                  borderWidth: 1,
                }}
              />
              <Typography
                variant="h6"
                fontWeight={700}
                gutterBottom
                sx={{
                  color: NEON,
                  mb: 2,
                  fontSize: '1.25rem',
                  textShadow: `0 0 10px ${NEON}33`,
                }}
              >
                {title}
              </Typography>
              <Typography
                variant="body1"
                sx={{
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.8,
                  fontSize: '0.95rem',
                }}
              >
                {description}
              </Typography>
            </StyledCard>
          </Grid>
        ))}
      </Grid>
    </Container>
  </StyledFeaturesSection>
);

export default AboutSection;
