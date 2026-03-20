import { useState } from 'react'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Scissors, Mail, Lock, Smartphone, ArrowRight } from 'lucide-react'

export default function Register() {

    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const navigate = useNavigate()

    const handleSubmit = async (e) => {
        e.preventDefault()

        setIsLoading(true)

        try {
            const res = await axios.post('/api/auth/register', {
                phone,
                email,
                password
            })

            localStorage.setItem('token', res.data.token)

            toast.success('Аккаунт создан 🚀')
            navigate('/profile')

        } catch (e) {
            toast.error(e.response?.data?.error || 'Ошибка')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-marso-900 to-marso-dark">

            <div className="w-full max-w-md">

                {/* ЛОГО */}
                <div className="text-center mb-10">

                    <div className="inline-flex items-center justify-center w-20 h-20 bg-marso rounded-2xl shadow-premium mx-auto mb-6">
                        <Scissors className="h-10 w-10 text-white" />
                    </div>

                    <h1 className="text-4xl font-serif font-bold text-white">
                        Регистрация
                    </h1>

                    <p className="mt-2 text-marso-300">
                        Создайте аккаунт MarSo
                    </p>

                </div>

                {/* КАРТОЧКА */}
                <div className="bg-white/95 rounded-2xl shadow-premium p-8">

                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* PHONE */}
                        <div>
                            <label className="text-sm mb-2 block">Телефон</label>

                            <div className="relative">
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="+7XXXXXXXXXX"
                                    className="w-full px-5 py-4 border rounded-xl focus:ring-2 focus:ring-marso"
                                    required
                                />
                                <Smartphone className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-marso" />
                            </div>
                        </div>

                        {/* EMAIL */}
                        <div>
                            <label className="text-sm mb-2 block">Email</label>

                            <div className="relative">
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="example@mail.com"
                                    className="w-full px-5 py-4 border rounded-xl focus:ring-2 focus:ring-marso"
                                    required
                                />
                                <Mail className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-marso" />
                            </div>
                        </div>

                        {/* PASSWORD */}
                        <div>
                            <label className="text-sm mb-2 block">Пароль</label>

                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Минимум 6 символов"
                                    className="w-full px-5 py-4 border rounded-xl focus:ring-2 focus:ring-marso"
                                    required
                                />
                                <Lock className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-marso" />
                            </div>
                        </div>

                        {/* BUTTON */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full btn-primary flex items-center justify-center gap-2"
                        >
                            {isLoading ? (
                                'Создание...'
                            ) : (
                                <>
                                    Зарегистрироваться
                                    <ArrowRight className="h-5 w-5" />
                                </>
                            )}
                        </button>

                    </form>

                    {/* ССЫЛКА НА ЛОГИН */}
                    <p className="text-center mt-6 text-sm">
                        Уже есть аккаунт?{' '}
                        <span
                            onClick={() => navigate('/')}
                            className="text-marso cursor-pointer font-medium"
                        >
                            Войти
                        </span>
                    </p>

                </div>

            </div>
        </div>
    )
}