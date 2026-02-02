// src/App.tsx

import React, { useEffect, useState } from 'react'
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
  Outlet,
} from 'react-router-dom'
import { useSelector, useDispatch } from 'react-redux'
import { selectAuth, login } from './features/auth/authSlice'

import ConfirmEmail from './features/auth/ConfirmEmail'
import LoginPage from './features/auth'            // wrapper com <Outlet/>
import UserLogin from './features/auth/UserLogin'
import ChangePassword from './features/auth/ChangePassword'
import Register from './features/auth/resgister'
import GoogleRedirectHandler from './features/auth/GoogleRedirectHandler'

import Navbar from './components/Navbar/Navbar'
import HeroSection from './features/Home/sections/Hero/Hero'
import AboutSection from './features/Home/sections/About/AboutSection'
import StrategySection from './features/Home/sections/Strategy/Strategy'
import Operations from './features/Home/sections/Operations/Operations'
import PricingPlans from './features/Home/sections/Plans/Plans'
import Footer from './components/Footer/Footer'

import ProjectDetail from './features/ProjectDetail/ProjectDetail'
import Home from './features'
import Users from './features/users'
import TesterApproval from './features/admin/TesterApproval'
import PaymentTab from './features/payment/paymentTab'
import ChangePasswordAlt from './features/ChangePassword'
import About from './features/about/About'

import { ThemeProvider } from './themeContext'
import Calculate from './features/calculate/calculate'
import TradingPage from './features/Graph/TradingPage'
import AllPositionsPage from './features/Graph/AllPositionsPage'
import Wallet from './features/Wallet'
import Bot from './features/Bots'
import BotDetailsPage from './features/Bots/BotDetailsPage'
import Challenge from './features/challenge'
import ChallengeTradingPage from './features/challenge/ChallengeTradingPage'
import FullRankingPage from './features/challenge/FullRankingPage'
import ChallengeHistoryPage from './features/challenge/ChallengeHistoryPage'
import ChallengeDetailsPage from './features/challenge/ChallengeDetailsPage'
import TokenHistoryPage from './features/challenge/TokenHistoryPage'
import Historical from './features/historical'
import BackTest from './features/backTest'
import BacktestResultsPage from './features/backTest/BacktestResultsPage'
import BacktestChartPage from './features/backTest/BacktestChartPage'
import UsersDashboard from './features/UsersDashboard'
import ChatPage from './features/chat/ChatPage'

const Landing = () => (
  <>
    <HeroSection />
    <AboutSection />
    <StrategySection />
    <Operations />
    <PricingPlans />
    <Footer />
  </>
)

const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isAuthenticated } = useSelector(selectAuth)
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const Layout: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()

  // Rola suavemente ao mudar hash
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 50)
      }
    }
  }, [location.hash])

  const onScrollTo = (id: string) => {
    if (location.pathname === '/') {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' })
        return
      }
    }
    navigate(`/#${id}`)
  }

  const onLogin = () => {
    navigate('/login')
  }

  return (
    <>
      <Navbar onScrollTo={onScrollTo} onLogin={onLogin} />
      <Outlet />
    </>
  )
}

export default function App() {
  const dispatch = useDispatch()
  const [isReady, setIsReady] = useState(false)

  // 1) Rehidrata auth a partir do localStorage
  useEffect(() => {
    const storedToken = localStorage.getItem('authToken')
    if (storedToken) {
      dispatch(login({ token: storedToken }))
    }
    setIsReady(true)
  }, [dispatch])

  if (!isReady) return null

  return (
    <ThemeProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/projects/:projectId" element={<ProjectDetail />} />

          <Route path="/login/*" element={<LoginPage />}>
            <Route index element={<UserLogin />} />
            <Route path="password" element={<ChangePassword />} />
            <Route path="register" element={<Register />} />
            <Route path="confirm" element={<ConfirmEmail />} />
            {/* Rota de callback do Google OAuth */}
            <Route path="google-redirect" element={<GoogleRedirectHandler />} />
          </Route>

          <Route
            path="/home/*"
            element={
              <RequireAuth>
                <Home />
              </RequireAuth>
            }
          >
            <Route index element={<Home />} />
            <Route path="tradingPage" element={<TradingPage />} />
            <Route path="allPositions" element={<AllPositionsPage />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="bots" element={<Bot />} />
            <Route path="bots/config" element={<Bot />} />
            <Route path="bots/config/:botId" element={<Bot />} />
            <Route path="bots/:botId/details" element={<BotDetailsPage />} />
            <Route path="users" element={<Users />} />
            <Route path="admin/tester-approval" element={<TesterApproval />} />
            <Route path="payment" element={<PaymentTab />} />
            <Route path="calculate" element={<Calculate />} />
            <Route path="changePasswordAlt" element={<ChangePasswordAlt />} />
            <Route path="about" element={<About />} />
            <Route path="challenge/ranking" element={<FullRankingPage />} />
            <Route path="challenge/:challengeId/details" element={<ChallengeDetailsPage />} />
            <Route path="challenge/:challengeId/trading" element={<ChallengeTradingPage />} />
            <Route path="challenge/:challengeId/history" element={<ChallengeHistoryPage />} />
            <Route path="challenge" element={<Challenge />} />
            <Route path="token-history" element={<TokenHistoryPage />} />
            <Route path="historical" element={<Historical />} />
            <Route path="backTest" element={<BackTest />} />
            <Route path="backTest/results/:resultId" element={<BacktestResultsPage />} />
            <Route path="backTest/results/:resultId/chart" element={<BacktestChartPage />} />
            <Route path="usersDashboard" element={<UsersDashboard />} />
            <Route path="chat" element={<ChatPage />} />
          </Route>
        </Route>
      </Routes>
    </ThemeProvider>
  )
}
