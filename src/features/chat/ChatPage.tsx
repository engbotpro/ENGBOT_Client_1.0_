import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Paper,
  Stack,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Send as SendIcon,
  SupportAgent as SupportAgentIcon,
  Person as PersonIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import chatAPI, { ChatMessage } from '../../services/chatAPI';

const ChatPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const isAdmin = user?.perfil === 'Admin';
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [serverError, setServerError] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens ao montar o componente
  useEffect(() => {
    loadMessages();
  }, []);

  // Scroll automático para a última mensagem
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    try {
      setIsLoading(true);
      const loadedMessages = await chatAPI.getMessages();
      
      // Se não houver mensagens, adicionar mensagem de boas-vindas
      if (loadedMessages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          userId: user?.id || '',
          text: 'Olá! Como posso ajudá-lo hoje?',
          sender: 'support',
          read: true,
          createdAt: new Date().toISOString(),
        };
        // Tentar salvar mensagem de boas-vindas no banco (apenas se servidor estiver disponível)
        try {
          await chatAPI.sendMessage(welcomeMessage.text, 'support');
        } catch (error) {
          // Se não conseguir salvar, apenas exibir localmente
          console.warn('Não foi possível salvar mensagem de boas-vindas:', error);
        }
        setMessages([welcomeMessage]);
      } else {
        setMessages(loadedMessages);
      }
    } catch (error: any) {
      console.error('Erro ao carregar mensagens:', error);
      
      // Verificar se é erro de conexão
      const isConnectionError = error?.message?.includes('Failed to fetch') || 
                                error?.message?.includes('ERR_CONNECTION_REFUSED') ||
                                error?.name === 'TypeError';
      
      if (isConnectionError) {
        setServerError(true);
        // Mensagem de erro mais amigável para erro de conexão
        setMessages([{
          id: 'connection-error',
          userId: user?.id || '',
          text: 'Não foi possível conectar ao servidor. Verifique se o servidor está rodando e tente novamente.',
          sender: 'support',
          read: true,
          createdAt: new Date().toISOString(),
        }]);
      } else {
        // Outros erros
        setMessages([{
          id: 'error',
          userId: user?.id || '',
          text: 'Erro ao carregar mensagens. Por favor, recarregue a página.',
          sender: 'support',
          read: true,
          createdAt: new Date().toISOString(),
        }]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isSending) return;

    const messageText = inputMessage.trim();
    setInputMessage('');
    setIsSending(true);

    try {
      // Se for admin, enviar como 'support', senão como 'user'
      const sender = isAdmin ? 'support' : 'user';
      const message = await chatAPI.sendMessage(messageText, sender);
      setMessages((prev) => [...prev, message]);
    } catch (error: any) {
      console.error('Erro ao enviar mensagem:', error);
      
      // Verificar se é erro de conexão
      const isConnectionError = error?.message?.includes('Failed to fetch') || 
                                error?.message?.includes('ERR_CONNECTION_REFUSED') ||
                                error?.name === 'TypeError';
      
      if (isConnectionError) {
        alert('Não foi possível conectar ao servidor. Verifique se o servidor está rodando e tente novamente.');
      } else {
        alert('Erro ao enviar mensagem. Por favor, tente novamente.');
      }
      
      // Restaurar mensagem no campo de input em caso de erro
      setInputMessage(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Box sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3, color: 'primary.main' }}>
        <ChatIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
        Chat de Suporte
      </Typography>

      {serverError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Servidor não disponível</strong>
            <br />
            Não foi possível conectar ao servidor. Certifique-se de que o servidor backend está rodando na porta 5000.
          </Typography>
        </Alert>
      )}
      
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          <strong>Bem-vindo ao Chat de Suporte!</strong>
          <br />
          {isAdmin 
            ? 'Você está logado como administrador. Suas mensagens serão enviadas como respostas oficiais do suporte.'
            : 'Nossa equipe está aqui para ajudá-lo com dúvidas sobre a plataforma, funcionalidades, problemas técnicos ou qualquer outra questão.'
          }
          <br />
          <strong>Horário de atendimento:</strong> Segunda a Sexta, das 9h às 18h (horário de Brasília)
        </Typography>
      </Alert>

      <Card elevation={3} sx={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column', p: 0 }}>
          {/* Área de mensagens */}
          <Box
            ref={messagesContainerRef}
            sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              backgroundColor: 'background.default',
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                {messages.map((message) => (
                  <Stack
                    key={message.id}
                    direction="row"
                    spacing={2}
                    justifyContent={message.sender === 'user' ? 'flex-end' : 'flex-start'}
                    sx={{ width: '100%' }}
                  >
                    {message.sender === 'support' && (
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <SupportAgentIcon />
                      </Avatar>
                    )}
                    <Paper
                      elevation={1}
                      sx={{
                        p: 2,
                        maxWidth: '70%',
                        backgroundColor: message.sender === 'user' ? 'primary.main' : 'background.paper',
                        color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                      }}
                    >
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                        {message.text}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          display: 'block',
                          mt: 1,
                          opacity: 0.7,
                          textAlign: message.sender === 'user' ? 'right' : 'left',
                        }}
                      >
                        {formatTime(message.createdAt)}
                      </Typography>
                    </Paper>
                    {message.sender === 'user' && (
                      <Avatar sx={{ bgcolor: 'secondary.main' }}>
                        <PersonIcon />
                      </Avatar>
                    )}
                  </Stack>
                ))}
                {isSending && (
                  <Stack direction="row" spacing={2} justifyContent="flex-start">
                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                      <SupportAgentIcon />
                    </Avatar>
                    <Paper elevation={1} sx={{ p: 2 }}>
                      <CircularProgress size={20} />
                    </Paper>
                  </Stack>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </Box>

          <Divider />

          {/* Área de input */}
          <Box sx={{ p: 2 }}>
            {isAdmin && (
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Você está respondendo como <strong>Suporte</strong>. Suas mensagens serão enviadas como respostas oficiais.
                </Typography>
              </Alert>
            )}
            <Stack direction="row" spacing={2} alignItems="flex-end">
              <TextField
                fullWidth
                multiline
                maxRows={4}
                placeholder={isAdmin ? "Digite sua resposta como suporte..." : "Digite sua mensagem..."}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isSending}
                variant="outlined"
                size="small"
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isSending}
                startIcon={<SendIcon />}
                sx={{ minWidth: 120 }}
              >
                {isAdmin ? 'Responder' : 'Enviar'}
              </Button>
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              Pressione Enter para enviar, Shift+Enter para nova linha
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Informações adicionais */}
      <Box sx={{ mt: 3 }}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <SupportAgentIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
              Informações de Contato
            </Typography>
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Email:</strong> engbotpro@gmail.com
              </Typography>
             
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default ChatPage;

