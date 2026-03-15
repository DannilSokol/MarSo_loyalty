// src/context/AuthContext.jsx (полный файл)
import React, { createContext, useState, useContext, useEffect } from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../services/api'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) throw new Error('useAuth must be used within an AuthProvider')
    return context
}

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        // Применяем токен только один раз при монтировании
        const clientToken = localStorage.getItem('marso_token')
        const adminToken = localStorage.getItem('marso_admin_token')

        if (adminToken) {
            try {
                jwtDecode(adminToken)
                if (api.defaults.headers.common['Authorization'] !== `Bearer ${adminToken}`) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`
                    console.log('Admin token applied once')
                }
                setIsAdmin(true)
                setUser({ isAdmin: true })
            } catch (err) {
                console.error('Invalid admin token:', err)
                localStorage.removeItem('marso_admin_token')
            }
        } else if (clientToken) {
            try {
                const decoded = jwtDecode(clientToken)
                if (api.defaults.headers.common['Authorization'] !== `Bearer ${clientToken}`) {
                    api.defaults.headers.common['Authorization'] = `Bearer ${clientToken}`
                    console.log('Client token applied once')
                }
                setUser(decoded)
            } catch (err) {
                console.error('Invalid client token:', err)
                localStorage.removeItem('marso_token')
            }
        }

        setLoading(false)
    }, []) // Пустой массив — выполняется только при монтировании

    const loginClient = async (phone) => {
        try {
            const response = await api.post('/api/auth/login', { phone })
            const { token } = response.data
            const decoded = jwtDecode(token)

            localStorage.setItem('marso_token', token)
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`

            const profileResponse = await api.get('/api/profile')
            const clientData = profileResponse.data

            setUser({ ...decoded, ...clientData, phone })
            setIsAdmin(false)

            toast.success('Вход выполнен')
            return { success: true }
        } catch (err) {
            const msg = err.response?.data?.error || 'Ошибка входа'
            toast.error(msg)
            return { success: false, error: msg }
        }
    }

    const loginAdmin = async (login, password) => {
        try {
            const response = await api.post('/api/admin/login', { login, password })
            const { token } = response.data

            localStorage.setItem('marso_admin_token', token)
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`

            setIsAdmin(true)
            setUser({ isAdmin: true, login })

            toast.success('Админ авторизован')
            return { success: true }
        } catch (err) {
            const msg = err.response?.data?.error || 'Неверные данные'
            toast.error(msg)
            return { success: false, error: msg }
        }
    }

    const logout = () => {
        localStorage.removeItem('marso_token')
        localStorage.removeItem('marso_admin_token')
        delete api.defaults.headers.common['Authorization']
        setUser(null)
        setIsAdmin(false)
        toast.success('Выход выполнен')
    }

    const updateUserData = (newData) => {
        setUser(prev => ({ ...prev, ...newData }))
    }

    const value = {
        user,
        isAdmin,
        loading,
        loginClient,
        loginAdmin,
        logout,
        updateUserData,
        isAuthenticated: !!user || isAdmin,
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}