import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminAPI } from '../services/client'
import {
    ArrowLeft, User, Phone, CreditCard, TrendingUp, Calendar,
    Mail, Clock, DollarSign, Plus, X, History, Home, RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'
import LoadingSpinner from '../components/Common/LoadingSpinner'

const AdminClientProfile = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const isMounted = useRef(true)

    const [client, setClient] = useState(null)
    const [visits, setVisits] = useState([])
    const [loading, setLoading] = useState(true)

    const [showCreateVisit, setShowCreateVisit] = useState(false)
    const [visitAmount, setVisitAmount] = useState('1500')
    const [useBonus, setUseBonus] = useState(false)
    const [bonusAmount, setBonusAmount] = useState('0')

    const loadClientData = useCallback(async () => {
        if (!isMounted.current) return

        setLoading(true)

        try {
            const res = await adminAPI.getClientById(id)

            if (!isMounted.current) return

            setClient(res.data.client)
            setVisits(res.data.visits || [])
        } catch (err) {
            toast.error('Не удалось загрузить данные клиента')
            if (isMounted.current) navigate('/admin/scanner')
        } finally {
            if (isMounted.current) {
                setLoading(false)
            }
        }
    }, [id, navigate])

    useEffect(() => {
        isMounted.current = true
        loadClientData()

        return () => {
            isMounted.current = false
        }
    }, [loadClientData])

    const handleCreateVisit = async () => {
        const amount = parseFloat(visitAmount)
        const bonus = useBonus ? parseFloat(bonusAmount) : 0

        if (isNaN(amount) || amount <= 0) return toast.error('Введите сумму > 0')
        if (useBonus && bonus > (client?.balance || 0)) return toast.error('Недостаточно бонусов')

        try {
            const payload = {
                phone: client.phone,
                barber_id: 2,  // ← пока оставляем, как было (потом уберём)
                amount,
                use_bonus: useBonus,
                bonus_amount: bonus,
                note: 'Создано из админ-панели'
            }

            await adminAPI.createVisitWithBonus(payload)
            toast.success('Посещение создано!')

            setShowCreateVisit(false)
            setVisitAmount('1500')
            setUseBonus(false)
            setBonusAmount('0')

            await loadClientData()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Ошибка создания визита')
        }
    }

    // Прогресс-бар — ИЗМЕНЕНО: 7 000 → Silver (5%), 90 000 → Gold (10%)
    const getLevelProgress = () => {
        if (!client) return { current: 'bronze', next: null, progress: 0, needed: 0 }

        const spent = client.total_spent || 0

        if (spent >= 90000) {
            return { current: 'gold', next: null, progress: 100, needed: 0 }
        }

        if (spent >= 7000) {
            const toGold = 90000 - spent
            const progress = ((spent - 7000) / (90000 - 7000)) * 100
            return { current: 'silver', next: 'gold', progress, needed: toGold }
        }

        const toSilver = 7000 - spent
        const progress = (spent / 7000) * 100
        return { current: 'bronze', next: 'silver', progress, needed: toSilver }
    }

    const { current, next, progress, needed } = getLevelProgress()

    const levelColors = {
        bronze: 'bg-amber-500',
        silver: 'bg-gray-400',
        gold: 'bg-yellow-500'
    }

    const levelTextColors = {
        bronze: 'text-amber-800',
        silver: 'text-gray-700 font-medium',
        gold: 'text-yellow-700 font-bold'
    }

    const formatDate = (date) => new Date(date).toLocaleString('ru-RU', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    })

    const formatCurrency = (amt) => new Intl.NumberFormat('ru-RU', {
        style: 'currency', currency: 'RUB', minimumFractionDigits: 0
    }).format(amt || 0)

    const getLevelBadge = (level) => {
        const styles = {
            gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            silver: 'bg-gray-100 text-gray-800 border-gray-300',
            bronze: 'bg-amber-100 text-amber-800 border-amber-300',
        }
        const s = styles[level] || styles.bronze
        return (
            <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium border ${s}`}>
                {level.charAt(0).toUpperCase() + level.slice(1)}
            </span>
        )
    }

    if (loading) return <LoadingSpinner size="lg" text="Загрузка профиля..." />

    if (!client) {
        return (
            <div className="text-center py-20">
                <User size={64} className="mx-auto text-gray-400 mb-6" />
                <h2 className="text-2xl font-bold mb-4">Клиент не найден</h2>
                <Link to="/admin/scanner" className="text-marso hover:underline">
                    Вернуться к сканеру →
                </Link>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">

            {/* Навигация */}
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link to="/admin" className="hover:text-marso flex items-center gap-1">
                    <Home size={16} /> Панель
                </Link>
                <span>›</span>
                <Link to="/admin/clients" className="hover:text-marso">Клиенты</Link>
                <span>›</span>
                <span className="text-marso font-medium">Профиль</span>
            </nav>

            {/* Заголовок */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {client.name || client.phone}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        ID: {id.slice(0,8)}...
                    </p>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2"
                    >
                        <ArrowLeft size={18} /> Назад
                    </button>
                    <button
                        onClick={() => setShowCreateVisit(true)}
                        className="px-6 py-2.5 bg-marso text-white rounded-xl hover:bg-marso-dark flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={18} /> Визит
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">

                    {/* Карточка клиента + прогресс-бар */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <div className="flex items-center gap-6 mb-8">
                            <div className="w-20 h-20 bg-marso/10 rounded-2xl flex items-center justify-center">
                                <User size={32} className="text-marso" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{client.name || 'Без имени'}</h2>
                                <p className="text-gray-600 mt-1">{client.phone}</p>
                            </div>
                        </div>

                        {/* Прогресс-бар */}
                        <div className="mb-8">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-600">
                                    Текущий уровень: <span className={`font-bold ${levelTextColors[current]}`}>{current.toUpperCase()}</span>
                                </span>
                                {next && (
                                    <span className="text-sm font-medium text-gray-600">
                                        До {next.toUpperCase()}: <strong>{formatCurrency(needed)}</strong>
                                    </span>
                                )}
                            </div>

                            <div className="h-5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                <div
                                    className={`h-full transition-all duration-1000 ease-out ${levelColors[current]}`}
                                    style={{ width: `${Math.min(progress, 100)}%` }}
                                />
                            </div>

                            {next ? (
                                <div className="mt-2 text-xs text-gray-500 text-center">
                                    Осталось {formatCurrency(needed)} до уровня {next.toUpperCase()}
                                </div>
                            ) : (
                                <div className="mt-2 text-xs text-yellow-700 text-center font-medium">
                                    Максимальный уровень достигнут ✨
                                </div>
                            )}
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <div className="text-sm text-gray-600">Баланс бонусов</div>
                                <div className="text-2xl font-bold text-emerald-700">
                                    {formatCurrency(client.balance)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm text-gray-600">Всего потрачено</div>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(client.total_spent)}
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="text-sm text-gray-600">Посещений</div>
                                <div className="text-2xl font-bold">{visits.length}</div>
                            </div>
                        </div>
                    </div>

                    {/* История посещений — колонка "Списано бонусами" */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                            <History size={20} /> История посещений
                        </h2>

                        {visits.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                Посещений пока нет
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Дата</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Сумма</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Списано бонусами</th>
                                        <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Примечание</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {visits.map(v => (
                                        <tr key={v.id} className="border-b hover:bg-gray-50">
                                            <td className="py-4 px-4">{formatDate(v.created_at)}</td>
                                            <td className="py-4 px-4 font-medium">{formatCurrency(v.amount)}</td>
                                            <td className="py-4 px-4">
                                                {v.bonus_amount && v.bonus_amount > 0 ? (
                                                    <span className="text-marso font-medium">
                                                        {formatCurrency(v.bonus_amount)}
                                                    </span>
                                                ) : (
                                                    '—'
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-gray-600">{v.note || '—'}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Боковая панель */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold mb-4">Действия</h3>
                        <div className="space-y-3">
                            <button
                                onClick={() => setShowCreateVisit(true)}
                                className="w-full bg-marso text-white py-3 rounded-xl hover:bg-marso-dark"
                            >
                                + Новый визит
                            </button>
                            <button
                                onClick={loadClientData}
                                className="w-full border border-gray-300 py-3 rounded-xl hover:bg-gray-50 flex items-center justify-center gap-2"
                            >
                                <RefreshCw size={18} /> Обновить
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Модалка */}
            {showCreateVisit && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold">Новый визит</h3>
                            <button onClick={() => setShowCreateVisit(false)}>
                                <X size={24} className="text-gray-500 hover:text-black" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="p-4 bg-blue-50 rounded-xl text-sm">
                                Клиент: <strong>{client.phone}</strong><br />
                                Бонусов: <strong>{formatCurrency(client.balance)}</strong>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Сумма (₽)</label>
                                <input
                                    type="number"
                                    value={visitAmount}
                                    onChange={e => setVisitAmount(e.target.value)}
                                    className="w-full px-4 py-3 border rounded-xl focus:ring-marso focus:border-marso"
                                    min="500"
                                    step="100"
                                />
                            </div>

                            {client.balance > 0 && (
                                <>
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={useBonus}
                                            onChange={e => setUseBonus(e.target.checked)}
                                            className="w-5 h-5 text-marso"
                                        />
                                        Списать бонусы
                                    </label>

                                    {useBonus && (
                                        <div>
                                            <label className="block text-sm font-medium mb-2">Сумма списания</label>
                                            <input
                                                type="number"
                                                value={bonusAmount}
                                                onChange={e => setBonusAmount(e.target.value)}
                                                className="w-full px-4 py-3 border rounded-xl focus:ring-marso focus:border-marso"
                                                max={client.balance}
                                                step="50"
                                            />
                                        </div>
                                    )}
                                </>
                            )}

                            <div className="flex gap-4 mt-8">
                                <button
                                    onClick={handleCreateVisit}
                                    className="flex-1 bg-marso text-white py-3 rounded-xl hover:bg-marso-dark"
                                >
                                    Создать
                                </button>
                                <button
                                    onClick={() => setShowCreateVisit(false)}
                                    className="flex-1 border py-3 rounded-xl hover:bg-gray-50"
                                >
                                    Отмена
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminClientProfile