import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Tabs,
  Tab,
  Box,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Pagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import type { Challenge, UserStats, ChallengeStatus, ChallengeType } from '../../types/challenge';
import challengeAPI from '../../services/challengeAPI';
import CreateChallengeDialog from './CreateChallengeDialog';
import ChallengeCard from './ChallengeCard';
import UserStatsCard from './UserStatsCard';
import LeaderboardCard from './LeaderboardCard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`challenge-tabpanel-${index}`}
      aria-labelledby={`challenge-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Challenge = () => {
  const navigate = useNavigate();
  const currentUserId = useSelector((state: RootState) => state.auth.user?.id || '');
  
  console.log('🎯 Componente Challenge renderizado!');
  console.log('👤 Current User ID:', currentUserId);
  
  const [tabValue, setTabValue] = useState(0);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userChallenges, setUserChallenges] = useState<Challenge[]>([]);
  const [activeChallenges, setActiveChallenges] = useState<Challenge[]>([]);
  const [availableUsers, setAvailableUsers] = useState<UserStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [challengesPerPage, setChallengesPerPage] = useState(12);
  const [statusFilter, setStatusFilter] = useState<string>('all'); // 'all', 'win', 'loss', 'rejected', 'cancelled', 'expired'

  useEffect(() => {
    loadData();
    
    // Verificar desafios expirados a cada 5 minutos
    const interval = setInterval(() => {
      checkExpiredChallenges();
    }, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentUserId, searchTerm]);

  const loadData = async () => {
    if (!currentUserId) return;
    
    try {
      setLoading(true);
      setError(null);

      const [stats, challenges, active, users] = await Promise.all([
        challengeAPI.getUserStats(currentUserId),
        challengeAPI.getUserChallenges(currentUserId),
        challengeAPI.getActiveChallenges(),
        challengeAPI.getAvailableUsers(currentUserId, searchTerm)
      ]);

      setUserStats(stats);
      setUserChallenges(challenges);
      setActiveChallenges(active);
      setAvailableUsers(users);
    } catch (err) {
      setError('Erro ao carregar dados dos desafios');
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const checkExpiredChallenges = async () => {
    try {
      await challengeAPI.checkExpiredChallenges();
      // Recarregar dados após verificar expiração
      await loadData();
    } catch (err) {
      console.error('Erro ao verificar desafios expirados:', err);
    }
  };

  const handleCreateChallenge = async (challengeData: any) => {
    try {
      // Adicionar o ID do usuário atual como desafiante
      const challengeDataWithChallenger = {
        ...challengeData,
        challengerId: currentUserId
      };
      
      const newChallenge = await challengeAPI.createChallenge(challengeDataWithChallenger);
      setUserChallenges(prev => [newChallenge, ...prev]);
      setCreateDialogOpen(false);
    } catch (err) {
      setError('Erro ao criar desafio');
      console.error('Erro ao criar desafio:', err);
    }
  };

  const handleRespondToChallenge = async (challengeId: string, accept: boolean) => {
    console.log('🔄 handleRespondToChallenge chamado:', { challengeId, accept });
    try {
      console.log('⏳ Chamando challengeAPI.respondToChallenge...');
      
      // Adicionar timeout mais longo (30 segundos) pois o backend pode estar processando muitas coisas
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout: A resposta do servidor demorou muito')), 30000)
      );
      
      const apiPromise = challengeAPI.respondToChallenge(challengeId, { accept });
      const updatedChallenge = await Promise.race([apiPromise, timeoutPromise]) as any;
      
      console.log('✅ Resposta recebida:', updatedChallenge);
      
      setUserChallenges(prev => 
        prev.map(c => c.id === challengeId ? updatedChallenge : c)
      );
      
      if (accept) {
        setActiveChallenges(prev => [updatedChallenge, ...prev]);
      }
      
      console.log('✅ Estados atualizados');
      
      // Recarregar dados em background (sem bloquear)
      loadData().catch(err => {
        console.error('Erro ao recarregar dados após resposta:', err);
      });
      
      console.log('✅ handleRespondToChallenge concluído com sucesso');
    } catch (err) {
      console.error('❌ Erro em handleRespondToChallenge:', err);
      setError('Erro ao responder ao desafio');
      throw err; // Re-throw para que o ChallengeCard possa tratar o erro
    }
  };

  const handleFinalizeChallenge = async (challengeId: string) => {
    try {
      const finalizedChallenge = await challengeAPI.finalizeChallenge(challengeId);
      
      setUserChallenges(prev => 
        prev.map(c => c.id === challengeId ? finalizedChallenge : c)
      );
      
      setActiveChallenges(prev => 
        prev.filter(c => c.id !== challengeId)
      );
      
      // Recarregar estatísticas do usuário
      const updatedStats = await challengeAPI.getUserStats(currentUserId);
      setUserStats(updatedStats);
    } catch (err) {
      setError('Erro ao finalizar desafio');
      console.error('Erro ao finalizar:', err);
    }
  };

  const handleCancelChallenge = async (challengeId: string) => {
    try {
      const cancelledChallenge = await challengeAPI.cancelChallenge(challengeId, currentUserId);
      
      setUserChallenges(prev => 
        prev.map(c => c.id === challengeId ? cancelledChallenge : c)
      );
      
      setActiveChallenges(prev => 
        prev.filter(c => c.id !== challengeId)
      );
    } catch (err) {
      setError('Erro ao cancelar desafio');
      console.error('Erro ao cancelar:', err);
    }
  };

  const handleViewHistory = (challengeId: string) => {
    // Navegar para a página de histórico de trades do desafio
    navigate(`/home/challenge/${challengeId}/history`);
  };

  const handleGoToTrade = (challengeId: string) => {
    // Navegar para a página de trading dedicada do desafio
    navigate(`/home/challenge/${challengeId}/trading`);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(1); // Resetar para primeira página ao mudar de aba
  };

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const handleStatusFilterChange = (event: SelectChangeEvent<string>) => {
    setStatusFilter(event.target.value);
    setPage(1); // Resetar para primeira página ao mudar filtro
  };

  const handleItemsPerPageChange = (event: SelectChangeEvent<number>) => {
    setChallengesPerPage(event.target.value as number);
    setPage(1); // Resetar para primeira página ao mudar itens por página
  };

  // Função auxiliar para determinar o status do desafio do ponto de vista do usuário
  const getChallengeStatusForUser = (challenge: Challenge): string => {
    // Verificar se foi rejeitado
    if (challenge.status === 'cancelled') {
      const now = new Date();
      const [hours, minutes] = challenge.startTime.split(':').map(Number);
      const startDateStr = challenge.startDate instanceof Date 
        ? challenge.startDate.toISOString().split('T')[0]
        : String(challenge.startDate).split('T')[0];
      const [year, month, day] = startDateStr.split('-').map(Number);
      const startDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
      
      // Se passou do horário de início, foi expirado
      if (now.getTime() >= startDateTime.getTime()) {
        return 'expired';
      }
      
      // Se não passou e o usuário atual é o desafiante, foi rejeitado
      if (challenge.challenger.id === currentUserId) {
        return 'rejected';
      }
      
      // Caso contrário, foi cancelado pelo desafiante
      return 'cancelled';
    }
    
    // Verificar se foi concluído e determinar vencedor/perdedor
    if (challenge.status === 'completed') {
      // Se há um winner definido
      if (challenge.winner) {
        if (challenge.winner.id === currentUserId) return 'win';
        if (challenge.loser?.id === currentUserId) return 'loss';
        return 'tie';
      }
      
      // Se não há winner mas há retornos, comparar
      if (challenge.challengerReturn !== undefined && challenge.challengedReturn !== undefined) {
        const isChallenger = challenge.challenger.id === currentUserId;
        const challengerReturn = challenge.challengerReturn || 0;
        const challengedReturn = challenge.challengedReturn || 0;
        
        if (isChallenger) {
          if (challengerReturn > challengedReturn) return 'win';
          if (challengedReturn > challengerReturn) return 'loss';
          return 'tie';
        } else {
          if (challengedReturn > challengerReturn) return 'win';
          if (challengerReturn > challengedReturn) return 'loss';
          return 'tie';
        }
      }
    }
    
    return 'other';
  };

  // Filtrar desafios baseado no status selecionado
  const getFilteredChallenges = () => {
    if (statusFilter === 'all') {
      return userChallenges;
    }
    
    return userChallenges.filter(challenge => {
      const challengeStatus = getChallengeStatusForUser(challenge);
      return challengeStatus === statusFilter;
    });
  };

  // Calcular desafios para a página atual
  const getPaginatedChallenges = () => {
    const filtered = getFilteredChallenges();
    const startIndex = (page - 1) * challengesPerPage;
    const endIndex = startIndex + challengesPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const filteredChallenges = getFilteredChallenges();
  const totalPages = Math.ceil(filteredChallenges.length / challengesPerPage);
  const paginatedChallenges = getPaginatedChallenges();
  const startIndex = (page - 1) * challengesPerPage + 1;
  const endIndex = Math.min(page * challengesPerPage, filteredChallenges.length);

  if (loading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ pt: 3 }}>
      <Grid container spacing={3}>
        {/* Header com estatísticas do usuário */}
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h4" gutterBottom fontWeight="bold" color="primary">
              Arena de Desafios
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Desafie outros traders e prove suas habilidades! Cada usuário começa com 1000 tokens.
            </Typography>
            
            {userStats && <UserStatsCard userStats={userStats} />}
          </Paper>
        </Grid>

        {/* Ranking dos Top 10 */}
        <Grid item xs={12} md={4}>
          <LeaderboardCard />
        </Grid>

        {/* Alertas */}
        {error && (
          <Grid item xs={12}>
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          </Grid>
        )}

        {/* Tabs */}
        <Grid item xs={12}>
          <Paper elevation={2}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabValue} onChange={handleTabChange} aria-label="challenge tabs">
                <Tab label="Meus Desafios" />
                <Tab label="Desafios Ativos" />
                <Tab label="Criar Desafio" />
              </Tabs>
            </Box>

            {/* Tab 1: Meus Desafios */}
            <TabPanel value={tabValue} index={0}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={3} flexWrap="wrap" gap={2}>
                <Typography variant="h6">Meus Desafios</Typography>
                <Button 
                  variant="contained" 
                  onClick={() => setCreateDialogOpen(true)}
                  color="primary"
                >
                  Novo Desafio
                </Button>
              </Box>

              {userChallenges.length === 0 ? (
                <Alert severity="info">
                  Você ainda não tem desafios. Crie um novo desafio para começar!
                </Alert>
              ) : (
                <>
                  {/* Filtros */}
                  <Box display="flex" gap={2} mb={3} flexWrap="wrap" alignItems="center">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                      <InputLabel>Filtrar por Status</InputLabel>
                      <Select
                        value={statusFilter}
                        label="Filtrar por Status"
                        onChange={handleStatusFilterChange}
                      >
                        <MenuItem value="all">Todos</MenuItem>
                        <MenuItem value="win">Vencedores</MenuItem>
                        <MenuItem value="loss">Perdedores</MenuItem>
                        <MenuItem value="rejected">Rejeitados</MenuItem>
                        <MenuItem value="cancelled">Cancelados</MenuItem>
                        <MenuItem value="expired">Expirados</MenuItem>
                      </Select>
                    </FormControl>
                    
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                      <InputLabel>Itens por Página</InputLabel>
                      <Select
                        value={challengesPerPage}
                        label="Itens por Página"
                        onChange={handleItemsPerPageChange}
                      >
                        <MenuItem value={8}>8</MenuItem>
                        <MenuItem value={12}>12</MenuItem>
                        <MenuItem value={16}>16</MenuItem>
                        <MenuItem value={20}>20</MenuItem>
                        <MenuItem value={24}>24</MenuItem>
                      </Select>
                    </FormControl>

                    <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
                      {filteredChallenges.length} desafio{filteredChallenges.length !== 1 ? 's' : ''} encontrado{filteredChallenges.length !== 1 ? 's' : ''}
                    </Typography>
                  </Box>

                  {/* Indicador de paginação */}
                  {totalPages > 1 && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2" color="text.secondary">
                        Mostrando {startIndex}-{endIndex} de {filteredChallenges.length} desafios
                      </Typography>
                    </Box>
                  )}

                  {filteredChallenges.length === 0 ? (
                    <Alert severity="info">
                      Nenhum desafio encontrado com o filtro selecionado.
                    </Alert>
                  ) : (
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: {
                          xs: '1fr',
                          sm: 'repeat(2, 1fr)',
                          md: 'repeat(4, 1fr)',
                        },
                        gap: 2,
                      }}
                    >
                    {paginatedChallenges.map((challenge) => (
                      <Box key={challenge.id} sx={{ display: 'flex', minWidth: 0, maxWidth: '100%' }}>
                        <ChallengeCard
                          challenge={challenge}
                          currentUserId={currentUserId}
                          onRespond={handleRespondToChallenge}
                          onFinalize={handleFinalizeChallenge}
                          onCancel={handleCancelChallenge}
                          onViewHistory={handleViewHistory}
                          onGoToTrade={handleGoToTrade}
                        />
                      </Box>
                    ))}
                    </Box>
                  )}

                  {/* Controles de paginação */}
                  {totalPages > 1 && (
                    <Box display="flex" justifyContent="center" mt={3}>
                      <Pagination
                        count={totalPages}
                        page={page}
                        onChange={handlePageChange}
                        color="primary"
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  )}
                </>
              )}
            </TabPanel>

            {/* Tab 2: Desafios Ativos */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" gutterBottom>
                Desafios Ativos na Plataforma
              </Typography>

              {activeChallenges.length === 0 ? (
                <Alert severity="info">
                  Não há desafios ativos no momento. Seja o primeiro a criar um!
                </Alert>
              ) : (
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: {
                      xs: '1fr',
                      sm: 'repeat(2, 1fr)',
                      md: 'repeat(4, 1fr)',
                    },
                    gap: 2,
                  }}
                >
                  {activeChallenges.map((challenge) => (
                    <Box key={challenge.id} sx={{ display: 'flex', minWidth: 0, maxWidth: '100%' }}>
                      <ChallengeCard
                        challenge={challenge}
                        currentUserId={currentUserId}
                        onRespond={handleRespondToChallenge}
                        onFinalize={handleFinalizeChallenge}
                        onCancel={handleCancelChallenge}
                        onViewHistory={handleViewHistory}
                        onGoToTrade={handleGoToTrade}
                        readOnly
                      />
                    </Box>
                  ))}
                </Box>
              )}
            </TabPanel>

            {/* Tab 3: Criar Desafio */}
            <TabPanel value={tabValue} index={2}>
              <Box textAlign="center" py={4}>
                <Typography variant="h6" gutterBottom>
                  Criar Novo Desafio
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                  Desafie outro usuário para uma competição de trading!
                </Typography>
                <Button 
                  variant="contained" 
                  size="large"
                  onClick={() => setCreateDialogOpen(true)}
                  color="primary"
                >
                  Criar Desafio
                </Button>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialog para criar desafio */}
      <CreateChallengeDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onCreate={handleCreateChallenge}
        availableUsers={availableUsers}
        userStats={userStats}
        onSearch={(term: string) => setSearchTerm(term)}
      />
    </Container>
  );
};

export default Challenge;

// Exportações adicionais
export { default as FullRankingPage } from './FullRankingPage';
export { default as ChallengeHistoryPage } from './ChallengeHistoryPage';
