import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  Stack,
  IconButton,
  Tooltip,
  TextField,
  Grid,
  ToggleButton,
  ToggleButtonGroup,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PaymentIcon from '@mui/icons-material/Payment';
import {
  Elements,
  useElements,
  useStripe,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { QRCodeSVG } from "qrcode.react";
import type { StripeCardElementOptions } from "@stripe/stripe-js";
import { Trade, TradeStats } from "../../types/trade";
import { 
  fetchUserTrades, 
  fetchTradeStats, 
  formatTradeDate, 
  formatCurrency, 
  getPnLColor,
  getTradeTypeLabel,
  getEnvironmentLabel,
  getEnvironmentColor
} from "../../services/tradeAPI";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useGetUserPlanHistoryQuery, useUpdateUserMutation } from "../users/userAPI";
import HistoryIcon from '@mui/icons-material/History';
import { PlanHistoryEntry } from "../users/userAPI";

// ⬇️ Carrega sua chave pública do Stripe do .env (ex.: VITE_STRIPE_PUBLIC_KEY)
const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY ?? ""
);

// Tipos para o histórico de planos
interface PlanHistory {
  id: string;
  planName: string;
  oldPlan?: string;
  changeType: 'upgrade' | 'downgrade' | 'new' | 'cancelled';
  date: Date;
  price: number;
  billingCycle: 'mensal' | 'anual';
}

// Interface para o plano selecionado
interface SelectedPlan {
  title: string;
  price: number;
  oldPrice: number;
  discount: number;
  features: string[];
  billingCycle: 'mensal' | 'anual';
}

// Status do pagamento
type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed' | 'cancelled';

// Interface para o status do pagamento PIX
interface PixPaymentStatus {
  status: PaymentStatus;
  message: string;
  transactionId?: string;
}

// Dados de exemplo para o histórico
const mockPlanHistory: PlanHistory[] = [
  {
    id: '1',
    planName: 'ENTUSIASTA BLACK',
    changeType: 'new',
    date: new Date('2024-01-15'),
    price: 59,
    billingCycle: 'anual',
  },
  {
    id: '2',
    planName: 'ESTRATEGISTA BLACK',
    oldPlan: 'ENTUSIASTA BLACK',
    changeType: 'upgrade',
    date: new Date('2024-02-20'),
    price: 99,
    billingCycle: 'anual',
  },
  {
    id: '3',
    planName: 'INICIANTE BLACK',
    oldPlan: 'ESTRATEGISTA BLACK',
    changeType: 'downgrade',
    date: new Date('2024-03-10'),
    price: 5,
    billingCycle: 'mensal',
  },
];

const NEON = '#3CFCD9';

// Função para calcular o desconto percentual em relação ao preço mensal
// Exemplo: se mensal é R$ 100 e anual é R$ 80/mês, desconto = (100 - 80) / 100 = 20%
const calculateDiscount = (oldPrice: number, newPrice: number): number => {
  if (oldPrice === 0 || oldPrice <= newPrice) return 0;
  return Math.round(((oldPrice - newPrice) / oldPrice) * 100);
};

const PlanCard = styled(Paper)(({ theme }) => ({
  backgroundColor: 'rgba(0,0,0,0.7)',
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(4),
  position: 'relative',
  color: 'rgba(255,255,255,0.7)',
}));

const NeonSpan = styled('span')(({ theme }) => ({
  ...theme.typography.h3,
  color: NEON,
  textShadow: `0 0 8px ${NEON}`,
  margin: '0 0.25rem',
}));

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
    price:  79.99,
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

/**
 * Componente principal que exibe três abas:
 *  1. Detalhes do Plano
 *  2. Pagamento (Cartão ou Pix)
 *  3. Histórico de Pagamentos
 */

const StripeField = styled('div')(({ theme }) => ({
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  padding: theme.spacing(1.5),
  height: 40,
  display: 'flex',
  alignItems: 'center',
  // o iframe interno precisa ocupar toda a área
  '& .StripeElement': {
    width: '100%',
  },
}));

