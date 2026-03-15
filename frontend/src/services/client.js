import api from './api'

const getAdminHeaders = () => {
    const token = localStorage.getItem('marso_admin_token')
    if (!token) {
        console.warn('Нет admin-токена в localStorage')
        return {}
    }
    return {
        Authorization: `Bearer ${token}`
    }
}

export const clientAPI = {
    getProfile: () => api.get('/api/profile'),
    getLoyaltyCard: () => api.get('/api/card'),
    updateProfile: (data) => api.put('/api/profile', data),  // Новый метод для обновления профиля
}

export const adminAPI = {
    getAllClients: () => {
        console.log('Вызван getAllClients — добавляю заголовок')
        return api.get('/api/admin/clients', { headers: getAdminHeaders() })
    },

    getClientById: (id) => {
        console.log(`ЗАПРОС ПРОФИЛЯ КЛИЕНТА: /api/admin/clients/${id}`)
        return api.get(`/api/admin/clients/${id}`, {
            headers: getAdminHeaders()
        })
    },

    deleteClient: (id) => api.delete(`/api/admin/clients/${id}`, { headers: getAdminHeaders() }),

    createVisitWithBonus: (data) => api.post('/api/admin/visits-with-bonus', data, {
        headers: getAdminHeaders()
    }),

    scanQR: (token) => api.post('/api/admin/scan-qr', { token }, {
        headers: getAdminHeaders()
    }),

    // ─── НОВЫЙ МЕТОД ────────────────────────────────────────────────────────
    getClientVisits: (clientId) => {
        console.log(`Запрашиваем посещения клиента ${clientId}`)
        return api.get(`/api/admin/clients/${clientId}/visits`, {
            headers: getAdminHeaders()
        })
    },

    getStats: () => {
        console.log('Запрашиваем статистику /api/admin/stats')
        return api.get('/api/admin/stats', {
            headers: getAdminHeaders()
        })
    },  // Новый метод для статистики
}