import React, { useEffect, useRef } from 'react'
import { useAppContext } from '../context/AppContext'
import { useLocation } from 'react-router-dom'

// Shown after returning from Stripe Checkout. The order is confirmed by the
// Stripe webhook; here we just empty the local cart and move on.
const Loading = () => {

    const { navigate, user, setCartItems } = useAppContext()
    const { search } = useLocation()
    const query = new URLSearchParams(search)
    const nextUrl = query.get('next');
    const cartCleared = useRef(false)

    useEffect(() => {
        if (nextUrl === 'my-orders' && user && !cartCleared.current) {
            cartCleared.current = true
            setCartItems({})
        }
    }, [nextUrl, user, setCartItems])

    useEffect(() => {
        if (!nextUrl) return
        // Only allow internal relative paths (prevents open redirects)
        const safeNext = /^[a-z0-9\-/]+$/i.test(nextUrl) ? nextUrl.replace(/^\/+/, '') : ''
        const timer = setTimeout(() => {
            navigate(`/${safeNext}`)
        }, 5000)
        return () => clearTimeout(timer)
    }, [nextUrl, navigate])


    return (
        <div className='flex justify-center items-center h-screen'>
            <div className='animate-spin rounded-full h-24 w-24 border-4 border-gray-300 border-t-primary'></div>

        </div>
    )
}

export default Loading