const PaymentTab: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<SelectedPlan | null>(null);
  const [billingCycle, setBillingCycle] = useState<'mensal' | 'anual'>('anual');

  const handlePlanSelection = (plan: typeof plans[0], cycle: 'mensal' | 'anual') => {
    setSelectedPlan({
      ...plan,
      billingCycle: cycle,
    });
    setBillingCycle(cycle);
    setTab(1); // Redireciona para a aba de pagamento
  };

  const handleBackToPlans = () => {
    setTab(0);
  };

  return (
    <Paper
      /* Padrão solicitado: Paper pai com 90% da tela */
      sx={{
        width: "90vw",
        height: "90vh",
        mx: "auto",
        my: 2,
        display: "flex",
        flexDirection: "column",
        p: 2,
        gap: 2,
      }}
      variant="outlined"
    >
      {/* Tabs de navegação */}
      <Tabs
        value={tab}
        onChange={(_, newTab) => setTab(newTab)}
        variant="fullWidth"
      >
        <Tab label="Detalhes do Plano" />
        <Tab label="Pagamento" />
        <Tab label="Histórico" />
      </Tabs>

      {/* Conteúdo das abas */}
      {tab === 0 && (
        <PlanDetails 
          onPlanSelect={handlePlanSelection}
          billingCycle={billingCycle}
          setBillingCycle={setBillingCycle}
        />
      )}
      {tab === 1 && (
        <Elements stripe={stripePromise}>
          <PaymentForm 
            selectedPlan={selectedPlan}
            onBackToPlans={handleBackToPlans}
            billingCycle={billingCycle}
            setBillingCycle={setBillingCycle}
            setSelectedPlan={setSelectedPlan}
          />
        </Elements>
      )}
      {tab === 2 && <PaymentHistory />}
    </Paper>
  );
};

/* -------------------------------------------------------------------------- */
/*                                Tab 1: Plano                                */
/* -------------------------------------------------------------------------- */
interface PlanDetailsProps {
  onPlanSelect: (plan: typeof plans[0], cycle: 'mensal' | 'anual') => void;
  billingCycle: 'mensal' | 'anual';
  setBillingCycle: (cycle: 'mensal' | 'anual') => void;
}

