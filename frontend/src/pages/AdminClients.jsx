import React, { useState, useEffect } from 'react'
import { adminAPI } from '../services/client'
import { Users, UserPlus, Search, Filter, Mail, Phone, Calendar, CreditCard, TrendingUp, Trash2, Eye, ChevronDown, ChevronUp, Copy } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminClients = () => {
    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [sortBy, setSortBy] = useState('created_at')
    const [sortOrder, setSortOrder] = useState('desc')
    const [filterLevel, setFilterLevel] = useState('all')
    const [selectedClient, setSelectedClient] = useState(null)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

    useEffect(() => {
        fetchClients()
    }, [])

    const fetchClients = async () => {
        try {
            setLoading(true)
            const response = await adminAPI.getAllClients()
            setClients(response.data) // API возвращает массив клиентов
        } catch (error) {
            toast.error('Ошибка загрузки клиентов')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteClient = async (clientId) => {
        try {
            await adminAPI.deleteClient(clientId)
            toast.success('Клиент удалён')
            fetchClients()
            setShowDeleteConfirm(null)
        } catch (error) {
            toast.error('Ошибка удаления клиента')
        }
    }

    const filteredClients = clients.filter(client => {
        // Поиск
        const matchesSearch =
            client.phone.includes(searchTerm) ||
            (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))

        // Фильтр по уровню
        const matchesLevel = filterLevel === 'all' || client.level === filterLevel

        return matchesSearch && matchesLevel
    })

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

    const getLevelBadge = (level) => {
        const badges = {
            gold: { class: 'badge-gold', label: 'Gold', color: 'text-yellow-600' },
            silver: { class: 'badge-silver', label: 'Silver', color: 'text-gray-600' },
            bronze: { class: 'badge-bronze', label: 'Bronze', color: 'text-amber-700' }
        }
        return badges[level] || badges.bronze
    }

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        })
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        toast.success('Скопировано в буфер обмена')
    }

    const getLevelStats = () => {
        const stats = {
            total: clients.length,
            gold: clients.filter(c => c.level === 'gold').length,
            silver: clients.filter(c => c.level === 'silver').length,
            bronze: clients.filter(c => c.level === 'bronze').length
        }

        stats.goldPercent = stats.total > 0 ? Math.round((stats.gold / stats.total) * 100) : 0
        stats.silverPercent = stats.total > 0 ? Math.round((stats.silver / stats.total) * 100) : 0
        stats.bronzePercent = stats.total > 0 ? Math.round((stats.bronze / stats.total) * 100) : 0

        return stats
    }

    const levelStats = getLevelStats()

    return (
        <div className="max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Управление клиентами</h1>
                <p className="text-gray-600 mt-2">Просмотр и управление всеми клиентами системы</p>
            </div>

            {/* Статистика */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="card">
                    <div className="flex items-center">
                        <Users className="h-8 w-8 text-blue-500 mr-3" />
                        <div>
                            <div className="text-sm text-gray-600">Всего клиентов</div>
                            <div className="text-2xl font-bold text-gray-900">{levelStats.total}</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="h-8 w-8 bg-yellow-100 text-yellow-600 rounded-lg flex items-center justify-center mr-3">
                            🥇
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Gold клиенты</div>
                            <div className="text-2xl font-bold text-gray-900">{levelStats.gold}</div>
                            <div className="text-xs text-gray-500">{levelStats.goldPercent}%</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="h-8 w-8 bg-gray-100 text-gray-600 rounded-lg flex items-center justify-center mr-3">
                            🥈
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Silver клиенты</div>
                            <div className="text-2xl font-bold text-gray-900">{levelStats.silver}</div>
                            <div className="text-xs text-gray-500">{levelStats.silverPercent}%</div>
                        </div>
                    </div>
                </div>

                <div className="card">
                    <div className="flex items-center">
                        <div className="h-8 w-8 bg-amber-100 text-amber-600 rounded-lg flex items-center justify-center mr-3">
                            🥉
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Bronze клиенты</div>
                            <div className="text-2xl font-bold text-gray-900">{levelStats.bronze}</div>
                            <div className="text-xs text-gray-500">{levelStats.bronzePercent}%</div>
                        </div>
                    </div>
                </div>
            </div>

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
                                value={filterLevel}
                                onChange={(e) => setFilterLevel(e.target.value)}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="all">Все уровни</option>
                                <option value="gold">Gold</option>
                                <option value="silver">Silver</option>
                                <option value="bronze">Bronze</option>
                            </select>
                        </div>

                        <div className="flex items-center space-x-2">
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
                        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">Клиенты не найдены</h3>
                        <p className="text-gray-600">
                            {searchTerm || filterLevel !== 'all' ? 'Попробуйте изменить условия поиска' : 'Клиенты ещё не зарегистрированы'}
                        </p>
                    </div>
                </div>
            ) : (
                <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Клиент
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Контакты
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Статистика
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Уровень
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Дата
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Действия
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                            {sortedClients.map((client) => {
                                const levelBadge = getLevelBadge(client.level)

                                return (
                                    <tr key={client.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 bg-gradient-to-br from-gray-900 to-black rounded-lg flex items-center justify-center text-white font-bold">
                                                    {client.name ? client.name.charAt(0).toUpperCase() : client.phone.charAt(0)}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-gray-900">
                                                        {client.name || 'Без имени'}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        ID: {client.id.substring(0, 8)}...
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center text-sm">
                                                    <Phone className="h-4 w-4 text-gray-400 mr-2" />
                                                    <span className="font-medium">{client.phone}</span>
                                                    <button
                                                        onClick={() => copyToClipboard(client.phone)}
                                                        className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                                                    >
                                                        <Copy className="h-3 w-3" />
                                                    </button>
                                                </div>
                                                {client.email && (
                                                    <div className="flex items-center text-sm text-gray-600">
                                                        <Mail className="h-4 w-4 text-gray-400 mr-2" />
                                                        {client.email}
                                                        <button
                                                            onClick={() => copyToClipboard(client.email)}
                                                            className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                                                        >
                                                            <Copy className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center text-sm">
                                                        <CreditCard className="h-4 w-4 text-blue-500 mr-2" />
                                                        <span className="text-gray-600">Потрачено:</span>
                                                    </div>
                                                    <span className="font-bold">{client.total_spent || 0} ₽</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center text-sm">
                                                        <TrendingUp className="h-4 w-4 text-green-500 mr-2" />
                                                        <span className="text-gray-600">Баланс:</span>
                                                    </div>
                                                    <span className="font-bold text-green-600">{client.balance || 0} ₽</span>
                                                </div>
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className={`badge ${levelBadge.class} ${levelBadge.color}`}>
                                                {levelBadge.label}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1">
                                                {client.level === 'gold' ? '10%' :
                                                    client.level === 'silver' ? '5%' : '3%'} кэшбэк
                                            </div>
                                        </td>

                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="flex items-center">
                                                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                                                {formatDate(client.created_at)}
                                            </div>
                                        </td>

                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => setSelectedClient(selectedClient?.id === client.id ? null : client)}
                                                    className="p-2 text-gray-400 hover:text-gray-600"
                                                    title="Просмотр"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </button>

                                                <button
                                                    onClick={() => setShowDeleteConfirm(client.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600"
                                                    title="Удалить"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Модальное окно удаления */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Подтверждение удаления</h3>
                        <p className="text-gray-600 mb-6">
                            Вы уверены, что хотите удалить этого клиента? Все данные будут удалены безвозвратно.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Отмена
                            </button>
                            <button
                                onClick={() => handleDeleteClient(showDeleteConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Панель деталей клиента */}
            {selectedClient && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900">Детали клиента</h3>
                                <p className="text-gray-600">Полная информация о клиенте</p>
                            </div>
                            <button
                                onClick={() => setSelectedClient(null)}
                                className="p-2 text-gray-400 hover:text-gray-600"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">ID клиента</div>
                                        <div className="font-mono bg-gray-100 p-2 rounded-lg">
                                            {selectedClient.id}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Имя</div>
                                        <div className="font-medium">{selectedClient.name || 'Не указано'}</div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Телефон</div>
                                        <div className="font-medium">{selectedClient.phone}</div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Email</div>
                                        <div className="font-medium">{selectedClient.email || 'Не указан'}</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Дата регистрации</div>
                                        <div className="font-medium">{formatDate(selectedClient.created_at)}</div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Уровень лояльности</div>
                                        <div className={`badge ${getLevelBadge(selectedClient.level).class}`}>
                                            {selectedClient.level}
                                        </div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Всего потрачено</div>
                                        <div className="text-2xl font-bold">{selectedClient.total_spent || 0} ₽</div>
                                    </div>

                                    <div>
                                        <div className="text-sm text-gray-600 mb-1">Бонусный баланс</div>
                                        <div className="text-2xl font-bold text-green-600">{selectedClient.balance || 0} ₽</div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-3">Кэшбэк по уровням</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-600">Текущий уровень ({selectedClient.level}):</span>
                                        <span className="font-medium">
                      {selectedClient.level === 'gold' ? '10%' :
                          selectedClient.level === 'silver' ? '5%' : '3%'} кэшбэк
                    </span>
                                    </div>

                                    {selectedClient.level !== 'gold' && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-600">До следующего уровня:</span>
                                            <span className="font-medium">
                        {selectedClient.level === 'bronze'
                            ? `${7000 - (selectedClient.total_spent || 0)} ₽ до Silver`
                            : `${50000 - (selectedClient.total_spent || 0)} ₽ до Gold`
                        }
                      </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-200">
                                <button
                                    onClick={() => {
                                        copyToClipboard(selectedClient.id)
                                        setSelectedClient(null)
                                    }}
                                    className="w-full flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                >
                                    <Copy className="h-4 w-4 mr-2" />
                                    Копировать ID клиента
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default AdminClients