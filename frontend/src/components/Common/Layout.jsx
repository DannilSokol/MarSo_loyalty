import React, { useState } from 'react'
import { Outlet, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Scissors, LogOut, User, QrCode, Menu, X } from 'lucide-react'

const Layout = ({ admin = false }) => {
    const { user, logout, isAdmin } = useAuth()
    const navigate = useNavigate()
    const [isMenuOpen, setIsMenuOpen] = useState(false)

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const closeMenu = () => setIsMenuOpen(false)

    return (
        <div className="min-h-screen bg-marso-bg flex flex-col">
            {/* Header */}
            <header className="bg-white border-b border-marso-border sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16 sm:h-20">
                        {/* Logo */}
                        <Link to={admin ? '/admin' : '/'} className="flex items-center gap-3 group">
                            <div className="p-2 bg-marso text-white rounded-xl group-hover:scale-105 transition-transform">
                                <Scissors className="h-6 w-6 sm:h-7 sm:w-7" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-serif font-bold text-marso-text tracking-tight">
                                    MarSo
                                </h1>
                                <p className="text-xs text-marso-text-muted font-medium hidden sm:block">
                                    {admin ? 'Панель управления' : 'Программа лояльности'}
                                </p>
                            </div>
                        </Link>

                        {/* Desktop Navigation */}
                        <nav className="hidden md:flex items-center gap-8 lg:gap-10">
                            {admin ? (
                                <>
                                    <NavLink to="/admin" label="Дашборд" />
                                    <NavLink to="/admin/clients" label="Клиенты" />
                                    <NavLink to="/admin/scanner" label="Сканер" />
                                </>
                            ) : (
                                <>
                                    <NavLink to="/" label="Главная" />
                                    <NavLink to="/profile" label="Профиль" />
                                    <NavLink to="/card" label="Карта" />
                                </>
                            )}
                        </nav>

                        {/* Right side: user info + logout + burger */}
                        <div className="flex items-center gap-4 sm:gap-6">
                            {/* User name - hidden on very small screens */}
                            <div className="text-right hidden sm:block">
                                <div className="font-medium text-marso-text text-sm">
                                    {admin ? 'Администратор' : user?.name || user?.phone || 'Клиент'}
                                </div>
                                <div className="text-xs text-marso-text-muted">
                                    {admin ? 'Управление' : 'Личный кабинет'}
                                </div>
                            </div>

                            {/* Logout button */}
                            <button
                                onClick={handleLogout}
                                className="p-2 text-marso-text-muted hover:text-marso hover:bg-marso-50 rounded-xl transition-colors"
                                title="Выйти"
                            >
                                <LogOut className="h-5 w-5" />
                            </button>

                            {/* Burger menu button - visible only on mobile */}
                            <button
                                className="md:hidden text-marso-text p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                onClick={() => setIsMenuOpen(!isMenuOpen)}
                                aria-label="Открыть меню"
                            >
                                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu dropdown */}
                {isMenuOpen && (
                    <div className="md:hidden border-t border-gray-200 bg-white shadow-lg">
                        <nav className="flex flex-col px-4 py-5 space-y-4 text-base font-medium">
                            {admin ? (
                                <>
                                    <MobileNavLink to="/admin" label="Дашборд" onClick={closeMenu} />
                                    <MobileNavLink to="/admin/clients" label="Клиенты" onClick={closeMenu} />
                                    <MobileNavLink to="/admin/scanner" label="Сканер" onClick={closeMenu} />
                                </>
                            ) : (
                                <>
                                    <MobileNavLink to="/" label="Главная" onClick={closeMenu} />
                                    <MobileNavLink to="/profile" label="Профиль" onClick={closeMenu} />
                                    <MobileNavLink to="/card" label="Карта" onClick={closeMenu} />
                                </>
                            )}

                            {/* Mobile user info */}
                            <div className="pt-4 border-t border-gray-200 text-sm text-gray-600">
                                {admin ? 'Администратор' : user?.name || user?.phone || 'Клиент'}
                            </div>
                        </nav>
                    </div>
                )}
            </header>

            {/* Main content */}
            <main className="flex-1">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
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

// Desktop Nav Link
const NavLink = ({ to, label }) => (
    <Link
        to={to}
        className="text-marso-text font-medium hover:text-marso transition-colors relative group"
    >
        {label}
        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-marso group-hover:w-full transition-all duration-300" />
    </Link>
)

// Mobile Nav Link
const MobileNavLink = ({ to, label, onClick }) => (
    <Link
        to={to}
        onClick={onClick}
        className="block py-3 px-4 text-marso-text hover:bg-marso-50 hover:text-marso rounded-lg transition-colors"
    >
        {label}
    </Link>
)

export default Layout