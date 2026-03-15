// src/pages/AdminScanner.jsx — ПОЛНЫЙ ФАЙЛ
import React, { useState, useRef, useEffect } from 'react'
import { adminAPI } from '../services/client'
import {
    QrCode, Camera, X, CheckCircle, AlertCircle, Scan, Key, Phone,
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
    const [qrToken, setQrToken] = useState('')
    const [showTokenInput, setShowTokenInput] = useState(false)
    const [showSuccessOverlay, setShowSuccessOverlay] = useState(false)

    // Форма создания визита (новая часть)
    const [showCreateVisit, setShowCreateVisit] = useState(false)
    const [visitAmount, setVisitAmount] = useState('1500')
    const [useBonus, setUseBonus] = useState(false)
    const [bonusAmount, setBonusAmount] = useState('0')
    const [note, setNote] = useState('')

    const navigate = useNavigate()
    const isProcessingRef = useRef(false)

    // Проверка токена админа при монтировании
    useEffect(() => {
        const adminToken = localStorage.getItem('marso_admin_token')
        if (!adminToken) {
            toast.error('Сессия истекла. Войдите заново')
            navigate('/login')
            return
        }
    }, [navigate])

    const resetAll = () => {
        setScanResult(null)
        setQrToken('')
        setPhoneNumber('')
        setShowPhoneSearch(false)
        setShowTokenInput(false)
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
            setQrToken(text)

            let clientData

            if (parsed.client_id) {
                const res = await adminAPI.getClientById(parsed.client_id)
                clientData = res.data.client
            } else {
                const res = await adminAPI.scanQR({ token: text })
                if (res.data?.valid && res.data?.client) {
                    clientData = res.data.client
                }
            }

            if (clientData) {
                setScanResult({ valid: true, client: clientData })
                toast.success('Клиент найден')

                // Показываем красивый оверлей успеха
                setShowSuccessOverlay(true)

                // Через 1.5 секунды автоматически открываем форму визита
                setTimeout(() => {
                    setShowSuccessOverlay(false)
                    setShowCreateVisit(true)
                }, 1500)
            } else {
                toast.error('Клиент не найден')
            }
        } catch (err) {
            toast.error('Ошибка обработки QR-кода')
            console.error('processQRData error:', err)
        } finally {
            setLoading(false)
            isProcessingRef.current = false
        }
    }

    // Создание визита из формы
    const handleCreateVisit = async () => {
        const amount = parseFloat(visitAmount)
        const bonus = useBonus ? parseFloat(bonusAmount) : 0

        if (isNaN(amount) || amount <= 0) return toast.error('Введите сумму > 0')
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
                note: note.trim() || 'Создано через сканер'
            }

            await adminAPI.createVisitWithBonus(payload)
            toast.success('Посещение успешно создано!')

            // Закрываем форму и сбрасываем состояние
            setShowCreateVisit(false)
            resetAll()

            // Редирект в профиль клиента
            navigate(`/admin/client/${scanResult.client.id}`)
        } catch (err) {
            toast.error(err.response?.data?.error || 'Ошибка создания визита')
            console.error('Create visit error:', err)
        } finally {
            setLoading(false)
        }
    }

    const fetchClientById = async (clientId) => {
        try {
            setLoading(true)
            const response = await adminAPI.getClientById(clientId)
            const client = response.data.client

            if (client) {
                setScanResult({ valid: true, client })
                toast.success('Клиент найден!')
                setShowSuccessOverlay(true)
                setTimeout(() => {
                    setShowSuccessOverlay(false)
                    setShowCreateVisit(true)
                }, 1500)
            } else {
                toast.error('Клиент не найден по ID')
            }
        } catch (err) {
            console.error('fetchClientById error:', err)
            toast.error('Ошибка загрузки клиента')
        } finally {
            setLoading(false)
        }
    }

    const processViaAPI = async (token) => {
        try {
            setLoading(true)
            const response = await adminAPI.scanQR({ token })

            if (response.data?.valid && response.data?.client) {
                const client = response.data.client
                setScanResult(response.data)
                toast.success('Клиент найден по токену!')
                setShowSuccessOverlay(true)
                setTimeout(() => {
                    setShowSuccessOverlay(false)
                    setShowCreateVisit(true)
                }, 1500)
            } else {
                toast.error('Токен недействителен')
            }
        } catch (err) {
            console.error('processViaAPI error:', err)
            toast.error('Ошибка сканирования токена')
        } finally {
            setLoading(false)
        }
    }

    const searchByPhone = async (e) => {
        e.preventDefault()
        let formatted = phoneNumber.replace(/\D/g, '')
        if (formatted.startsWith('8')) formatted = '7' + formatted.slice(1)
        if (formatted.length !== 11 || !formatted.startsWith('7')) {
            return toast.error('Номер должен быть +7XXXXXXXXXX')
        }

        try {
            setLoading(true)
            const response = await adminAPI.getAllClients()
            const client = response.data?.find(
                c => c.phone === `+${formatted}` || c.phone === formatted
            )

            if (client) {
                setScanResult({ valid: true, client })
                toast.success('Клиент найден по номеру!')
                setShowSuccessOverlay(true)
                setTimeout(() => {
                    setShowSuccessOverlay(false)
                    setShowCreateVisit(true)
                }, 1500)
            } else {
                toast.error('Клиент не найден')
            }
        } catch (err) {
            console.error('searchByPhone error:', err)
            toast.error('Ошибка поиска по номеру')
        } finally {
            setLoading(false)
        }
    }

    const handleManualToken = (e) => {
        e.preventDefault()
        if (!qrToken.trim()) return toast.error('Введите токен')
        processQRData(qrToken.trim())
    }

    const getLevelBadge = (level) => {
        const styles = {
            gold: 'bg-yellow-100 text-yellow-800 border-yellow-300',
            silver: 'bg-gray-100 text-gray-800 border-gray-300',
            bronze: 'bg-amber-100 text-amber-800 border-amber-300'
        }
        return (
            <span className={`inline-block px-5 py-2 rounded-full text-base font-medium border ${styles[level] || styles.bronze}`}>
                {level ? level.charAt(0).toUpperCase() + level.slice(1) : 'Bronze'}
            </span>
        )
    }

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60)
        const s = seconds % 60
        return `${m}:${s.toString().padStart(2, '0')}`
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-10 bg-gradient-to-b from-white to-marso-50/30 min-h-screen relative">
            {/* Успешный оверлей после сканирования */}
            {showSuccessOverlay && scanResult?.client && (
                <div className="fixed inset-0 bg-gradient-to-br from-marso to-marso-dark/95 flex items-center justify-center z-50 backdrop-blur-sm animate-fade-in">
                    <div className="text-center text-white px-6 max-w-lg">
                        <div className="relative inline-block mb-10">
                            <CheckCircle className="h-32 w-32 mx-auto text-green-400 animate-pulse" />
                            <div className="absolute inset-0 rounded-full bg-green-400/20 animate-ping-slow" />
                        </div>

                        <h2 className="text-5xl md:text-6xl font-serif font-bold mb-6 tracking-tight">
                            Клиент найден
                        </h2>

                        <div className="text-3xl md:text-4xl font-medium mb-10 font-mono">
                            {scanResult.client.phone}
                        </div>

                        <div className="inline-block bg-white/10 backdrop-blur-md px-10 md:px-16 py-6 md:py-8 rounded-2xl border border-white/20 shadow-2xl">
                            <div className="text-6xl md:text-7xl font-black mb-2">
                                {scanResult.client.balance ?? 0} ₽
                            </div>
                            <div className="text-xl md:text-2xl opacity-90 font-medium">
                                бонусов на счету
                            </div>
                        </div>

                        <p className="mt-16 text-xl md:text-2xl opacity-80 flex items-center justify-center gap-3">
                            <Loader2 className="h-6 w-6 animate-spin" />
                            Открываем форму визита...
                        </p>
                    </div>
                </div>
            )}

            <div className="mb-16 text-center">
                <h1 className="text-6xl md:text-7xl font-serif font-extrabold text-marso mb-4 tracking-tight">
                    MarSo Scanner
                </h1>
                <p className="text-2xl md:text-3xl text-marso-text-muted max-w-3xl mx-auto leading-relaxed">
                    Отсканируйте QR-код клиента или найдите по номеру для мгновенного доступа к профилю
                </p>
            </div>

            {loading && !showSuccessOverlay && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-md">
                    <div className="bg-white rounded-3xl p-16 shadow-premium text-center max-w-lg w-full border border-marso-border/30">
                        <div className="animate-spin rounded-full h-24 w-24 border-b-6 border-marso mx-auto mb-10"></div>
                        <p className="text-3xl font-medium text-marso mb-4">Поиск клиента...</p>
                        <p className="text-xl text-marso-text-muted">Пожалуйста, подождите</p>
                    </div>
                </div>
            )}

            <div className="grid lg:grid-cols-2 gap-16">
                {/* Левая колонка — инструменты */}
                <div className="space-y-12">
                    <div className="card p-12 shadow-premium border-marso-border/40 bg-white/90 backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-4xl font-serif font-bold text-marso">
                                {isScanning
                                    ? 'Сканирование...'
                                    : showPhoneSearch
                                        ? 'Поиск по номеру'
                                        : showTokenInput
                                            ? 'Ручной ввод'
                                            : showCreateVisit
                                                ? 'Создание визита'
                                                : 'Выберите способ'}
                            </h2>

                            <div className="flex gap-6">
                                {!isScanning && !showPhoneSearch && !showTokenInput && !showCreateVisit ? (
                                    <>
                                        <button
                                            onClick={startScanner}
                                            className="btn-primary flex items-center gap-4 px-10 py-6 text-2xl shadow-lg hover:shadow-xl transition-all"
                                        >
                                            <Camera className="h-8 w-8" /> QR-код
                                        </button>
                                        <button
                                            onClick={() => setShowPhoneSearch(true)}
                                            className="btn-outline flex items-center gap-4 px-10 py-6 text-2xl"
                                        >
                                            <Phone className="h-8 w-8" /> Телефон
                                        </button>
                                        <button
                                            onClick={() => setShowTokenInput(true)}
                                            className="btn-outline flex items-center gap-4 px-10 py-6 text-2xl"
                                        >
                                            <Key className="h-8 w-8" /> Токен
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={resetAll}
                                        className="btn-outline flex items-center gap-4 px-10 py-6 text-2xl"
                                    >
                                        <X className="h-8 w-8" /> Отмена
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Формы и сканер */}
                        {showCreateVisit && scanResult?.client ? (
                            // Форма создания визита (встроена вместо сканера)
                            <div className="space-y-8 animate-fade-in">
                                <div className="p-6 bg-blue-50 rounded-2xl text-center">
                                    <h3 className="text-2xl font-bold text-marso mb-2">
                                        Создаём визит для {scanResult.client.phone}
                                    </h3>
                                    <p className="text-marso-text-muted">
                                        Баланс бонусов: {scanResult.client.balance.toLocaleString('ru-RU')} ₽
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-marso-text">Сумма чека (₽)</label>
                                        <input
                                            type="number"
                                            value={visitAmount}
                                            onChange={e => setVisitAmount(e.target.value)}
                                            className="w-full px-6 py-4 bg-white border border-marso-border rounded-2xl focus:ring-2 focus:ring-marso focus:border-transparent text-xl"
                                            min="500"
                                            step="100"
                                            placeholder="1500"
                                        />
                                    </div>

                                    {scanResult.client.balance > 0 && (
                                        <>
                                            <label className="flex items-center gap-3 text-lg">
                                                <input
                                                    type="checkbox"
                                                    checked={useBonus}
                                                    onChange={e => setUseBonus(e.target.checked)}
                                                    className="w-6 h-6 text-marso rounded border-marso-border"
                                                />
                                                Списать бонусы
                                            </label>

                                            {useBonus && (
                                                <div>
                                                    <label className="block text-sm font-medium mb-2 text-marso-text">Сумма списания (₽)</label>
                                                    <input
                                                        type="number"
                                                        value={bonusAmount}
                                                        onChange={e => setBonusAmount(e.target.value)}
                                                        className="w-full px-6 py-4 bg-white border border-marso-border rounded-2xl focus:ring-2 focus:ring-marso focus:border-transparent text-xl"
                                                        max={scanResult.client.balance}
                                                        step="50"
                                                        placeholder="0"
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-marso-text">Примечание</label>
                                        <textarea
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            className="w-full px-6 py-4 bg-white border border-marso-border rounded-2xl focus:ring-2 focus:ring-marso focus:border-transparent resize-none"
                                            rows="3"
                                            placeholder="Дополнительная информация о визите..."
                                        />
                                    </div>

                                    <div className="flex gap-6 mt-10">
                                        <button
                                            onClick={handleCreateVisit}
                                            disabled={loading}
                                            className="flex-1 bg-marso text-white py-5 rounded-2xl hover:bg-marso-dark text-xl font-medium shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 className="h-6 w-6 animate-spin" />
                                                    Создаём...
                                                </>
                                            ) : (
                                                <>
                                                    <Plus className="h-6 w-6" />
                                                    Создать визит
                                                </>
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setShowCreateVisit(false)}
                                            className="flex-1 border-2 border-marso text-marso py-5 rounded-2xl hover:bg-marso/5 text-xl font-medium transition-all"
                                        >
                                            Отмена
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : showTokenInput ? (
                            <form onSubmit={handleManualToken} className="space-y-10">
                                <textarea
                                    value={qrToken}
                                    onChange={e => setQrToken(e.target.value)}
                                    placeholder="Вставьте токен или содержимое QR-кода"
                                    className="w-full px-8 py-6 bg-marso-50 border border-marso-border rounded-3xl focus:ring-4 focus:ring-marso/30 focus:border-marso h-48 resize-none font-mono text-lg shadow-inner"
                                    disabled={loading}
                                />
                                <div className="flex gap-8">
                                    <button
                                        type="submit"
                                        disabled={loading || !qrToken.trim()}
                                        className="flex-1 btn-primary py-6 text-2xl shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {loading ? 'Поиск...' : 'Найти клиента'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetAll}
                                        className="btn-outline py-6 px-12 text-2xl"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        ) : showPhoneSearch ? (
                            <form onSubmit={searchByPhone} className="space-y-10">
                                <div className="relative">
                                    <input
                                        type="tel"
                                        value={phoneNumber}
                                        onChange={e => setPhoneNumber(e.target.value)}
                                        placeholder="+7 (___) ___-__-__"
                                        className="w-full px-8 py-6 pl-16 bg-marso-50 border border-marso-border rounded-3xl focus:ring-4 focus:ring-marso/30 focus:border-marso text-2xl shadow-inner"
                                        disabled={loading}
                                    />
                                    <span className="absolute left-8 top-1/2 -translate-y-1/2 text-marso font-medium text-2xl">+7</span>
                                </div>
                                <div className="flex gap-8">
                                    <button
                                        type="submit"
                                        disabled={loading || !phoneNumber.trim()}
                                        className="flex-1 btn-primary py-6 text-2xl shadow-lg hover:shadow-xl transition-all"
                                    >
                                        {loading ? 'Поиск...' : 'Найти клиента'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={resetAll}
                                        className="btn-outline py-6 px-12 text-2xl"
                                    >
                                        Отмена
                                    </button>
                                </div>
                            </form>
                        ) : isScanning ? (
                            <div className="relative bg-black rounded-3xl overflow-hidden aspect-square max-w-[700px] mx-auto shadow-2xl border-8 border-marso">
                                {!scanResult && (
                                    <QrReader
                                        onResult={handleScanResult}
                                        constraints={{ facingMode: 'environment' }}
                                        scanDelay={300}
                                        className="w-full h-full"
                                    />
                                )}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="w-96 h-96 border-6 border-white/70 rounded-3xl relative">
                                        <div className="absolute -top-6 -left-6 w-16 h-16 border-t-8 border-l-8 border-marso rounded-tl-3xl" />
                                        <div className="absolute -top-6 -right-6 w-16 h-16 border-t-8 border-r-8 border-marso rounded-tr-3xl" />
                                        <div className="absolute -bottom-6 -left-6 w-16 h-16 border-b-8 border-l-8 border-marso rounded-bl-3xl" />
                                        <div className="absolute -bottom-6 -right-6 w-16 h-16 border-b-8 border-r-8 border-marso rounded-br-3xl" />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 py-20">
                                <button
                                    onClick={startScanner}
                                    className="card hover:shadow-premium transition-all group text-center p-12 border-marso-border/40"
                                >
                                    <div className="p-10 bg-marso text-white rounded-3xl mb-8 inline-block group-hover:scale-110 transition-transform duration-300 shadow-xl">
                                        <Camera className="h-20 w-20" />
                                    </div>
                                    <h3 className="font-bold text-3xl text-marso">Сканировать QR</h3>
                                </button>

                                <button
                                    onClick={() => setShowPhoneSearch(true)}
                                    className="card hover:shadow-premium transition-all group text-center p-12 border-marso-border/40"
                                >
                                    <div className="p-10 bg-marso text-white rounded-3xl mb-8 inline-block group-hover:scale-110 transition-transform duration-300 shadow-xl">
                                        <Phone className="h-20 w-20" />
                                    </div>
                                    <h3 className="font-bold text-3xl text-marso">По номеру</h3>
                                </button>

                                <button
                                    onClick={() => setShowTokenInput(true)}
                                    className="card hover:shadow-premium transition-all group text-center p-12 border-marso-border/40"
                                >
                                    <div className="p-10 bg-marso text-white rounded-3xl mb-8 inline-block group-hover:scale-110 transition-transform duration-300 shadow-xl">
                                        <Key className="h-20 w-20" />
                                    </div>
                                    <h3 className="font-bold text-3xl text-marso">Ввести токен</h3>
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Правая колонка — результат */}
                <div className="space-y-12">
                    {scanResult?.client && !showSuccessOverlay && !showCreateVisit ? (
                        <div className="card p-12 shadow-premium border-marso-border/40 bg-gradient-to-br from-marso-50 to-white">
                            <div className="flex items-center gap-8 mb-12">
                                <CheckCircle className="h-16 w-16 text-green-600 bg-green-100 rounded-full p-4" />
                                <h2 className="text-5xl font-serif font-bold text-marso">Клиент найден</h2>
                            </div>

                            <div className="grid md:grid-cols-2 gap-12 mb-12">
                                <div>
                                    <div className="text-xl text-marso-text-muted mb-3">Телефон</div>
                                    <div className="text-4xl font-medium font-mono text-marso">
                                        {scanResult.client.phone || '—'}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xl text-marso-text-muted mb-3">Баланс бонусов</div>
                                    <div className="text-5xl font-bold text-marso">
                                        {scanResult.client.balance ?? 0} ₽
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xl text-marso-text-muted mb-3">Уровень</div>
                                    <div className="text-4xl">
                                        {getLevelBadge(scanResult.client.level || 'bronze')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-xl text-marso-text-muted mb-3">Всего потрачено</div>
                                    <div className="text-4xl font-medium">
                                        {scanResult.client.total_spent ?? 0} ₽
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col sm:flex-row gap-8">
                                <button
                                    onClick={() => navigate(`/admin/client/${scanResult.client.id}`)}
                                    className="flex-1 btn-primary flex items-center justify-center gap-5 py-7 text-3xl shadow-xl hover:shadow-2xl transition-all"
                                >
                                    <ExternalLink className="h-10 w-10" />
                                    Полный профиль
                                </button>

                                <button
                                    onClick={() => setShowCreateVisit(true)}
                                    className="flex-1 btn-outline flex items-center justify-center gap-5 py-7 text-3xl border-marso hover:bg-marso-50 transition-all"
                                >
                                    <CreditCard className="h-10 w-10" />
                                    Создать визит
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="card min-h-[700px] flex flex-col items-center justify-center text-center p-16 bg-white/90 backdrop-blur-md border-marso-border/30 shadow-premium">
                            <Scan className="h-64 w-64 text-marso opacity-15 mb-16" />
                            <h3 className="text-5xl font-serif font-bold mb-8 text-marso">Готов к сканированию</h3>
                            <p className="text-3xl text-marso-text-muted max-w-2xl leading-relaxed">
                                Выберите способ слева: QR-код, номер телефона или ручной ввод токена клиента
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminScanner