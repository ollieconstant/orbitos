import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import Landing from './pages/Landing.jsx'
import Pricing from './pages/Pricing.jsx'
import App     from './App.jsx'

const path = window.location.pathname

const Component = path === '/pricing'     ? Pricing
                : path.startsWith('/app') ? App
                : Landing

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Component />
  </React.StrictMode>
)
