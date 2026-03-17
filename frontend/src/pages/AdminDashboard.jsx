import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/client'
import {
    Users, BarChart3, DollarSign, Activity,
    Calendar, QrCode, BarChart2, PieChart,
    RefreshCw, Sparkles, UserPlus,
    ArrowUpCircle, ArrowDownCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
    const navigate = useNavigate()

    const [stats, setStats] = useState({
        clients: {},
        revenue: {},
        visits: {},
        loyalty: {},
        breakdown_by_level: {},
        top_clients: []
    })

    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const response = await adminAPI.getStats()
            console.log('Получена статистика:', response.data)
            setStats(response.data || {})
        } catch (error) {
            toast.error('Ошибка загрузки статистики')
            console.error('Dashboard error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount || 0)
    }

    const formatPercent = (value) => {
        if (value == null) return '—'

        const isPositive = value > 0
        const isNegative = value < 0

        const color = isPositive
            ? 'text-emerald-700'
            : isNegative
                ? 'text-rose-700'
                : 'text-marso-text-muted'

        const icon = isPositive
            ? <ArrowUpCircle className="h-4 w-4" />
            : isNegative
                ? <ArrowDownCircle className="h-4 w-4" />
                : null

        return (
            <span className={`flex items-center gap-1 font-medium ${color}`}>
                {icon}
                {Math.abs(value).toFixed(1)}%
            </span>
        )
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-marso mb-4"></div>
                <p className="text-marso-text-muted">Загрузка статистики...</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

            {/* Header */}
            <div className="mb-10 flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-marso">
                        Панель управления
                    </h1>
                    <p className="text-marso-text-muted">
                        Обзор системы лояльности MarSo
                    </p>
                </div>

                <button
                    onClick={fetchDashboardData}
                    className="flex items-center px-6 py-3 bg-white border border-marso/30 text-marso font-medium rounded-xl hover:bg-marso/5 transition"
                >
                    <RefreshCw className="h-5 w-5 mr-2"/>
                    Обновить
                </button>
            </div>


            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">

                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium">
                    <div className="text-sm text-marso-text-muted">
                        Всего клиентов
                    </div>
                    <div className="text-3xl font-bold text-marso">
                        {stats.clients?.total || 0}
                    </div>

                    <div className="text-xs text-marso-text-muted mt-2 flex items-center gap-2">
                        <UserPlus className="h-4 w-4"/>
                        Новых: {stats.clients?.new_this_month || 0}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium">
                    <div className="text-sm text-marso-text-muted">
                        Выручка за месяц
                    </div>

                    <div className="text-3xl font-bold text-marso">
                        {formatCurrency(stats.revenue?.this_month)}
                    </div>

                    {formatPercent(stats.revenue?.growth_month)}
                </div>

                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium">
                    <div className="text-sm text-marso-text-muted">
                        Посещений за неделю
                    </div>

                    <div className="text-3xl font-bold text-marso">
                        {stats.visits?.this_week || 0}
                    </div>

                    <div className="text-xs mt-2">
                        Ср. чек: {formatCurrency(stats.visits?.average_check)}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium">
                    <div className="text-sm text-marso-text-muted">
                        Активные клиенты
                    </div>

                    <div className="text-3xl font-bold text-marso">
                        {stats.clients?.active_last_30_days || 0}
                    </div>

                    <div className="text-xs mt-2">
                        Отток: {formatPercent(stats.clients?.churn_rate_30_days)}
                    </div>
                </div>

            </div>


            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

                <button
                    onClick={() => navigate('/admin/scanner')}
                    className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium hover:border-marso/40 text-left"
                >
                    <QrCode className="h-10 w-10 text-marso mb-4"/>
                    <div className="font-bold text-xl">Сканирование QR</div>
                    <p className="text-marso-text-muted">
                        Обработка посещений
                    </p>
                </button>

                <button
                    onClick={() => navigate('/admin/clients')}
                    className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium text-left"
                >
                    <Users className="h-10 w-10 text-marso mb-4"/>
                    <div className="font-bold text-xl">Клиенты</div>
                    <p className="text-marso-text-muted">
                        База клиентов
                    </p>
                </button>

                <button
                    onClick={() => navigate('/admin/visits')}
                    className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium text-left"
                >
                    <Calendar className="h-10 w-10 text-marso mb-4"/>
                    <div className="font-bold text-xl">Посещения</div>
                    <p className="text-marso-text-muted">
                        История визитов
                    </p>
                </button>

            </div>


            {/* Top Clients */}
            <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium">

                <div className="flex justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-marso">
                            Топ клиентов
                        </h2>
                        <p className="text-marso-text-muted">
                            По расходам
                        </p>
                    </div>
                    <BarChart2 className="h-6 w-6 text-marso"/>
                </div>

                {stats.top_clients.length === 0 ? (
                    <div className="text-center py-10 text-marso-text-muted">
                        Нет данных
                    </div>
                ) : (
                    <div className="space-y-4">
                        {stats.top_clients.map((client, idx) => (
                            <div
                                key={idx}
                                className="p-5 bg-marso/5 rounded-xl border border-marso/10"
                            >
                                <div className="flex justify-between mb-2">
                                    <span className="font-medium text-marso">
                                        {client.phone}
                                    </span>

                                    <span className="text-sm text-marso-text-muted capitalize">
                                        {client.level}
                                    </span>
                                </div>

                                <div className="flex justify-between text-sm">
                                    <span>
                                        Потрачено:
                                        <strong className="ml-1">
                                            {formatCurrency(client.total_spent)}
                                        </strong>
                                    </span>

                                    <span>{client.visits} визитов</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

            </div>

        </div>
    )
}

export default AdminDashboard