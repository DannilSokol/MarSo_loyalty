import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { adminAPI } from '../services/client'
import { ArrowLeft, User, History, Plus, X, Home } from 'lucide-react'
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
    const [note, setNote] = useState('') // можно потом вывести поле для ввода

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
            if (isMounted.current) navigate('/admin/clients')
        } finally {
            if (isMounted.current) setLoading(false)
        }
    }, [id, navigate])

    useEffect(() => {
        isMounted.current = true
        loadClientData()
        return () => { isMounted.current = false }
    }, [loadClientData])

    const handleCreateVisit = async (e) => {
        e.preventDefault()

        const amountNum = Number(visitAmount)
        const bonusNum = useBonus ? Number(bonusAmount) : 0

        if (isNaN(amountNum) || amountNum <= 0) {
            toast.error('Сумма должна быть больше 0')
            return
        }

        if (useBonus && bonusNum > (client?.balance || 0)) {
            toast.error('Недостаточно бонусов на балансе')
            return
        }

        try {
            const payload = {
                phone: client.phone,               // обязательно — бэкенд скорее всего ищет по телефону
                amount: amountNum,
                use_bonus: useBonus,
                bonus_amount: bonusNum,
                note: note.trim() || 'Добавлено из профиля администратором',
            }

            // Для отладки — можно убрать позже
            console.log('Отправка визита:', payload)

            await adminAPI.createVisitWithBonus(payload)  // ← правильный метод и эндпоинт

            toast.success('Визит успешно добавлен')
            setShowCreateVisit(false)
            setVisitAmount('1500')
            setUseBonus(false)
            setBonusAmount('0')
            setNote('')
            loadClientData() // обновляем данные клиента и список визитов
        } catch (err) {
            console.error('Ошибка создания визита:', err)
            const errorMsg = err.response?.data?.error ||
                err.response?.data?.message ||
                'Ошибка при добавлении визита'
            toast.error(errorMsg)
        }
    }

    if (loading) return <LoadingSpinner size="lg" text="Загрузка профиля..." />

    if (!client) return (
        <div className="text-center py-20">
            <User size={64} className="mx-auto text-gray-400 mb-6" />
            <h2 className="text-2xl font-bold mb-4">Клиент не найден</h2>
            <Link to="/admin/clients" className="text-marso hover:underline">Вернуться к клиентам →</Link>
        </div>
    )

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
                <Link to="/admin" className="hover:text-marso flex items-center gap-1">
                    <Home size={16}/> Панель
                </Link>
                <span>›</span>
                <Link to="/admin/clients" className="hover:text-marso">Клиенты</Link>
                <span>›</span>
                <span className="text-marso font-medium">Профиль</span>
            </nav>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">{client.name || client.phone}</h1>
                    <p className="text-gray-600 mt-1">ID: {id.slice(0,8)}...</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 flex items-center gap-2"
                    >
                        <ArrowLeft size={18}/> Назад
                    </button>
                    <button
                        onClick={() => setShowCreateVisit(true)}
                        className="px-6 py-2.5 bg-marso text-white rounded-xl hover:bg-marso-dark flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={18}/> Визит
                    </button>
                </div>
            </div>

            {/* Карточка клиента */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm mb-8">
                <div className="flex items-center gap-6 mb-8">
                    <div className="w-20 h-20 bg-marso/10 rounded-2xl flex items-center justify-center">
                        <User size={32} className="text-marso"/>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold">{client.name || 'Без имени'}</h2>
                        <p className="text-gray-600 mt-1">{client.phone}</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <div className="text-sm text-gray-600">Баланс бонусов</div>
                        <div className="text-2xl font-bold text-emerald-700">{client.balance}</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm text-gray-600">Всего потрачено</div>
                        <div className="text-2xl font-bold">{client.total_spent}</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm text-gray-600">Посещений</div>
                        <div className="text-2xl font-bold">{visits.length}</div>
                    </div>
                </div>
            </div>

            {/* История посещений */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                    <History size={20}/> История посещений
                </h2>
                {visits.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">Посещений пока нет</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4 text-sm text-gray-600">Дата</th>
                                <th className="text-left py-3 px-4 text-sm text-gray-600">Сумма</th>
                                <th className="text-left py-3 px-4 text-sm text-gray-600">Списано бонусами</th>
                                <th className="text-left py-3 px-4 text-sm text-gray-600">Примечание</th>
                            </tr>
                            </thead>
                            <tbody>
                            {visits.map(v => (
                                <tr key={v.id} className="border-b hover:bg-gray-50">
                                    <td className="py-4 px-4">{new Date(v.created_at).toLocaleString('ru-RU')}</td>
                                    <td className="py-4 px-4 font-medium">{v.amount} ₽</td>
                                    <td className="py-4 px-4">{v.bonus_amount > 0 ? `${v.bonus_amount} ₽` : '—'}</td>
                                    <td className="py-4 px-4 text-gray-600">{v.note || '—'}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Модальное окно "Новый визит" */}
            {showCreateVisit && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 px-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-8 shadow-2xl border border-gray-200">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Новый визит</h3>
                            <button
                                onClick={() => setShowCreateVisit(false)}
                                className="text-gray-500 hover:text-gray-900 transition-colors"
                            >
                                <X size={28} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateVisit} className="space-y-6">
                            <div>
                                <label className="block text-sm text-gray-700 font-medium mb-2">
                                    Сумма визита (₽)
                                </label>
                                <input
                                    type="number"
                                    value={visitAmount}
                                    onChange={e => setVisitAmount(e.target.value)}
                                    className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-marso focus:border-transparent"
                                    min="0"
                                    step="100"
                                    required
                                />
                            </div>

                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    id="useBonus"
                                    checked={useBonus}
                                    onChange={e => setUseBonus(e.target.checked)}
                                    className="w-5 h-5 text-marso border-gray-300 rounded focus:ring-marso"
                                />
                                <label htmlFor="useBonus" className="text-gray-700 font-medium">
                                    Списать бонусами
                                </label>
                            </div>

                            {useBonus && (
                                <div>
                                    <label className="block text-sm text-gray-700 font-medium mb-2">
                                        Сумма бонусов (₽)
                                    </label>
                                    <input
                                        type="number"
                                        value={bonusAmount}
                                        onChange={e => setBonusAmount(e.target.value)}
                                        className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-marso focus:border-transparent"
                                        min="0"
                                        max={client.balance || 0}
                                        step="10"
                                        required={useBonus}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Доступно на балансе: {client.balance} ₽
                                    </p>
                                </div>
                            )}

                            {/* Опционально — можно раскомментировать */}
                            {/* <div>
                                <label className="block text-sm text-gray-700 font-medium mb-2">
                                    Примечание
                                </label>
                                <textarea
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    className="w-full px-5 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-marso focus:border-transparent min-h-[80px]"
                                    placeholder="Дополнительная информация..."
                                />
                            </div> */}

                            <div className="flex gap-4 mt-8">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateVisit(false)}
                                    className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
                                >
                                    Отмена
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 bg-marso text-white rounded-xl hover:bg-marso-dark transition-colors font-medium shadow-sm"
                                >
                                    Добавить визит
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminClientProfile