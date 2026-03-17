// src/pages/AdminClients.jsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { adminAPI } from '../services/client'
import { Users, Search, Phone, Mail, Trash2, Copy, X } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminClients = () => {
    const navigate = useNavigate()

    const [clients, setClients] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterLevel, setFilterLevel] = useState('all')
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(null)

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

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
        toast.success('Скопировано')
    }

    const formatDate = (date) => {
        return new Date(date).toLocaleDateString('ru-RU')
    }

    const filteredClients = clients.filter(client => {
        const matchesSearch =
            client.phone.includes(searchTerm) ||
            (client.name && client.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (client.email && client.email.toLowerCase().includes(searchTerm.toLowerCase()))
        const matchesLevel = filterLevel === 'all' || client.level === filterLevel
        return matchesSearch && matchesLevel
    })

    return (
        <div className="max-w-7xl mx-auto">

            {/* HEADER */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Управление клиентами</h1>
                <p className="text-gray-600 mt-2">Просмотр и управление клиентами</p>
            </div>

            {/* FILTERS */}
            <div className="card mb-6">
                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"/>
                        <input
                            value={searchTerm}
                            onChange={(e)=>setSearchTerm(e.target.value)}
                            placeholder="Поиск..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg"
                        />
                    </div>

                    <select
                        value={filterLevel}
                        onChange={(e)=>setFilterLevel(e.target.value)}
                        className="border rounded-lg px-3 py-2"
                    >
                        <option value="all">Все</option>
                        <option value="gold">Gold</option>
                        <option value="silver">Silver</option>
                        <option value="bronze">Bronze</option>
                    </select>
                </div>
            </div>

            {/* TABLE */}
            <div className="bg-white rounded-xl border overflow-hidden">
                <table className="min-w-full">
                    <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs text-gray-500">Клиент</th>
                        <th className="px-6 py-3 text-left text-xs text-gray-500">Телефон</th>
                        <th className="px-6 py-3 text-left text-xs text-gray-500">Баланс</th>
                        <th className="px-6 py-3 text-left text-xs text-gray-500">Дата</th>
                        <th className="px-6 py-3 text-left text-xs text-gray-500">Действия</th>
                    </tr>
                    </thead>

                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="5" className="text-center py-12">
                                <div className="animate-spin h-10 w-10 border-b-2 border-black mx-auto"/>
                            </td>
                        </tr>
                    ) : filteredClients.map(client => (
                        <tr
                            key={client.id}
                            onClick={() => navigate(`/admin/clients/${client.id}`)} // <- переход на профиль
                            className="hover:bg-gray-50 cursor-pointer transition"
                        >
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-black text-white flex items-center justify-center rounded-lg">
                                        {client.name ? client.name[0] : client.phone[0]}
                                    </div>
                                    <div>
                                        <div className="font-medium">{client.name || 'Без имени'}</div>
                                        <div className="text-sm text-gray-500">ID {client.id.slice(0,6)}</div>
                                    </div>
                                </div>
                            </td>

                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    {client.phone}
                                    <button
                                        onClick={(e)=>{
                                            e.stopPropagation()
                                            copyToClipboard(client.phone)
                                        }}
                                    >
                                        <Copy className="h-4 w-4 text-gray-400"/>
                                    </button>
                                </div>
                            </td>

                            <td className="px-6 py-4">
                                <div className="text-green-600 font-bold">
                                    {client.balance || 0} ₽
                                </div>
                            </td>

                            <td className="px-6 py-4 text-gray-500">
                                {formatDate(client.created_at)}
                            </td>

                            <td className="px-6 py-4">
                                <button
                                    onClick={(e)=>{
                                        e.stopPropagation()
                                        setShowDeleteConfirm(client.id)
                                    }}
                                    className="text-gray-400 hover:text-red-600"
                                >
                                    <Trash2 className="h-4 w-4"/>
                                </button>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            {/* DELETE CONFIRM */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
                    <div className="bg-white p-6 rounded-xl">
                        <p className="mb-4">Удалить клиента?</p>
                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={()=>setShowDeleteConfirm(null)}
                                className="px-4 py-2 bg-gray-200 rounded"
                            >Отмена</button>
                            <button
                                onClick={()=>handleDeleteClient(showDeleteConfirm)}
                                className="px-4 py-2 bg-red-600 text-white rounded"
                            >Удалить</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    )
}

export default AdminClients