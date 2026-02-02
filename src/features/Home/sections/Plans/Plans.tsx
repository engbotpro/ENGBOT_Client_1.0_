// src/features/Home/sections/Plans/Plans.tsx
import React, { useRef, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  styled,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import AnimationComponent from '../../../../components/AnimationComponent/AnimationComponent';

const NEON = '#3CFCD9';
const GRADIENT_DOTTED = `
  linear-gradient(135deg, #0f2027 0%, #2c5364 100%),
  radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
`;

const StyledPlansSection = styled('section')(({ theme }) => ({
  backgroundImage: GRADIENT_DOTTED,
  backgroundSize: '100% 100%, 20px 20px',
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
  color: theme.palette.common.white,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
}));

const PlanCard = styled(Paper)(({ theme }) => ({
  backgroundColor: 'rgba(0,0,0,0.7)',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4),
  position: 'relative',
  color: 'rgba(255,255,255,0.7)',
  flex: '0 0 auto',
  width: 320,
  maxWidth: '85vw',
}));

const NeonSpan = styled('span')(({ theme }) => ({
  ...theme.typography.h3,
  color: NEON,
  textShadow: `0 0 8px ${NEON}`,
  margin: '0 0.25rem',
}));

// Função para calcular o desconto percentual em relação ao preço mensal
const calculateDiscount = (oldPrice: number, newPrice: number): number => {
  if (oldPrice === 0 || oldPrice <= newPrice) return 0;
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
};

const plans = [
  {
    title: 'SEM PLANO',
    oldPrice: 0,
    price: 0,
    discount: 0,
    features: [
      'Acesso limitado',
      'Operações simuladas',
      'Sem robôs reais',
    ],
  },
  {
    title: 'INICIANTE BLACK',
    oldPrice: 9.99,
    price: 8.99,
    discount: calculateDiscount(9.99, 8.99), // 10%
    features: [
      '5 Robôs Simulados Simultâneos',
      'Operações simuladas',
      'Uma estratégia personalizada virtual',
      'Até 30 backtests mensais',
      'Calculadora inteligente',
    ],
  },
  {
    title: 'ENTUSIASTA BLACK',
    oldPrice: 29.99,
    price: 24.99,
    discount: calculateDiscount(29.99, 24.99), // 17%
    features: [
      '2 Robôs Em ambiente real Simultâneos',
      '10 Robôs Simulados Simultâneos',
      'Operações Reais e simuladas',
      '1 estratégias personalizada em ambiente real',
      '3 estratégias personalizada virtual',
      'Até 120 backtests mensais',
      'Calculadora inteligente',
    ],
  },
  {
    title: 'ESTRATEGISTA BLACK',
    oldPrice: 99.99,
    price: 79.99,
    discount: calculateDiscount(99.99, 79.99), // 20%
    features: [
      '10 Robôs Em ambiente real Simultâneos',
      '30 Robôs Simulados Simultâneos',
      'Operações Reais e simuladas',
      '3 estratégias personalizada em ambiente real',
      '6 estratégias personalizada virtual',
      'Até 200 backtests mensais',
      'Calculadora inteligente',
    ],
  },
  {
    title: 'PREMIUM BLACK',
    oldPrice: 239.99,
    price: 199.99,
    discount: calculateDiscount(239.99, 199.99), // 17%
    features: [
      '30 Robôs Em ambiente real Simultâneos',
      'Robôs ilimitados em ambiente Simulados Simultâneos',
      'Operações Reais e simuladas',
      'ilimitadas estratégias personalizada em ambiente real',
      '20 estratégias personalizada virtual',
      'backtests ilimitados',
      'Calculadora inteligente',
    ],
  },
];