const PlanDetails: React.FC<PlanDetailsProps> = ({ 
  onPlanSelect, 
  billingCycle, 
  setBillingCycle 
}) => {
  const user = useSelector((state: RootState) => state.auth.user);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const plansScrollRef = React.useRef<HTMLDivElement | null>(null);
  
  // Verificar se o usuário tem plano ativo
  const hasActivePlan = user?.currentPlan && (
    !user.planExpiresAt || new Date(user.planExpiresAt) > new Date()
  );
  
  const currentPlan = user?.currentPlan || null;

  const handleBilling = (
    _: React.MouseEvent<HTMLElement>,
    newVal: 'mensal' | 'anual' | null
  ) => {
    if (newVal) setBillingCycle(newVal);
  };

  const handleCancelSubscription = async () => {
    if (!user?.id) return;
    
    try {
      // Atualizar o plano para null (o backend trata null como remoção do plano)
      await updateUser({
        id: user.id,
        currentPlan: null as any, // Enviar null explicitamente
        billingCycle: null as any,
        planActivatedAt: null as any,
        planExpiresAt: null as any,
      }).unwrap();

      // Recarregar a página para atualizar o estado do usuário do JWT
      window.location.reload();
    } catch (error) {
      console.error('Erro ao cancelar assinatura:', error);
      alert('Erro ao cancelar assinatura. Tente novamente.');
    }
  };


  return (
    <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
      <Typography variant="h4" gutterBottom sx={{ textAlign: 'center', mb: 4 }}>
        PLANOS AUTOMATIZADO NA ENGBOT
      </Typography>
      <Typography variant="h6" sx={{ textAlign: 'center', mb: 4 }}>
        Crie seus próprios robôs-traders ou siga estratégias profissionais, sem complicações.
      </Typography>

      {/* Toggle Mensal / Anual */}
      <Box textAlign="center" mb={4}>
        <ToggleButtonGroup
          value={billingCycle}
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
          {plans.map((plan) => (
            <PlanCard elevation={0} key={plan.title} sx={{ flex: '0 0 auto', width: 320, maxWidth: '85vw' }}>
              <Typography variant="subtitle1" gutterBottom>
                {plan.title}
              </Typography>

              {/* Preços */}
              <Box
                display="flex"
                flexDirection="column"
                mb={4}
              >
                {billingCycle === 'anual' && plan.oldPrice > 0 && (
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
                          {billingCycle === 'anual'
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
                  backgroundColor: plan.title === 'SEM PLANO' 
                    ? (hasActivePlan ? '#f44336' : '#9e9e9e')
                    : (currentPlan === plan.title ? '#4caf50' : NEON),
                  color: 'common.black',
                  fontWeight: 600,
                  py: 1.5,
                  mb: 3,
                  mt: plan.title === 'SEM PLANO' ? 9.5 : 0,
                  boxShadow: plan.title === 'SEM PLANO' 
                    ? 'none' 
                    : (currentPlan === plan.title ? '0 0 8px #4caf50' : `0 0 8px ${NEON}`),
                  '&:hover': { 
                    backgroundColor: plan.title === 'SEM PLANO' 
                      ? (hasActivePlan ? '#d32f2f' : '#9e9e9e')
                      : (currentPlan === plan.title ? '#45a049' : '#2cd2aa') 
                  },
                }}
                disabled={plan.title === 'SEM PLANO' && !hasActivePlan}
                onClick={() => {
                  if (plan.title === 'SEM PLANO' && hasActivePlan) {
                    setCancelDialogOpen(true);
                  } else if (plan.title !== 'SEM PLANO' && currentPlan !== plan.title) {
                    onPlanSelect(plan, billingCycle);
                  }
                }}
              >
                {plan.title === 'SEM PLANO' 
                  ? (hasActivePlan ? 'CANCELAR ASSINATURA' : 'SEM ASSINATURA')
                  : currentPlan === plan.title 
                  ? 'PLANO ATUAL'
                  : billingCycle === 'anual'
                    ? `ASSINAR ANUAL ${calculateDiscount(plan.oldPrice, plan.price)}% OFF`
                    : 'ASSINAR MENSAL'
                }
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
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{feat}</Typography>
                </Box>
              ))}
            </PlanCard>
              ))}
        </Box>
      </Box>

      {/* Dialog de Confirmação de Cancelamento */}
      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6" fontWeight="bold">
            Cancelar Assinatura
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Tem certeza que deseja cancelar sua assinatura?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Ao cancelar, você perderá acesso a todas as funcionalidades do seu plano atual e voltará para o plano gratuito.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => setCancelDialogOpen(false)}
            disabled={isUpdating}
          >
            Não, manter assinatura
          </Button>
          <Button 
            onClick={handleCancelSubscription}
            variant="contained"
            color="error"
            disabled={isUpdating}
          >
            {isUpdating ? 'Cancelando...' : 'Sim, cancelar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/* -------------------------------------------------------------------------- */
/*                         Tab 2: Formulário de Pagamento                      */
/* -------------------------------------------------------------------------- */
interface PaymentFormProps {
  selectedPlan: SelectedPlan | null;
  onBackToPlans: () => void;
  billingCycle: 'mensal' | 'anual';
  setBillingCycle: (cycle: 'mensal' | 'anual') => void;
  setSelectedPlan: (plan: SelectedPlan | null) => void;
}

const CARD_ELEMENT_OPTIONS: StripeCardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      letterSpacing: "0.025em",
      fontFamily: "Roboto, Open Sans, Segoe UI, sans-serif",
      "::placeholder": {
        color: "#9e9e9e",
      },
    },
    invalid: {
      color: "#e5424d",
    },
  },
};

/**
 * Estilo utilitário para caixas que contêm Stripe Elements, garantindo altura fixa
 * e clique/teclado habilitados.
 */
