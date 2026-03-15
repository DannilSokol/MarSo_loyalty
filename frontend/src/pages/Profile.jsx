// src/pages/Profile.jsx
import React, { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { clientAPI } from '../services/client'
import { User, Phone, Mail, Calendar, CreditCard, TrendingUp, Edit2, Save, X, Award } from 'lucide-react'
import toast from 'react-hot-toast'

const Profile = () => {
    const { user, updateUserData } = useAuth()
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [editData, setEditData] = useState({ name: '', email: '' })

    // Загружаем профиль при монтировании и после каждого успешного сохранения
    const fetchProfile = async () => {
        try {
            setLoading(true)
            const response = await clientAPI.getProfile()
            const freshData = response.data
            setProfile(freshData)
            setEditData({
                name: freshData.name || '',
                email: freshData.email || ''
            })
            // Синхронизируем глобальный user
            updateUserData(freshData)
        } catch (error) {
            toast.error('Ошибка загрузки профиля')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchProfile()
    }, []) // только при первом рендере

    const handleSaveProfile = async () => {
        try {
            await clientAPI.updateProfile(editData)
            toast.success('Профиль обновлён')

            // Самый надёжный способ — перезагружаем все данные с сервера
            await fetchProfile()

            setIsEditing(false)
        } catch (error) {
            toast.error('Ошибка обновления профиля')
            console.error(error)
        }
    }

    const getLevelInfo = (level) => {
        const levels = {
            bronze: {
                next: 'Silver',
                threshold: 15000,
                color: 'from-amber-400 to-amber-600',
                bg: 'from-amber-50 to-amber-100',
                text: 'text-amber-800'
            },
            silver: {
                next: 'Gold',
                threshold: 90000,
                color: 'from-gray-400 to-gray-700',
                bg: 'from-gray-50 to-gray-200',
                text: 'text-gray-800'
            },
            gold: {
                next: null,
                threshold: null,
                color: 'from-yellow-400 to-yellow-600',
                bg: 'from-yellow-50 to-yellow-100',
                text: 'text-yellow-800'
            }
        }
        return levels[level] || levels.bronze
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marso"></div>
            </div>
        )
    }

    if (!profile) {
        return (
            <div className="text-center py-12">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">Профиль не найден</h3>
            </div>
        )
    }

    const levelInfo = getLevelInfo(profile.level)
    const currentSpent = profile.total_spent || 0
    const progress = levelInfo.threshold
        ? Math.min(100, Math.round((currentSpent / levelInfo.threshold) * 100))
        : 100
    const remaining = levelInfo.threshold ? Math.max(0, levelInfo.threshold - currentSpent) : 0

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Мой профиль</h1>
                <p className="text-gray-600 mt-2">Управляйте данными и отслеживайте прогресс</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Основная информация */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Личная информация</h2>
                                <p className="text-gray-600 text-sm mt-1">Основные данные профиля</p>
                            </div>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
                            >
                                {isEditing ? (
                                    <>
                                        <X className="h-4 w-4 mr-2" />
                                        Отмена
                                    </>
                                ) : (
                                    <>
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Редактировать
                                    </>
                                )}
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Телефон</label>
                                    <div className="text-gray-900 font-medium p-3 bg-gray-50 rounded-xl">{profile.phone}</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Дата регистрации</label>
                                    <div className="text-gray-900 p-3 bg-gray-50 rounded-xl">
                                        {new Date(profile.created_at).toLocaleDateString('ru-RU')}
                                    </div>
                                </div>
                            </div>

                            {isEditing ? (
                                <div className="space-y-4 pt-6 border-t border-gray-200">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Имя</label>
                                        <input
                                            type="text"
                                            value={editData.name}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-marso focus:border-marso outline-none"
                                            placeholder="Ваше имя"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <input
                                            type="email"
                                            value={editData.email}
                                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-marso focus:border-marso outline-none"
                                            placeholder="email@example.com"
                                        />
                                    </div>

                                    <button
                                        onClick={handleSaveProfile}
                                        className="w-full bg-marso text-white py-3 px-6 rounded-xl hover:bg-marso-dark transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <Save className="h-4 w-4" />
                                        Сохранить изменения
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-200">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Имя</label>
                                        <div className="text-gray-900 p-3 bg-gray-50 rounded-xl">
                                            {profile.name || 'Не указано'}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                        <div className="text-gray-900 p-3 bg-gray-50 rounded-xl">
                                            {profile.email || 'Не указан'}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Прогресс до следующего уровня */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                            <Award className="h-6 w-6 text-marso" />
                            Прогресс лояльности
                        </h2>

                        {levelInfo.next ? (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">
                    Текущий уровень: <strong className="text-marso capitalize">{profile.level}</strong>
                  </span>
                                    <span className="font-medium text-marso">
                    {progress}% до {levelInfo.next}
                  </span>
                                </div>

                                <div className="h-5 bg-gray-100 rounded-full overflow-hidden shadow-inner">
                                    <div
                                        className={`h-full transition-all duration-1000 ease-out bg-gradient-to-r ${levelInfo.color}`}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>

                                <div className="text-center text-sm text-gray-600 mt-2">
                                    Осталось <strong className="text-marso font-medium">{remaining.toLocaleString('ru-RU')} ₽</strong> до уровня {levelInfo.next}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 text-yellow-600 rounded-full mb-4">
                                    <Award className="h-8 w-8" />
                                </div>
                                <h3 className="text-xl font-bold text-yellow-800 mb-2">Максимальный уровень достигнут</h3>
                                <p className="text-gray-600">Вы — Gold клиент MarSo ✨</p>
                            </div>
                        )}
                    </div>

                    {/* Статистика */}
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
                        <h2 className="text-xl font-bold text-gray-900 mb-6">Ваши показатели</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
                                <TrendingUp className="h-10 w-10 text-blue-600 mx-auto mb-3" />
                                <div className="text-2xl font-bold text-blue-900">{currentSpent.toLocaleString('ru-RU')} ₽</div>
                                <div className="text-sm text-blue-700 mt-1">Всего потрачено</div>
                            </div>

                            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
                                <CreditCard className="h-10 w-10 text-green-600 mx-auto mb-3" />
                                <div className="text-2xl font-bold text-green-900">{profile.balance?.toLocaleString('ru-RU') || 0} ₽</div>
                                <div className="text-sm text-green-700 mt-1">Бонусный баланс</div>
                            </div>

                            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
                                <Award className="h-10 w-10 text-purple-600 mx-auto mb-3" />
                                <div className="text-2xl font-bold text-purple-900 capitalize">{profile.level}</div>
                                <div className="text-sm text-purple-700 mt-1">Текущий уровень</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Правая колонка */}
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-gray-900 to-black text-white rounded-2xl p-8 shadow-xl">
                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <div className="text-sm text-gray-400">MarSo Loyalty</div>
                                <div className="text-2xl font-bold mt-1">Клиентская карта</div>
                            </div>
                            <div className={`px-4 py-1.5 rounded-full text-sm font-medium ${
                                profile.level === 'gold' ? 'bg-yellow-500 text-black' :
                                    profile.level === 'silver' ? 'bg-gray-300 text-black' :
                                        'bg-amber-600 text-white'
                            }`}>
                                {profile.level.toUpperCase()}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <div className="text-xs text-gray-400">Телефон</div>
                                <div className="font-medium">{profile.phone}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-400">Бонусы</div>
                                <div className="text-3xl font-bold text-yellow-400">
                                    {profile.balance?.toLocaleString('ru-RU') || 0} ₽
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-700 text-xs text-gray-400 flex justify-between">
                            <div>ID: {profile.id?.slice(0, 8).toUpperCase()}...</div>
                            <div>С {new Date(profile.created_at).toLocaleDateString('ru-RU')}</div>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Award className="h-5 w-5 text-marso" />
                            Уровни программы
                        </h3>

                        <div className="space-y-4">
                            {['bronze', 'silver', 'gold'].map(lvl => {
                                const isCurrent = lvl === profile.level
                                const info = getLevelInfo(lvl)
                                return (
                                    <div
                                        key={lvl}
                                        className={`p-4 rounded-xl border ${
                                            isCurrent
                                                ? 'border-marso bg-marso/5'
                                                : 'border-gray-200 bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {lvl === 'bronze' ? '🥉' : lvl === 'silver' ? '🥈' : '🥇'}
                        </span>
                                                <div>
                                                    <div className="font-medium capitalize">{lvl}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {lvl === 'bronze' ? '3%' : lvl === 'silver' ? '5%' : '10%'} кэшбэк
                                                    </div>
                                                </div>
                                            </div>
                                            {isCurrent && (
                                                <span className="text-xs font-medium px-3 py-1 bg-marso text-white rounded-full">
                          Текущий
                        </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Profile