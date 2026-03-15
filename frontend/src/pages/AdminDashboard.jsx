import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/client'
import {
    Users, TrendingUp, CreditCard, Calendar,
    QrCode, BarChart3, DollarSign, Activity,
    ChevronRight, RefreshCw, Sparkles, UserPlus,
    ArrowUpCircle, ArrowDownCircle, BarChart2, PieChart
} from 'lucide-react'
import toast from 'react-hot-toast'

const AdminDashboard = () => {
    const navigate = useNavigate()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const response = await adminAPI.getStats()
            console.log('Получена статистика:', response.data) // для дебага — смотри в консоли
            setStats(response.data || {})
        } catch (error) {
            toast.error('Ошибка загрузки статистики')
            console.error('Dashboard error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency: 'RUB',
            minimumFractionDigits: 0
        }).format(amount || 0)
    }

    const formatPercent = (value, isGrowth = false) => {
        if (value == null) return '—'
        const isPositive = value > 0
        const isNegative = value < 0
        const color = isPositive ? 'text-emerald-700' : isNegative ? 'text-rose-700' : 'text-marso-text-muted'
        const icon = isPositive ? <ArrowUpCircle className="h-4 w-4" /> :
            isNegative ? <ArrowDownCircle className="h-4 w-4" /> : null
        return (
            <span className={`flex items-center gap-1 font-medium ${color}`}>
                {icon}
                {Math.abs(value).toFixed(1)}%
            </span>
        )
    }

    // Защита от null
    const safeStats = stats || {}
    const hasData = Object.keys(safeStats).length > 0

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px]">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-marso mb-4"></div>
                <p className="text-marso-text-muted">Загрузка статистики...</p>
            </div>
        )
    }

    if (!hasData) {
        return (
            <div className="text-center py-12">
                <BarChart3 className="h-16 w-16 text-marso-text-muted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-marso-text">Нет данных</h3>
                <p className="text-sm text-marso-text-muted mt-2">Совершите первые визиты — статистика появится автоматически</p>
            </div>
        )
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-serif font-bold text-marso tracking-tight">Панель управления</h1>
                        <p className="mt-2 text-marso-text-muted">Обзор системы лояльности MarSo</p>
                    </div>
                    <button
                        onClick={fetchDashboardData}
                        disabled={loading}
                        className="flex items-center px-6 py-3 bg-white border border-marso/30 text-marso font-medium rounded-xl hover:bg-marso/5 transition-colors shadow-sm disabled:opacity-50"
                    >
                        <RefreshCw className={`h-5 w-5 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Обновить
                    </button>
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium hover:shadow-premium-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-marso-text-muted mb-1">Всего клиентов</div>
                            <div className="text-3xl font-bold text-marso">{safeStats.clients?.total || 0}</div>
                            <div className="text-xs text-marso-text-muted mt-2 flex items-center gap-2">
                                <UserPlus className="h-4 w-4 text-marso/70" />
                                Новых: <span className="text-marso font-medium">{safeStats.clients?.new_this_month || 0}</span> за месяц
                            </div>
                        </div>
                        <div className="p-4 bg-marso/5 rounded-xl">
                            <Users className="h-8 w-8 text-marso" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium hover:shadow-premium-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-marso-text-muted mb-1">Выручка за месяц</div>
                            <div className="text-3xl font-bold text-marso">{formatCurrency(safeStats.revenue?.this_month)}</div>
                            <div className="text-xs mt-2">
                                {formatPercent(safeStats.revenue?.growth_month, true)} к прошлому месяцу
                            </div>
                        </div>
                        <div className="p-4 bg-marso/5 rounded-xl">
                            <DollarSign className="h-8 w-8 text-marso" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium hover:shadow-premium-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-marso-text-muted mb-1">Посещений за неделю</div>
                            <div className="text-3xl font-bold text-marso">{safeStats.visits?.this_week || 0}</div>
                            <div className="text-xs text-marso-text-muted mt-2">
                                Ср. чек: <span className="text-marso font-medium">{formatCurrency(safeStats.visits?.average_check)}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-marso/5 rounded-xl">
                            <Calendar className="h-8 w-8 text-marso" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium hover:shadow-premium-lg transition-all duration-300">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-marso-text-muted mb-1">Активные клиенты</div>
                            <div className="text-3xl font-bold text-marso">{safeStats.clients?.active_last_30_days || 0}</div>
                            <div className="text-xs mt-2">
                                Отток: {formatPercent(safeStats.clients?.churn_rate_30_days)}
                            </div>
                        </div>
                        <div className="p-4 bg-marso/5 rounded-xl">
                            <Activity className="h-8 w-8 text-marso" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <button
                    onClick={() => navigate('/admin/scanner')}
                    className="group bg-white rounded-2xl border border-marso/20 p-8 shadow-premium hover:shadow-premium-lg hover:border-marso/40 transition-all duration-300 text-left"
                >
                    <div className="flex items-start">
                        <div className="p-5 bg-marso/5 rounded-xl mr-6 group-hover:bg-marso/10 transition-colors">
                            <QrCode className="h-10 w-10 text-marso" />
                        </div>
                        <div>
                            <div className="font-bold text-marso-text text-xl mb-2">Сканирование QR</div>
                            <p className="text-marso-text-muted">Обработка посещений в реальном времени</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/admin/clients')}
                    className="group bg-white rounded-2xl border border-marso/20 p-8 shadow-premium hover:shadow-premium-lg hover:border-marso/40 transition-all duration-300 text-left"
                >
                    <div className="flex items-start">
                        <div className="p-5 bg-marso/5 rounded-xl mr-6 group-hover:bg-marso/10 transition-colors">
                            <Users className="h-10 w-10 text-marso" />
                        </div>
                        <div>
                            <div className="font-bold text-marso-text text-xl mb-2">Управление клиентами</div>
                            <p className="text-marso-text-muted">Полный список и профили</p>
                        </div>
                    </div>
                </button>

                <button
                    onClick={() => navigate('/admin/visits')}
                    className="group bg-white rounded-2xl border border-marso/20 p-8 shadow-premium hover:shadow-premium-lg hover:border-marso/40 transition-all duration-300 text-left"
                >
                    <div className="flex items-start">
                        <div className="p-5 bg-marso/5 rounded-xl mr-6 group-hover:bg-marso/10 transition-colors">
                            <Calendar className="h-10 w-10 text-marso" />
                        </div>
                        <div>
                            <div className="font-bold text-marso-text text-xl mb-2">Посещения</div>
                            <p className="text-marso-text-muted">История и создание визитов</p>
                        </div>
                    </div>
                </button>
            </div>

            {/* Detailed Stats */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Revenue Breakdown */}
                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-marso">Выручка</h2>
                            <p className="text-marso-text-muted">Анализ доходов</p>
                        </div>
                        <BarChart3 className="h-6 w-6 text-marso" />
                    </div>

                    <div className="space-y-5">
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Сегодня</span>
                            <span className="font-medium text-marso">{formatCurrency(safeStats.revenue?.today)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Эта неделя</span>
                            <span className="font-medium text-marso">{formatCurrency(safeStats.revenue?.this_week)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Этот месяц</span>
                            <span className="font-medium text-marso">{formatCurrency(safeStats.revenue?.this_month)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-marso-text-muted">Всего</span>
                            <span className="font-bold text-marso text-lg">{formatCurrency(safeStats.revenue?.total)}</span>
                        </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-marso/10">
                        <div className="text-sm text-marso-text-muted mb-2">Рост</div>
                        <div className="flex justify-between text-sm">
                            <span>Неделя: {formatPercent(safeStats.revenue?.growth_week, true)}</span>
                            <span>Месяц: {formatPercent(safeStats.revenue?.growth_month, true)}</span>
                        </div>
                    </div>
                </div>

                {/* Visits Breakdown */}
                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-marso">Посещения</h2>
                            <p className="text-marso-text-muted">Активность клиентов</p>
                        </div>
                        <BarChart2 className="h-6 w-6 text-marso" />
                    </div>

                    <div className="space-y-5">
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Сегодня</span>
                            <span className="font-medium text-marso">{safeStats.visits?.today || 0}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Эта неделя</span>
                            <span className="font-medium text-marso">{safeStats.visits?.this_week || 0}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Этот месяц</span>
                            <span className="font-medium text-marso">{safeStats.visits?.this_month || 0}</span>
                        </div>
                        <div className="flex justify-between items-center pt-3">
                            <span className="text-marso-text-muted">Средний чек</span>
                            <span className="font-bold text-marso">{formatCurrency(safeStats.visits?.average_check)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Clients and Loyalty */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                {/* Clients Stats */}
                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-marso">Клиенты</h2>
                            <p className="text-marso-text-muted">Анализ базы</p>
                        </div>
                        <PieChart className="h-6 w-6 text-marso" />
                    </div>

                    <div className="space-y-5">
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Всего</span>
                            <span className="font-medium text-marso">{safeStats.clients?.total || 0}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Новых за месяц</span>
                            <span className="font-medium text-marso">{safeStats.clients?.new_this_month || 0}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Активных (30 дней)</span>
                            <span className="font-medium text-marso">{safeStats.clients?.active_last_30_days || 0}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Средний LTV</span>
                            <span className="font-bold text-marso">{formatCurrency(safeStats.clients?.avg_ltv)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-marso-text-muted">Отток (30 дней)</span>
                            {formatPercent(safeStats.clients?.churn_rate_30_days)}
                        </div>
                    </div>
                </div>

                {/* Loyalty Stats */}
                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-marso">Программа лояльности</h2>
                            <p className="text-marso-text-muted">Бонусы и использование</p>
                        </div>
                        <Sparkles className="h-6 w-6 text-marso" />
                    </div>

                    <div className="space-y-5">
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Всего бонусов</span>
                            <span className="font-bold text-marso">{formatCurrency(safeStats.loyalty?.total_balance)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Начислено за месяц</span>
                            <span className="font-medium text-emerald-700">+{formatCurrency(safeStats.loyalty?.accrued_this_month)}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-marso/10">
                            <span className="text-marso-text-muted">Использовано за месяц</span>
                            <span className="font-medium text-rose-700">-{formatCurrency(safeStats.loyalty?.redeemed_this_month)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-marso-text-muted">Сгорело за месяц</span>
                            <span className="font-medium text-amber-700">-{formatCurrency(safeStats.loyalty?.expired_this_month)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Breakdown by Level */}
            <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium mb-12">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-marso">Распределение по уровням</h2>
                        <p className="text-marso-text-muted">Клиенты и выручка</p>
                    </div>
                    <BarChart3 className="h-6 w-6 text-marso" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-marso/5 rounded-xl text-center border border-marso/10">
                        <div className="text-5xl mb-3">🥉</div>
                        <div className="text-xl font-bold text-marso mb-1">Bronze</div>
                        <div className="text-marso-text-muted mb-2">{safeStats.breakdown_by_level?.bronze?.clients || 0} клиентов</div>
                        <div className="text-lg font-medium text-marso">{formatCurrency(safeStats.breakdown_by_level?.bronze?.revenue)}</div>
                    </div>

                    <div className="p-6 bg-marso/5 rounded-xl text-center border border-marso/10">
                        <div className="text-5xl mb-3">🥈</div>
                        <div className="text-xl font-bold text-marso mb-1">Silver</div>
                        <div className="text-marso-text-muted mb-2">{safeStats.breakdown_by_level?.silver?.clients || 0} клиентов</div>
                        <div className="text-lg font-medium text-marso">{formatCurrency(safeStats.breakdown_by_level?.silver?.revenue)}</div>
                    </div>

                    <div className="p-6 bg-marso/5 rounded-xl text-center border border-marso/10">
                        <div className="text-5xl mb-3">🥇</div>
                        <div className="text-xl font-bold text-marso mb-1">Gold</div>
                        <div className="text-marso-text-muted mb-2">{safeStats.breakdown_by_level?.gold?.clients || 0} клиентов</div>
                        <div className="text-lg font-medium text-marso">{formatCurrency(safeStats.breakdown_by_level?.gold?.revenue)}</div>
                    </div>
                </div>
            </div>

            {/* Top Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Top Clients */}
                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-marso">Топ клиентов</h2>
                            <p className="text-marso-text-muted">По расходам</p>
                        </div>
                        <BarChart2 className="h-6 w-6 text-marso" />
                    </div>

                    {safeStats.top_clients?.length === 0 ? (
                        <div className="text-center py-12 text-marso-text-muted">Нет данных</div>
                    ) : (
                        <div className="space-y-4">
                            {safeStats.top_clients.map((client, idx) => (
                                <div key={idx} className="p-5 bg-marso/5 rounded-xl border border-marso/10">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="font-medium text-marso">{client.phone}</span>
                                        <span className="text-sm text-marso-text-muted capitalize">{client.level}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-marso-text-muted">
                                        <span>Потрачено: <strong className="text-marso">{formatCurrency(client.total_spent)}</strong></span>
                                        <span>{client.visits} визитов</span>
                                    </div>
                                    <div className="text-xs text-marso-text-muted mt-2">
                                        Последний визит: {client.last_visit || '—'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Top Barbers */}
                <div className="bg-white rounded-2xl border border-marso/20 p-8 shadow-premium">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-2xl font-serif font-bold text-marso">Топ мастеров</h2>
                            <p className="text-marso-text-muted">По выручке</p>
                        </div>
                        <BarChart2 className="h-6 w-6 text-marso" />
                    </div>

                    {safeStats.top_barbers?.length === 0 ? (
                        <div className="text-center py-12 text-marso-text-muted">Нет данных</div>
                    ) : (
                        <div className="space-y-4">
                            {safeStats.top_barbers.map((barber, idx) => (
                                <div key={idx} className="p-5 bg-marso/5 rounded-xl border border-marso/10">
                                    <div className="font-medium text-marso mb-2">{barber.name}</div>
                                    <div className="flex justify-between text-sm text-marso-text-muted mb-1">
                                        <span>Выручка: <strong className="text-marso">{formatCurrency(barber.revenue)}</strong></span>
                                        <span>{barber.visits} визитов</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-marso-text-muted">
                                        <span>Ср. чек: <strong className="text-marso">{formatCurrency(barber.avg_check)}</strong></span>
                                        <span>Топ клиент: {barber.top_client || '—'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard