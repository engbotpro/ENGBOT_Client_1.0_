import React from 'react'
import {
  Box,
  Button,
  Container,
  Grid,
  Typography,
  styled,
  useMediaQuery,
  useTheme,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import AccountBalanceWalletOutlinedIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded'
import EventNoteRoundedIcon from '@mui/icons-material/EventNoteRounded'
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded'
import ScienceRoundedIcon from '@mui/icons-material/ScienceRounded'
import WorkspacePremiumRoundedIcon from '@mui/icons-material/WorkspacePremiumRounded'
import LocalFireDepartmentRoundedIcon from '@mui/icons-material/LocalFireDepartmentRounded'
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded'
import PersonAddAlt1RoundedIcon from '@mui/icons-material/PersonAddAlt1Rounded'
import LockOpenRoundedIcon from '@mui/icons-material/LockOpenRounded'

const BG = '#061216'
const SURFACE = 'rgba(13, 37, 45, 0.88)'
const SURFACE_ALT = 'rgba(16, 49, 59, 0.74)'
const PRIMARY = '#39FF14'
const TEXT = '#F6FFF5'
const MUTED = '#A8B8B9'
const AMBER = '#FF9800'

const PageRoot = styled(Box)({
  background: `
    radial-gradient(circle at 12% 8%, rgba(57, 255, 20, 0.14), transparent 32%),
    radial-gradient(circle at 88% 4%, rgba(255, 152, 0, 0.11), transparent 28%),
    linear-gradient(135deg, ${BG} 0%, #071b21 52%, #092a20 100%)
  `,
  color: TEXT,
  minHeight: '100vh',
  paddingTop: 88,
  paddingBottom: 32,
})

const Card = styled(Box)({
  borderRadius: 24,
  border: `1px solid rgba(57, 255, 20, 0.22)`,
  background: SURFACE,
  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.18)',
})

const Eyebrow = styled(Box)({
  display: 'inline-flex',
  padding: '8px 14px',
  borderRadius: 999,
  border: `1px solid rgba(255, 152, 0, 0.45)`,
  background: 'rgba(255, 152, 0, 0.16)',
  color: PRIMARY,
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: '0.07em',
  textTransform: 'uppercase',
})

const Pill = styled(Box)({
  display: 'inline-flex',
  padding: '8px 13px',
  borderRadius: 999,
  background: SURFACE_ALT,
  border: `1px solid rgba(57, 255, 20, 0.18)`,
  fontSize: 12,
  fontWeight: 800,
})

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <Box sx={{ textAlign: 'center', maxWidth: 700, mx: 'auto', mb: 3 }}>
    <Typography
      variant="h2"
      sx={{
        fontSize: { xs: '1.85rem', md: '2.55rem' },
        fontWeight: 900,
        lineHeight: 1.12,
        letterSpacing: '-0.04em',
        mb: 1.25,
      }}
    >
      {title}
    </Typography>
    <Typography sx={{ color: MUTED, lineHeight: 1.55 }}>{subtitle}</Typography>
  </Box>
)

const screenshots = [
  {
    src: '/landing/landing_home.png',
    title: 'Início completo',
    description: 'Cotações, carteira virtual e atalhos financeiros no mesmo painel.',
  },
  {
    src: '/landing/landing_planning.png',
    title: 'Planejamento financeiro',
    description: 'Compare planejado, realizado e análises por categoria.',
  },
  {
    src: '/landing/landing_chart.png',
    title: 'Gráficos em tempo real',
    description: 'Acompanhe candles, indicadores e movimentações de mercado.',
  },
  {
    src: '/landing/landing_fire.png',
    title: 'Independência financeira',
    description: 'Simule patrimônio, rendimentos, impostos e saque sustentável.',
  },
]

const features = [
  {
    icon: AccountBalanceWalletOutlinedIcon,
    title: 'Carteira e patrimônio',
    description:
      'Organize investimentos, acompanhe saldo virtual e visualize sua composição.',
  },
  {
    icon: QueryStatsRoundedIcon,
    title: 'Mercado ao vivo',
    description:
      'Veja cotações, candles e variações com leitura rápida para tomada de decisão.',
  },
  {
    icon: EventNoteRoundedIcon,
    title: 'Planejamento mensal',
    description: 'Cadastre receitas, despesas e compare planejado versus realizado.',
  },
  {
    icon: CalculateRoundedIcon,
    title: 'Calculadoras inteligentes',
    description:
      'Simule juros compostos, independência financeira, financiamento e impostos.',
  },
]

