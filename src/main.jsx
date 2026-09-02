import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import Landing from './pages/Landing.jsx'
import Pricing from './pages/Pricing.jsx'

const path = window.location.pathname
const Page = path === '/pricing'     ? Pricing
           : path.startsWith('/app') ? App
           : Landing

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Page /></React.StrictMode>
)
