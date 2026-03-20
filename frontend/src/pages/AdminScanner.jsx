// frontend/src/pages/AdminScanner.jsx

import React, { useState, useRef, useEffect } from 'react'
import { adminAPI } from '../services/client'
import {
    Camera, X, CheckCircle, Scan, Phone,
    ExternalLink, CreditCard, Loader2, Plus
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { QrReader } from 'react-qr-reader'

const AdminScanner = () => {
    const [scanResult, setScanResult] = useState(null)
    const [loading, setLoading] = useState(false)
    const [isScanning, setIsScanning] = useState(false)
    const [showPhoneSearch, setShowPhoneSearch] = useState(false)
    const [phoneNumber, setPhoneNumber] = useState('')
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)
    const [showCreateVisit, setShowCreateVisit] = useState(false)
    const [visitAmount, setVisitAmount] = useState('1500')
    const [useBonus, setUseBonus] = useState(false)
    const [bonusAmount, setBonusAmount] = useState('0')
    const [note, setNote] = useState('')

    const navigate = useNavigate()
    const isProcessingRef = useRef(false)

    useEffect(() => {
        const adminToken = localStorage.getItem('marso_admin_token')
        if (!adminToken) {
            toast.error('Сессия истекла. Войдите заново')
            navigate('/login')
        }
    }, [navigate])

    const resetAll = () => {
        setScanResult(null)
        setPhoneNumber('')
        setShowPhoneSearch(false)
        setIsScanning(false)
        setLoading(false)
        setShowSuccessOverlay(false)
        setShowCreateVisit(false)
        setVisitAmount('1500')
        setUseBonus(false)
        setBonusAmount('0')
        setNote('')
        isProcessingRef.current = false
    }

    const startScanner = () => {
        resetAll()
        setIsScanning(true)
    }

    const parseQRData = (text) => {
        try {
            return JSON.parse(text)
        } catch {
            return { client_id: text }
        }
    }

    const handleScanResult = (result) => {
        if (isProcessingRef.current || !result?.text || scanResult?.client) return
        isProcessingRef.current = true
        processQRData(result.text)
    }

    const processQRData = async (text) => {
        try {
            setLoading(true)
            const parsed = parseQRData(text)

            let clientData
            if (parsed.client_id) {
                const res = await adminAPI.getClientById(parsed.client_id)
                clientData = res.data.client
            } else {
                // Эта ветка больше не используется, но оставляем на всякий случай
                toast.error('Неизвестный формат QR')
                return
            }

            if (clientData) {
                setScanResult({ valid: true, client: clientData })
                toast.success('Клиент найден')
                setShowSuccessOverlay(true)
                setTimeout(() => {
                    setShowSuccessOverlay(false)
                    setShowCreateVisit(true)
                }, 1200)
            } else {
                toast.error('Клиент не найден')
            }
        } catch (err) {
            toast.error('Ошибка обработки QR')
            console.error(err)
        } finally {
            setLoading(false)
            isProcessingRef.current = false
        }
    }

    const handleCreateVisit = async () => {
        const amount = parseFloat(visitAmount)
        const bonus = useBonus ? parseFloat(bonusAmount) : 0

        if (isNaN(amount) || amount <= 0) return toast.error('Сумма > 0')
        if (useBonus && bonus > (scanResult?.client?.balance || 0)) {
            return toast.error('Недостаточно бонусов')
        }

        try {
            setLoading(true)
            const payload = {
                phone: scanResult.client.phone,
                amount,
                use_bonus: useBonus,
                bonus_amount: bonus,
                note: note.trim() || 'Через сканер'
            }

            await adminAPI.createVisitWithBonus(payload)
            toast.success('Визит создан')

            setShowCreateVisit(false)
            resetAll()
        } catch (err) {
            toast.error(err.response?.data?.error || 'Ошибка')
        } finally {
            setLoading(false)
        }
    }

    const searchByPhone = async (e) => {
        e.preventDefault()
        let phone = phoneNumber.replace(/\D/g, '')
        if (phone.startsWith('8')) phone = '7' + phone.slice(1)
        if (phone.length !== 11 || !phone.startsWith('7')) {
            return toast.error('Номер: +7XXXXXXXXXX')
        }

        try {
            setLoading(true)
            const res = await adminAPI.getAllClients()
            const client = res.data?.find(c =>
                c.phone === `+${phone}` || c.phone === phone
            )

            if (client) {
                setScanResult({ valid: true, client })
                toast.success('Найден по номеру')
                setShowSuccessOverlay(true)
                setTimeout(() => {
                    setShowSuccessOverlay(false)
                    setShowCreateVisit(true)
                }, 1200)
            } else {
                toast.error('Не найден')
            }
        } catch (err) {
            toast.error('Ошибка поиска')
        } finally {
            setLoading(false)
        }
    }

    const formatPhoneInput = (value) => {
        const digits = value.replace(/\D/g, '')
        if (!digits) return ''
        let formatted = '+7'
        if (digits.length > 1) {
            formatted += ' (' + digits.slice(1,4)
            if (digits.length > 4) formatted += ') ' + digits.slice(4,7)
            if (digits.length > 7) formatted += '-' + digits.slice(7,9)
            if (digits.length > 9) formatted += '-' + digits.slice(9,11)
        }
        return formatted
    }

    const getLevelBadge = (level) => {
        const map = {
            gold: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
            silver: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' },
            bronze: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' }
        }
        const style = map[level?.toLowerCase()] || map.bronze
        return (
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium border ${style.bg} ${style.text} ${style.border}`}>
                {level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Bronze'}
            </span>
        )
    }

    const activeMode = isScanning || showPhoneSearch || showCreateVisit

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            {/* Оверлей успеха */}
            {showSuccessOverlay && scanResult?.client && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-10 text-center max-w-md w-full mx-4 shadow-2xl">
                        <CheckCircle className="h-20 w-20 text-green-500 mx-auto mb-6" />
                        <h2 className="text-3xl font-bold mb-3">Клиент найден</h2>
                        <div className="text-2xl font-mono mb-6">{scanResult.client.phone}</div>
                        <div className="text-5xl font-bold text-[#501822] mb-2">
                            {scanResult.client.balance ?? 0} ₽
                        </div>
                        <p className="text-gray-500">бонусов</p>
                        <p className="mt-8 text-gray-600 flex items-center justify-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Открываем форму...
                        </p>
                    </div>
                </div>
            )}

            <div className="max-w-6xl mx-auto px-5 py-10">
                <h1 className="text-4xl md:text-5xl font-bold text-[#501822] text-center mb-2">MarSo Scanner</h1>
                <p className="text-center text-gray-600 mb-10 md:mb-12 max-w-2xl mx-auto">
                    Отсканируйте QR-код клиента или найдите по номеру телефона
                </p>

                {loading && !showSuccessOverlay && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                        <div className="bg-white p-10 rounded-2xl shadow-2xl text-center">
                            <Loader2 className="h-12 w-12 animate-spin text-[#501822] mx-auto mb-4" />
                            <p className="text-xl font-medium">Поиск...</p>
                        </div>
                    </div>
                )}

                <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
                    {/* Левая панель — управление */}
                    <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl md:text-3xl font-bold text-[#501822]">
                                {showCreateVisit ? 'Новый визит' :
                                    showPhoneSearch ? 'Поиск по номеру' :
                                        isScanning ? 'Сканирование QR' : 'Выберите действие'}
                            </h2>

                            {activeMode && (
                                <button
                                    onClick={resetAll}
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition flex items-center gap-2 font-medium"
                                >
                                    <X size={20} /> Отмена
                                </button>
                            )}
                        </div>

                        {!activeMode ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <button
                                    onClick={startScanner}
                                    className="p-8 border-2 border-gray-200 rounded-2xl hover:border-[#501822]/30 hover:bg-[#501822]/5 transition text-center group"
                                >
                                    <Camera className="h-12 w-12 text-[#501822] mx-auto mb-4 group-hover:scale-110 transition" />
                                    <div className="font-semibold text-lg">QR-код</div>
                                </button>

                                <button
                                    onClick={() => setShowPhoneSearch(true)}
                                    className="p-8 border-2 border-gray-200 rounded-2xl hover:border-[#501822]/30 hover:bg-[#501822]/5 transition text-center group"
                                >
                                    <Phone className="h-12 w-12 text-[#501822] mx-auto mb-4 group-hover:scale-110 transition" />
                                    <div className="font-semibold text-lg">Номер телефона</div>
                                </button>
                            </div>
                        ) : showCreateVisit && scanResult?.client ? (
                            <div className="space-y-6">
                                <div className="p-5 bg-gray-50 rounded-xl text-center border border-gray-200">
                                    <div className="font-medium text-lg mb-1">{scanResult.client.phone}</div>
                                    <div className="text-3xl font-bold text-[#501822]">
                                        {scanResult.client.balance.toLocaleString('ru-RU')} ₽
                                    </div>
                                    <div className="text-sm text-gray-500">бонусов</div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Сумма чека (₽)</label>
                                    <input
                                        type="number"
                                        value={visitAmount}
                                        onChange={e => setVisitAmount(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#501822] focus:ring-1 focus:ring-[#501822]/30 text-lg"
                                        min="500"
                                        step="100"
                                    />
                                </div>

                                {scanResult.client.balance > 0 && (
                                    <>
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={useBonus}
                                                onChange={e => setUseBonus(e.target.checked)}
                                                className="h-5 w-5 text-[#501822] border-gray-300 rounded"
                                            />
                                            <span className="font-medium">Списать бонусы</span>
                                        </label>

                                        {useBonus && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Сумма списания (₽)</label>
                                                <input
                                                    type="number"
                                                    value={bonusAmount}
                                                    onChange={e => setBonusAmount(e.target.value)}
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#501822] focus:ring-1 focus:ring-[#501822]/30 text-lg"
                                                    max={scanResult.client.balance}
                                                    step="50"
                                                />
                                                <p className="text-sm text-gray-500 mt-1">
                                                    Доступно: {scanResult.client.balance.toLocaleString('ru-RU')} ₽
                                                </p>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Примечание</label>
                                    <textarea
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#501822] focus:ring-1 focus:ring-[#501822]/30 resize-none h-24"
                                        placeholder="Дополнительная информация..."
                                    />
                                </div>

                                <div className="flex gap-4 mt-8">
                                    <button
                                        onClick={handleCreateVisit}
                                        disabled={loading}
                                        className="flex-1 bg-[#501822] text-white py-4 rounded-xl font-medium hover:bg-[#3e1420] transition disabled:opacity-60 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="animate-spin" /> : <Plus size={20} />}
                                        {loading ? 'Создаём...' : 'Создать визит'}
                                    </button>
                                    <button
                                        onClick={() => setShowCreateVisit(false)}
                                        className="flex-1 border border-gray-300 py-4 rounded-xl font-medium hover:bg-gray-50 transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </div>
                        ) : showPhoneSearch ? (
                            <form onSubmit={searchByPhone} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Номер телефона</label>
                                    <input
                                        type="tel"
                                        value={formatPhoneInput(phoneNumber)}
                                        onChange={e => {
                                            const digits = e.target.value.replace(/\D/g, '')
                                            setPhoneNumber(digits)
                                        }}
                                        placeholder="+7 (___) ___-__-__"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:border-[#501822] focus:ring-1 focus:ring-[#501822]/30 text-lg font-mono"
                                        maxLength={18}
                                    />
                                </div>

                                <div className="flex gap-4">
                                    <button
                                        type="submit"
                                        disabled={loading || phoneNumber.length < 11}
                                        className="flex-1 bg-[#501822] text-white py-4 rounded-xl font-medium hover:bg-[#3e1420] transition disabled:opacity-60"
                                    >
                                        {loading ? 'Поиск...' : 'Найти клиента'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetAll}
                                        className="flex-1 border border-gray-300 py-4 rounded-xl font-medium hover:bg-gray-50 transition"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        ) : isScanning ? (
                            <div className="relative bg-black rounded-2xl overflow-hidden aspect-square border-4 border-[#501822]/30 shadow-xl max-w-[500px] mx-auto">
                                <QrReader
                                    onResult={handleScanResult}
                                    constraints={{ facingMode: 'environment' }}
                                    scanDelay={300}
                                    className="w-full h-full"
                                />
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-72 h-72 border-4 border-white/60 rounded-2xl relative">
                                        <div className="absolute inset-4 border-2 border-[#C9A96E]/70 rounded-xl" />
                                    </div>
                                </div>
                                <div className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-base pointer-events-none">
                                    Наведите камеру на QR-код клиента
                                </div>
                            </div>
                        ) : null}
                    </div>

                    {/* Правая панель — результат */}
                    <div className="bg-white rounded-2xl shadow border border-gray-200 p-6 md:p-8 min-h-[500px] flex flex-col">
                        {scanResult?.client && !showSuccessOverlay && !showCreateVisit ? (
                            <>
                                <div className="text-center mb-8">
                                    <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                                    <h2 className="text-3xl font-bold text-[#501822]">Клиент найден</h2>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                    <div className="p-5 bg-gray-50 rounded-xl">
                                        <div className="text-sm text-gray-500 mb-1">Телефон</div>
                                        <div className="text-2xl font-mono">{scanResult.client.phone}</div>
                                    </div>
                                    <div className="p-5 bg-gray-50 rounded-xl">
                                        <div className="text-sm text-gray-500 mb-1">Баланс бонусов</div>
                                        <div className="text-4xl font-bold text-[#501822]">
                                            {scanResult.client.balance ?? 0} ₽
                                        </div>
                                    </div>
                                    <div className="p-5 bg-gray-50 rounded-xl">
                                        <div className="text-sm text-gray-500 mb-1">Уровень</div>
                                        {getLevelBadge(scanResult.client.level)}
                                    </div>
                                    <div className="p-5 bg-gray-50 rounded-xl">
                                        <div className="text-sm text-gray-500 mb-1">Всего потрачено</div>
                                        <div className="text-2xl font-medium">
                                            {scanResult.client.total_spent ?? 0} ₽
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-auto flex flex-col sm:flex-row gap-4">
                                    <button
                                        onClick={() => navigate(`/admin/client/${scanResult.client.id}`)}
                                        className="flex-1 border-2 border-[#501822] text-[#501822] py-4 rounded-xl font-medium hover:bg-[#501822]/10 transition flex items-center justify-center gap-2"
                                    >
                                        <ExternalLink size={20} /> Полный профиль
                                    </button>
                                    <button
                                        onClick={() => setShowCreateVisit(true)}
                                        className="flex-1 bg-[#501822] text-white py-4 rounded-xl font-medium hover:bg-[#3e1420] transition flex items-center justify-center gap-2"
                                    >
                                        <CreditCard size={20} /> Создать визит
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-400">
                                <Scan className="h-20 w-20 mb-6 opacity-40" />
                                <h3 className="text-2xl font-bold mb-3">Ожидание сканирования</h3>
                                <p className="max-w-md">Выберите способ слева</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminScanner