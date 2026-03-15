import React from 'react'

const LoadingSpinner = ({ size = 'md', text = 'Загрузка...' }) => {
    const sizeClasses = {
        sm: 'h-6 w-6',
        md: 'h-12 w-12',
        lg: 'h-16 w-16'
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
            <div className={`animate-spin rounded-full border-b-2 border-marso-red ${sizeClasses[size]}`}></div>
            {text && <p className="mt-4 text-gray-600">{text}</p>}
        </div>
    )
}

export default LoadingSpinner