const automationItems = [
  {
    icon: ScienceRoundedIcon,
    title: 'Ambiente virtual',
    description:
      'Teste robôs, regras e entradas sem usar dinheiro real. Ideal para validar estratégias antes de operar na conta real.',
  },
  {
    icon: AccountBalanceWalletOutlinedIcon,
    title: 'Operação real',
    description:
      'Conecte sua Binance com chaves API e acompanhe operações automatizadas em criptomoedas com saldo real.',
  },
  {
    icon: WorkspacePremiumRoundedIcon,
    title: 'Função desafio',
    description:
      'Participe de desafios com metas, saldo inicial e acompanhamento de performance para medir consistência e evolução.',
  },
]

function PhoneShot({
  src,
  alt,
  width,
  featured = false,
  sx,
}: {
  src: string
  alt: string
  width: number | string
  featured?: boolean
  sx?: object
}) {
  return (
    <Box
      sx={{
        width,
        p: 1,
        borderRadius: '30px',
        bgcolor: '#02090b',
        border: featured
          ? `1.4px solid ${PRIMARY}`
          : '1px solid rgba(255,255,255,0.16)',
        boxShadow: featured
          ? '0 18px 60px rgba(57, 255, 20, 0.22), 0 24px 70px rgba(0,0,0,0.34)'
          : '0 24px 70px rgba(0,0,0,0.34)',
        ...sx,
      }}
    >
      <Box
        component="img"
        src={src}
        alt={alt}
        sx={{ width: '100%', display: 'block', borderRadius: '22px' }}
      />
    </Box>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ElementType
  title: string
  description: string
}) {
  return (
    <Card sx={{ p: 2.5, height: '100%' }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '16px',
          bgcolor: 'rgba(57, 255, 20, 0.12)',
          display: 'grid',
          placeItems: 'center',
          mb: 2,
        }}
      >
        <Icon sx={{ color: PRIMARY, fontSize: 26 }} />
      </Box>
      <Typography sx={{ fontWeight: 900, fontSize: 17, mb: 1 }}>{title}</Typography>
      <Typography sx={{ color: MUTED, fontSize: 13, lineHeight: 1.45 }}>{description}</Typography>
    </Card>
  )
}

