"use client"

import { useState } from "react"
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from "react-router-dom"
import Dashboard from "./components/Dashboard"
import Inventory from "./components/Inventory"
import PedidosApp from "./components/PedidosApp"
import { Package, BarChart3, Menu, X, Home } from "lucide-react"
import "./App.css"

// Componente de navegación personalizado
const Navigation = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const navigationItems = [
    {
      path: "/",
      label: "Dashboard",
      icon: BarChart3,
      description: "Vista general del inventario",
    },
    {
      path: "/inventario",
      label: "Inventario",
      icon: Package,
      description: "Gestión de productos",
    },
    {
      path: "/pedidos",
      label: "Pedidos",
      icon: Package,
      description: "Gestión de pedidos y proveedores",
    }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo y título */}
        <div className="navbar-brand">
          <div className="brand-icon">
            <Home className="brand-icon-svg" />
          </div>
          <div className="brand-content">
            <h1 className="brand-title">Sistema de Inventario</h1>
            <p className="brand-subtitle">Abarrotes & Más</p>
          </div>
        </div>

        {/* Navegación desktop */}
        <div className="navbar-nav">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-link ${isActive(item.path) ? "nav-link-active" : ""}`}
                title={item.description}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
                {isActive(item.path) && <div className="nav-indicator" />}
              </Link>
            )
          })}
        </div>

        {/* Botón menú móvil */}
        <button
          className="mobile-menu-button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {mobileMenuOpen ? <X className="mobile-menu-icon" /> : <Menu className="mobile-menu-icon" />}
        </button>
      </div>

      {/* Menú móvil */}
      <div className={`mobile-menu ${mobileMenuOpen ? "mobile-menu-open" : ""}`}>
        <div className="mobile-menu-content">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-link ${isActive(item.path) ? "mobile-nav-link-active" : ""}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon className="mobile-nav-icon" />
                <div className="mobile-nav-content">
                  <span className="mobile-nav-label">{item.label}</span>
                  <span className="mobile-nav-description">{item.description}</span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Overlay para cerrar menú móvil */}
      {mobileMenuOpen && <div className="mobile-menu-overlay" onClick={() => setMobileMenuOpen(false)} />}
    </nav>
  )
}

function App() {
  return (
    <Router>
      <div className="app">
        <Navigation />

        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventario" element={<Inventory />} />
            <Route path="/pedidos" element={<PedidosApp/>}/>
          </Routes>
        </main>
      </div>
    </Router>
  )
}

export default App
