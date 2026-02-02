import { Typography, Paper, Container, Box, Divider, Tabs, Tab, Button } from '@mui/material';
import { useState } from 'react';
import TermsModal from '../../components/TermsModal/TermsModal';
import { useCheckTermsAcceptedQuery } from '../users/userAPI';

const About = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { data: termsData } = useCheckTermsAcceptedQuery();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Tabs value={activeTab} onChange={handleTabChange} sx={{ mb: 4, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Litepaper" />
          <Tab label="Termos de Uso" />
        </Tabs>

        {activeTab === 0 && (
          <>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" align="center" sx={{ mb: 4 }}>
              ENGBOT Litepaper
            </Typography>
        <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary" sx={{ mb: 4 }}>
          Token Utilitário para Desafios, Reputação e Mérito em Trading Algorítmico
        </Typography>

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
            1. Introdução e Contexto
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A plataforma foi concebida como um ambiente de operações financeiras onde estratégias de negociação — manuais ou automatizadas — podem ser avaliadas de forma objetiva, transparente e comparável. Por meio de operações simuladas e reais, os participantes competem utilizando métricas claras de desempenho, risco e consistência, promovendo uma cultura baseada em mérito técnico e resultados verificáveis.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Um dos principais componentes da plataforma é o sistema de desafios entre traders e robôs, no qual participantes confrontam suas estratégias em condições previamente definidas. Esses desafios funcionam como mecanismos de validação prática, permitindo que o desempenho de cada trader seja avaliado não apenas por resultados isolados, mas por sua capacidade de superar outros participantes em cenários equivalentes.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Nesse contexto, o token da plataforma surge como um instrumento de reputação e coordenação econômica, e não como um ativo especulativo. O token representa o reconhecimento objetivo do desempenho de um trader ao longo do tempo: ao vencer desafios, o participante sobe no ranking e recebe os tokens apostados na disputa, consolidando sua posição como operador consistente e tecnicamente qualificado dentro do ecossistema.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Dessa forma, o token atua como um mecanismo de incentivo, coordenação e acesso a funcionalidades da plataforma, alinhando interesses entre participantes, reduzindo comportamentos oportunistas e fortalecendo a meritocracia baseada em desempenho real.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Diferentemente de sistemas tradicionais de pontuação subjetiva, o token está diretamente vinculado a resultados verificáveis e a regras de competição transparentes, tornando-se um indicador mensurável de desempenho ao longo do tempo.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
            2. Problema que o Sistema Resolve
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A avaliação de desempenho de traders e sistemas automatizados historicamente sofre com uma série de limitações estruturais. Resultados isolados, períodos curtos de observação e métricas pouco padronizadas frequentemente distorcem a percepção de competência, dificultando a distinção entre habilidade consistente, sorte estatística e exposição excessiva a risco.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Em muitos ambientes, rankings são baseados em métricas incompletas ou facilmente manipuláveis, incentivando comportamentos oportunistas, como estratégias excessivamente alavancadas, overfitting em dados históricos ou divulgação seletiva de resultados positivos. Esse cenário compromete a credibilidade das avaliações e cria assimetrias de informação entre participantes.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Além disso, a ausência de mecanismos econômicos claros para alinhar incentivos tende a gerar spam, simulações artificiais de desempenho e competições sem comprometimento real. Sem um custo mensurável de participação, torna-se difícil penalizar comportamentos abusivos ou premiar de forma proporcional a consistência ao longo do tempo.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O sistema de desafios da plataforma foi projetado para mitigar essas limitações ao introduzir confrontos diretos entre traders e robôs, realizados sob regras previamente definidas e métricas verificáveis. Nesse modelo, o desempenho é avaliado de forma comparativa e contínua, reduzindo a influência de fatores aleatórios e privilegiando estratégias sustentáveis.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O token desempenha um papel central nesse processo ao atuar como um instrumento de sinalização econômica e reputacional. Ao exigir a aposta de tokens nos desafios, o sistema impõe um custo explícito à participação, desencorajando comportamentos oportunistas e promovendo maior comprometimento com a qualidade das estratégias. A redistribuição dos tokens aos vencedores reforça a meritocracia do ecossistema e cria um ciclo de incentivos alinhado ao desempenho real.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Dessa forma, a plataforma busca estabelecer um ambiente onde reputação, mérito técnico e incentivos econômicos estejam intrinsicamente conectados, criando uma base mais confiável e transparente para a avaliação de traders e sistemas automatizados.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
            3. Utilidade do Token no Ecossistema
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O token da plataforma foi projetado como um ativo utilitário, cuja função principal é viabilizar mecanismos de incentivo, coordenação e validação de desempenho dentro do ecossistema. Sua utilização está diretamente associada à participação em desafios, à construção de reputação e ao acesso a funcionalidades específicas da plataforma, não sendo concebido como instrumento especulativo ou de investimento.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            3.1 Participação em Desafios
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O uso central do token ocorre no sistema de desafios entre traders e robôs. Para participar de um desafio, os envolvidos devem alocar uma quantidade previamente definida de tokens como compromisso econômico. Essa alocação funciona como um mecanismo de alinhamento de incentivos, garantindo que os participantes assumam riscos proporcionais à confiança em suas estratégias.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Ao término do desafio, os tokens alocados são redistribuídos de acordo com o resultado, sendo transferidos ao participante vencedor conforme regras previamente estabelecidas. Esse modelo assegura que a obtenção de tokens esteja diretamente vinculada a desempenho comprovado em condições comparáveis.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            3.2 Construção de Reputação e Ranking
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O acúmulo de tokens ao longo do tempo reflete a capacidade do trader ou robô de superar outros participantes de forma consistente. Dessa maneira, o token atua como um indicador mensurável de reputação, complementando métricas tradicionais de desempenho e fortalecendo a confiabilidade dos rankings da plataforma.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Diferentemente de sistemas baseados apenas em pontuações abstratas, o modelo adotado associa reputação a resultados verificáveis e a decisões econômicas reais, reduzindo distorções causadas por sorte estatística ou estratégias excessivamente arriscadas.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            3.3 Acesso a Funcionalidades da Plataforma
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Além da participação em desafios, o token pode ser utilizado como meio de acesso a funcionalidades avançadas da plataforma, tais como:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">participação em ligas ou categorias específicas de competição;</Typography></li>
            <li><Typography component="span">desbloqueio de métricas adicionais de análise de desempenho;</Typography></li>
            <li><Typography component="span">acesso a ambientes de simulação avançados ou históricos ampliados;</Typography></li>
            <li><Typography component="span">priorização em filas de execução ou processamento, quando aplicável.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Esses usos reforçam o caráter utilitário do token, criando uma relação direta entre sua posse e a utilização efetiva dos serviços oferecidos.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            3.4 Staking e Mecanismos de Comprometimento (Evolução Futura)
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Em fases futuras, poderão ser implementados mecanismos de staking, nos quais participantes optam por bloquear temporariamente tokens como forma de sinalizar comprometimento de longo prazo com o ecossistema. Esses mecanismos poderão estar associados à participação em competições de maior relevância, à obtenção de direitos adicionais ou à mitigação de comportamentos abusivos, sempre sob regras transparentes e previamente divulgadas.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            3.5 Governança (Opcional)
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A depender da maturidade do ecossistema, o token poderá ser utilizado como instrumento de participação em processos de governança relacionados a parâmetros específicos da plataforma, como regras de desafios, formatos de competição ou alocação de recursos de incentivo. Qualquer funcionalidade de governança será implementada de forma gradual e limitada, preservando a estabilidade e a segurança do sistema.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
            4. Visão Geral do Token ENGBOT
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O ENGBOT é um token utilitário projetado para operar como elemento central de coordenação econômica, reputação e acesso a funcionalidades dentro da plataforma. Sua arquitetura foi concebida para ser simples, transparente e compatível com padrões amplamente adotados no ecossistema blockchain, priorizando segurança, auditabilidade e interoperabilidade.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            4.1 Identificação do Token
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span"><strong>Nome:</strong> ENGBOT</Typography></li>
            <li><Typography component="span"><strong>Símbolo:</strong> ENGBOT</Typography></li>
            <li><Typography component="span"><strong>Padrão:</strong> ERC-20</Typography></li>
            <li><Typography component="span"><strong>Rede:</strong> Rede compatível com EVM (camada 2)</Typography></li>
            <li><Typography component="span"><strong>Decimais:</strong> 18</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A escolha do padrão ERC-20 permite integração direta com ferramentas consolidadas de custódia, auditoria, análise e infraestrutura de mercado, além de facilitar futuras expansões do ecossistema.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            4.2 Natureza e Finalidade
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O ENGBOT é definido como um token estritamente utilitário, cuja finalidade está vinculada ao uso funcional dentro da plataforma. Sua emissão, circulação e utilização estão diretamente associadas à participação em desafios, à construção de reputação e ao acesso a serviços e funcionalidades oferecidos pelo sistema.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O token não representa participação societária, direitos sobre receitas da plataforma ou expectativa de retorno financeiro, sendo utilizado exclusivamente como mecanismo operacional e de incentivo interno.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            4.3 Oferta e Emissão
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A oferta total do ENGBOT será definida de forma transparente e documentada antes do lançamento on-chain, podendo adotar um modelo de oferta fixa ou emissão controlada, conforme decisão de governança da plataforma. Em qualquer cenário, eventuais mecanismos de emissão estarão sujeitos a limites explícitos, controles de acesso e períodos de bloqueio (timelock), assegurando previsibilidade e mitigação de riscos operacionais.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A alocação inicial do supply será detalhada na seção de tokenomics, contemplando reservas para recompensas de desafios, tesouraria operacional, desenvolvimento da plataforma e outros usos estritamente utilitários.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            4.4 Custódia e Controle Administrativo
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Funções administrativas relacionadas ao contrato do ENGBOT, quando existentes, serão geridas por meio de carteiras multiassinatura, reduzindo riscos de falha única ou ações unilaterais. Alterações críticas de parâmetros, quando permitidas, estarão sujeitas a mecanismos de atraso programado (timelock), garantindo transparência e tempo hábil para análise por parte da comunidade.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Sempre que possível, privilégios administrativos serão progressivamente reduzidos ou desativados à medida que o ecossistema atingir maior maturidade operacional.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            4.5 Interoperabilidade e Transparência
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O ENGBOT será totalmente compatível com exploradores de blocos, carteiras e ferramentas analíticas padrão do ecossistema EVM, permitindo rastreamento público de transações, verificação independente de supply e auditoria contínua por terceiros.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Endereços associados à tesouraria, contratos principais e mecanismos de distribuição serão publicamente divulgados, reforçando o compromisso com a transparência e a confiança no funcionamento do sistema.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
            5. Tokenomics do ENGBOT
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O modelo econômico do ENGBOT foi estruturado para privilegiar simplicidade, previsibilidade e alinhamento de incentivos, assegurando que a circulação do token esteja diretamente relacionada ao uso efetivo da plataforma e ao desempenho dos participantes nos desafios.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            5.1 Oferta Total (Total Supply)
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span"><strong>Oferta total:</strong> 100.000.000 ENGBOT</Typography></li>
            <li><Typography component="span"><strong>Modelo:</strong> oferta fixa (fixed supply)</Typography></li>
            <li><Typography component="span"><strong>Emissão adicional:</strong> não permitida após o lançamento on-chain</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A adoção de uma oferta fixa elimina incertezas relacionadas à inflação futura, reduz riscos operacionais associados a funções de emissão (mint) e facilita auditorias e verificações independentes de supply.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            5.2 Distribuição Inicial
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A distribuição inicial do ENGBOT foi definida para priorizar recompensas baseadas em mérito, sustentabilidade operacional e desenvolvimento contínuo da plataforma.
          </Typography>
          <Box sx={{ overflowX: 'auto', my: 3 }}>
            <Box component="table" sx={{ width: '100%', borderCollapse: 'collapse', mb: 2 }}>
              <Box component="thead">
                <Box component="tr" sx={{ borderBottom: '2px solid', borderColor: 'divider' }}>
                  <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 'bold' }}>Categoria</Box>
                  <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 'bold' }}>Percentual</Box>
                  <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 'bold' }}>Quantidade (ENGBOT)</Box>
                  <Box component="th" sx={{ p: 2, textAlign: 'left', fontWeight: 'bold' }}>Observações</Box>
                </Box>
              </Box>
              <Box component="tbody">
                <Box component="tr" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box component="td" sx={{ p: 2 }}>Recompensas de Desafios</Box>
                  <Box component="td" sx={{ p: 2 }}>50%</Box>
                  <Box component="td" sx={{ p: 2 }}>50.000.000</Box>
                  <Box component="td" sx={{ p: 2 }}>Distribuição gradual conforme uso da plataforma</Box>
                </Box>
                <Box component="tr" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box component="td" sx={{ p: 2 }}>Tesouraria da Plataforma</Box>
                  <Box component="td" sx={{ p: 2 }}>20%</Box>
                  <Box component="td" sx={{ p: 2 }}>20.000.000</Box>
                  <Box component="td" sx={{ p: 2 }}>Operação, liquidez e manutenção</Box>
                </Box>
                <Box component="tr" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box component="td" sx={{ p: 2 }}>Desenvolvimento e Infraestrutura</Box>
                  <Box component="td" sx={{ p: 2 }}>15%</Box>
                  <Box component="td" sx={{ p: 2 }}>15.000.000</Box>
                  <Box component="td" sx={{ p: 2 }}>Evolução técnica e segurança</Box>
                </Box>
                <Box component="tr" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box component="td" sx={{ p: 2 }}>Equipe (com vesting)</Box>
                  <Box component="td" sx={{ p: 2 }}>10%</Box>
                  <Box component="td" sx={{ p: 2 }}>10.000.000</Box>
                  <Box component="td" sx={{ p: 2 }}>Bloqueio e liberação gradual</Box>
                </Box>
                <Box component="tr" sx={{ borderBottom: '1px solid', borderColor: 'divider' }}>
                  <Box component="td" sx={{ p: 2 }}>Reserva Estratégica</Box>
                  <Box component="td" sx={{ p: 2 }}>5%</Box>
                  <Box component="td" sx={{ p: 2 }}>5.000.000</Box>
                  <Box component="td" sx={{ p: 2 }}>Contingências e parcerias</Box>
                </Box>
              </Box>
            </Box>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Essa estrutura assegura que a maioria absoluta do supply esteja destinada aos participantes, reforçando o caráter meritocrático do ecossistema.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            5.3 Recompensas de Desafios
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Os tokens alocados à categoria de recompensas serão distribuídos de forma progressiva e condicionada à participação real nos desafios entre traders e robôs.
          </Typography>
          <Typography paragraph component="div">
            Principais diretrizes:
            <Box component="ul" sx={{ pl: 4, mt: 1 }}>
              <li><Typography component="span">distribuição baseada exclusivamente em resultados verificáveis;</Typography></li>
              <li><Typography component="span">limites máximos por período para evitar concentração excessiva;</Typography></li>
              <li><Typography component="span">regras públicas e imutáveis de cálculo de recompensa;</Typography></li>
              <li><Typography component="span">ausência de distribuição automática sem atividade comprovada.</Typography></li>
            </Box>
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Esse modelo impede emissões arbitrárias e vincula diretamente a circulação do token ao crescimento orgânico da plataforma.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            5.4 Tesouraria e Liquidez
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Os tokens reservados à tesouraria serão utilizados para:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">prover liquidez inicial em ambientes compatíveis;</Typography></li>
            <li><Typography component="span">sustentar mecanismos operacionais do token;</Typography></li>
            <li><Typography component="span">cobrir custos relacionados à infraestrutura on-chain;</Typography></li>
            <li><Typography component="span">apoiar iniciativas que fortaleçam o ecossistema.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A movimentação da tesouraria será realizada exclusivamente por meio de carteiras multiassinatura, com endereços publicamente divulgados e rastreáveis.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            5.5 Alocação da Equipe e Vesting
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Os tokens destinados à equipe estarão sujeitos a um cronograma de vesting, prevenindo desalinhamento de incentivos e mitigando riscos de curto prazo.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Sugestão de vesting:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">cliff inicial: 12 meses</Typography></li>
            <li><Typography component="span">liberação gradual: 36 meses após o cliff</Typography></li>
            <li><Typography component="span">desbloqueio linear mensal</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Esse modelo incentiva o comprometimento de longo prazo com a estabilidade e evolução da plataforma.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            5.6 Reserva Estratégica
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A reserva estratégica tem como finalidade apoiar:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">parcerias técnicas ou institucionais;</Typography></li>
            <li><Typography component="span">integração com novos serviços;</Typography></li>
            <li><Typography component="span">contingências operacionais não previstas.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O uso dessa reserva estará sujeito a regras internas de governança e transparência, sendo documentado e divulgado publicamente sempre que acionado.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            5.7 Mecanismos de Circulação e Redução de Oferta (Opcional)
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A plataforma poderá adotar mecanismos opcionais de redução de oferta em circulação, tais como:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">queima de tokens provenientes de taxas operacionais;</Typography></li>
            <li><Typography component="span">retenção temporária de tokens vinculados a staking ou desafios ativos.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Qualquer mecanismo desse tipo será implementado apenas após validação técnica, auditoria e comunicação prévia aos usuários.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
            6. Sistema de Recompensas e Prevenção de Abusos
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O sistema de recompensas da plataforma foi projetado para assegurar que a distribuição de tokens ENGBOT reflita desempenho real, comprometimento econômico e comportamento consistente, ao mesmo tempo em que mitiga práticas abusivas, manipulações de resultados e exploração indevida de incentivos.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            6.1 Estrutura dos Desafios
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Os desafios entre traders e robôs ocorrem sob parâmetros previamente definidos, incluindo:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">período de duração;</Typography></li>
            <li><Typography component="span">ativos ou mercados elegíveis;</Typography></li>
            <li><Typography component="span">métricas de avaliação;</Typography></li>
            <li><Typography component="span">critérios de vitória;</Typography></li>
            <li><Typography component="span">quantidade de tokens alocados por cada participante.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Esses parâmetros são públicos, auditáveis e imutáveis durante a execução de cada desafio, garantindo condições equitativas para todos os envolvidos.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            6.2 Aposta de Tokens como Compromisso Econômico
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Para participar de um desafio, cada participante deve alocar uma quantidade mínima de tokens ENGBOT como compromisso econômico. Essa alocação:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">não constitui pagamento ou taxa à plataforma;</Typography></li>
            <li><Typography component="span">funciona como mecanismo de alinhamento de incentivos;</Typography></li>
            <li><Typography component="span">reduz participação oportunista ou automatizada sem risco real.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Ao final do desafio, os tokens alocados são redistribuídos conforme o resultado, sendo transferidos ao vencedor ou distribuídos segundo regras pré-definidas, sempre de forma transparente.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            6.3 Critérios de Avaliação de Desempenho
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A avaliação dos desafios considera métricas objetivas e verificáveis, que podem incluir:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">retorno ajustado ao risco;</Typography></li>
            <li><Typography component="span">consistência ao longo do período;</Typography></li>
            <li><Typography component="span">drawdown máximo;</Typography></li>
            <li><Typography component="span">aderência às regras do desafio.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O uso de múltiplos critérios reduz a dependência de métricas isoladas e minimiza incentivos a estratégias excessivamente arriscadas ou manipuláveis.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            6.4 Limites e Controles de Recompensa
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Para preservar a integridade do ecossistema e evitar concentração excessiva de tokens, são adotados mecanismos de controle, tais como:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">limites máximos de recompensa por período;</Typography></li>
            <li><Typography component="span">restrições progressivas conforme o nível do ranking;</Typography></li>
            <li><Typography component="span">balanceamento dinâmico entre categorias ou ligas.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Esses limites são ajustados de forma conservadora e documentada, permitindo crescimento sustentável da base de participantes.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            6.5 Prevenção de Farming e Colusão
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O sistema incorpora múltiplas camadas de prevenção a abusos, incluindo:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">detecção de padrões anômalos de comportamento entre contas ou robôs;</Typography></li>
            <li><Typography component="span">restrições a desafios repetitivos entre os mesmos participantes;</Typography></li>
            <li><Typography component="span">monitoramento de correlação excessiva entre estratégias;</Typography></li>
            <li><Typography component="span">penalidades graduais em casos de comportamento suspeito ou comprovadamente abusivo.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Esses mecanismos visam reduzir práticas de token farming, colusão intencional e manipulação de resultados.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            6.6 Penalidades e Medidas Corretivas
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Em situações de violação das regras da plataforma, poderão ser aplicadas medidas corretivas proporcionais, incluindo:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">perda parcial ou total dos tokens alocados em desafios;</Typography></li>
            <li><Typography component="span">suspensão temporária de participação;</Typography></li>
            <li><Typography component="span">rebaixamento no ranking;</Typography></li>
            <li><Typography component="span">exclusão definitiva em casos graves ou reincidentes.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Todas as penalidades são baseadas em regras previamente estabelecidas e sujeitas a revisão conforme processos internos da plataforma.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            6.7 Transparência e Auditabilidade
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Todas as etapas relacionadas à participação em desafios, alocação de tokens e distribuição de recompensas são registradas de forma auditável, permitindo:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">verificação independente dos resultados;</Typography></li>
            <li><Typography component="span">rastreabilidade de movimentações relevantes;</Typography></li>
            <li><Typography component="span">análise histórica de desempenho.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Sempre que aplicável, eventos on-chain e registros off-chain são correlacionados para garantir consistência e integridade das informações.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
            7. Integração Off-Chain e On-Chain
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A arquitetura do ENGBOT adota uma abordagem híbrida, combinando registro off-chain e representação on-chain, de modo a equilibrar eficiência operacional, segurança e flexibilidade regulatória. Essa separação permite que a plataforma valide o modelo econômico e os mecanismos de recompensa antes da plena exposição do token ao ambiente blockchain.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            7.1 Fase Off-Chain: Registro Interno de Pontos
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Inicialmente, o ENGBOT opera como um registro interno de pontos, mantido pela plataforma por meio de um sistema de ledger auditável. Nesse estágio:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">os tokens são atribuídos exclusivamente como resultado de desafios válidos;</Typography></li>
            <li><Typography component="span">todas as movimentações são registradas com trilha de auditoria completa;</Typography></li>
            <li><Typography component="span">não há transferências externas ou negociação livre;</Typography></li>
            <li><Typography component="span">o foco é validar métricas, regras e prevenção de abusos.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Essa fase permite ajustes controlados no modelo econômico, reduzindo riscos técnicos e operacionais antes da emissão on-chain.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            7.2 Transição para o Token On-Chain
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Após a consolidação do sistema de recompensas e validação do comportamento do ecossistema, o ENGBOT passa a existir como um token ERC-20 on-chain, mantendo correspondência lógica com os registros off-chain existentes.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A transição é planejada para ocorrer de forma transparente e verificável, assegurando que nenhum token seja criado sem respaldo em atividades previamente registradas.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            7.3 Mecanismo de Conversão (Claim)
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A conversão de tokens off-chain para ENGBOT on-chain ocorrerá por meio de um mecanismo de claim, que poderá ser implementado de uma das seguintes formas:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span"><strong>Snapshot com Merkle Tree:</strong> Um snapshot dos saldos off-chain é realizado em um momento específico, gerando uma estrutura criptográfica que permite aos usuários reivindicarem seus tokens diretamente no contrato inteligente.</Typography></li>
            <li><Typography component="span"><strong>Mint Controlado via Backend:</strong> O backend da plataforma autoriza a emissão controlada de tokens on-chain mediante solicitação explícita do usuário, respeitando limites e regras predefinidas.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Em ambos os casos, o processo é limitado ao saldo previamente registrado, impedindo emissões arbitrárias ou duplicadas.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            7.4 Limites e Controles de Conversão
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Para mitigar riscos operacionais e evitar exploração indevida do sistema, o processo de conversão pode incluir:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">limites máximos de conversão por período;</Typography></li>
            <li><Typography component="span">janelas temporais específicas para claim;</Typography></li>
            <li><Typography component="span">exigência de verificação de identidade ou critérios técnicos mínimos;</Typography></li>
            <li><Typography component="span">bloqueios temporários para contas sob análise.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Esses controles permitem uma migração gradual e segura, compatível com a maturidade do ecossistema.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            7.5 Sincronização e Consistência de Dados
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Durante o período em que coexistem registros off-chain e tokens on-chain, a plataforma mantém mecanismos de sincronização que asseguram:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">consistência entre saldos internos e tokens emitidos;</Typography></li>
            <li><Typography component="span">prevenção de dupla contagem;</Typography></li>
            <li><Typography component="span">rastreabilidade entre eventos off-chain e transações on-chain.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Essa correlação é essencial para garantir integridade contábil e transparência operacional.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            7.6 Evolução do Modelo Híbrido
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Mesmo após a migração on-chain, a plataforma poderá manter parte da lógica operacional off-chain, especialmente no que se refere à validação de desafios, cálculo de métricas e prevenção de abusos. O token on-chain atua como camada de liquidação e representação econômica, enquanto a lógica de avaliação permanece no domínio da aplicação.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Essa separação reduz custos, melhora escalabilidade e preserva flexibilidade para evoluções futuras.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            7.7 Aquisição Antecipada de Créditos Utilitários
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Antes da emissão on-chain do token ENGBOT, a plataforma poderá disponibilizar mecanismos de aquisição de créditos utilitários destinados exclusivamente ao uso interno. Esses créditos têm como finalidade viabilizar a participação em desafios, o acesso a funcionalidades da plataforma e a utilização de serviços associados ao ecossistema.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A eventual conversão desses créditos em tokens ENGBOT, após o lançamento on-chain, poderá ser disponibilizada de forma opcional, limitada e sujeita a regras específicas, não constituindo direito adquirido nem promessa de conversão integral.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Em nenhuma hipótese esses créditos representam instrumentos financeiros, ativos negociáveis ou expectativa de retorno econômico, estando restritos ao uso funcional dentro da plataforma.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
            8. Segurança, Governança e Transparência
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A segurança do ecossistema ENGBOT é tratada como um requisito estrutural e contínuo, abrangendo tanto os componentes off-chain quanto on-chain. As decisões de governança e os mecanismos de controle foram desenhados para reduzir riscos operacionais, evitar pontos únicos de falha e garantir previsibilidade e confiança aos participantes.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            8.1 Princípios de Segurança
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O projeto adota os seguintes princípios fundamentais:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">mínimo privilégio, restringindo funções administrativas ao estritamente necessário;</Typography></li>
            <li><Typography component="span">defesa em profundidade, combinando controles técnicos, operacionais e procedimentais;</Typography></li>
            <li><Typography component="span">transparência por padrão, permitindo verificação independente sempre que possível;</Typography></li>
            <li><Typography component="span">simplicidade arquitetural, reduzindo superfícies de ataque.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Esses princípios orientam tanto o desenvolvimento de contratos inteligentes quanto a operação da plataforma.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            8.2 Segurança On-Chain
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O contrato do token ENGBOT segue padrões amplamente auditados e consolidados no ecossistema EVM, priorizando previsibilidade e compatibilidade.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Medidas adotadas incluem:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">uso de bibliotecas amplamente testadas (ex.: OpenZeppelin);</Typography></li>
            <li><Typography component="span">ausência de funções desnecessárias de emissão ou modificação de supply;</Typography></li>
            <li><Typography component="span">validações explícitas de permissões administrativas;</Typography></li>
            <li><Typography component="span">eventos on-chain para rastreabilidade de operações relevantes.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Antes da adoção plena do token on-chain, o contrato será submetido a processos de revisão técnica e, quando aplicável, auditoria independente.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            8.3 Custódia Administrativa e Multiassinatura
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Funções administrativas críticas, incluindo controle de tesouraria e eventuais parâmetros configuráveis, são exercidas exclusivamente por carteiras multiassinatura. Esse modelo:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">reduz riscos de comprometimento de chaves individuais;</Typography></li>
            <li><Typography component="span">previne ações unilaterais;</Typography></li>
            <li><Typography component="span">aumenta a resiliência operacional.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Os endereços das carteiras multiassinatura são publicamente divulgados, permitindo monitoramento contínuo por parte da comunidade.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            8.4 Mecanismos de Timelock
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Alterações sensíveis em contratos ou parâmetros operacionais, quando permitidas, estarão sujeitas a mecanismos de atraso programado (timelock). Esses mecanismos asseguram:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">comunicação prévia de mudanças;</Typography></li>
            <li><Typography component="span">tempo adequado para análise externa;</Typography></li>
            <li><Typography component="span">mitigação de riscos associados a decisões abruptas.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O período de timelock será definido de forma conservadora, compatível com a criticidade da alteração proposta.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            8.5 Segurança Off-Chain
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            No ambiente off-chain, a plataforma adota controles rigorosos para proteger dados, lógica de avaliação e registros de desafios, incluindo:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">segregação de responsabilidades entre serviços;</Typography></li>
            <li><Typography component="span">registros imutáveis de eventos relevantes;</Typography></li>
            <li><Typography component="span">monitoramento contínuo de comportamento anômalo;</Typography></li>
            <li><Typography component="span">rotinas de backup e recuperação.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Esses mecanismos garantem consistência e confiabilidade dos dados utilizados na atribuição de tokens e no cálculo de rankings.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            8.6 Governança Progressiva
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O modelo de governança do ENGBOT é concebido de forma progressiva e proporcional à maturidade do ecossistema. Inicialmente, decisões estratégicas e operacionais permanecem sob responsabilidade da equipe mantenedora, com transparência e prestação de contas.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            À medida que o ecossistema evoluir, poderão ser introduzidos mecanismos limitados de participação dos usuários, sempre restritos a parâmetros específicos e previamente definidos, preservando a estabilidade do sistema.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            8.7 Transparência Operacional
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A plataforma compromete-se com a divulgação clara e contínua de informações relevantes, incluindo:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">endereços de contratos e carteiras críticas;</Typography></li>
            <li><Typography component="span">políticas de uso da tesouraria;</Typography></li>
            <li><Typography component="span">regras de distribuição e conversão de tokens;</Typography></li>
            <li><Typography component="span">alterações significativas de parâmetros.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Essa transparência permite auditoria contínua, fortalece a confiança no ecossistema e reduz assimetrias de informação entre participantes.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
            9. Roadmap e Considerações Finais
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            9.1 Roadmap do Projeto
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O desenvolvimento do ENGBOT está estruturado em fases progressivas, permitindo validação contínua do modelo econômico, ajustes técnicos controlados e mitigação de riscos operacionais.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            <strong>Fase 1 – Consolidação Off-Chain</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">operação do ENGBOT como sistema interno de pontos;</Typography></li>
            <li><Typography component="span">validação dos desafios entre traders e robôs;</Typography></li>
            <li><Typography component="span">ajuste de métricas, limites e mecanismos de prevenção de abusos;</Typography></li>
            <li><Typography component="span">consolidação do ranking baseado em desempenho verificável.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            <strong>Fase 2 – Preparação para Token On-Chain</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">definição final de parâmetros técnicos do token;</Typography></li>
            <li><Typography component="span">implementação e testes do contrato ERC-20;</Typography></li>
            <li><Typography component="span">configuração de carteiras multiassinatura e timelock;</Typography></li>
            <li><Typography component="span">auditoria técnica e revisão de segurança.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            <strong>Fase 3 – Lançamento On-Chain</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">emissão do token ENGBOT na rede compatível com EVM;</Typography></li>
            <li><Typography component="span">ativação do mecanismo de conversão (claim);</Typography></li>
            <li><Typography component="span">integração gradual com funcionalidades da plataforma;</Typography></li>
            <li><Typography component="span">monitoramento intensivo de segurança e uso.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            <strong>Fase 4 – Expansão Funcional</strong>
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">introdução de mecanismos de staking e ligas avançadas;</Typography></li>
            <li><Typography component="span">ampliação de funcionalidades acessíveis via token;</Typography></li>
            <li><Typography component="span">possíveis mecanismos limitados de governança;</Typography></li>
            <li><Typography component="span">parcerias técnicas e integração com novos serviços.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O avanço entre fases será condicionado à estabilidade técnica, ao comportamento do ecossistema e à maturidade operacional da plataforma.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            9.2 Considerações Finais
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O ENGBOT foi concebido como um instrumento utilitário, projetado para reforçar a meritocracia, a transparência e o alinhamento de incentivos em um ambiente competitivo de operações financeiras. Sua função central é representar desempenho comprovado, compromisso econômico e reputação mensurável, dentro de regras claras e verificáveis.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Ao adotar uma abordagem híbrida, progressiva e orientada à segurança, o projeto busca equilibrar inovação tecnológica com responsabilidade operacional. A evolução do token e de suas funcionalidades será guiada por princípios de simplicidade, previsibilidade e transparência, evitando promessas especulativas ou estruturas econômicas artificiais.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            9.3 Avisos Importantes
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O ENGBOT:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">não representa participação societária ou direito sobre receitas da plataforma;</Typography></li>
            <li><Typography component="span">não constitui instrumento financeiro ou promessa de retorno econômico;</Typography></li>
            <li><Typography component="span">é destinado exclusivamente ao uso funcional dentro do ecossistema descrito neste documento.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            As regras, parâmetros e funcionalidades descritos neste litepaper poderão ser ajustados conforme necessidades técnicas, regulatórias ou operacionais, sempre com comunicação prévia e transparência.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            Encerramento
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Este documento estabelece a base conceitual, técnica e econômica do ENGBOT, servindo como referência para desenvolvimento, auditoria e operação do ecossistema. A plataforma compromete-se a evoluir o projeto de forma responsável, sustentada por métricas reais, segurança robusta e alinhamento de incentivos entre todos os participantes.
          </Typography>
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" component="h2" gutterBottom fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
            10. Programa de Super Créditos de Incentivo (Evolução Opcional)
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A plataforma poderá implementar, em caráter opcional, experimental e complementar, um programa específico de Super Créditos de Incentivo, destinado exclusivamente a apoiar o desenvolvimento inicial do ecossistema, incentivar a participação de testadores qualificados e reconhecer contribuições técnicas relevantes para a evolução da plataforma.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Os Super Créditos não se confundem com o token utilitário ENGBOT, não integram sua tokenomics principal, não são utilizados para participação em desafios, ranking ou acesso às funcionalidades operacionais padrão da plataforma, e não constituem instrumentos financeiros ou ativos negociáveis.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            10.1 Origem e Limite de Alocação
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Os Super Créditos poderão ser originados a partir de uma realocação limitada e controlada de até 5% da alocação originalmente destinada à categoria "Desenvolvimento e Infraestrutura", sem impacto sobre as recompensas de desafios, rankings ou demais mecanismos meritocráticos do ecossistema.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A eventual utilização de recursos financeiros associados ao programa estará limitada, discricionária e condicionada à sustentabilidade operacional da plataforma, não gerando direito adquirido, expectativa de continuidade ou obrigação de distribuição.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            10.2 Forma de Aquisição
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Os Super Créditos poderão ser concedidos exclusivamente por meio de:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">participação qualificada como testador do sistema, mediante critérios técnicos, operacionais ou de contribuição definidos pela plataforma;</Typography></li>
            <li><Typography component="span">aquisição direta em condições restritas, específicas e previamente documentadas, voltadas ao apoio do desenvolvimento do projeto.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            O programa não constitui oferta pública, sendo restrito a participantes previamente elegíveis, mediante convite ou critérios internos objetivos.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            10.3 Natureza Jurídica e Funcional
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Os Super Créditos representam instrumentos internos de incentivo e reconhecimento, vinculados a termos específicos de participação, não configurando, em nenhuma hipótese:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">token utilitário ou criptativo;</Typography></li>
            <li><Typography component="span">valor mobiliário ou instrumento financeiro;</Typography></li>
            <li><Typography component="span">participação societária;</Typography></li>
            <li><Typography component="span">promessa, garantia ou expectativa de retorno econômico;</Typography></li>
            <li><Typography component="span">direito subjetivo a lucros, dividendos ou receitas da plataforma.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Sua concessão e eventual utilização dependem da adesão expressa aos termos do programa, podendo ser ajustados, suspensos ou encerrados a qualquer tempo.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            10.4 Benefícios Associados (Quando Aplicável)
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            De forma eventual, não automática e não garantida, a plataforma poderá, a seu exclusivo critério, oferecer benefícios associados aos Super Créditos, que poderão incluir:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">reconhecimento institucional por contribuições relevantes;</Typography></li>
            <li><Typography component="span">acesso antecipado a funcionalidades experimentais;</Typography></li>
            <li><Typography component="span">benefícios operacionais internos;</Typography></li>
            <li><Typography component="span">participação discricionária em programas de incentivo ou bonificação.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Qualquer benefício concedido será limitado, documentado e desvinculado de obrigação futura, não gerando expectativa de continuidade.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            10.5 Limitações, Transferência e Restrições
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Os Super Créditos:
          </Typography>
          <Box component="ul" sx={{ pl: 4, mb: 2 }}>
            <li><Typography component="span">não são transferíveis;</Typography></li>
            <li><Typography component="span">não são negociáveis;</Typography></li>
            <li><Typography component="span">não possuem valor de mercado;</Typography></li>
            <li><Typography component="span">não podem ser revendidos, cedidos ou utilizados como instrumento de troca.</Typography></li>
          </Box>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Sua validade está condicionada à manutenção do vínculo do participante com a plataforma e ao cumprimento das regras do programa.
          </Typography>

          <Typography variant="h6" component="h3" gutterBottom fontWeight="bold" sx={{ mt: 3, mb: 1 }}>
            10.6 Transparência, Governança e Encerramento
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            Os critérios gerais do programa, sua duração e eventuais alterações serão comunicados de forma clara e transparente aos participantes elegíveis.
          </Typography>
          <Typography paragraph sx={{ textAlign: 'justify' }}>
            A plataforma poderá, a qualquer tempo, revisar, modificar, suspender ou encerrar o Programa de Super Créditos de Incentivo, sem que isso configure descumprimento contratual ou gere direito a compensações.
          </Typography>
        </Box>
      </>
        )}

        {activeTab === 1 && (
          <Box>
            <Typography variant="h4" component="h1" gutterBottom fontWeight="bold" align="center" sx={{ mb: 4 }}>
              Termos de Uso e Política da Plataforma
            </Typography>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <Button
                variant="contained"
                color="primary"
                size="large"
                onClick={() => setShowTermsModal(true)}
                sx={{ minWidth: 200 }}
              >
                Visualizar Termos de Uso
              </Button>
            </Box>
            <Typography variant="body1" paragraph sx={{ textAlign: 'justify' }}>
              Para visualizar os termos completos de uso e política da plataforma ENGBOT, clique no botão acima. 
              Os termos incluem informações importantes sobre responsabilidades, riscos e limitações da plataforma.
            </Typography>
            <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1 }}>
              <Typography variant="body2" sx={{ textAlign: 'justify' }}>
                <strong>Última atualização:</strong> {termsData?.termsAcceptedAt
                  ? new Date(termsData.termsAcceptedAt).toLocaleDateString('pt-BR')
                  : 'Você ainda não aceitou os termos'}
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      {/* Modal de Termos de Uso */}
      <TermsModal
        open={showTermsModal}
        onAccept={() => {
          setShowTermsModal(false);
        }}
        onClose={() => setShowTermsModal(false)}
        readOnly={false}
      />
    </Container>
  );
}

export default About;