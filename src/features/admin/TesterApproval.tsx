import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Alert,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Paper,
  Grid,
  Tabs,
  Tab,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { CheckCircle, Cancel, Star, BugReport, Visibility, Settings, CurrencyBitcoin } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { useGetPlatformSettingsQuery, useUpdatePlatformSettingsMutation } from '../../services/platformSettingsAPI';
import { useGetAllBitcoinTransactionsQuery, useApproveBitcoinTransactionMutation, useRejectBitcoinTransactionMutation } from '../../services/bitcoinTransactionAPI';
import useMutationAlert from '../../hooks/useMutationAlert';

interface TesterRequest {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
}

const TesterApproval: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [testerRequests, setTesterRequests] = useState<TesterRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<TesterRequest | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info', text: string } | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [bitcoinAddress, setBitcoinAddress] = useState('');

  // Verificar se é admin
  const isAdmin = user?.perfil === 'Admin';

  // Platform Settings
  const { data: platformSettings } = useGetPlatformSettingsQuery();
  const [updateSettings, updateSettingsResult] = useUpdatePlatformSettingsMutation();
  useMutationAlert(updateSettingsResult);

  // Bitcoin Transactions
  const { data: bitcoinTransactions, refetch: refetchTransactions } = useGetAllBitcoinTransactionsQuery(undefined, {
    skip: !isAdmin || activeTab !== 1,
  });
  const [approveTransaction, approveResult] = useApproveBitcoinTransactionMutation();
  const [rejectTransaction, rejectResult] = useRejectBitcoinTransactionMutation();
  useMutationAlert(approveResult);
  useMutationAlert(rejectResult);

  // Carregar solicitações de testadores
  useEffect(() => {
    const loadTesterRequests = () => {
      const stored = localStorage.getItem('testerRequests');
      if (stored) {
        const requests = JSON.parse(stored) as TesterRequest[];
        // Ordenar por data (mais recentes primeiro)
        const sorted = requests.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTesterRequests(sorted);
      }
    };

    loadTesterRequests();
    
    // Atualizar quando houver mudanças no localStorage
    const handleStorageChange = () => {
      loadTesterRequests();
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('superCreditsUpdated', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('superCreditsUpdated', handleStorageChange);
    };
  }, []);

  const handleApprove = (request: TesterRequest) => {
    if (!isAdmin || !user?.id) {
      setMessage({ type: 'error', text: 'Apenas administradores podem aprovar testadores.' });
      return;
    }

    // Atualizar status da solicitação
    const updated = testerRequests.map(r => 
      r.id === request.id 
        ? { 
            ...r, 
            status: 'approved' as const,
            approvedAt: new Date().toISOString(),
            approvedBy: user.id
          }
        : r
    );
    setTesterRequests(updated);
    localStorage.setItem('testerRequests', JSON.stringify(updated));

    // Atualizar status do usuário
    localStorage.setItem(`testerStatus_${request.userId}`, 'approved');

    // Adicionar 1 Super Crédito ao usuário
    const currentCredits = parseInt(localStorage.getItem(`superCredits_${request.userId}`) || '0');
    const newCredits = currentCredits + 1;
    localStorage.setItem(`superCredits_${request.userId}`, newCredits.toString());

    // Disparar evento para atualizar NavBar
    window.dispatchEvent(new Event('superCreditsUpdated'));

    setMessage({ 
      type: 'success', 
      text: `Testador aprovado! ${request.userName} recebeu 1 Super Crédito.` 
    });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleReject = (request: TesterRequest) => {
    if (!isAdmin || !user?.id) {
      setMessage({ type: 'error', text: 'Apenas administradores podem rejeitar testadores.' });
      return;
    }

    // Atualizar status da solicitação
    const updated = testerRequests.map(r => 
      r.id === request.id 
        ? { 
            ...r, 
            status: 'rejected' as const,
            approvedAt: new Date().toISOString(),
            approvedBy: user.id
          }
        : r
    );
    setTesterRequests(updated);
    localStorage.setItem('testerRequests', JSON.stringify(updated));

    // Remover status de testador
    localStorage.removeItem(`testerStatus_${request.userId}`);

    setMessage({ 
      type: 'info', 
      text: `Solicitação de ${request.userName} foi rejeitada.` 
    });
    setTimeout(() => setMessage(null), 5000);
  };

  // Atualizar campo Bitcoin quando settings carregarem
  useEffect(() => {
    if (platformSettings) {
      setBitcoinAddress(platformSettings.bitcoinWalletAddress || '');
    }
  }, [platformSettings]);

  // Refetch transações após aprovar/rejeitar
  useEffect(() => {
    if (approveResult.isSuccess || rejectResult.isSuccess) {
      refetchTransactions();
    }
  }, [approveResult.isSuccess, rejectResult.isSuccess, refetchTransactions]);

  const handleSaveBitcoinAddress = async () => {
    if (!user?.id) {
      setMessage({ type: 'error', text: 'Você precisa estar logado para salvar configurações.' });
      return;
    }
    
    try {
      await updateSettings({ bitcoinWalletAddress: bitcoinAddress }).unwrap();
      setMessage({ type: 'success', text: 'Endereço Bitcoin salvo com sucesso!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error: any) {
      // Erro já será mostrado pelo useMutationAlert
      console.error('Erro ao salvar endereço Bitcoin:', error);
    }
  };

  const handleApproveBitcoin = async (id: string) => {
    await approveTransaction(id);
  };

  const handleRejectBitcoin = async (id: string) => {
    await rejectTransaction({ id });
  };

  const pendingRequests = testerRequests.filter(r => r.status === 'pending');
  const approvedRequests = testerRequests.filter(r => r.status === 'approved');
  const rejectedRequests = testerRequests.filter(r => r.status === 'rejected');
  
  const pendingBitcoinTransactions = bitcoinTransactions?.filter(t => t.status === 'pending') || [];

  if (!isAdmin) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">
          Acesso negado. Apenas administradores podem acessar esta página.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" sx={{ mb: 4 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <BugReport color="warning" />
          Painel Administrativo
        </Box>
      </Typography>

      <Tabs value={activeTab} onChange={(e, newValue) => setActiveTab(newValue)} sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Testadores" icon={<BugReport />} iconPosition="start" />
        <Tab label="Configurações" icon={<Settings />} iconPosition="start" />
      </Tabs>

      {/* Aba Testadores */}
      {activeTab === 0 && (
        <>

      {message && (
        <Alert severity={message.type} sx={{ mb: 3 }} onClose={() => setMessage(null)}>
          {message.text}
        </Alert>
      )}

      {/* Estatísticas */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="warning.main">
                {pendingRequests.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pendentes
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="success.main">
                {approvedRequests.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Aprovados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="error.main">
                {rejectedRequests.length}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Rejeitados
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Solicitações Pendentes */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom fontWeight="bold">
          Solicitações Pendentes ({pendingRequests.length})
        </Typography>
        {pendingRequests.length === 0 ? (
          <Alert severity="info">Nenhuma solicitação pendente no momento.</Alert>
        ) : (
          pendingRequests.map((request) => (
            <Card key={request.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {request.userName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {request.userEmail}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Solicitado em: {new Date(request.createdAt).toLocaleString('pt-BR')}
                    </Typography>
                  </Box>
                  <Chip 
                    label="Pendente" 
                    color="warning" 
                    icon={<BugReport />}
                  />
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" paragraph sx={{ whiteSpace: 'pre-wrap', mb: 2 }}>
                  <strong>Descrição do Teste e Problema:</strong>
                </Typography>
                <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {request.description}
                  </Typography>
                </Paper>

                <Box display="flex" gap={2}>
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<CheckCircle />}
                    onClick={() => handleApprove(request)}
                  >
                    Aprovar (1 Super Crédito)
                  </Button>
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<Cancel />}
                    onClick={() => handleReject(request)}
                  >
                    Rejeitar
                  </Button>
                </Box>
              </CardContent>
            </Card>
          ))
        )}
      </Box>

      {/* Solicitações Aprovadas */}
      {approvedRequests.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Solicitações Aprovadas ({approvedRequests.length})
          </Typography>
          {approvedRequests.map((request) => (
            <Card key={request.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {request.userName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {request.userEmail}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Aprovado em: {request.approvedAt ? new Date(request.approvedAt).toLocaleString('pt-BR') : 'N/A'}
                    </Typography>
                  </Box>
                  <Chip 
                    label="Aprovado" 
                    color="success" 
                    icon={<CheckCircle />}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      {/* Solicitações Rejeitadas */}
      {rejectedRequests.length > 0 && (
        <Box>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Solicitações Rejeitadas ({rejectedRequests.length})
          </Typography>
          {rejectedRequests.map((request) => (
            <Card key={request.id} sx={{ mb: 2 }}>
              <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {request.userName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {request.userEmail}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                      Rejeitado em: {request.approvedAt ? new Date(request.approvedAt).toLocaleString('pt-BR') : 'N/A'}
                    </Typography>
                  </Box>
                  <Chip 
                    label="Rejeitado" 
                    color="error" 
                    icon={<Cancel />}
                  />
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
        </>
      )}

      {/* Aba Configurações */}
      {activeTab === 1 && (
        <Box>
          {/* Configuração do Endereço Bitcoin */}
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                <Box display="flex" alignItems="center" gap={1}>
                  <CurrencyBitcoin />
                  Endereço da Carteira Bitcoin
                </Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Configure o endereço da carteira Bitcoin para receber pagamentos de Super Créditos.
              </Typography>
              <Box display="flex" gap={2} mt={2}>
                <TextField
                  fullWidth
                  label="Endereço da Carteira Bitcoin"
                  value={bitcoinAddress}
                  onChange={(e) => setBitcoinAddress(e.target.value)}
                  placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                />
                <Button
                  variant="contained"
                  onClick={handleSaveBitcoinAddress}
                  disabled={updateSettingsResult.isLoading}
                  sx={{ minWidth: 120 }}
                >
                  Salvar
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Transações Bitcoin Pendentes */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom fontWeight="bold">
                Transações Bitcoin Pendentes ({pendingBitcoinTransactions.length})
              </Typography>
              {pendingBitcoinTransactions.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Nenhuma transação Bitcoin pendente no momento.
                </Alert>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ mt: 2 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell><strong>Usuário</strong></TableCell>
                        <TableCell><strong>Super Créditos</strong></TableCell>
                        <TableCell><strong>Quantidade BTC</strong></TableCell>
                        <TableCell><strong>TX Hash</strong></TableCell>
                        <TableCell><strong>Data</strong></TableCell>
                        <TableCell align="right"><strong>Ações</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pendingBitcoinTransactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {transaction.user?.name || 'N/A'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {transaction.user?.email || 'N/A'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>{transaction.superCreditsAmount}</TableCell>
                          <TableCell>{transaction.amountBTC.toFixed(8)} BTC</TableCell>
                          <TableCell>
                            {transaction.txHash ? (
                              <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                {transaction.txHash.substring(0, 20)}...
                              </Typography>
                            ) : (
                              <Typography variant="body2" color="text.secondary">
                                Não informado
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            {new Date(transaction.createdAt).toLocaleString('pt-BR')}
                          </TableCell>
                          <TableCell align="right">
                            <Box display="flex" gap={1} justifyContent="flex-end">
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                startIcon={<CheckCircle />}
                                onClick={() => handleApproveBitcoin(transaction.id)}
                                disabled={approveResult.isLoading || rejectResult.isLoading}
                              >
                                Aprovar
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                startIcon={<Cancel />}
                                onClick={() => handleRejectBitcoin(transaction.id)}
                                disabled={approveResult.isLoading || rejectResult.isLoading}
                              >
                                Rejeitar
                              </Button>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Container>
  );
};

export default TesterApproval;
