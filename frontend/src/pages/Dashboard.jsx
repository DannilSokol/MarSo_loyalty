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
                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-marso-red to-red-600 rounded-2xl mb-6">
                    <Sparkles className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold text-gray-900 mb-4">
                    Добро пожаловать, <span className="text-marso-red">{user?.name || 'Клиент'}!</span>
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                    Премиальная программа лояльности для постоянных клиентов барбершопа MarSo
                </p>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="card bg-gradient-to-br from-blue-50 to-blue-100">
                    <div className="flex items-center">
                        <div className="p-3 bg-blue-500 text-white rounded-xl mr-4">
                            <CreditCard className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-blue-700">Бонусный баланс</div>
                            <div className="text-2xl font-bold text-blue-900">
                                {user?.balance || 0} ₽
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-green-50 to-green-100">
                    <div className="flex items-center">
                        <div className="p-3 bg-green-500 text-white rounded-xl mr-4">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-green-700">Всего потрачено</div>
                            <div className="text-2xl font-bold text-green-900">
                                {user?.total_spent || 0} ₽
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card bg-gradient-to-br from-purple-50 to-purple-100">
                    <div className="flex items-center">
                        <div className="p-3 bg-purple-500 text-white rounded-xl mr-4">
                            <Sparkles className="h-6 w-6" />
                        </div>
                        <div>
                            <div className="text-sm text-purple-700">Уровень лояльности</div>
                            <div className="text-2xl font-bold text-purple-900 capitalize">
                                {user?.level || 'bronze'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="card">
                    <div className="flex items-center mb-6">
                        <div className="p-2 bg-marso-red text-white rounded-lg mr-3">
                            <QrCode className="h-6 w-6" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900">Ваша карта лояльности</h2>
                    </div>
                    <p className="text-gray-600 mb-6">
                        Покажите QR-код администратору при следующем посещении для начисления бонусов
                    </p>
                    <Link
                        to="/card"
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-marso-red to-red-600 text-white rounded-xl hover:from-red-700 hover:to-red-800 font-medium"
                    >
                        <QrCode className="h-5 w-5 mr-2" />
                        Открыть карту
                    </Link>
                </div>

                <div className="card">
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
                        className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-gray-900 to-black text-white rounded-xl hover:from-black hover:to-gray-900 font-medium"
                    >
                        Открыть профиль
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Dashboard