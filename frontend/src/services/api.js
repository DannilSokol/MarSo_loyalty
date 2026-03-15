// src/services/api.js (полный)
import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8080',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
})

// Интерсептор — теперь безопасный, не перезаписывает существующий заголовок
api.interceptors.request.use((config) => {
    const clientToken = localStorage.getItem('marso_token')
    const adminToken = localStorage.getItem('marso_admin_token')

    // Если заголовок уже есть — не трогаем (чтобы не перезаписывать Bearer)
    if (!config.headers.Authorization) {
        let token = null
        if (adminToken) token = adminToken
        else if (clientToken) token = clientToken

        if (token) {
            config.headers.Authorization = `Bearer ${token}`
            console.log('Интерсептор добавил Bearer:', token.slice(0, 30) + '...')
        }
    }

    return config
})

export default api