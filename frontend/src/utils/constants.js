export const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://your-production-api.com'
    : 'http://localhost:8080'

export const API_ENDPOINTS = {
    // Публичные
    HEALTH: '/health',
    VERSION: '/version',

    // Авторизация
    CLIENT_LOGIN: '/api/auth/login',
    ADMIN_LOGIN: '/api/admin/login',

    // Клиентские
    PROFILE: '/api/profile',
    LOYALTY_CARD: '/api/card',
    VALIDATE_SCAN: '/api/validate-scan',

    // Админские
    CLIENTS: '/api/admin/clients',
    VISITS: '/api/admin/visits',
    VISITS_WITH_BONUS: '/api/admin/visits-with-bonus',
    SCAN_QR: '/api/admin/scan-qr'
}

export const LOYALTY_LEVELS = {
    BRONZE: {
        name: 'bronze',
        minSpent: 0,
        maxSpent: 6999,
        cashback: 3,
        icon: '🥉',
        color: 'amber'
    },
    SILVER: {
        name: 'silver',
        minSpent: 7000,
        maxSpent: 49999,
        cashback: 5,
        icon: '🥈',
        color: 'gray'
    },
    GOLD: {
        name: 'gold',
        minSpent: 50000,
        cashback: 10,
        icon: '🥇',
        color: 'yellow'
    }
}

export const getLevelBySpent = (amount) => {
    if (amount >= LOYALTY_LEVELS.GOLD.minSpent) return LOYALTY_LEVELS.GOLD
    if (amount >= LOYALTY_LEVELS.SILVER.minSpent) return LOYALTY_LEVELS.SILVER
    return LOYALTY_LEVELS.BRONZE
}