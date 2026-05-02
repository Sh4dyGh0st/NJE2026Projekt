import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Navbar from './components/Navbar'
import './index.css'

import EventListPage from './pages/EventListPage'
import EventDetailPage from './pages/EventDetailPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import QrCodePage from './pages/QrCodePage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import EventFormPage from './pages/EventFormPage'
import ParticipantListPage from './pages/ParticipantListPage'
import QrScannerPage from './pages/QrScannerPage'
import NewsFeedPage from './pages/NewsFeedPage'

import CreateAdminPage from './pages/CreateAdminPage'
import EventModulesPage from './pages/EventModulesPage'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={
            <ProtectedRoute><EventListPage /></ProtectedRoute>
          } />
          <Route path="/events/:id" element={
            <ProtectedRoute><EventDetailPage /></ProtectedRoute>
          } />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/news" element={
            <ProtectedRoute><NewsFeedPage /></ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute><ProfilePage /></ProtectedRoute>
          } />
          <Route path="/qr" element={
            <ProtectedRoute><QrCodePage /></ProtectedRoute>
          } />
          <Route path="/admin" element={
            <ProtectedRoute requiredRole="Admin"><AdminDashboardPage /></ProtectedRoute>
          } />
          <Route path="/admin/events/new" element={
            <ProtectedRoute requiredRole="Admin"><EventFormPage /></ProtectedRoute>
          } />
          <Route path="/admin/events/:id/edit" element={
            <ProtectedRoute requiredRole="Admin"><EventFormPage /></ProtectedRoute>
          } />
          <Route path="/admin/events/:id/participants" element={
            <ProtectedRoute requiredRole="Admin"><ParticipantListPage /></ProtectedRoute>
          } />
          <Route path="/admin/events/:id/modules" element={
            <ProtectedRoute requiredRole="Admin"><EventModulesPage /></ProtectedRoute>
          } />
          <Route path="/admin/scanner" element={
            <ProtectedRoute requiredRole="Admin"><QrScannerPage /></ProtectedRoute>
          } />
          {/* Secret admin creation page — no auth required for bootstrapping */}
          <Route path="/create-admin" element={<CreateAdminPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
)