const stripeBoxStyles = {
  display: "flex",
  alignItems: "center",
  height: 40,
  border: "1px solid #c4c4c4",
  borderRadius: 1,
  px: 1.5,
  "& .StripeElement": {
    flex: 1,
    width: "100%",
    backgroundColor: "transparent",
  },
} as const;

// Função para verificar status do pagamento PIX
const checkPixPaymentStatus = async (transactionId: string): Promise<PixPaymentStatus> => {
  try {
    const response = await fetch(`/api/payments/pix/status/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Erro ao verificar status do pagamento');
    }

    const data = await response.json();
    return {
      status: data.status,
      message: data.message,
      transactionId: data.transactionId,
    };
  } catch (error) {
    console.error('Erro ao verificar status PIX:', error);
    return {
      status: 'failed',
      message: 'Erro ao verificar status do pagamento',
      transactionId,
    };
  }
};

// Função para criar pagamento no backend
const createPaymentIntent = async (amount: number, plan: SelectedPlan) => {
  try {
    const response = await fetch('/api/payments/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        plan: plan.title,
        billingCycle: plan.billingCycle,
        userId: 'anonymous', // Em produção, pegar do contexto de autenticação
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar payment intent:', error);
    throw error; // Re-throw para ser tratado no componente
  }
};

// Função para criar pagamento PIX no backend
const createPixPayment = async (amount: number, plan: SelectedPlan) => {
  try {
    const response = await fetch('/api/payments/pix/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        plan: plan.title,
        billingCycle: plan.billingCycle,
        userId: 'anonymous', // Em produção, pegar do contexto de autenticação
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao criar pagamento PIX:', error);
    throw error;
  }
};

const PaymentForm: React.FC<PaymentFormProps> = ({ 
  selectedPlan, 
  onBackToPlans,
  billingCycle,
  setBillingCycle,
  setSelectedPlan
}) => {
  const stripe = useStripe();
  const elements = useElements();

  const [loading, setLoading] = useState(false);
  const [paymentType, setPaymentType] = useState<"card" | "pix">("card");
  const [cardHolder, setCardHolder] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
  const [paymentMessage, setPaymentMessage] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [pixTransactionId, setPixTransactionId] = useState<string>("");
  const [pixPollingInterval, setPixPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Se não há plano selecionado, volta para a aba de planos
  if (!selectedPlan) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h6" gutterBottom>
          Nenhum plano selecionado
        </Typography>
        <Button 
          variant="contained" 
          onClick={onBackToPlans}
          startIcon={<ArrowBackIcon />}
        >
          Voltar aos Planos
        </Button>
      </Box>
    );
  }

  // Estado para armazenar o código PIX real
  const [pixCode, setPixCode] = useState<string>("");
  const [pixQrCode, setPixQrCode] = useState<string>("");

  // Função chamada somente quando a opção Cartão está selecionada
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!stripe || !elements || paymentType !== "card") return;

    setLoading(true);
    setPaymentStatus('processing');
    setPaymentMessage("Processando pagamento...");

    try {
      const cardNumberElement = elements.getElement(CardNumberElement);
      if (!cardNumberElement) {
        throw new Error("Elemento do cartão não encontrado");
      }

      // Cria o payment intent no backend
      const totalAmount = getTotalPrice();
      const paymentIntent = await createPaymentIntent(totalAmount, selectedPlan);

      // Confirma o pagamento no Stripe
      const { error, paymentIntent: confirmedPaymentIntent } = await stripe.confirmCardPayment(
        paymentIntent.clientSecret,
        {
          payment_method: {
            card: cardNumberElement,
            billing_details: {
              name: cardHolder,
            },
          },
        }
      );

      if (error) {
        throw new Error(error.message || "Erro ao processar pagamento");
      }

      if (confirmedPaymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        setPaymentMessage("Pagamento realizado com sucesso! Seu plano foi ativado.");
        setShowSuccessDialog(true);
      } else {
        throw new Error("Pagamento não foi confirmado");
      }

    } catch (error) {
      console.error('Erro no pagamento:', error);
      setPaymentStatus('failed');
      setPaymentMessage(error instanceof Error ? error.message : "Erro ao processar pagamento");
    } finally {
      setLoading(false);
    }
  };

  // Inicia verificação de pagamento PIX
  const handlePixPaid = async () => {
    setPaymentStatus('processing');
    setPaymentMessage("Verificando pagamento PIX...");
    
    // Inicia polling para verificar o status
    const interval = setInterval(async () => {
      try {
        const status = await checkPixPaymentStatus(pixTransactionId);
        
        if (status.status === 'success') {
          setPaymentStatus('success');
          setPaymentMessage(status.message);
          setShowSuccessDialog(true);
          clearInterval(interval);
        } else if (status.status === 'failed') {
          setPaymentStatus('failed');
          setPaymentMessage(status.message);
          clearInterval(interval);
        } else {
          setPaymentMessage(status.message);
        }
      } catch (error) {
        setPaymentStatus('failed');
        setPaymentMessage("Erro ao verificar pagamento");
        clearInterval(interval);
      }
    }, 5000); // Verifica a cada 5 segundos

    setPixPollingInterval(interval);
  };

  // Função para gerar o pagamento PIX quando selecionado
  const handlePixSelection = async () => {
    if (!selectedPlan) return;

    setPaymentStatus('processing');
    setPaymentMessage("Gerando pagamento PIX...");

    try {
      const totalAmount = getTotalPrice();
      console.log('Gerando PIX para valor:', totalAmount);
      
      const pixPayment = await createPixPayment(totalAmount, selectedPlan);
      console.log('Resposta do PIX:', pixPayment);
      
      setPixTransactionId(pixPayment.transactionId);
      setPixCode(pixPayment.pixCode);
      setPixQrCode(pixPayment.qrCode);
      
      console.log('PIX Code definido:', pixPayment.pixCode);
      console.log('PIX Code length:', pixPayment.pixCode?.length);
      
      setPaymentStatus('pending');
      setPaymentMessage("Pagamento PIX gerado. Escaneie o QR Code ou copie o código.");
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      setPaymentStatus('failed');
      setPaymentMessage(error instanceof Error ? error.message : "Erro ao gerar pagamento PIX");
    }
  };

  // Limpa o polling quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (pixPollingInterval) {
        clearInterval(pixPollingInterval);
      }
    };
  }, [pixPollingInterval]);

  const handleBillingCycleChange = (
    _: React.MouseEvent<HTMLElement>,
    newVal: 'mensal' | 'anual' | null
  ) => {
    if (newVal && selectedPlan) {
      setBillingCycle(newVal);
      // Atualiza o plano selecionado com o novo ciclo
      const plan = plans.find(p => p.title === selectedPlan.title);
      if (plan) {
        // Atualiza o selectedPlan com o novo ciclo de cobrança
        setSelectedPlan({
          ...selectedPlan,
          billingCycle: newVal,
        });
      }
    }
  };

  const getTotalPrice = () => {
    const monthlyPrice = billingCycle === 'anual' ? selectedPlan.price : selectedPlan.oldPrice;
    return billingCycle === 'anual' ? monthlyPrice * 12 : monthlyPrice;
  };

  const handleSuccessDialogClose = () => {
    setShowSuccessDialog(false);
    // Redireciona para a aba de histórico ou dashboard
    // Aqui você pode adicionar lógica para redirecionar o usuário
  };

  const getStatusColor = (status: PaymentStatus) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'failed':
        return 'error';
      case 'processing':
        return 'info';
      default:
        return 'warning';
    }
  };

  return (
    <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
      {/* Botão Voltar */}
      <Button 
        startIcon={<ArrowBackIcon />}
        onClick={onBackToPlans}
        sx={{ mb: 3 }}
      >
        Voltar aos Planos
      </Button>

      {/* Alert de Status do Pagamento */}
      {paymentStatus !== 'pending' && (
        <Alert 
          severity={getStatusColor(paymentStatus)} 
          sx={{ mb: 3 }}
          action={
            paymentStatus === 'processing' && (
              <CircularProgress size={20} />
            )
          }
        >
          {paymentMessage}
        </Alert>
      )}

      <Grid container spacing={4}>
        {/* Coluna da Esquerda - Detalhes do Plano */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 3, height: 'fit-content' }}>
            <Typography variant="h6" gutterBottom>
              Resumo do Plano
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight="bold" color="primary">
                {selectedPlan.title}
              </Typography>
            </Box>

            {/* Toggle Mensal / Anual */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" gutterBottom>
                Ciclo de Cobrança:
              </Typography>
              <ToggleButtonGroup
                value={billingCycle}
                exclusive
                onChange={handleBillingCycleChange}
                size="small"
                fullWidth
                disabled={paymentStatus === 'processing'}
                sx={{
                  '& .MuiToggleButton-root': {
                    color: 'grey.600',
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

            <Divider sx={{ my: 2 }} />

            {/* Preços */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Preço por mês:
              </Typography>
              <Box display="flex" alignItems="baseline" flexWrap="wrap">
                {billingCycle === 'anual' && (
                  <Typography
                    sx={{
                      textDecoration: 'line-through',
                      color: 'grey.500',
                      mr: 1,
                    }}
                  >
                    R$ {selectedPlan.oldPrice}
                  </Typography>
                )}
                <Typography variant="h4" color="primary" fontWeight="bold">
                  R$ {billingCycle === 'anual' ? selectedPlan.price : selectedPlan.oldPrice}
                </Typography>
              </Box>
              
              {billingCycle === 'anual' && (
                <Typography variant="body2" color="success.main" sx={{ mt: 1 }}>
                  {calculateDiscount(selectedPlan.oldPrice, selectedPlan.price)}% de desconto
                </Typography>
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Total */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Total a pagar:
              </Typography>
              <Typography variant="h5" fontWeight="bold" color="primary">
                R$ {getTotalPrice().toFixed(2)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {billingCycle === 'anual' ? 'por ano' : 'por mês'}
              </Typography>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Features */}
            <Box>
              <Typography variant="body2" gutterBottom>
                Incluso no plano:
              </Typography>
              {selectedPlan.features.map((feature, index) => (
                <Box key={index} display="flex" alignItems="center" mb={1}>
                  <CheckCircleIcon
                    fontSize="small"
                    sx={{ color: NEON, mr: 1 }}
                  />
                  <Typography variant="body2">{feature}</Typography>
                </Box>
              ))}
            </Box>
          </Card>
        </Grid>

        {/* Coluna da Direita - Formulário de Pagamento */}
        <Grid item xs={12} md={8}>
          <Card sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Método de Pagamento
            </Typography>

            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                display: "flex",
                flexDirection: "column",
                gap: 3,
              }}
            >
              {/* Escolha do método */}
              <FormLabel>Escolha o método de pagamento:</FormLabel>
              <RadioGroup
                row
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as "card" | "pix")}
              >
                <FormControlLabel 
                  value="card" 
                  control={<Radio disabled={paymentStatus === 'processing'} />} 
                  label="Cartão de Crédito" 
                />
                <FormControlLabel 
                  value="pix" 
                  control={<Radio disabled={paymentStatus === 'processing'} />} 
                  label="PIX" 
                />
              </RadioGroup>

              {/* --------------------------------------------------------- */}
              {/* Cartão de Crédito */}
              {/* --------------------------------------------------------- */}
              {paymentType === "card" && (
                <Stack spacing={2}>
                  <TextField
                    label="Nome no cartão"
                    variant="outlined"
                    fullWidth
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    required
                    disabled={paymentStatus === 'processing'}
                  />
                  <StripeField>
                    <CardNumberElement options={CARD_ELEMENT_OPTIONS} />
                  </StripeField>

                  <Stack direction="row" spacing={2}>
                    <StripeField style={{ flex: 1 }}>
                      <CardExpiryElement options={CARD_ELEMENT_OPTIONS} />
                    </StripeField>
                    <StripeField style={{ width: 120 }}>
                      <CardCvcElement options={CARD_ELEMENT_OPTIONS} />
                    </StripeField>
                  </Stack>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading || paymentStatus === 'processing'}
                    sx={{ py: 1.5 }}
                    startIcon={loading ? <CircularProgress size={20} /> : <PaymentIcon />}
                  >
                    {loading ? "Processando..." : `Pagar R$ ${getTotalPrice().toFixed(2)}`}
                  </Button>
                </Stack>
              )}

              {/* --------------------------------------------------------- */}
              {/* Pix */}
              {/* --------------------------------------------------------- */}
              {paymentType === "pix" && (
                <Stack spacing={3} alignItems="center">
                  {!pixCode ? (
                    // Botão para gerar PIX
                    <Button
                      variant="contained"
                      onClick={handlePixSelection}
                      disabled={paymentStatus === 'processing'}
                      sx={{ py: 1.5 }}
                      startIcon={paymentStatus === 'processing' ? <CircularProgress size={20} /> : <PaymentIcon />}
                    >
                      {paymentStatus === 'processing' ? "Gerando PIX..." : "Gerar Pagamento PIX"}
                    </Button>
                  ) : (
                    // Exibe QR Code e código PIX
                    <>
                      <Typography variant="h6" textAlign="center">
                        Escaneie o QR Code ou copie o código Pix
                      </Typography>

                      {/* QR Code */}
                      <Box
                        sx={{
                          p: 2,
                          border: "1px solid #e0e0e0",
                          borderRadius: 2,
                          bgcolor: "white",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          minHeight: 200,
                        }}
                      >
                        {pixCode && pixCode.length > 0 ? (
                          <div style={{ position: 'relative' }}>
                            <QRCodeSVG 
                              value={pixCode} 
                              size={200}
                              level="M"
                              includeMargin={true}
                              onError={(error) => {
                                console.error('Erro no QR Code:', error);
                              }}
                            />
                            <Typography 
                              variant="caption" 
                              sx={{ 
                                position: 'absolute', 
                                bottom: -20, 
                                left: '50%', 
                                transform: 'translateX(-50%)',
                                color: 'text.secondary'
                              }}
                            >
                              Escaneie com seu app bancário
                            </Typography>
                          </div>
                        ) : (
                          <Typography color="error">
                            Erro ao gerar QR Code
                          </Typography>
                        )}
                      </Box>

                      {/* Código Pix */}
                      <Box sx={{ width: "100%" }}>
                        <Typography variant="body2" gutterBottom>
                          Código Pix:
                        </Typography>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            p: 1,
                            border: "1px solid #e0e0e0",
                            borderRadius: 1,
                            bgcolor: "#f5f5f5",
                            fontFamily: "monospace",
                            fontSize: "0.875rem",
                            wordBreak: "break-all",
                          }}
                        >
                          <Typography
                            component="span"
                            sx={{ flex: 1, fontFamily: "monospace" }}
                          >
                            {pixCode}
                          </Typography>
                          <Tooltip title="Copiar código">
                            <IconButton
                              size="small"
                              onClick={() => navigator.clipboard.writeText(pixCode)}
                              disabled={paymentStatus === 'processing'}
                            >
                              <ContentCopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </Box>

                      <Button
                        variant="contained"
                        onClick={handlePixPaid}
                        disabled={paymentStatus === 'processing'}
                        sx={{ py: 1.5 }}
                        startIcon={paymentStatus === 'processing' ? <CircularProgress size={20} /> : <PaymentIcon />}
                      >
                        {paymentStatus === 'processing' ? "Verificando Pagamento..." : "Já Paguei via Pix"}
                      </Button>
                    </>
                  )}
                </Stack>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Dialog de Sucesso */}
      <Dialog
        open={showSuccessDialog}
        onClose={handleSuccessDialogClose}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ textAlign: 'center' }}>
          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 60, mb: 2 }} />
          <Typography variant="h5" color="success.main">
            Pagamento Confirmado!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" textAlign="center" gutterBottom>
            Seu pagamento foi processado com sucesso.
          </Typography>
          <Typography variant="body2" textAlign="center" color="text.secondary">
            Plano: {selectedPlan.title}<br />
            Valor: R$ {getTotalPrice().toFixed(2)}<br />
            Ciclo: {billingCycle === 'anual' ? 'Anual' : 'Mensal'}
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button 
            variant="contained" 
            onClick={handleSuccessDialogClose}
            size="large"
          >
            Continuar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

/* -------------------------------------------------------------------------- */
/*                              Tab 3: Histórico                              */
/* -------------------------------------------------------------------------- */
const PaymentHistory: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: planHistory, isLoading, error } = useGetUserPlanHistoryQuery(user?.id || '', { 
    skip: !user?.id 
  });

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'new':
        return 'success';
      case 'upgrade':
        return 'primary';
      case 'downgrade':
        return 'warning';
      case 'cancelled':
        return 'error';
      default:
        return 'default';
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case 'new':
        return 'Nova Adesão';
      case 'upgrade':
        return 'Upgrade';
      case 'downgrade':
        return 'Downgrade';
      case 'cancelled':
        return 'Cancelamento';
      default:
        return changeType;
    }
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'new':
        return '🎉';
      case 'upgrade':
        return '⬆️';
      case 'downgrade':
        return '⬇️';
      case 'cancelled':
        return '❌';
      default:
        return '📋';
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">
          Erro ao carregar histórico de planos: {error ? 'Erro desconhecido' : 'Erro desconhecido'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        <HistoryIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Histórico de Planos
      </Typography>
      
      {!planHistory || planHistory.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Nenhum histórico de plano encontrado
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Seu histórico de mudanças de plano aparecerá aqui quando você fizer alterações
          </Typography>
        </Card>
      ) : (
        <Stack spacing={2}>
          {planHistory.map((entry: PlanHistoryEntry) => (
            <Card key={entry.id} sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Typography variant="h4" sx={{ fontSize: '2rem' }}>
                    {getChangeTypeIcon(entry.changeType)}
                  </Typography>
                  <Box>
                    <Typography variant="h6" fontWeight="bold">
                      {entry.planName}
                    </Typography>
                    <Chip 
                      label={getChangeTypeLabel(entry.changeType)}
                      color={getChangeTypeColor(entry.changeType)}
                      size="small"
                    />
                  </Box>
                </Box>
                <Box sx={{ textAlign: 'right' }}>
                  <Typography variant="h6" fontWeight="bold" color="primary.main">
                    R$ {entry.price.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {entry.billingCycle === 'mensal' ? 'Mensal' : 'Anual'}
                  </Typography>
                </Box>
              </Box>
              
              <Divider sx={{ my: 2 }} />
              
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="body2" color="text.secondary">
                    Data da Mudança
                  </Typography>
                  <Typography variant="body1" fontWeight="medium">
                    {new Date(entry.date).toLocaleDateString('pt-BR', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Typography>
                </Grid>
                
                {entry.oldPlan && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="text.secondary">
                      Plano Anterior
                    </Typography>
                    <Typography variant="body1" fontWeight="medium">
                      {entry.oldPlan}
                    </Typography>
                  </Grid>
                )}
                
                <Grid item xs={12}>
                  <Box sx={{ 
                    p: 2, 
                    bgcolor: 'background.default', 
                    borderRadius: 1,
                    border: 1,
                    borderColor: 'divider'
                  }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Detalhes da Mudança
                    </Typography>
                    <Typography variant="body1">
                      {entry.changeType === 'new' && `Nova adesão ao plano ${entry.planName}`}
                      {entry.changeType === 'upgrade' && `Upgrade do plano ${entry.oldPlan} para ${entry.planName}`}
                      {entry.changeType === 'downgrade' && `Downgrade do plano ${entry.oldPlan} para ${entry.planName}`}
                      {entry.changeType === 'cancelled' && `Cancelamento do plano ${entry.oldPlan}`}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          ))}
        </Stack>
      )}
    </Box>
  );
};

export default PaymentTab;
