import React from 'react';
import {
  Typography,
  Paper,
  Container,
  Grid,
  Card,
  CardContent,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  People as PeopleIcon,
  PersonAdd as PersonAddIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon
} from '@mui/icons-material';
import { useGetDashboardStatsQuery } from '../users/userAPI';

const StatCard = ({ title, value, icon, color }: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) => (
  <Card sx={{ height: '100%' }}>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="div" sx={{ fontWeight: 'bold', color }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ color }}>
          {icon}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const UsersDashboard = () => {
  const { data: stats, isLoading, error } = useGetDashboardStatsQuery();

  if (isLoading) {
    return (
      <Container>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 2 }}>
          Erro ao carregar estatísticas do dashboard
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 4 }}>
        Dashboard de Usuários
      </Typography>

      {/* Cards de Estatísticas */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total de Usuários"
            value={stats?.totalUsers || 0}
            icon={<PeopleIcon sx={{ fontSize: 40 }} />}
            color="#1976d2"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Assinantes Ativos"
            value={stats?.subscribers || 0}
            icon={<PersonAddIcon sx={{ fontSize: 40 }} />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Receita Mensal"
            value={`R$ ${(stats?.monthlyRevenue || 0).toFixed(2)}`}
            icon={<MoneyIcon sx={{ fontSize: 40 }} />}
            color="#ed6c02"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Taxa de Conversão"
            value={`${stats?.totalUsers ? ((stats.subscribers / stats.totalUsers) * 100).toFixed(1) : 0}%`}
            icon={<TrendingUpIcon sx={{ fontSize: 40 }} />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Tabela de Distribuição por Planos */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
              Distribuição por Planos
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Plano</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Usuários</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Preço Mensal</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Receita Mensal</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>% do Total</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {stats?.planDetails.map((plan) => (
                    <TableRow key={plan.plan}>
                      <TableCell sx={{ fontWeight: 'medium' }}>
                        {plan.plan}
                      </TableCell>
                      <TableCell align="right">{plan.count}</TableCell>
                      <TableCell align="right">R$ {plan.price.toFixed(2)}</TableCell>
                      <TableCell align="right">R$ {plan.revenue.toFixed(2)}</TableCell>
                      <TableCell align="right">
                        {stats.subscribers ? ((plan.count / stats.subscribers) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!stats?.planDetails || stats.planDetails.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        Nenhum plano ativo encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Informações Adicionais */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', mb: 2 }}>
              Resumo da Plataforma
            </Typography>
            <Typography paragraph>
              A plataforma atualmente possui <strong>{stats?.totalUsers || 0} usuários</strong> cadastrados, 
              sendo <strong>{stats?.subscribers || 0} assinantes ativos</strong>.
            </Typography>
            <Typography paragraph>
              A receita mensal total é de <strong>R$ {(stats?.monthlyRevenue || 0).toFixed(2)}</strong>, 
              gerada através dos planos de assinatura disponíveis.
            </Typography>
            <Typography paragraph>
              A taxa de conversão de usuários para assinantes é de{' '}
              <strong>
                {stats?.totalUsers ? ((stats.subscribers / stats.totalUsers) * 100).toFixed(1) : 0}%
              </strong>.
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default UsersDashboard;
