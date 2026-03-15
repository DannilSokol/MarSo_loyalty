import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { clientAPI } from '../services/client'
import { QrCode, Download, RefreshCw, Clock, CreditCard, Award, Copy, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'

const LoyaltyCard = () => {
    const { user } = useAuth()
    const [cardData, setCardData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [timeLeft, setTimeLeft] = useState(300) // 5 минут

    useEffect(() => {
        fetchCard()
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    fetchCard()
                    return 300
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [])

    const fetchCard = async () => {
        try {
            setLoading(true)
            const response = await clientAPI.getLoyaltyCard()
            setCardData(response.data)
            setTimeLeft(300)
        } catch (error) {
            toast.error('Не удалось загрузить карту лояльности')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    const downloadQR = () => {
        if (!cardData?.qr_data) return
        const link = document.createElement('a')
        link.href = cardData.qr_data
        link.download = `marso-card-${cardData.client_id?.slice(0, 8)}.png`
        link.click()
        toast.success('QR-код сохранён')
    }

    const copyToken = () => {
        if (!cardData?.token) return
        navigator.clipboard.writeText(cardData.token)
        toast.success('Токен скопирован')
    }

    const getLevelInfo = (level) => {
        const levels = {
            bronze: {
                icon: '🥉',
                color: 'text-amber-700',
                bg: 'from-amber-50 to-amber-100',
                cashback: '3%',
                title: 'Bronze',
                desc: 'Начальный уровень',
            },
            silver: {
                icon: '🥈',
                color: 'text-gray-700',
                bg: 'from-gray-50 to-gray-100',
                cashback: '5%',
                title: 'Silver',
                desc: 'Средний уровень',
            },
            gold: {
                icon: '🥇',
                color: 'text-yellow-700',
                bg: 'from-yellow-50 to-yellow-100',
                cashback: '10%',
                title: 'Gold',
                desc: 'Премиум-уровень',
            },
        }
        return levels[level] || levels.bronze
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-marso mb-6"></div>
                <p className="text-marso-text-muted text-lg">Загрузка вашей карты...</p>
            </div>
        )
    }

    const level = getLevelInfo(cardData?.level || 'bronze')

    return (
        <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
                <h1 className="section-title">Ваша карта лояльности</h1>
                <p className="section-subtitle">
                    Покажите QR-код или токен администратору при посещении
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-10">
                {/* Левая часть — QR и основные действия */}
                <div className="space-y-8">
                    <div className="card relative overflow-hidden">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-serif font-bold text-marso-text">
                                QR-код для сканирования
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-marso-text-muted">
                                <Clock className="h-5 w-5" />
                                <span>Обновится через {formatTime(timeLeft)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-center">
                            <div className="p-6 bg-white rounded-2xl border-4 border-marso shadow-premium mb-8">
                                {cardData?.qr_data ? (
                                    <img
                                        src={cardData.qr_data}
                                        alt="QR-код лояльности MarSo"
                                        className="w-72 h-72 object-contain"
                                    />
                                ) : (
                                    <div className="w-72 h-72 flex items-center justify-center bg-marso-50 rounded-xl">
                                        <QrCode className="h-32 w-32 text-marso opacity-30" />
                                    </div>
                                )}
                            </div>

                            <div className="w-full space-y-4">
                                <div className="bg-marso-50 rounded-xl p-5 text-center">
                                    <div className="text-sm text-marso-text-muted mb-1">Токен для ручного ввода</div>
                                    <div className="font-mono text-lg font-medium break-all select-all">
                                        {cardData?.token || '—'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={downloadQR}
                                        disabled={!cardData?.qr_data}
                                        className="btn-primary flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <Download className="h-5 w-5" />
                                        Скачать QR
                                    </button>

                                    <button
                                        onClick={copyToken}
                                        disabled={!cardData?.token}
                                        className="btn-outline flex items-center justify-center gap-3 disabled:opacity-50"
                                    >
                                        <Copy className="h-5 w-5" />
                                        Скопировать токен
                                    </button>
                                </div>

                                <button
                                    onClick={fetchCard}
                                    className="w-full flex items-center justify-center gap-3 text-marso hover:text-marso-dark font-medium mt-4"
                                >
                                    <RefreshCw className="h-5 w-5" />
                                    Обновить карту
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Инструкция */}
                    <div className="card bg-marso-50 border-marso-100">
                        <h3 className="text-xl font-serif font-semibold mb-6 flex items-center gap-3">
                            <Sparkles className="h-6 w-6 text-marso" />
                            Как использовать карту
                        </h3>
                        <div className="space-y-6">
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-marso text-white rounded-full flex items-center justify-center text-lg font-bold">
                                    1
                                </div>
                                <div>
                                    <p className="font-medium">Покажите QR-код или токен</p>
                                    <p className="text-sm text-marso-text-muted mt-1">
                                        Мастер отсканирует его или введёт токен вручную
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-shrink-0 w-10 h-10 bg-marso text-white rounded-full flex items-center justify-center text-lg font-bold">
                                    2
                                </div>
                                <div>
                                    <p className="font-medium">Получите бонусы автоматически</p>
                                    <p className="text-sm text-marso-text-muted mt-1">
                                        Кэшбэк начисляется сразу после посещения
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Правая часть — информация о статусе */}
                <div className="space-y-8">
                    <div className="card">
                        <h2 className="text-2xl font-serif font-bold mb-8">Ваш статус</h2>

                        <div className={`p-8 rounded-2xl bg-gradient-to-br ${level.bg} border border-marso-border`}>
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <span className="text-5xl">{level.icon}</span>
                                    <div>
                                        <h3 className={`text-3xl font-bold ${level.color}`}>
                                            {level.title}
                                        </h3>
                                        <p className="text-marso-text-muted">{level.desc}</p>
                                    </div>
                                </div>
                                <div className={`text-right ${level.color}`}>
                                    <div className="text-4xl font-bold">{level.cashback}</div>
                                    <div className="text-sm font-medium">кэшбэк</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 mt-8">
                                <div>
                                    <div className="text-sm text-marso-text-muted mb-1">Бонусный баланс</div>
                                    <div className="text-3xl font-bold text-marso">
                                        {cardData?.balance || 0} ₽
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-marso-text-muted mb-1">Всего потрачено</div>
                                    <div className="text-3xl font-bold text-marso">
                                        {user?.total_spent || 0} ₽
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Преимущества уровня */}
                    <div className="card">
                        <h3 className="text-xl font-serif font-semibold mb-6 flex items-center gap-3">
                            <Award className="h-6 w-6 text-marso" />
                            Преимущества вашего уровня
                        </h3>
                        <div className="space-y-4">
                            {level.title === 'Bronze' && (
                                <>
                                    <div className="p-4 bg-amber-50 rounded-xl">3% кэшбэк на каждое посещение</div>
                                    <div className="p-4 bg-amber-50 rounded-xl">Участие в сезонных акциях</div>
                                </>
                            )}
                            {level.title === 'Silver' && (
                                <>
                                    <div className="p-4 bg-gray-50 rounded-xl">5% кэшбэк на каждое посещение</div>
                                    <div className="p-4 bg-gray-50 rounded-xl">Приоритетная запись</div>
                                    <div className="p-4 bg-gray-50 rounded-xl">Бесплатный кофе при каждом визите</div>
                                </>
                            )}
                            {level.title === 'Gold' && (
                                <>
                                    <div className="p-4 bg-yellow-50 rounded-xl">10% кэшбэк на каждое посещение</div>
                                    <div className="p-4 bg-yellow-50 rounded-xl">Персональный администратор</div>
                                    <div className="p-4 bg-yellow-50 rounded-xl">Двойные бонусы в акциях</div>
                                    <div className="p-4 bg-yellow-50 rounded-xl">Эксклюзивные подарки</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default LoyaltyCard