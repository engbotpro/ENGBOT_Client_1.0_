import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Chip,
  Alert,
  LinearProgress
} from '@mui/material';
import { Person, SportsEsports, Schedule, EmojiEvents, CalendarToday } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import type { UserStats, CreateChallengeRequest } from '../../types/challenge';
import { ChallengeType } from '../../types/challenge';
import botAPI from '../../services/botAPI';
import type { BackendBot } from '../../types/bot';

interface CreateChallengeDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (challengeData: CreateChallengeRequest) => void;
  availableUsers: UserStats[];
  userStats: UserStats | null;
  onSearch?: (term: string) => void;
}

const CreateChallengeDialog: React.FC<CreateChallengeDialogProps> = ({
  open,
  onClose,
  onCreate,
  availableUsers,
  userStats,
  onSearch
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    challengedUserId: '',
    type: ChallengeType.MANUAL_TRADING,
    betAmount: 50,
    startTime: '09:00',
    endTime: '18:00',
    startDate: new Date().toISOString().split('T')[0], // Data atual no formato YYYY-MM-DD
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Amanhã
    challengerBotId: '',
    challengedBotId: '',
    // Novos campos para duração do trading manual
    durationDays: 1,
    durationHours: 0,
    durationMinutes: 0
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null);
  const [myBots, setMyBots] = useState<BackendBot[]>([]);
  const [opponentBots, setOpponentBots] = useState<BackendBot[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserStats[]>([]);
  const [loadingBots, setLoadingBots] = useState(false);

  const currentUserId = useSelector((state: RootState) => state.auth.user?.id || '');

  // Carregar robôs do usuário atual
  useEffect(() => {
    const loadMyBots = async () => {
      if (!currentUserId) return;
      try {
        setLoadingBots(true);
        const bots = await botAPI.getBots();
        setMyBots(bots);
      } catch (error) {
        console.error('Erro ao carregar robôs:', error);
      } finally {
        setLoadingBots(false);
      }
    };
    loadMyBots();
  }, [currentUserId]);

  // Carregar robôs do oponente quando um usuário for selecionado
  useEffect(() => {
    const loadOpponentBots = async () => {
      if (!formData.challengedUserId || formData.type !== ChallengeType.BOT_DUEL) {
        setOpponentBots([]);
        // Limpar seleção do robô do oponente quando não há usuário selecionado
        setFormData(prev => ({ ...prev, challengedBotId: '' }));
        return;
      }
      try {
        setLoadingBots(true);
        const bots = await botAPI.getBotsByUserId(formData.challengedUserId);
        setOpponentBots(bots);
        // Limpar seleção se o robô selecionado não estiver mais na lista
        if (formData.challengedBotId && !bots.find(b => b.id === formData.challengedBotId)) {
          setFormData(prev => ({ ...prev, challengedBotId: '' }));
        }
      } catch (error) {
        console.error('Erro ao carregar robôs do oponente:', error);
        setOpponentBots([]);
        setFormData(prev => ({ ...prev, challengedBotId: '' }));
      } finally {
        setLoadingBots(false);
      }
    };
    loadOpponentBots();
  }, [formData.challengedUserId, formData.type]);

  useEffect(() => {
    if (formData.challengedUserId) {
      const user = availableUsers.find(u => u.id === formData.challengedUserId);
      setSelectedUser(user || null);
    } else {
      setSelectedUser(null);
    }
  }, [formData.challengedUserId, availableUsers]);

  // Filtrar usuários baseado no termo de busca
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(availableUsers);
    } else {
      const filtered = availableUsers.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  }, [searchTerm, availableUsers]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Título é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (!formData.challengedUserId) {
      newErrors.challengedUserId = 'Selecione um usuário para desafiar';
    }

    if (formData.betAmount < 10 || formData.betAmount > (userStats?.tokens || 0)) {
      newErrors.betAmount = `Aposta deve ser entre 10 e ${userStats?.tokens || 0} tokens`;
    }

    // Validações específicas por tipo de desafio
    if (formData.type === ChallengeType.MANUAL_TRADING) {
      // Para trading manual: validar duração
      const totalDuration = formData.durationDays * 24 * 60 + formData.durationHours * 60 + formData.durationMinutes;
      if (totalDuration < 1) { // Mínimo 30 minutos
        newErrors.durationMinutes = 'Duração mínima é 30 minutos';
      }
      if (formData.durationDays > 30) { // Máximo 30 dias
        newErrors.durationDays = 'Duração máxima é 30 dias';
      }
    } else if (formData.type === ChallengeType.BOT_DUEL) {
      // Para duelo de robôs: validar datas
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const [startYear, startMonth, startDay] = formData.startDate.split('-').map(Number);
      const startDate = new Date(startYear, startMonth - 1, startDay);
      if (startDate < today) {
        newErrors.startDate = 'A data de início não pode ser anterior a hoje';
      }

      const [endYear, endMonth, endDay] = formData.endDate.split('-').map(Number);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      if (endDate < startDate) {
        newErrors.endDate = 'A data de término não pode ser anterior à data de início';
      }

      if (endDate.getTime() === startDate.getTime()) {
        const startTime = formData.startTime;
        const endTime = formData.endTime;
        if (startTime >= endTime) {
          newErrors.endTime = 'O horário de término deve ser posterior ao horário de início';
        } else {
          // Verificar se há pelo menos 5 minutos de diferença
          const [startHour, startMinute] = startTime.split(':').map(Number);
          const [endHour, endMinute] = endTime.split(':').map(Number);
          const startMinutes = startHour * 60 + startMinute;
          const endMinutes = endHour * 60 + endMinute;
          const diffMinutes = endMinutes - startMinutes;
          
          if (diffMinutes < 5) {
            newErrors.endTime = 'O desafio deve ter pelo menos 5 minutos de duração';
          }
        }
      }
    }

    if (formData.type === ChallengeType.BOT_DUEL) {
      if (!formData.challengerBotId) {
        newErrors.challengerBotId = 'Selecione seu robô';
      }
      if (!formData.challengedBotId) {
        newErrors.challengedBotId = 'Selecione o robô do oponente';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      let durationInDays: number;
      let startDate: string;
      let endDate: string;
      let startTime: string;
      let endTime: string;

      if (formData.type === ChallengeType.MANUAL_TRADING) {
        // Para trading manual: calcular duração em dias baseada nos campos de duração
        const totalMinutes = formData.durationDays * 24 * 60 + formData.durationHours * 60 + formData.durationMinutes;
        durationInDays = totalMinutes / (24 * 60); // Converter minutos para dias
        
        // Para trading manual, usar data/hora atual como início
        const now = new Date();
        startDate = now.toISOString().split('T')[0];
        startTime = now.toTimeString().split(' ')[0].substring(0, 5);
        
        // Calcular data/hora de fim baseada na duração
        const endDateTime = new Date(now.getTime() + totalMinutes * 60 * 1000);
        endDate = endDateTime.toISOString().split('T')[0];
        endTime = endDateTime.toTimeString().split(' ')[0].substring(0, 5);
      } else {
        // Para duelo de robôs: usar as datas configuradas
        const [startYear, startMonth, startDay] = formData.startDate.split('-').map(Number);
        const [endYear, endMonth, endDay] = formData.endDate.split('-').map(Number);
        const [startHour, startMinute] = formData.startTime.split(':').map(Number);
        const [endHour, endMinute] = formData.endTime.split(':').map(Number);
        
        const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMinute);
        const endDateTime = new Date(endYear, endMonth - 1, endDay, endHour, endMinute);
        
        const durationInMs = endDateTime.getTime() - startDateTime.getTime();
        durationInDays = Math.max(durationInMs / (1000 * 60 * 60 * 24), 0.01); // Mínimo de 0.01 dias para evitar 0
        
        startDate = formData.startDate;
        endDate = formData.endDate;
        startTime = formData.startTime;
        endTime = formData.endTime;
      }

      const challengeData: CreateChallengeRequest = {
        title: formData.title,
        description: formData.description,
        challengedUserId: formData.challengedUserId,
        type: formData.type,
        duration: durationInDays,
        betAmount: formData.betAmount,
        startDate: startDate,
        endDate: endDate,
        startTime: startTime,
        endTime: endTime,
        challengerBotId: formData.challengerBotId || undefined,
        challengedBotId: formData.challengedBotId || undefined
      };

      await onCreate(challengeData);
      handleClose();
    } catch (error) {
      console.error('Erro ao criar desafio:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      challengedUserId: '',
      type: ChallengeType.MANUAL_TRADING,
      betAmount: 50,
      startTime: '09:00',
      endTime: '18:00',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      challengerBotId: '',
      challengedBotId: '',
      // Novos campos para duração do trading manual
      durationDays: 1,
      durationHours: 0,
      durationMinutes: 0
    });
    setErrors({});
    setSelectedUser(null);
    setSearchTerm('');
    onClose();
  };

  const getTypeDescription = (type: ChallengeType) => {
    switch (type) {
      case ChallengeType.MANUAL_TRADING:
        return 'Você e seu oponente farão trades manuais durante o período do desafio';
      case ChallengeType.BOT_DUEL:
        return 'Seus robôs competirão automaticamente durante o período do desafio';
      default:
        return '';
    }
  };

  const formatDuration = (startDate: string, endDate: string, startTime: string, endTime: string) => {
    // Criar datas considerando fuso horário local
    const [startYear, startMonth, startDay] = startDate.split('-').map(Number);
    const [endYear, endMonth, endDay] = endDate.split('-').map(Number);
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startDateTime = new Date(startYear, startMonth - 1, startDay, startHour, startMinute);
    const endDateTime = new Date(endYear, endMonth - 1, endDay, endHour, endMinute);
    
    const durationInMs = endDateTime.getTime() - startDateTime.getTime();
    const durationInDays = durationInMs / (1000 * 60 * 60 * 24);
    
    if (durationInDays < 1) {
      const hours = Math.round(durationInDays * 24);
      return `${hours} hora${hours !== 1 ? 's' : ''}`;
    } else if (durationInDays === 1) {
      return '1 dia';
    } else {
      return `${durationInDays.toFixed(1)} dias`;
    }
  };

  // Nova função para formatar duração dos campos de entrada
  const formatInputDuration = () => {
    const parts = [];
    if (formData.durationDays > 0) {
      parts.push(`${formData.durationDays} dia${formData.durationDays !== 1 ? 's' : ''}`);
    }
    if (formData.durationHours > 0) {
      parts.push(`${formData.durationHours} hora${formData.durationHours !== 1 ? 's' : ''}`);
    }
    if (formData.durationMinutes > 0) {
      parts.push(`${formData.durationMinutes} minuto${formData.durationMinutes !== 1 ? 's' : ''}`);
    }
    return parts.length > 0 ? parts.join(', ') : '0 minutos';
  };

  // Função para formatar data corretamente considerando fuso horário local
  const formatDate = (dateString: string) => {
    // Criar a data considerando o fuso horário local
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month - 1 porque JavaScript usa 0-11 para meses
    return date.toLocaleDateString('pt-BR');
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        Criar Novo Desafio
      </DialogTitle>

      <DialogContent>
        <Grid container spacing={3}>
          {/* Informações básicas */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Informações do Desafio
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Título do Desafio"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              error={!!errors.title}
              helperText={errors.title}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel 
                id="challenge-type-label"
                shrink={true}
                sx={{ 
                  backgroundColor: 'background.paper',
                  px: 1,
                  transform: 'translate(14px, -9px) scale(0.75)',
                  '&.Mui-focused': {
                    transform: 'translate(14px, -9px) scale(0.75)',
                  }
                }}
              >
                Tipo de Desafio
              </InputLabel>
              <Select
                labelId="challenge-type-label"
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as ChallengeType }))}
                label="Tipo de Desafio"
                notched
              >
                <MenuItem value={ChallengeType.MANUAL_TRADING}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Person />
                    Trading Manual
                  </Box>
                </MenuItem>
                <MenuItem value={ChallengeType.BOT_DUEL}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <SportsEsports />
                    Duelo de Robôs
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Descrição"
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              error={!!errors.description}
              helperText={errors.description}
            />
          </Grid>

          {/* Datas e horários do desafio */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              {formData.type === ChallengeType.MANUAL_TRADING ? 'Duração do Desafio' : 'Período do Desafio'}
            </Typography>
          </Grid>

          {formData.type === ChallengeType.MANUAL_TRADING ? (
            // Campos para duração do trading manual
            <>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Dias"
                  type="number"
                  value={formData.durationDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationDays: Number(e.target.value) }))}
                  error={!!errors.durationDays}
                  helperText={errors.durationDays}
                  InputProps={{
                    inputProps: { min: 0, max: 30 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Horas"
                  type="number"
                  value={formData.durationHours}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationHours: Number(e.target.value) }))}
                  InputProps={{
                    inputProps: { min: 0, max: 23 }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Minutos"
                  type="number"
                  value={formData.durationMinutes}
                  onChange={(e) => setFormData(prev => ({ ...prev, durationMinutes: Number(e.target.value) }))}
                  error={!!errors.durationMinutes}
                  helperText={errors.durationMinutes}
                  InputProps={{
                    inputProps: { min: 0, max: 59 }
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <Alert severity="info">
                  Duração configurada: {formatInputDuration()}
                </Alert>
              </Grid>
            </>
          ) : (
            // Campos para datas do duelo de robôs
            <>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data de Início"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  error={!!errors.startDate}
                  helperText={errors.startDate}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: <CalendarToday />
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Data de Término"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  error={!!errors.endDate}
                  helperText={errors.endDate}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: <CalendarToday />
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Horário de Início"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 min
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Horário de Término"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  error={!!errors.endTime}
                  helperText={errors.endTime}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    step: 300, // 5 min
                  }}
                />
              </Grid>
            </>
          )}

          <Grid item xs={12}>
            <Alert severity="info">
              {getTypeDescription(formData.type)}
            </Alert>
          </Grid>

          {/* Seleção do oponente */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Selecionar Oponente
            </Typography>
          </Grid>

          {/* Campo de busca */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Buscar usuário por nome ou email"
              value={searchTerm}
              onChange={(e) => {
                const value = e.target.value;
                setSearchTerm(value);
                if (onSearch) {
                  onSearch(value);
                }
              }}
              placeholder="Digite o nome ou email do usuário..."
              size="small"
              sx={{ mb: 2 }}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.challengedUserId}>
              <InputLabel 
                id="challenged-user-label"
                shrink={true}
                sx={{ 
                  backgroundColor: 'background.paper',
                  px: 1,
                  transform: 'translate(14px, -9px) scale(0.75)',
                  '&.Mui-focused': {
                    transform: 'translate(14px, -9px) scale(0.75)',
                  }
                }}
              >
                Usuário para Desafiar
              </InputLabel>
              <Select
                labelId="challenged-user-label"
                value={formData.challengedUserId}
                onChange={(e) => setFormData(prev => ({ ...prev, challengedUserId: e.target.value }))}
                label="Usuário para Desafiar"
                notched
                MenuProps={{
                  PaperProps: {
                    style: {
                      maxHeight: 300
                    }
                  }
                }}
              >
                {filteredUsers.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      Nenhum usuário encontrado
                    </Typography>
                  </MenuItem>
                ) : (
                  filteredUsers.map((user) => (
                    <MenuItem key={user.id} value={user.id}>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Avatar src={user.avatar} sx={{ width: 24, height: 24 }}>
                          {user.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography variant="body1">{user.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.tokens} tokens | {user.winRate.toFixed(1)}% vitórias
                          </Typography>
                        </Box>
                      </Box>
                    </MenuItem>
                  ))
                )}
              </Select>
              {errors.challengedUserId && (
                <Typography variant="caption" color="error">
                  {errors.challengedUserId}
                </Typography>
              )}
            </FormControl>
          </Grid>

          {/* Informações do usuário selecionado */}
          {selectedUser && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar src={selectedUser.avatar}>
                      {selectedUser.name.charAt(0)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{selectedUser.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {selectedUser.email}
                      </Typography>
                    </Box>
                  </Box>
                  <Box display="flex" gap={1}>
                    <Chip label={`${selectedUser.tokens} tokens`} size="small" />
                    <Chip label={`${selectedUser.totalWins} vitórias`} size="small" color="success" />
                    <Chip label={`${selectedUser.winRate.toFixed(1)}% taxa`} size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* Configuração do desafio */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Configuração do Desafio
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Aposta (tokens)"
              type="number"
              value={formData.betAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, betAmount: Number(e.target.value) }))}
              error={!!errors.betAmount}
              helperText={errors.betAmount}
              InputProps={{
                startAdornment: <EmojiEvents />
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Box display="flex" alignItems="center" height="100%">
              <Typography variant="body2" color="text.secondary">
                Duração: {formData.type === ChallengeType.MANUAL_TRADING 
                  ? formatInputDuration() 
                  : formatDuration(formData.startDate, formData.endDate, formData.startTime, formData.endTime)
                }
              </Typography>
            </Box>
          </Grid>

          {/* Seleção de robôs (apenas para duelo de robôs) */}
          {formData.type === ChallengeType.BOT_DUEL && (
            <>
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Seleção de Robôs
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.challengerBotId}>
                  <InputLabel 
                    id="challenger-bot-label"
                    shrink={true}
                    sx={{ 
                      backgroundColor: 'background.paper',
                      px: 1,
                      transform: 'translate(14px, -9px) scale(0.75)',
                      '&.Mui-focused': {
                        transform: 'translate(14px, -9px) scale(0.75)',
                      }
                    }}
                  >
                    Seu Robô
                  </InputLabel>
                  <Select
                    labelId="challenger-bot-label"
                    value={formData.challengerBotId}
                    onChange={(e) => setFormData(prev => ({ ...prev, challengerBotId: e.target.value }))}
                    label="Seu Robô"
                    notched
                    disabled={loadingBots || myBots.length === 0}
                  >
                    {myBots.length === 0 ? (
                      <MenuItem disabled>Nenhum robô disponível</MenuItem>
                    ) : (
                      myBots.map((bot) => (
                        <MenuItem key={bot.id} value={bot.id}>
                          {bot.name} ({bot.symbol})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.challengerBotId && (
                    <Typography variant="caption" color="error">
                      {errors.challengerBotId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth error={!!errors.challengedBotId}>
                  <InputLabel 
                    id="challenged-bot-label"
                    shrink={true}
                    sx={{ 
                      backgroundColor: 'background.paper',
                      px: 1,
                      transform: 'translate(14px, -9px) scale(0.75)',
                      '&.Mui-focused': {
                        transform: 'translate(14px, -9px) scale(0.75)',
                      }
                    }}
                  >
                    Robô do Oponente
                  </InputLabel>
                  <Select
                    labelId="challenged-bot-label"
                    value={formData.challengedBotId}
                    onChange={(e) => setFormData(prev => ({ ...prev, challengedBotId: e.target.value }))}
                    label="Robô do Oponente"
                    notched
                    disabled={loadingBots || !formData.challengedUserId}
                  >
                    {!formData.challengedUserId ? (
                      <MenuItem disabled>Selecione um usuário primeiro</MenuItem>
                    ) : loadingBots ? (
                      <MenuItem disabled>Carregando robôs...</MenuItem>
                    ) : opponentBots.length === 0 ? (
                      <MenuItem disabled>O oponente não possui robôs disponíveis</MenuItem>
                    ) : (
                      opponentBots.map((bot) => (
                        <MenuItem key={bot.id} value={bot.id}>
                          {bot.name} ({bot.symbol})
                        </MenuItem>
                      ))
                    )}
                  </Select>
                  {errors.challengedBotId && (
                    <Typography variant="caption" color="error">
                      {errors.challengedBotId}
                    </Typography>
                  )}
                </FormControl>
              </Grid>
            </>
          )}

          {/* Resumo */}
          <Grid item xs={12}>
            <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Resumo do Desafio
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Tipo
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formData.type === ChallengeType.MANUAL_TRADING ? 'Trading Manual' : 'Duelo de Robôs'}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Duração
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formData.type === ChallengeType.MANUAL_TRADING 
                        ? formatInputDuration() 
                        : formatDuration(formData.startDate, formData.endDate, formData.startTime, formData.endTime)
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {formData.type === ChallengeType.MANUAL_TRADING ? 'Início' : 'Data de Início'}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formData.type === ChallengeType.MANUAL_TRADING 
                        ? 'Imediato (quando aceito)' 
                        : `${formatDate(formData.startDate)} às ${formData.startTime}`
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      {formData.type === ChallengeType.MANUAL_TRADING ? 'Término' : 'Data de Término'}
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {formData.type === ChallengeType.MANUAL_TRADING 
                        ? `${formatInputDuration()} após início` 
                        : `${formatDate(formData.endDate)} às ${formData.endTime}`
                      }
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Aposta por Jogador
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="primary">
                      {formData.betAmount} tokens
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="text.secondary">
                      Prêmio Total
                    </Typography>
                    <Typography variant="body1" fontWeight="bold" color="success.main">
                      {formData.betAmount * 2} tokens
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          Cancelar
        </Button>
        <Button 
          onClick={handleCreate} 
          variant="contained" 
          disabled={loading || !formData.challengedUserId}
          startIcon={loading ? <LinearProgress /> : null}
        >
          {loading ? 'Criando...' : 'Criar Desafio'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateChallengeDialog; 