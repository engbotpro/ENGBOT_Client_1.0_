import React, { useState, useEffect, useMemo } from 'react';
import {
  Paper,
  Tabs,
  Tab,
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
} from '@mui/material';
import {
  Calculate as CalculateIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountBalanceIcon,
  Savings as SavingsIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import CompoundInterest from './CompoundInterest';
import FinancialIndependence from './FinancialIndependence';
import ProfitPlan from './ProfitPlan';
import SpendingPlan from './SpendingPlan';

const Calculate: React.FC = () => {
  const user = useSelector((state: RootState) => state.auth.user);

  // Função para verificar se o usuário tem plano ativo
  const hasActivePlan = useMemo(() => {
    if (!user?.currentPlan) return false;
    
    // Se não tem data de expiração, considera como plano ativo (plano permanente ou sem expiração)
    if (!user.planExpiresAt) return true;
    
    // Verifica se a data de expiração ainda não passou
    const expirationDate = new Date(user.planExpiresAt);
    const now = new Date();
    return expirationDate > now;
  }, [user?.currentPlan, user?.planExpiresAt]);

  // Configuração completa de todas as abas
  const allTabConfig = [
    {
      label: 'Capital Total',
      icon: <CalculateIcon />,
      component: <ProfitPlan />,
      description: 'Simule investimentos e projete seus lucros futuros',
      requiresPlan: true
    },
    {
      label: 'Planejamento Financeiro',
      icon: <AccountBalanceIcon />,
      component: <SpendingPlan />,
      description: 'Organize suas receitas e despesas com planejamento personalizado',
      requiresPlan: false
    },
    {
      label: 'Juros Compostos',
      icon: <TrendingUpIcon />,
      component: <CompoundInterest />,
      description: 'Calcule o crescimento do seu investimento com juros compostos',
      requiresPlan: false
    },
    {
      label: 'Independência Financeira',
      icon: <SavingsIcon />,
      component: <FinancialIndependence />,
      description: 'Planeje sua independência financeira com aportes regulares',
      requiresPlan: false
    },
    
   
  ];

  // Filtra as abas baseado no plano do usuário
  const tabConfig = useMemo(() => {
    return allTabConfig.filter(tab => !tab.requiresPlan || hasActivePlan);
  }, [hasActivePlan]);

  // Função para calcular o índice inicial da aba salva
  // Esta função é chamada durante a inicialização, então não pode depender de tabConfig
  const getInitialTab = (): number => {
    if (typeof window === 'undefined') return 0;
    
    // Primeiro, tenta carregar pelo label (mais confiável)
    const savedTabLabel = window.localStorage.getItem('CalculateTabLabel');
    console.log('🔵 [Calculate] Inicializando. Label salvo:', savedTabLabel);
    
    if (savedTabLabel) {
      // Encontra o índice no array completo
      const fullIndex = allTabConfig.findIndex(tab => tab.label === savedTabLabel);
      console.log('🔵 [Calculate] Índice no array completo:', fullIndex);
      
      if (fullIndex >= 0) {
        // Verifica se a aba requer plano
        const tabRequiresPlan = allTabConfig[fullIndex].requiresPlan;
        
        // Se requer plano mas usuário não tem, retorna 0
        if (tabRequiresPlan && !hasActivePlan) {
          console.log('🔵 [Calculate] ⚠️ Aba salva requer plano, redirecionando para primeira aba');
          return 0;
        }
        
        // Calcula o índice nas abas filtradas manualmente
        let availableIndex = 0;
        for (let i = 0; i <= fullIndex; i++) {
          if (!allTabConfig[i].requiresPlan || hasActivePlan) {
            if (i === fullIndex) {
              console.log('🔵 [Calculate] ✅ Usando aba salva:', savedTabLabel, 'índice calculado:', availableIndex);
              return availableIndex;
            }
            availableIndex++;
          }
        }
      }
    }
    
    // Fallback: tenta usar o índice salvo (para compatibilidade com versões antigas)
    const savedTabIndex = window.localStorage.getItem('CalculateTab');
    console.log('🔵 [Calculate] Índice salvo (fallback):', savedTabIndex);
    
    if (savedTabIndex !== null) {
      const savedIndex = Number(savedTabIndex);
      // Se o índice salvo é 3 (Planejamento de Lucro) e requer plano mas usuário não tem
      if (savedIndex === 3 && allTabConfig[3].requiresPlan && !hasActivePlan) {
        console.log('🔵 [Calculate] ⚠️ Índice 3 requer plano, redirecionando para primeira aba');
        return 0;
      }
      
      // Calcula quantas abas estão disponíveis antes do índice salvo
      let availableCount = 0;
      for (let i = 0; i < savedIndex && i < allTabConfig.length; i++) {
        if (!allTabConfig[i].requiresPlan || hasActivePlan) {
          availableCount++;
        }
      }
      
      // Se o índice salvo está dentro do range disponível
      if (savedIndex < allTabConfig.length && (!allTabConfig[savedIndex].requiresPlan || hasActivePlan)) {
        console.log('🔵 [Calculate] ✅ Usando índice salvo:', savedIndex, 'índice calculado:', availableCount);
        return availableCount;
      }
    }
    
    console.log('🔵 [Calculate] ⚠️ Nenhuma aba salva encontrada, usando primeira aba (0)');
    return 0;
  };

  // Inicializa o estado com a aba salva
  const [tab, setTab] = useState<number>(getInitialTab);
  const [isChangingTab, setIsChangingTab] = useState(false);

  // Ajusta o índice da aba quando as abas disponíveis mudam (ex: quando plano é ativado/desativado)
  // Usa useLayoutEffect para executar antes da renderização visual
  useEffect(() => {
    console.log('🔵 [Calculate] useEffect executado. tabConfig.length:', tabConfig.length, 'hasActivePlan:', hasActivePlan, 'tab atual:', tab);
    
    // Primeiro, tenta carregar pelo label (mais confiável)
    const savedTabLabel = window.localStorage.getItem('CalculateTabLabel');
    console.log('🔵 [Calculate] Label salvo no localStorage:', savedTabLabel);
    
    if (savedTabLabel) {
      const availableIndex = tabConfig.findIndex(tab => tab.label === savedTabLabel);
      console.log('🔵 [Calculate] Índice encontrado nas abas filtradas:', availableIndex);
      
      if (availableIndex >= 0) {
        console.log('🔵 [Calculate] ✅ Ajustando para aba salva:', savedTabLabel, 'índice:', availableIndex);
        setTab(availableIndex);
        return;
      } else {
        console.log('🔵 [Calculate] ⚠️ Aba salva não encontrada nas abas disponíveis');
      }
    }
    
    // Fallback: tenta usar o índice salvo
    const savedTabIndex = window.localStorage.getItem('CalculateTab');
    console.log('🔵 [Calculate] Índice salvo (fallback):', savedTabIndex);
    
    if (savedTabIndex !== null) {
      const savedIndex = Number(savedTabIndex);
      if (savedIndex === 3 && !hasActivePlan) {
        console.log('🔵 [Calculate] ⚠️ Índice 3 requer plano, ajustando para primeira aba');
        setTab(0);
        window.localStorage.setItem('CalculateTab', '0');
        window.localStorage.setItem('CalculateTabLabel', tabConfig[0]?.label || '');
        return;
      }
      
      if (savedIndex >= 0 && savedIndex < tabConfig.length) {
        console.log('🔵 [Calculate] ✅ Ajustando para índice salvo:', savedIndex);
        setTab(savedIndex);
        window.localStorage.setItem('CalculateTabLabel', tabConfig[savedIndex]?.label || '');
      }
    }
  }, [hasActivePlan, tabConfig]);

  // Sempre que tab mudar, persiste no localStorage (tanto o label quanto o índice)
  useEffect(() => {
    if (tab >= 0 && tab < tabConfig.length) {
      const currentTabLabel = tabConfig[tab].label;
      console.log('🟢 [Calculate] Salvando aba:', currentTabLabel, 'índice:', tab);
      window.localStorage.setItem('CalculateTabLabel', currentTabLabel);
      window.localStorage.setItem('CalculateTab', tab.toString());
    } else {
      console.log('🟢 [Calculate] ⚠️ Tab inválido, não salvando. tab:', tab, 'tabConfig.length:', tabConfig.length);
    }
  }, [tab, tabConfig]);

  return (
    <Box sx={{ p: 3, height: '100%', overflow: 'hidden' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
        <CalculateIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Calculadora Financeira
      </Typography>

      <Card elevation={3} sx={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
        {/* Header com Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'background.paper' }}>
          <Tabs
            value={tab}
            onChange={(_, newTab) => {
              console.log('🟡 [Calculate] Usuário mudou para aba:', newTab, 'label:', tabConfig[newTab]?.label);
              setIsChangingTab(true);
              // Simula um pequeno delay para mostrar o loading (pode ser removido se não necessário)
              setTimeout(() => {
                setTab(newTab);
                setIsChangingTab(false);
              }, 300);
            }}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              '& .MuiTab-root': {
                minHeight: 64,
                fontSize: '0.9rem',
                fontWeight: 'medium',
                textTransform: 'none',
                color: 'text.secondary',
                backgroundColor: 'action.hover',
                marginRight: 1,
                borderRadius: '8px 8px 0 0',
                transition: 'all 0.3s ease',
                '&:hover': {
                  backgroundColor: 'action.selected',
                  color: 'primary.main',
                },
                '&.Mui-selected': {
                  fontWeight: 'bold',
                  color: 'primary.contrastText',
                  backgroundColor: 'primary.main',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              },
              '& .MuiTabs-indicator': {
                display: 'none', // Remove o indicador padrão já que usamos background color
              },
            }}
          >
            {tabConfig.map((config, index) => (
              <Tab
                key={index}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {config.icon}
                    {config.label}
                  </Box>
                }
                sx={{ minWidth: 'auto', px: 3 }}
              />
            ))}
          </Tabs>
        </Box>

        {/* Descrição da aba atual */}
        {tabConfig.length > 0 && tab < tabConfig.length && (
          <>
            <Box sx={{ p: 2, backgroundColor: 'background.default', borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary">
                {tabConfig[tab].description}
              </Typography>
            </Box>

            {/* Conteúdo da aba */}
            <Box sx={{ flex: 1, overflow: 'auto', position: 'relative' }}>
              {isChangingTab && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 1000,
                    backdropFilter: 'blur(2px)',
                  }}
                >
                  <CircularProgress size={60} />
                </Box>
              )}
              {tabConfig[tab].component}
            </Box>
          </>
        )}
      </Card>
    </Box>
  );
};

export default Calculate;
