// src/App.jsx — ИСПРАВЛЕННЫЙ ПОЛНЫЙ ФАЙЛ
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext.jsx'
import ProtectedRoute from './components/Common/ProtectedRoute.jsx'
import Layout from './components/Common/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Profile from './pages/Profile.jsx'
import LoyaltyCard from './pages/LoyaltyCard.jsx'
import AdminScanner from './pages/AdminScanner.jsx'
import AdminClients from './pages/AdminClients.jsx'
import AdminVisits from './pages/AdminVisits.jsx'
import AdminDashboard from './pages/AdminDashboard.jsx'
import AdminClientProfile from './pages/AdminClientProfile.jsx'
import './styles/global.css'

function App() {
    return (
        <AuthProvider>
            <Router>
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 4000,
                        style: {
                            background: '#363636',
                            color: '#fff',
                        },
                    }}
                />
                <Routes>
                    {/* Публичный маршрут логина */}
                    <Route path="/login" element={<Login />} />

                    {/* Защищённые роуты клиента — используем вложенность с Outlet */}
                    <Route element={
                        <ProtectedRoute>
                            <Layout />  {/* Здесь должен быть <Outlet /> внутри Layout */}
                        </ProtectedRoute>
                    }>
                        <Route path="/" element={<Dashboard />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/card" element={<LoyaltyCard />} />
                    </Route>

                    {/* Защищённые роуты админа */}
                    <Route element={
                        <ProtectedRoute adminOnly>
                            <Layout admin />  {/* Здесь тоже <Outlet /> */}
                        </ProtectedRoute>
                    }>
                        <Route path="/admin" element={<AdminDashboard />} />
                        <Route path="/admin/clients" element={<AdminClients />} />
                        <Route path="/admin/scanner" element={<AdminScanner />} />
                        <Route path="/admin/visits" element={<AdminVisits />} />
                        <Route path="/admin/clients/:id" element={<AdminClientProfile />} />
                    </Route>

                    {/* Catch-all — редирект на главную */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Router>
        </AuthProvider>
    )
}

export default App