const LandingPage: React.FC = () => {
  const navigate = useNavigate()
  const theme = useTheme()
  const isWide = useMediaQuery(theme.breakpoints.up('md'))

  const primaryBtnSx = {
    borderRadius: 999,
    px: 2.75,
    py: 1.5,
    fontWeight: 900,
    bgcolor: PRIMARY,
    color: '#061216',
    boxShadow: '0 14px 32px rgba(57, 255, 20, 0.25)',
    '&:hover': { bgcolor: '#52ff3a', transform: 'translateY(-2px)' },
  }

  const ghostBtnSx = {
    borderRadius: 999,
    px: 2.75,
    py: 1.5,
    fontWeight: 900,
    bgcolor: 'rgba(255,255,255,0.04)',
    color: TEXT,
    border: '1px solid rgba(255,255,255,0.18)',
    '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', transform: 'translateY(-2px)' },
  }

  return (
    <PageRoot>
      <Container maxWidth="lg">
        {/* Hero */}
        <Grid container spacing={5} alignItems="center" sx={{ mb: 6.5 }}>
          <Grid item xs={12} md={6}>
            <Eyebrow sx={{ mb: 2.25 }}>
              Finanças, cripto e planejamento em um só app
            </Eyebrow>
            <Typography
              component="h1"
              sx={{
                fontSize: { xs: '2.25rem', md: '3.5rem' },
                fontWeight: 900,
                lineHeight: 1.04,
                letterSpacing: '-0.055em',
                mb: 2.25,
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              Controle seu dinheiro, acompanhe o mercado e planeje seu futuro financeiro.
            </Typography>
            <Typography
              sx={{
                color: MUTED,
                fontSize: 17,
                lineHeight: 1.65,
                mb: 3.25,
                textAlign: { xs: 'center', md: 'left' },
              }}
            >
              A EB Finance reúne carteira virtual, cotações, gráficos, calculadoras e
              planejamento financeiro em uma experiência rápida, visual e pensada para celular.
            </Typography>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.5,
                justifyContent: { xs: 'center', md: 'flex-start' },
                mb: 3.25,
              }}
            >
              <Button
                endIcon={<ArrowForwardRoundedIcon />}
                onClick={() => navigate('/login')}
                sx={primaryBtnSx}
              >
                Começar agora
              </Button>
              <Button
                endIcon={<PersonAddAlt1RoundedIcon />}
                onClick={() => navigate('/login/register')}
                sx={ghostBtnSx}
              >
                Criar conta
              </Button>
            </Box>
            <Box
              sx={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 1.25,
                justifyContent: { xs: 'center', md: 'flex-start' },
              }}
            >
              {[
                'Carteira virtual',
                'Operações automáticas',
                'Conta real',
                'Desafios',
                'Planejamento',
                'Cotações',
                'Calculadoras',
              ].map((label) => (
                <Pill key={label}>{label}</Pill>
              ))}
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Box
              sx={{
                position: 'relative',
                minHeight: { xs: 470, md: 520 },
                borderRadius: '36px',
                background:
                  'linear-gradient(135deg, rgba(57,255,20,0.33), rgba(0,154,100,0.12), transparent)',
              }}
            >
              <PhoneShot
                src="/landing/landing_planning.png"
                alt="Planejamento financeiro"
                width={isWide ? 205 : 178}
                sx={{ position: 'absolute', top: 10, left: { xs: 0, md: 12 } }}
              />
              <PhoneShot
                src="/landing/landing_chart.png"
                alt="Gráficos em tempo real"
                width={isWide ? 205 : 178}
                sx={{ position: 'absolute', top: { xs: 74, md: 56 }, right: { xs: 2, md: 28 } }}
              />
              <PhoneShot
                src="/landing/landing_home.png"
                alt="Tela inicial EB Finance"
                width={isWide ? 235 : 205}
                featured
                sx={{
                  position: 'absolute',
                  bottom: 0,
                  left: { xs: '50%', md: 136 },
                  transform: { xs: 'translateX(-50%)', md: 'none' },
                }}
              />
            </Box>
          </Grid>
        </Grid>

        {/* Recursos */}
        <Box id="recursos" sx={{ mb: 6.5, scrollMarginTop: 96 }}>
          <SectionTitle
            title="Tudo que você precisa para decidir melhor"
            subtitle="Uma página inicial inspirada no app real, com foco nos recursos que o usuário encontra após entrar."
          />
          <Grid container spacing={1.75}>
            {features.map((feature) => (
              <Grid item xs={12} sm={6} md={3} key={feature.title}>
                <FeatureCard {...feature} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Operações automatizadas */}
        <Box id="operacoes" sx={{ mb: 6.5, scrollMarginTop: 96 }}>
          <SectionTitle
            title="Operações automatizadas em criptomoedas"
            subtitle="Use a EB Finance para experimentar no modo virtual, operar em ambiente real e acompanhar sua evolução por desafios."
          />
          <Grid container spacing={1.75}>
            {automationItems.map((item) => (
              <Grid item xs={12} md={4} key={item.title}>
                <FeatureCard {...item} />
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Telas do app */}
        <Box id="app" sx={{ mb: 7, scrollMarginTop: 96 }}>
          <SectionTitle
            title="Experiência visual feita para mobile e web"
            subtitle="As principais telas ganham destaque na landing para mostrar o produto antes do login."
          />
          <Grid container spacing={1.75}>
            {screenshots.map((shot) => (
              <Grid item xs={6} md={3} key={shot.title}>
                <Card sx={{ p: 1.25, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box
                    component="img"
                    src={shot.src}
                    alt={shot.title}
                    sx={{
                      width: '100%',
                      aspectRatio: '0.52',
                      objectFit: 'cover',
                      objectPosition: 'top',
                      borderRadius: '22px',
                      mb: 1.5,
                    }}
                  />
                  <Typography sx={{ fontWeight: 900, fontSize: 14, mb: 0.5 }}>
                    {shot.title}
                  </Typography>
                  <Typography sx={{ color: MUTED, fontSize: 11, lineHeight: 1.35 }}>
                    {shot.description}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA final */}
        <Box id="acesso" sx={{ scrollMarginTop: 96 }}>
          <Box
            sx={{
              p: 3,
              borderRadius: '30px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #0d7a15, #0a4d2b)',
              border: `1px solid ${PRIMARY}`,
              boxShadow: '0 24px 54px rgba(57, 255, 20, 0.18)',
            }}
          >
            <LocalFireDepartmentRoundedIcon sx={{ color: PRIMARY, fontSize: 40, mb: 1.5 }} />
            <Typography sx={{ fontWeight: 900, fontSize: { xs: 24, md: 28 }, mb: 1.25 }}>
              Seu painel financeiro começa aqui
            </Typography>
            <Typography sx={{ color: '#d8f6d7', lineHeight: 1.5, maxWidth: 620, mx: 'auto', mb: 2.5 }}>
              Entre para acompanhar seus dados, simular cenários e planejar próximos passos.
            </Typography>
            <Button
              endIcon={<LockOpenRoundedIcon />}
              onClick={() => navigate('/login')}
              sx={{
                ...primaryBtnSx,
                bgcolor: TEXT,
                color: '#0a421a',
                '&:hover': { bgcolor: '#ffffff', transform: 'translateY(-2px)' },
              }}
            >
              Acessar EB Finance
            </Button>
          </Box>
        </Box>
      </Container>
    </PageRoot>
  )
}

export default LandingPage
