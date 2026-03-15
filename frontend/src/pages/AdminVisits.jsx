import React, { useState, useEffect } from 'react'
import { adminAPI } from '../services/client'
import { Calendar, User, CreditCard, Plus, Filter, Search, ChevronDown, ChevronUp, Trash2, Eye, TrendingUp } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminVisits = () => {
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [showCreateForm, setShowCreateForm] = useState(false)
    const [formData, setFormData] = useState({
        phone: '',
        amount: '',
        use_bonus: false,
        bonus_amount: '',
        note: ''
    })
    const [expandedVisit, setExpandedVisit] = useState(null)
    const [sortBy, setSortBy] = useState('created_at')
    const [sortOrder, setSortOrder] = useState('desc')

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            setLoading(true)
            const response = await adminAPI.getAllClients()
            setClients(response.data)
        } catch (error) {
            toast.error('Ошибка загрузки клиентов')
        } finally {
            setLoading(false)
        }
    }

    const handleCreateVisit = async (e) => {
        e.preventDefault()
        try {
            setLoading(true)
            const data = {
                ...formData,
                amount: parseFloat(formData.amount),
                bonus_amount: formData.use_bonus ? parseFloat(formData.bonus_amount) : 0
            }

            const response = formData.use_bonus
                ? await adminAPI.createVisitWithBonus(data)
                : await adminAPI.createVisit(data)

            toast.success('Посещение успешно создано!')
            setShowCreateForm(false)
            setFormData({
                phone: '',
                amount: '',
                use_bonus: false,
                bonus_amount: '',
                note: ''
            })
            fetchClients()
        } catch (error) {
            toast.error(error.response?.data?.error || 'Ошибка создания посещения')
        } finally {
            setLoading(false)
        }
    }

    const getClientVisits = (client) => {
        // В реальном приложении здесь будет запрос к API для получения посещений клиента
        // Сейчас возвращаем заглушку
        return []
    }

    const filteredClients = clients.filter(client =>
        client.phone.includes(searchTerm) ||
        (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    const sortedClients = [...filteredClients].sort((a, b) => {
        let aValue = a[sortBy]
        let bValue = b[sortBy]

        if (sortBy === 'created_at') {
            aValue = new Date(aValue)
            bValue = new Date(bValue)
        }

        if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1
        } else {
            return aValue < bValue ? 1 : -1
        }
    })

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getLevelBadge = (level) => {
        const badges = {
            gold: { class: 'badge-gold', label: 'Gold' },
            silver: { class: 'badge-silver', label: 'Silver' },
            bronze: { class: 'badge-bronze', label: 'Bronze' }
        }
        return badges[level] || badges.bronze
    }

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Управление посещениями</h1>
                        <p className="text-gray-600 mt-2">Создание и просмотр посещений клиентов</p>
                    </div>
                    <button
                        onClick={() => setShowCreateForm(!showCreateForm)}
                        className="flex items-center px-6 py-3 bg-marso-red text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
                    >
                        <Plus className="h-5 w-5 mr-2" />
                        Новое посещение
                    </button>
                </div>
            </div>

            {/* Форма создания посещения */}
            {showCreateForm && (
                <div className="card mb-6 animate-slide-up">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900">Создание посещения</h2>
                        <button
                            onClick={() => setShowCreateForm(false)}
                            className="p-2 text-gray-500 hover:text-gray-700"
                        >
                            ✕
                        </button>
                    </div>

                    <form onSubmit={handleCreateVisit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Телефон клиента *
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="+7XXXXXXXXXX"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                                <p className="text-xs text-gray-500">
                                    Введите номер телефона клиента
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Сумма посещения (₽) *
                                </label>
                                <input
                                    type="number"
                                    value={formData.amount}
                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="1500"
                                    min="0"
                                    step="0.01"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="use_bonus"
                                    checked={formData.use_bonus}
                                    onChange={(e) => setFormData({ ...formData, use_bonus: e.target.checked })}
                                    className="h-4 w-4 text-marso-red rounded focus:ring-marso-red"
                                />
                                <label htmlFor="use_bonus" className="ml-2 text-sm font-medium text-gray-700">
                                    Списать бонусы
                                </label>
                            </div>

                            {formData.use_bonus && (
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Сумма списания бонусов (₽)
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.bonus_amount}
                                        onChange={(e) => setFormData({ ...formData, bonus_amount: e.target.value })}
                                        placeholder="100"
                                        min="0"
                                        step="0.01"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-gray-700">
                                Примечание
                            </label>
                            <textarea
                                value={formData.note}
                                onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                                placeholder="Дополнительная информация о посещении..."
                                rows="2"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                            />
                        </div>

                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={() => setShowCreateForm(false)}
                                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Отмена
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-6 py-2 bg-marso-red text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                            >
                                {loading ? 'Создание...' : 'Создать посещение'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Поиск и фильтры */}
            <div className="card mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Поиск по телефону, имени или email..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-marso-red"
                        />
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                            <Filter className="h-5 w-5 text-gray-500" />
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="created_at">По дате</option>
                                <option value="total_spent">По сумме</option>
                                <option value="balance">По балансу</option>
                                <option value="name">По имени</option>
                            </select>
                            <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="p-2 text-gray-500 hover:text-gray-700"
                            >
                                {sortOrder === 'asc' ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Список клиентов */}
            {loading ? (
                <div className="card">
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marso-red"></div>
                    </div>
                </div>
            ) : sortedClients.length === 0 ? (
                <div className="card">
                    <div className="text-center py-12">
                        <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Клиенты не найдены</h3>
                        <p className="text-gray-600">
                            {searchTerm ? 'Попробуйте изменить условия поиска' : 'Создайте первое посещение'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="space-y-4">
                    {sortedClients.map((client) => {
                        const levelBadge = getLevelBadge(client.level)
                        const visits = getClientVisits(client)

                        return (
                            <div key={client.id} className="card">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center mb-2">
                                            <User className="h-5 w-5 text-gray-500 mr-2" />
                                            <h3 className="font-bold text-gray-900">
                                                {client.name || 'Без имени'}
                                            </h3>
                                            <div className={`ml-3 badge ${levelBadge.class}`}>
                                                {levelBadge.label}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <div className="text-gray-600">Телефон</div>
                                                <div className="font-medium">{client.phone}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600">Email</div>
                                                <div className="font-medium">{client.email || 'Не указан'}</div>
                                            </div>
                                            <div>
                                                <div className="text-gray-600">Регистрация</div>
                                                <div className="font-medium">{formatDate(client.created_at)}</div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center space-x-4">
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600">Всего потрачено</div>
                                            <div className="text-xl font-bold text-gray-900">{client.total_spent || 0} ₽</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm text-gray-600">Баланс</div>
                                            <div className="text-xl font-bold text-green-600">{client.balance || 0} ₽</div>
                                        </div>
                                    </div>
                                </div>

                                {/* История посещений */}
                                {expandedVisit === client.id && visits.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-200">
                                        <h4 className="font-medium text-gray-900 mb-4">История посещений</h4>
                                        <div className="space-y-3">
                                            {visits.map((visit, index) => (
                                                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                                                    <div className="flex justify-between items-center">
                                                        <div className="font-medium">{visit.amount} ₽</div>
                                                        <div className="text-sm text-gray-600">
                                                            {formatDate(visit.created_at)}
                                                        </div>
                                                    </div>
                                                    {visit.note && (
                                                        <div className="text-sm text-gray-600 mt-1">{visit.note}</div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="flex justify-between items-center">
                                        <button
                                            onClick={() => setExpandedVisit(expandedVisit === client.id ? null : client.id)}
                                            className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                                        >
                                            <Eye className="h-4 w-4 mr-2" />
                                            {expandedVisit === client.id ? 'Скрыть историю' : 'Показать историю'}
                                        </button>

                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setFormData({
                                                        phone: client.phone,
                                                        amount: '',
                                                        use_bonus: false,
                                                        bonus_amount: '',
                                                        note: ''
                                                    })
                                                    setShowCreateForm(true)
                                                }}
                                                className="flex items-center px-4 py-2 bg-marso-red text-white rounded-lg hover:bg-red-700 text-sm"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Новое посещение
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Статистика */}
            {!loading && clients.length > 0 && (
                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="card">
                        <div className="flex items-center">
                            <CreditCard className="h-8 w-8 text-blue-500 mr-3" />
                            <div>
                                <div className="text-sm text-gray-600">Общая выручка</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {clients.reduce((sum, client) => sum + (client.total_spent || 0), 0).toLocaleString('ru-RU')} ₽
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <TrendingUp className="h-8 w-8 text-green-500 mr-3" />
                            <div>
                                <div className="text-sm text-gray-600">Накопленные бонусы</div>
                                <div className="text-2xl font-bold text-gray-900">
                                    {clients.reduce((sum, client) => sum + (client.balance || 0), 0).toLocaleString('ru-RU')} ₽
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card">
                        <div className="flex items-center">
                            <User className="h-8 w-8 text-purple-500 mr-3" />
                            <div>
                                <div className="text-sm text-gray-600">Всего клиентов</div>
                                <div className="text-2xl font-bold text-gray-900">{clients.length}</div>
                                <div className="text-xs text-gray-500 mt-1">
                                    Gold: {clients.filter(c => c.level === 'gold').length} |
                                    Silver: {clients.filter(c => c.level === 'silver').length} |
                                    Bronze: {clients.filter(c => c.level === 'bronze').length}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminVisits