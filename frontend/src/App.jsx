import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'

import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Audience from './pages/Audience'
import Campaigns from './pages/Campaigns'
import CampaignDetail from './pages/CampaignDetail'
import Templates from './pages/Templates'
import Analytics from './pages/Analytics'
import Feedback from './pages/Feedback'
import Sentiments from './pages/Sentiments'
import CanvasStudio from './pages/CanvasStudio'
import LiveBulletins from './pages/LiveBulletins'

export default function App() {
  return (
    <AuthProvider>
      <Routes>

        {/* Public Routes */}
        <Route
          path="/"
          element={<Landing />}
        />

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/register"
          element={<Register />}
        />


        {/* Protected Routes */}

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/audience"
          element={
            <ProtectedRoute>
              <Audience />
            </ProtectedRoute>
          }
        />

        <Route
          path="/campaigns"
          element={
            <ProtectedRoute>
              <Campaigns />
            </ProtectedRoute>
          }
        />

        <Route
          path="/campaigns/create"
          element={
            <ProtectedRoute>
              <Campaigns />
            </ProtectedRoute>
          }
        />

        <Route
          path="/campaigns/:id"
          element={
            <ProtectedRoute>
              <CampaignDetail />
            </ProtectedRoute>
          }
        />

        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <Templates />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feedback"
          element={
            <ProtectedRoute>
              <Feedback />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sentiments"
          element={
            <ProtectedRoute>
              <Sentiments />
            </ProtectedRoute>
          }
        />

        <Route
          path="/canvas-studio"
          element={
            <ProtectedRoute>
              <CanvasStudio />
            </ProtectedRoute>
          }
        />

        {/* Live Bulletins */}
        <Route
          path="/live-bulletins"
          element={
            <ProtectedRoute>
              <LiveBulletins />
            </ProtectedRoute>
          }
        />

      </Routes>
    </AuthProvider>
  )
}