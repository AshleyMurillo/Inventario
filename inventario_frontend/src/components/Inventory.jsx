"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  TrendingUp,
  AlertCircle,
  BarChart3,
  Eye,
  X,
  Zap,
  ShoppingCart,
  Activity,
  Target,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js"
import "../styles/Inventory.css"

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const Inventory = () => {
  const [productos, setProductos] = useState([])
  const [modalData, setModalData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState("")
  const [itemsPerPage] = useState(10)

  useEffect(() => {
    fetchProductos()
  }, [])

  const fetchProductos = async () => {
    try {
      setLoading(true)
      const response = await fetch("http://localhost:5000/api/inventario/con-eoq")
      if (!response.ok) throw new Error("Error al cargar productos")
      const data = await response.json()
      setProductos(data)
    } catch (err) {
      console.error("Error al cargar EOQ:", err)
      setError("Error al cargar los productos")
    } finally {
      setLoading(false)
    }
  }

  const handleDetalles = async (productId, nombre) => {
    try {
      const res = await fetch(`http://localhost:5000/api/inventario/detalles/${productId}`)
      const data = await res.json()
      setModalData({ nombre, ...data })
    } catch (error) {
      console.error("Error al obtener detalles:", error)
      setModalData({ nombre, error: true })
    }
  }

  const getStockStatus = (stock, eoq) => {
    const ratio = stock / eoq
    if (ratio < 0.5) return { status: "critical", color: "danger", label: "Crítico" }
    if (ratio < 1) return { status: "low", color: "warning", label: "Bajo" }
    if (ratio < 2) return { status: "good", color: "success", label: "Bueno" }
    return { status: "high", color: "info", label: "Alto" }
  }

  // Filtrar productos por búsqueda
  const filteredProductos = productos.filter(
    (producto) =>
      producto.Product_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.Product_ID.toString().includes(searchTerm),
  )

  // Calcular paginación
  const totalPages = Math.ceil(filteredProductos.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentProductos = filteredProductos.slice(startIndex, endIndex)

  // Resetear página cuando cambia la búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  const generarProsa = (data) => {
    const stockStatus = getStockStatus(data["Stock actual"], data.EOQ)
    return `El análisis del producto "${data.nombre}" revela un stock actual de ${data["Stock actual"]} unidades con un estado ${stockStatus.label.toLowerCase()}. 

El sistema recomienda mantener un Punto de Reorden (PRO) de ${data.PRO} unidades y un stock de seguridad de ${data["Stock seguro"]} unidades para evitar desabastecimientos.

La Cantidad Económica de Pedido (EOQ) calculada es de ${Math.round(data.EOQ)} unidades, optimizando los costos de almacenamiento y pedido. 

Recomendación: Realizar un pedido de ${Math.round(data["Pedido sugerido"])} unidades para mantener niveles óptimos de inventario.`
  }

  const generarGrafico = (data) => {
    return {
      labels: ["Stock Actual", "EOQ", "Stock Seguro", "PRO", "Pedido Sugerido"],
      datasets: [
        {
          label: "Cantidad",
          data: [data["Stock actual"], Math.round(data.EOQ), data["Stock seguro"], data.PRO, data["Pedido sugerido"]],
          backgroundColor: [
            "rgba(59, 130, 246, 0.8)", // Stock Actual - Azul
            "rgba(16, 185, 129, 0.8)", // EOQ - Verde
            "rgba(245, 158, 11, 0.8)", // Stock Seguro - Ámbar
            "rgba(239, 68, 68, 0.8)", // PRO - Rojo
            "rgba(139, 92, 246, 0.8)", // Pedido Sugerido - Púrpura
          ],
          borderColor: [
            "rgba(59, 130, 246, 1)",
            "rgba(16, 185, 129, 1)",
            "rgba(245, 158, 11, 1)",
            "rgba(239, 68, 68, 1)",
            "rgba(139, 92, 246, 1)",
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
  }

  const opcionesGrafico = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.95)",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        borderColor: "rgba(59, 130, 246, 0.5)",
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          title: (context) => `${context[0].label}`,
          label: (context) => `Cantidad: ${context.parsed.y} unidades`,
        },
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 12,
            weight: "500",
          },
          maxRotation: 45,
        },
      },
      y: {
        grid: {
          color: "rgba(148, 163, 184, 0.1)",
          drawBorder: false,
        },
        ticks: {
          color: "#64748b",
          font: {
            size: 12,
          },
          callback: (value) => value + " u",
        },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
  }

  if (loading) {
    return (
      <div className="inventory-container">
        <div className="inventory-header">
          <div className="skeleton skeleton-title"></div>
        </div>
        <div className="inventory-content">
          <div className="skeleton skeleton-table"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="inventory-container">
        <div className="error-state">
          <AlertCircle className="error-icon" />
          <h3 className="error-title">Error al cargar inventario</h3>
          <p className="error-message">{error}</p>
          <button className="btn btn-primary" onClick={fetchProductos}>
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <motion.div
        className="inventory-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className="inventory-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="header-content">
            <div className="header-icon">
              <Package className="icon-lg" />
            </div>
            <div className="header-text">
              <h1 className="header-title">Gestión de Inventario</h1>
              <p className="header-subtitle">Análisis EOQ y optimización de stock</p>
            </div>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">Total Productos</span>
              <span className="stat-value">{productos.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Mostrando</span>
              <span className="stat-value">{filteredProductos.length}</span>
            </div>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          className="inventory-content"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="table-container">
            <div className="table-header">
              <h2 className="table-title">
                <BarChart3 className="icon-sm" />
                Productos y Análisis EOQ
              </h2>
            </div>

            <div className="search-section">
              <div className="search-container">
                <Search className="search-icon" />
                <input
                  type="text"
                  placeholder="Buscar por nombre o ID del producto..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm("")
                      setCurrentPage(1)
                    }}
                    className="search-clear"
                  >
                    <X className="icon-xs" />
                  </button>
                )}
              </div>
              <div className="search-results">
                {searchTerm && (
                  <span className="search-results-text">
                    {filteredProductos.length} resultado{filteredProductos.length !== 1 ? "s" : ""} encontrado
                    {filteredProductos.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>

            <div className="table-wrapper">
              <table className="inventory-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Producto</th>
                    <th>Stock Actual</th>
                    <th>EOQ</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <AnimatePresence>
                    {currentProductos.map((producto, index) => {
                      const stockStatus = getStockStatus(producto.Stock_Quantity, producto.EOQ)
                      return (
                        <motion.tr
                          key={producto.Product_ID}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="table-row"
                        >
                          <td className="cell-id">{producto.Product_ID}</td>
                          <td className="cell-name">
                            <div className="product-info">
                              <Package className="product-icon" />
                              <span>{producto.Product_Name}</span>
                            </div>
                          </td>
                          <td className="cell-stock">
                            <span className="stock-value">{producto.Stock_Quantity}</span>
                            <span className="stock-unit">unidades</span>
                          </td>
                          <td className="cell-eoq">
                            <span className="eoq-value">{Math.round(producto.EOQ)}</span>
                          </td>
                          <td className="cell-status">
                            <span className={`status-badge status-${stockStatus.color}`}>{stockStatus.label}</span>
                          </td>
                          <td className="cell-actions">
                            <button
                              className="btn-details"
                              onClick={() => handleDetalles(producto.Product_ID, producto.Product_Name)}
                            >
                              <Eye className="icon-xs" />
                              Ver Detalles
                            </button>
                          </td>
                        </motion.tr>
                      )
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="pagination-section">
                <div className="pagination-info">
                  <span className="pagination-text">
                    Mostrando {startIndex + 1} - {Math.min(endIndex, filteredProductos.length)} de{" "}
                    {filteredProductos.length} productos
                  </span>
                </div>
                <div className="pagination-controls">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-btn pagination-prev"
                  >
                    <ChevronLeft className="icon-xs" />
                    Anterior
                  </button>

                  <div className="pagination-numbers">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber
                      if (totalPages <= 5) {
                        pageNumber = i + 1
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i
                      } else {
                        pageNumber = currentPage - 2 + i
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => handlePageChange(pageNumber)}
                          className={`pagination-number ${currentPage === pageNumber ? "pagination-active" : ""}`}
                        >
                          {pageNumber}
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-btn pagination-next"
                  >
                    Siguiente
                    <ChevronRight className="icon-xs" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action Button */}
          <motion.div
            className="action-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button className="btn-promotion">
              <Zap className="icon-sm" />
              Simular Promociones
              <span className="btn-arrow">→</span>
            </button>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {modalData && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="modal-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setModalData(null)}
            />

            <motion.div
              className="modal-content modal-large"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
            >
              <div className="modal-header">
                <div className="modal-title-section">
                  <Activity className="modal-icon" />
                  <div>
                    <h2 className="modal-title">Análisis Detallado</h2>
                    <p className="modal-subtitle">{modalData.nombre}</p>
                  </div>
                </div>
                <button className="modal-close" onClick={() => setModalData(null)}>
                  <X className="icon-sm" />
                </button>
              </div>

              <div className="modal-body">
                {modalData.error ? (
                  <div className="error-content">
                    <AlertCircle className="error-icon-large" />
                    <h3 className="error-title">Datos Insuficientes</h3>
                    <p className="error-description">
                      Este producto no tiene datos suficientes para mostrar el análisis detallado.
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Métricas */}
                    <div className="metrics-grid">
                      <div className="metric-card metric-primary">
                        <div className="metric-icon">
                          <Package className="icon-md" />
                        </div>
                        <div className="metric-content">
                          <span className="metric-label">Stock Actual</span>
                          <span className="metric-value">{modalData["Stock actual"]}</span>
                        </div>
                      </div>

                      <div className="metric-card metric-success">
                        <div className="metric-icon">
                          <Target className="icon-md" />
                        </div>
                        <div className="metric-content">
                          <span className="metric-label">EOQ Óptimo</span>
                          <span className="metric-value">{Math.round(modalData.EOQ)}</span>
                        </div>
                      </div>

                      <div className="metric-card metric-warning">
                        <div className="metric-icon">
                          <AlertCircle className="icon-md" />
                        </div>
                        <div className="metric-content">
                          <span className="metric-label">Stock Seguro</span>
                          <span className="metric-value">{modalData["Stock seguro"]}</span>
                        </div>
                      </div>

                      <div className="metric-card metric-info">
                        <div className="metric-icon">
                          <TrendingUp className="icon-md" />
                        </div>
                        <div className="metric-content">
                          <span className="metric-label">Punto Reorden</span>
                          <span className="metric-value">{modalData.PRO}</span>
                        </div>
                      </div>

                      <div className="metric-card metric-purple">
                        <div className="metric-icon">
                          <ShoppingCart className="icon-md" />
                        </div>
                        <div className="metric-content">
                          <span className="metric-label">Pedido Sugerido</span>
                          <span className="metric-value">{Math.round(modalData["Pedido sugerido"])}</span>
                        </div>
                      </div>

                      <div className="metric-card metric-secondary">
                        <div className="metric-icon">
                          <Activity className="icon-md" />
                        </div>
                        <div className="metric-content">
                          <span className="metric-label">Estado</span>
                          <span className="metric-status">{modalData.Estado}</span>
                        </div>
                      </div>
                    </div>

                    {/* Gráfico */}
                    <div className="chart-section">
                      <h3 className="chart-title">
                        <BarChart3 className="icon-sm" />
                        Análisis Visual de Inventario
                      </h3>
                      <div className="chart-container">
                        <Bar data={generarGrafico(modalData)} options={opcionesGrafico} />
                      </div>
                    </div>

                    {/* Análisis */}
                    <div className="analysis-section">
                      <h3 className="analysis-title">
                        <TrendingUp className="icon-sm" />
                        Análisis y Recomendaciones
                      </h3>
                      <div className="analysis-content">
                        <p className="analysis-text">{generarProsa(modalData)}</p>
                      </div>
                    </div>
                  </>
                )}

                <div className="modal-actions">
                  <button className="btn btn-primary btn-full" onClick={() => setModalData(null)}>
                    Cerrar Análisis
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Inventory
