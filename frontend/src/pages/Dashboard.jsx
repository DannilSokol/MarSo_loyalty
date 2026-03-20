// src/pages/Dashboard.jsx — исправленный полный файл

import React from 'react'
import { useAuth } from '../context/AuthContext'
import { Link } from 'react-router-dom'
import { CreditCard, TrendingUp, QrCode, Sparkles } from 'lucide-react'

const Dashboard = () => {
    const { user } = useAuth()

    return (
        <div className="max-w-6xl mx-auto">
            {/* Welcome section */}
            <div className="text-center mb-12">
                <div className="inline-flex items-center justify-center p-3 bg-[#501822] text-white rounded-2xl mb-6">
                    <Sparkles className="h-8 w-8" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Добро пожаловать, <span className="text-[#501822]">{user?.name || 'Клиент'}!</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Премиальная программа лояльности для постоянных клиентов барбершопа MarSo
                </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card bg-white border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-[#501822]/10 text-[#501822] rounded-xl mr-4">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Бонусный баланс</div>
                            <div className="text-2xl font-bold text-[#501822]">
                                {user?.balance || 0} ₽
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-white border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-[#501822]/10 text-[#501822] rounded-xl mr-4">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Всего потрачено</div>
                            <div className="text-2xl font-bold text-[#501822]">
                                {user?.total_spent || 0} ₽
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-white border border-gray-200">
                    <div className="flex items-center">
                        <div className="p-3 bg-[#501822]/10 text-[#501822] rounded-xl mr-4">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-600">Уровень лояльности</div>
                            <div className="text-2xl font-bold text-[#501822] capitalize">
                                {user?.level || 'bronze'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card bg-white border border-gray-200">
                    <div className="flex items-center mb-6">
                        <div className="p-2 bg-[#501822] text-white rounded-lg mr-3">
                            <QrCode className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Ваша карта лояльности</h2>
                    </div>
                    <p className="text-gray-600 mb-6">
                        Покажите QR-код администратору при следующем посещении для начисления бонусов
                    </p>
                    <Link
                        to="/card"
                        className="inline-flex items-center px-6 py-3 bg-[#501822] text-white rounded-xl font-medium hover:bg-[#3e1420] transition"
                    >
                        <QrCode className="h-5 w-5 mr-2" />
                        Открыть карту
                    </Link>
                </div>

                <div className="card bg-white border border-gray-200">
                    <div className="flex items-center mb-6">
                        <div className="p-2 bg-gray-900 text-white rounded-lg mr-3">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Статистика</h2>
                    </div>
                    <p className="text-gray-600 mb-6">
                        Отслеживайте ваши посещения, накопленные бонусы и прогресс по уровням
                    </p>
                    <Link
                        to="/profile"
                        className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl font-medium hover:bg-black transition"
                    >
                        Открыть профиль
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Dashboard