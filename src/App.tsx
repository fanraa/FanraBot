import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';

// Pages
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import DashboardHome from './pages/DashboardHome';
import ConnectWhatsApp from './pages/ConnectWhatsApp';
import AIProviderPage from './pages/AIProviderPage';
import AIRouterPage from './pages/AIRouterPage';
import BotSettings from './pages/BotSettings';
import BotCommands from './pages/BotCommands';
import AutomationPage from './pages/AutomationPage';
import ConversationsPage from './pages/ConversationsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import RewardsPage from './pages/RewardsPage';
import LogsPage from './pages/LogsPage';
import AccountPage from './pages/AccountPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<AuthPage initialMode="login" />} />
        <Route path="/register" element={<AuthPage initialMode="register" />} />
        <Route path="/verify" element={<AuthPage initialMode="otp" />} />

        {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="connect" element={<ConnectWhatsApp />} />
          <Route path="providers" element={<AIProviderPage />} />
          <Route path="router" element={<AIRouterPage />} />
          <Route path="settings" element={<BotSettings />} />
          <Route path="commands" element={<BotCommands />} />
          <Route path="automation" element={<AutomationPage />} />
          <Route path="conversations" element={<ConversationsPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="rewards" element={<RewardsPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="account" element={<AccountPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

