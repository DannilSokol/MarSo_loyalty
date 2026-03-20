// frontend/src/pages/Register.jsx
// Полный файл с улучшенным вводом телефона

import { useState } from 'react'
import axios from 'axios'
import { useNavigate, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Scissors, Mail, Lock, Smartphone, ArrowRight } from 'lucide-react'

export default function Register() {
    const [phone, setPhone] = useState('+7')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const ref = searchParams.get('ref')

    const handlePhoneChange = (e) => {
        let value = e.target.value

        // Удаляем всё кроме цифр и +
        value = value.replace(/[^+\d]/g, '')

        // Защищаем +7 в начале
        if (!value.startsWith('+7')) {
            // Если удалили +7 → восстанавливаем
            value = '+7' + value.replace(/^\+?7?/, '')
        }

        // Ограничиваем длину: +7 + максимум 10 цифр
        const digitsPart = value.slice(2) // после +7
        if (digitsPart.length > 10) {
            value = '+7' + digitsPart.slice(0, 10)
        }

        setPhone(value)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        // Проверка: ровно 10 цифр после +7
        const digits = phone.replace('+7', '').replace(/\D/g, '')
        if (digits.length !== 10) {
            toast.error('Номер должен быть в формате +7 и содержать 10 цифр')
            setIsLoading(false)
            return
        }

        try {
            const payload = { phone, email, password }
            if (ref) payload.ref = ref

            const res = await axios.post('/api/auth/register', payload)

            localStorage.setItem('marso_token', res.data.token)
            toast.success('Аккаунт создан 🚀')
            navigate('/profile')
        } catch (e) {
            toast.error(e.response?.data?.error || 'Ошибка регистрации')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-marso-900 to-marso-dark">
            <div className="w-full max-w-md">
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-marso rounded-2xl shadow-premium mx-auto mb-6">
                        <Scissors className="h-10 w-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-serif font-bold text-white">Регистрация</h1>
                    <p className="mt-2 text-marso-300">Создайте аккаунт MarSo</p>
                </div>

                <div className="bg-white/95 rounded-2xl shadow-premium p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* PHONE */}
                        <div>
                            <label className="text-sm mb-2 block text-gray-700">Телефон</label>
                            <div className="relative">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    placeholder="+7XXXXXXXXXX"
                                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-marso focus:border-marso outline-none transition-all"
                                    required
                                    maxLength={12}
                                    autoComplete="tel"
                                />
                                <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-marso" />
                            </div>
                            <p className="mt-1 text-xs text-gray-500">
                                Формат: +7XXXXXXXXXX
                            </p>
                        </div>

                        {/* EMAIL */}
                        <div>
                            <label className="text-sm mb-2 block text-gray-700">Email</label>
                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@mail.com"
                                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-marso focus:border-marso outline-none transition-all"
                                    required
                                />
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-marso" />
                            </div>
                        </div>

                        {/* PASSWORD */}
                        <div>
                            <label className="text-sm mb-2 block text-gray-700">Пароль</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Минимум 6 символов"
                                    className="w-full px-5 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-marso focus:border-marso outline-none transition-all"
                                    required
                                    minLength={6}
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-marso" />
                            </div>
                        </div>

                        {/* BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-marso hover:bg-marso-dark text-white font-medium py-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-premium disabled:opacity-70"
                        >
                            {isLoading ? 'Создание...' : <>Зарегистрироваться <ArrowRight className="h-5 w-5" /></>}
                        </button>
                    </form>

                    <p className="text-center mt-6 text-sm text-gray-600">
                        Уже есть аккаунт?{' '}
                        <span
                            onClick={() => navigate('/')}
                            className="text-marso hover:underline cursor-pointer font-medium"
                        >
                            Войти
                        </span>
                    </p>
                </div>
            </div>
        </div>
    )
}