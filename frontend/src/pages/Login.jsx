import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Scissors, Smartphone, Lock, ArrowRight, Sparkles, Coffee } from 'lucide-react'
import toast from 'react-hot-toast'

const Login = () => {
    const [phone, setPhone] = useState('')
    const [adminLogin, setAdminLogin] = useState('')
    const [adminPassword, setAdminPassword] = useState('')
    const [isAdminMode, setIsAdminMode] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const { loginClient, loginAdmin } = useAuth()
    const navigate = useNavigate()

    const formatPhone = (value) => {
        // Простая маска: +7 (XXX) XXX-XX-XX
        let val = value.replace(/\D/g, '')
        if (val.startsWith('7') || val.startsWith('8')) val = val.substring(1)
        if (val.length > 10) val = val.substring(0, 10)

        let formatted = '+7'
        if (val.length > 0) formatted += ' (' + val.substring(0, 3)
        if (val.length > 3) formatted += ') ' + val.substring(3, 6)
        if (val.length > 6) formatted += '-' + val.substring(6, 8)
        if (val.length > 8) formatted += '-' + val.substring(8, 10)

        return formatted
    }

    const handlePhoneChange = (e) => {
        const formatted = formatPhone(e.target.value)
        setPhone(formatted)
    }

    const handleClientLogin = async (e) => {
        e.preventDefault()

        // Убираем пробелы, скобки, тире для отправки на бэк
        const cleanPhone = phone.replace(/\D/g, '')
        if (cleanPhone.length !== 11 || !cleanPhone.startsWith('7')) {
            toast.error('Введите корректный номер +7XXXXXXXXXX')
            return
        }

        setIsLoading(true)
        try {
            const result = await loginClient(`+${cleanPhone}`)
            if (result.success) {
                toast.success('Добро пожаловать в MarSo!')
                navigate('/profile')
            }
        } catch (err) {
            // toast уже показывает ошибку внутри loginClient
        } finally {
            setIsLoading(false)
        }
    }

    const handleAdminLogin = async (e) => {
        e.preventDefault()
        if (!adminLogin || !adminPassword) {
            toast.error('Заполните все поля')
            return
        }

        setIsLoading(true)
        try {
            const result = await loginAdmin(adminLogin, adminPassword)
            if (result.success) {
                toast.success('Администратор авторизован')
                navigate('/admin/scanner')
            }
        } catch (err) {
            // toast уже внутри loginAdmin
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-marso-900 to-marso-dark">
            <div className="w-full max-w-md">
                {/* Логотип и заголовок */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-marso rounded-2xl shadow-premium mx-auto mb-6 transform hover:scale-105 transition-transform">
                        <Scissors className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-serif font-bold text-white tracking-tight">
                        MarSo
                    </h1>
                    <p className="mt-3 text-lg text-marso-300">
                        Премиальная программа лояльности
                    </p>
                </div>

                {/* Переключатель режимов */}
                <div className="flex justify-center mb-8">
                    <div className="inline-flex rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 p-1.5">
                        <button
                            onClick={() => setIsAdminMode(false)}
                            className={`px-6 py-3 text-sm font-medium rounded-lg transition-all ${
                                !isAdminMode
                                    ? 'bg-white text-marso-dark shadow-premium'
                                    : 'text-white/80 hover:text-white'
                            }`}
                        >
                            Клиент
                        </button>
                        <button
                            onClick={() => setIsAdminMode(true)}
                            className={`px-6 py-3 text-sm font-medium rounded-lg transition-all ${
                                isAdminMode
                                    ? 'bg-marso text-white shadow-premium'
                                    : 'text-white/80 hover:text-white'
                            }`}
                        >
                            Администратор
                        </button>
                    </div>
                </div>

                {/* Форма */}
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-premium border border-marso-border/50 overflow-hidden">
                    <div className="p-8 md:p-10">
                        {!isAdminMode ? (
                            <form onSubmit={handleClientLogin} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-marso-text-muted mb-2">
                                        Номер телефона
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="tel"
                                            value={phone}
                                            onChange={handlePhoneChange}
                                            placeholder="+7 (XXX) XXX-XX-XX"
                                            className="w-full px-5 py-4 bg-marso-50 border border-marso-border rounded-xl focus:ring-2 focus:ring-marso focus:border-transparent outline-none text-marso-text font-medium"
                                            required
                                        />
                                        <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-marso" />
                                    </div>
                                    <p className="mt-2 text-xs text-marso-text-muted">
                                        При первом входе аккаунт создаётся автоматически
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                                            <span>Вход...</span>
                                        </>
                                    ) : (
                                        <>
                                            Войти в программу
                                            <ArrowRight className="h-5 w-5" />
                                        </>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleAdminLogin} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-marso-text-muted mb-2">
                                        Логин администратора
                                    </label>
                                    <input
                                        type="text"
                                        value={adminLogin}
                                        onChange={(e) => setAdminLogin(e.target.value)}
                                        placeholder="admin"
                                        className="w-full px-5 py-4 bg-marso-50 border border-marso-border rounded-xl focus:ring-2 focus:ring-marso focus:border-transparent outline-none text-marso-text font-medium"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-marso-text-muted mb-2">
                                        Пароль
                                    </label>
                                    <input
                                        type="password"
                                        value={adminPassword}
                                        onChange={(e) => setAdminPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="w-full px-5 py-4 bg-marso-50 border border-marso-border rounded-xl focus:ring-2 focus:ring-marso focus:border-transparent outline-none text-marso-text font-medium"
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full" />
                                            <span>Вход...</span>
                                        </>
                                    ) : (
                                        'Войти в панель управления'
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    {/* Нижняя подсказка */}
                    <div className="px-8 py-5 bg-marso-50 border-t border-marso-border text-center text-sm text-marso-text-muted">
                        {!isAdminMode ? (
                            <p>Покажите QR-код мастеру при посещении и получайте бонусы</p>
                        ) : (
                            <p className="flex items-center justify-center gap-2">
                                <Coffee className="h-4 w-4" />
                                Демо: admin / marso123
                            </p>
                        )}
                    </div>
                </div>

                {/* Декоративные элементы */}
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-marso/10 rounded-full blur-3xl -z-10" />
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-marso/5 rounded-full blur-3xl -z-10" />
            </div>
        </div>
    )
}

export default Login