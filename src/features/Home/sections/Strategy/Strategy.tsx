// src/features/Home/sections/Strategy/Strategy.tsx
import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  styled,
} from '@mui/material';
import ProjectCard, {
  ProjectCardProps,
} from '../../../../components/ProjectCard/ProjectCard';
import AnimationComponent from '../../../../components/AnimationComponent/AnimationComponent';

const GRADIENT_DOTTED = `
  linear-gradient(135deg, #0f2027 0%, #2c5364 100%),
  radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)
`;

// wrapper com fundo pontilhado + altura full e centralização
const StyledStrategySection = styled('section')(({ theme }) => ({
  backgroundImage: GRADIENT_DOTTED,
  backgroundSize: '100% 100%, 20px 20px',
  color: theme.palette.common.white,
  minHeight: '100vh',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  paddingTop: theme.spacing(8),
  paddingBottom: theme.spacing(8),
}));

const projects: ProjectCardProps[] = [
  {
    title: 'Médias Móveis',    
    srcImg: '/src/assets/images/ma.jpg',
    description:
      'É a média móvel dos preços num período definido, suavizando as oscilações diárias para mostrar a tendência geral. Quando o preço cruza a média de baixo para cima, pode indicar início de tendência de alta; o contrário sugere reversão de baixa. Serve como suporte/resistência dinâmica e filtra “ruído” de curto prazo, ajudando a confirmar direções de mercado.',
      
  },
  {
    title: 'Bandas de Bollinger',
   
    srcImg: '/src/assets/images/bb.jpg',
    description:
      'Consistem numa média móvel central e duas bandas superior e inferior, calculadas a partir do desvio-padrão dos preços. Bandas que se estreitam sinalizam baixa volatilidade (possível “squeeze” antes de rompimento); ao se alargarem, refletem alta volatilidade. Preços tocando a banda superior indicam sobrecompra, enquanto tocar a inferior sugere sobrevenda, mas não são sinais isolados de compra/venda.',
   
   
  },
  {
    title: 'Moving Average Convergence Divergence',
   
    srcImg: '/src/assets/images/macd.jpg',
    description:
      'É a diferença entre duas médias móveis exponenciais (geralmente de 12 e 26 períodos), mostrando a convergência/divergência das tendências. A linha de sinal (média móvel da diferença) gera gatilhos de alta/quebra quando cruza a MACD de baixo para cima (compra) ou de cima para baixo (venda). Histograma positivo reforça tendência de alta; negativo, tendência de baixa; divergências entre preço e MACD apontam potenciais reversões.',
   
   
  },
  {
    title: 'Nuvem de Ichimoku',
    
    srcImg: '/src/assets/images/ic.jpg',
    description:
      'Combina cinco linhas (Tenkan, Kijun, Senkou Span A/B e Chikou Span) para fornecer suporte/resistência, direção de tendência e momentum. A “nuvem” (entre Senkou Span A e B) define zonas de suporte/resistência: preço acima da nuvem indica alta, abaixo indica baixa. Cruzamentos das linhas Tenkan/Kijun e a posição do Chikou Span em relação ao preço confirmam entradas e possíveis reversões.',
   
   
  },
  {
    title: 'Índice de Força Relativa',
    
    srcImg: '/src/assets/images/rsi.jpg',
    description:
      'Mede a velocidade e a intensidade das variações de preço, oscilando geralmente entre 0 e 100 para indicar força de compra ou venda. Leituras acima de 70 sinalizam sobrecompra (possível correção), abaixo de 30 indicam sobrevenda (potencial recuperação). Divergências entre RSI e preço podem antecipar reversões: valor cai enquanto preço sobe, por exemplo, sugere enfraquecimento da alta.',
   
   
  },
  {
    title: 'Oscilador Estocástico',
   
    srcImg: '/src/assets/images/so.jpg',
    description:
      'Compara o preço de fechamento com sua faixa de negociação num determinado período, gerando duas linhas (%K e %D) que oscilam de 0–100. Leituras acima de 80 indicam sobrecompra; abaixo de 20, sobrevenda; cruzamentos das linhas geram sinais de compra/venda. Convergências e divergências entre estocástico e movimento de preço funcionam como alertas de mudança de tendência.',
    
    
  },
  {
    title: 'Outras ferramentas',
   
    srcImg: '/src/assets/images/fibo.jpg',
    description:
      'Utilize as técnicas de Fibonacci, Price Action, ondas de Eliot, compras e vendas parciais além de explorar a otimização do preço médio realizando compras da queda',
    
    
  },
  {
    title: 'Soluções pessoais',
    
    srcImg: '/src/assets/images/text.jpg',
    description:
      'Combine ou crie seu próprio indicador!! Grande diferencial da platarfoma! Caso as ferramentas disponíveis não te atendam, entre em contato e explique a sua ideia!',
    
    
  },
];

const Strategy: React.FC = () => (
  <StyledStrategySection id="strategy">
    <Container maxWidth="lg">
      {/* Cabeçalho */}
      <Box pt={5} pb={5} textAlign="center">
        <Typography
          variant="h2"
          sx={{
            fontSize: { xs: '2rem', md: '3rem' },
            color: '#3CFCD9',
            fontWeight: 700,
            textShadow: '0 0 20px rgba(60, 252, 217, 0.4)',
            mb: 2,
            textTransform: 'uppercase',
            letterSpacing: 2,
          }}
        >
          Análise Técnica
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: 'rgba(255,255,255,0.7)',
            fontWeight: 300,
            maxWidth: '600px',
            mx: 'auto',
          }}
        >
          Ferramentas profissionais para análise e execução de estratégias avançadas
        </Typography>
      </Box>

      {/* Cards */}
      <Grid container spacing={5} pb={3}>
        {projects.map((project, idx) => (
          <Grid item xs={12} md={6} key={project.title}>
            <AnimationComponent
              moveDirection={
                idx % 2 === 0 ? 'right' : 'left'
              }
            >
              <ProjectCard {...project} />
            </AnimationComponent>
          </Grid>
        ))}
      </Grid>
    </Container>
  </StyledStrategySection>
);

export default Strategy;
