import { Route, Routes, Navigate } from "react-router-dom"
import { useEffect } from "react"
import axios from "./lib/axios"

import HomePage from "./pages/HomePage"
import SignUpPage from "./pages/SignUpPage"
import LoginPage from "./pages/LoginPage"
import AdminPage from "./pages/AdminPage"
import CategoryPage from "./pages/CategoryPage"
import CartPage from "./pages/CartPage"
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage"
import PurchaseCancelPage from "./pages/PurchaseCancelPage"


import { useUserStore } from "./stores/useUserStores"
import { useCartStore } from "./stores/useCartStore"
import Navbar from "./components/Navbar"
import { Toaster } from "react-hot-toast"
import LoadingSpinner from "./components/LoadingSpinner"

const url = 'https://e-commerce-4xoe.onrender.com/'
const interval = 30000


function App() {
  const { user, checkAuth, checkingAuth } = useUserStore();
  const { getCartItems } = useCartStore();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    if (!user) return;
    getCartItems();
  }, [getCartItems, user]);

  useEffect(() => {
    const reloadWebsite = () => {
      axios.get(url)
        .then(response => {
          console.log(`Reload at ${new Date().toISOString()}: Status Code ${response.status}`);
        })
        .catch (error => {
          console.error(`Error reloading at ${new Date().toISOString()}:`, error.message);
        })
    };

    const intervalId = setInterval(reloadWebsite, interval);

    return () => clearInterval(intervalId);
  }, []);

  if (checkingAuth) return <LoadingSpinner />


  return (
    <div className='min-h-screen bg-gray-900 text-white relative overflow-hidden'>
      {/* Background gradient */}
			<div className='absolute inset-0 overflow-hidden'>
				<div className='absolute inset-0'>
					<div className='absolute top-0 left-1/2 -translate-x-1/2 w-full h-full 
          bg-[radial-gradient(ellipse_at_top,_rgba(99,102,241,0.3)_0%,_rgba(55,65,81,0.2)_45%,_rgba(0,0,0,0.1)_100%)]' />
				</div>
			</div>

      <div className='relative z-50 pt-20'>
        <Navbar />
        <Routes>

          <Route path="/" element={<HomePage />} />
          <Route path="/signup" element={!user ? <SignUpPage /> : <Navigate to='/' />} />
          <Route path="/login" element={!user ? <LoginPage /> : <Navigate to='/' />} />
          <Route path="/secret-dashboard" element={user?.role === "admin" ? <AdminPage /> : <Navigate to='/login' />} />
          <Route path='/category/:category' element={<CategoryPage />} />
					<Route path='/cart' element={user ? <CartPage /> : <Navigate to='/login' />} />
					<Route path='/purchase-success' element={user ? <PurchaseSuccessPage /> : <Navigate to='/login' />} />
          <Route path='/purchase-cancel' element={user ? <PurchaseCancelPage /> : <Navigate to='/login' />} />

        </Routes>
      </div>
      <Toaster />
          
          
    </div>
  )
}

export default App
