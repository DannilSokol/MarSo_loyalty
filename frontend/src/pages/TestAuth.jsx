import React from 'react'
import { useAuth } from '../context/AuthContext'

const TestAuth = () => {
    const auth = useAuth()

    console.log('TestAuth - auth context:', auth)

    const handleTestLogin = async () => {
        console.log('Testing client login...')
        const result = await auth.loginClient('+79991234567')
        console.log('Test login result:', result)
    }

    const handleTestAdminLogin = async () => {
        console.log('Testing admin login...')
        const result = await auth.loginAdmin('admin', 'marso123')
        console.log('Test admin login result:', result)
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Test Auth Page</h1>
            <p>Auth context exists: {auth ? 'YES' : 'NO'}</p>
            <p>Loading: {auth?.loading ? 'YES' : 'NO'}</p>
            <p>User: {JSON.stringify(auth?.user)}</p>
            <p>isAdmin: {auth?.isAdmin ? 'YES' : 'NO'}</p>

            <button
                onClick={handleTestLogin}
                style={{ margin: '10px', padding: '10px', background: '#007bff', color: 'white' }}
            >
                Test Client Login
            </button>

            <button
                onClick={handleTestAdminLogin}
                style={{ margin: '10px', padding: '10px', background: '#28a745', color: 'white' }}
            >
                Test Admin Login
            </button>

            <button
                onClick={auth?.logout}
                style={{ margin: '10px', padding: '10px', background: '#dc3545', color: 'white' }}
            >
                Logout
            </button>
        </div>
    )
}

export default TestAuth