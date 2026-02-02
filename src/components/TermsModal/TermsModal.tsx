import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Checkbox,
  FormControlLabel,
  Box,
  Divider,
  Alert
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { useAcceptTermsMutation } from '../../features/users/userAPI';

interface TermsModalProps {
  open: boolean;
  onAccept: () => void;
  onClose?: () => void;
  readOnly?: boolean; // Se true, não permite fechar sem aceitar
}

const TermsModal: React.FC<TermsModalProps> = ({ open, onAccept, onClose, readOnly = false }) => {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [liabilityAccepted, setLiabilityAccepted] = useState(false);
  const [responsibilityAccepted, setResponsibilityAccepted] = useState(false);
  const [noGuaranteeAccepted, setNoGuaranteeAccepted] = useState(false);
  const [acceptTerms, { isLoading }] = useAcceptTermsMutation();

  const allAccepted = termsAccepted && liabilityAccepted && responsibilityAccepted && noGuaranteeAccepted;

  const handleAccept = async () => {
    if (allAccepted) {
      try {
        await acceptTerms().unwrap();
        onAccept();
      } catch (error) {
        console.error('Erro ao aceitar termos:', error);
      }
    }
  };

  const handleClose = () => {
    if (!readOnly && onClose) {
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={readOnly ? undefined : handleClose}
      maxWidth="md"
      fullWidth
      disableEscapeKeyDown={readOnly}
      PaperProps={{
        sx: {
          maxHeight: '90vh'
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Info color="primary" />
          <Typography variant="h6" component="span" fontWeight="bold">
            Termos de Uso e Política da Plataforma ENGBOT
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Alert severity="info" sx={{ mb: 3 }}>
          <Typography variant="body2">
            Por favor, leia atentamente os termos abaixo antes de continuar utilizando a plataforma.
          </Typography>
        </Alert>

        <Box sx={{ maxHeight: '60vh', overflowY: 'auto', pr: 1 }}>
          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold' }}>
            1. Natureza da Plataforma
          </Typography>
          <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
            A plataforma ENGBOT é um ambiente de simulação e operações financeiras onde estratégias de negociação — manuais ou automatizadas — podem ser testadas, avaliadas e executadas. A plataforma oferece ferramentas para análise técnica, criação de robôs de trading, execução de backtests e participação em desafios entre traders.
          </Typography>

          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 2 }}>
            2. Não Garantia de Ganhos
          </Typography>
          <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
            A plataforma ENGBOT <strong>NÃO GARANTE</strong> ganhos, lucros ou retornos financeiros de qualquer natureza. Todas as operações realizadas na plataforma, sejam em ambiente simulado ou real, estão sujeitas a riscos de mercado, volatilidade de preços, falhas técnicas, erros de execução e outros fatores que podem resultar em perdas totais ou parciais do capital investido.
          </Typography>
          <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
            O desempenho passado de estratégias, robôs ou indicadores não garante resultados futuros. Operações financeiras envolvem riscos significativos e podem resultar em perdas substanciais.
          </Typography>

          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 2 }}>
            3. Responsabilidade do Usuário
          </Typography>
          <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
            O usuário é <strong>EXCLUSIVAMENTE RESPONSÁVEL</strong> por todas as decisões de trading, configurações de robôs, estratégias implementadas e operações executadas na plataforma. A ENGBOT não se responsabiliza por:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Perdas financeiras decorrentes de operações realizadas na plataforma;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Decisões de investimento ou trading tomadas pelo usuário;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Configurações incorretas de robôs ou estratégias;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Interpretação ou uso inadequado de indicadores técnicos ou análises fornecidas;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Resultados de backtests que não se materializem em operações reais;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Falhas de conexão, latência ou interrupções técnicas que possam afetar operações.</Typography></li>
          </Box>

          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 2 }}>
            4. Riscos de Trading
          </Typography>
          <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
            O usuário reconhece e aceita que operações financeiras envolvem riscos significativos, incluindo, mas não se limitando a:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Perda total ou parcial do capital investido;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Volatilidade extrema de mercado;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Gaps de preço ou movimentos bruscos;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Falhas técnicas ou de infraestrutura;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Interrupções de serviço ou manutenção;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Mudanças regulatórias que possam afetar operações.</Typography></li>
          </Box>

          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 2 }}>
            5. Limitação de Responsabilidade
          </Typography>
          <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
            A ENGBOT, seus desenvolvedores, operadores e afiliados <strong>NÃO SERÃO RESPONSÁVEIS</strong> por quaisquer danos diretos, indiretos, incidentais, especiais, consequenciais ou punitivos decorrentes do uso ou incapacidade de usar a plataforma, incluindo perdas financeiras, lucros cessantes, perda de dados ou outras perdas intangíveis.
          </Typography>

          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 2 }}>
            6. Disponibilidade e Funcionamento do Serviço
          </Typography>
          <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
            A plataforma é fornecida "como está" e "conforme disponível". A ENGBOT não garante que o serviço estará disponível de forma ininterrupta, livre de erros ou que atenderá a todas as expectativas do usuário. A plataforma pode sofrer interrupções para manutenção, atualizações ou por motivos técnicos, sem aviso prévio.
          </Typography>

          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 2 }}>
            7. Uso Adequado da Plataforma
          </Typography>
          <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
            O usuário compromete-se a utilizar a plataforma de forma adequada e responsável, não utilizando-a para:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Atividades ilegais ou não autorizadas;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Manipulação de resultados ou rankings;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Colusão ou práticas abusivas em desafios;</Typography></li>
            <li><Typography variant="body2" component="span" sx={{ textAlign: 'justify' }}>Tentativas de comprometer a segurança ou integridade da plataforma.</Typography></li>
          </Box>

          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 2 }}>
            8. Propriedade Intelectual
          </Typography>
          <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
            Todo o conteúdo da plataforma, incluindo software, design, textos, gráficos, logos e outros materiais, é propriedade da ENGBOT ou de seus licenciadores e está protegido por leis de propriedade intelectual. O usuário não possui direitos de propriedade sobre o conteúdo da plataforma, exceto sobre suas próprias estratégias e configurações de robôs.
          </Typography>

          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 2 }}>
            9. Modificações dos Termos
          </Typography>
          <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
            A ENGBOT reserva-se o direito de modificar estes termos a qualquer momento. Alterações significativas serão comunicadas aos usuários, e o uso continuado da plataforma após tais modificações constitui aceitação dos novos termos.
          </Typography>

          <Typography variant="body1" paragraph sx={{ textAlign: 'justify', fontWeight: 'bold', mt: 2 }}>
            10. Rescisão
          </Typography>
          <Typography variant="body2" paragraph sx={{ textAlign: 'justify' }}>
            A ENGBOT reserva-se o direito de suspender ou encerrar o acesso do usuário à plataforma a qualquer momento, sem aviso prévio, em caso de violação destes termos ou por qualquer outro motivo que julgue necessário para proteger a integridade da plataforma.
          </Typography>

          <Divider sx={{ my: 3 }} />

          <Typography variant="body2" paragraph sx={{ textAlign: 'justify', fontStyle: 'italic', color: 'text.secondary' }}>
            Ao aceitar estes termos, o usuário declara que leu, compreendeu e concorda com todas as condições acima, reconhecendo os riscos envolvidos e assumindo total responsabilidade por suas ações na plataforma.
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        <Box sx={{ mt: 3 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ textAlign: 'justify' }}>
                <strong>Li e concordo</strong> com os Termos de Uso e Política da Plataforma ENGBOT acima descritos.
              </Typography>
            }
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={liabilityAccepted}
                onChange={(e) => setLiabilityAccepted(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ textAlign: 'justify' }}>
                <strong>Li e concordo</strong> que a ENGBOT não se responsabiliza por perdas financeiras decorrentes do uso da plataforma.
              </Typography>
            }
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={responsibilityAccepted}
                onChange={(e) => setResponsibilityAccepted(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ textAlign: 'justify' }}>
                <strong>Li e concordo</strong> que sou exclusivamente responsável por todas as decisões de trading e operações realizadas na plataforma.
              </Typography>
            }
          />
        </Box>

        <Box sx={{ mt: 2 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={noGuaranteeAccepted}
                onChange={(e) => setNoGuaranteeAccepted(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" sx={{ textAlign: 'justify' }}>
                <strong>Li e concordo</strong> que a plataforma não garante ganhos, lucros ou retornos financeiros de qualquer natureza.
              </Typography>
            }
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, px: 3 }}>
        {!readOnly && (
          <Button onClick={handleClose} color="inherit">
            Fechar
          </Button>
        )}
        <Button
          onClick={handleAccept}
          variant="contained"
          color="primary"
          disabled={!allAccepted || isLoading}
          sx={{ minWidth: 120 }}
        >
          {isLoading ? 'Salvando...' : 'Aceitar e Continuar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TermsModal;