const PricingPlans: React.FC = () => {
  const [billing, setBilling] = useState<'mensal' | 'anual'>('anual');
  const plansScrollRef = useRef<HTMLDivElement | null>(null);
  const handleBilling = (
    _: React.MouseEvent<HTMLElement>,
    newVal: 'mensal' | 'anual' | null
  ) => {
    if (newVal) setBilling(newVal);
  };

  return (
    <StyledPlansSection id="plans">
      <Container maxWidth="lg">
        <Box pt={5} pb={4} textAlign="center">
          <Typography
            variant="h2"
            gutterBottom
            sx={{
              fontWeight: 800,
              fontSize: { xs: '2rem', md: '3rem' },
              color: NEON,
              textShadow: `0 0 20px ${NEON}44`,
              mb: 2,
              textTransform: 'uppercase',
              letterSpacing: 2,
            }}
          >
            PLANOS AUTOMATIZADO NA ENGBOT
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: 'rgba(255,255,255,0.8)',
              fontWeight: 300,
              maxWidth: '700px',
              mx: 'auto',
            }}
          >
            Crie seus próprios robôs-traders ou siga estratégias profissionais, sem complicações.
          </Typography>
        </Box>

        {/* Toggle Mensal / Anual */}
        <Box textAlign="center" mb={4}>
          <ToggleButtonGroup
            value={billing}
            exclusive
            onChange={handleBilling}
            size="small"
            sx={{
              bgcolor: 'rgba(0,0,0,0.5)',
              borderRadius: 1,
              '& .MuiToggleButton-root': {
                color: 'grey.400',
                '&.Mui-selected': {
                  backgroundColor: NEON,
                  color: 'common.black',
                  boxShadow: `0 0 8px ${NEON}`,
                },
              },
            }}
          >
            <ToggleButton value="mensal">Mensal</ToggleButton>
            <ToggleButton value="anual">Anual</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Box sx={{ width: '100%', maxWidth: 1800, mx: 'auto', px: { xs: 2, md: 4 } }}>
          {/* Lista horizontal */}
          <Box
            ref={plansScrollRef}
            sx={{
              display: 'flex',
              gap: 3,
              overflowX: 'auto',
              justifyContent: 'flex-start',
              pb: 2,
              pr: { xs: 4, md: 8 },
              scrollBehavior: 'smooth',
              WebkitOverflowScrolling: 'touch',
              '&::-webkit-scrollbar': { height: 8 },
              '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(60,252,217,0.35)', borderRadius: 8 },
            }}
          >
            {plans.map((plan, idx) => (
              <AnimationComponent
                key={plan.title}
                moveDirection={idx % 2 === 0 ? 'right' : 'left'}
              >
                <PlanCard elevation={0}>
                  <Typography variant="subtitle1" gutterBottom sx={{ wordBreak: 'break-word' }}>
                    {plan.title}
                  </Typography>

                  {/* Preços */}
                  <Box
                    display="flex"
                    flexDirection="column"
                    mb={4}
                  >
                    {billing === 'anual' && plan.oldPrice > 0 && (
                      <Typography
                        sx={{
                          textDecoration: 'line-through',
                          color: 'grey.500',
                          mb: 0.5,
                        }}
                      >
                        R${plan.oldPrice}/mês
                      </Typography>
                    )}

                    {plan.title !== 'SEM PLANO' && (
                    <Typography
                        variant="body2"
                      sx={{
                          color: 'text.secondary',
                          mb: 0.5,
                      }}
                    >
                        por
                      </Typography>
                    )}

                    <Box>
                      {plan.title === 'SEM PLANO' ? (
                        <NeonSpan>Grátis</NeonSpan>
                      ) : (
                        <>
                          <Typography
                            variant="h4"
                            component="div"
                          >
                          <NeonSpan>
                            R$
                            {billing === 'anual'
                              ? plan.price
                              : plan.oldPrice}
                          </NeonSpan>
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              color: 'text.secondary',
                              mt: 0.5,
                            }}
                          >
                          /mês
                          </Typography>
                        </>
                      )}
                    </Box>
                  </Box>

                  {/* Botão */}
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{
                      backgroundColor: plan.title === 'SEM PLANO' ? '#9e9e9e' : NEON,
                      color: 'common.black',
                      fontWeight: 600,
                      py: 1.5,
                      mb: 3,
                      mt: plan.title === 'SEM PLANO' ? 9.5 : 0,
                      boxShadow: plan.title === 'SEM PLANO' ? 'none' : `0 0 8px ${NEON}`,
                      '&:hover': {
                        backgroundColor: plan.title === 'SEM PLANO' ? '#9e9e9e' : '#2cd2aa',
                      },
                    }}
                    disabled={plan.title === 'SEM PLANO'}
                  >
                    {plan.title === 'SEM PLANO'
                      ? 'SEM ASSINATURA'
                      : billing === 'anual'
                        ? `ASSINAR ANUAL ${calculateDiscount(plan.oldPrice, plan.price)}% OFF`
                        : 'ASSINAR MENSAL'}
                  </Button>

                  {/* Lista de Features */}
                  <Typography variant="body2" gutterBottom>
                    Incluso nesse plano:
                  </Typography>
                  {plan.features.map((feat) => (
                    <Box
                      key={feat}
                      display="flex"
                      alignItems="flex-start"
                      mb={1.5}
                    >
                      <CheckCircleIcon
                        fontSize="small"
                        sx={{ color: NEON, mr: 1 }}
                      />
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        {feat}
                      </Typography>
                    </Box>
                  ))}
                </PlanCard>
              </AnimationComponent>
            ))}
          </Box>
        </Box>
      </Container>
    </StyledPlansSection>
  );
};

export default PricingPlans;
