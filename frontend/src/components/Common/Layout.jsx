// src/components/Common/Layout.jsx
import React from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Scissors, LogOut, User, QrCode } from 'lucide-react'

const Layout = ({ admin = false }) => {
    const { user, logout, isAdmin } = useAuth()
    const navigate = useNavigate()

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    return (
        <div className="min-h-screen bg-marso-bg flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-marso-border sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        {/* Logo */}
                        <Link to={admin ? '/admin' : '/'} className="flex items-center gap-3 group">
                            <div className="p-2.5 bg-marso text-white rounded-xl group-hover:scale-105 transition-transform">
                                <Scissors className="h-7 w-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-serif font-bold text-marso-text tracking-tight">
                                    MarSo
                                </h1>
                                <p className="text-xs text-marso-text-muted font-medium">
                                    {admin ? 'Панель управления' : 'Программа лояльности'}
                                </p>
                            </div>
                        </Link>

                        {/* Navigation */}
                        <nav className="hidden md:flex items-center gap-10">
                            {admin ? (
                                <>
                                    <NavLink to="/admin" label="Дашборд" />
                                    <NavLink to="/admin/clients" label="Клиенты" />
                                    <NavLink to="/admin/scanner" label="Сканер" />
                                    {/* <NavLink to="/admin/visits" label="Посещения" /> */}
                                </>
                            ) : (
                                <>
                                    <NavLink to="/" label="Главная" />
                                    <NavLink to="/profile" label="Профиль" />
                                    <NavLink to="/card" label="Карта" />
                                </>
                            )}
                        </nav>

                        {/* User area */}
                        <div className="flex items-center gap-6">
                            <div className="text-right hidden sm:block">
                                <div className="font-medium text-marso-text">
                                    {admin ? 'Администратор' : user?.name || user?.phone || 'Клиент'}
                                </div>
                                <div className="text-xs text-marso-text-muted">
                                    {admin ? 'Управление' : 'Личный кабинет'}
                                </div>
                            </div>

                            <button
                                onClick={handleLogout}
                                className="p-2.5 text-marso-text-muted hover:text-marso hover:bg-marso-50 rounded-xl transition-colors"
                                title="Выйти"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main content */}
            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
                    <Outlet />
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-marso-border mt-auto">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-marso-text-muted">
                    <p>© {new Date().getFullYear()} MarSo Barber Shop. Все права защищены.</p>
                    <p className="mt-1">Система лояльности • Премиум-уровень</p>
                </div>
            </footer>
        </div>
    )
}

// Вспомогательный компонент для навигации
const NavLink = ({ to, label }) => (
    <Link
        to={to}
        className="text-marso-text font-medium hover:text-marso transition-colors relative group"
    >
        {label}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-marso group-hover:w-full transition-all duration-300" />
    </Link>
)

export default Layout