import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App     from './App.jsx'
import Landing from './Landing.jsx'
import Pricing from './Pricing.jsx'
import Privacy from './Privacy.jsx'
import Terms   from './Terms.jsx'

const path = window.location.pathname

const Page = path === '/pricing'     ? Pricing
           : path === '/privacy'     ? Privacy
           : path === '/terms'       ? Terms
           : path.startsWith('/app') ? App
           : Landing

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode><Page /></React.StrictMode>
)
