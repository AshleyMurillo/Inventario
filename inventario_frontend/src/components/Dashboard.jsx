"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingUp,
  Calendar,
  BarChart3,
  Eye,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { getProductosActivos, getProductosVencidos, getProductosBajoStock } from "../api/inventarioService"
import { useNavigate } from "react-router-dom"
import "../styles/Dashboard.css"

// Componentes personalizados
const Card = ({ children, className = "", onClick, ...props }) => (
  <div className={`card ${className}`} onClick={onClick} {...props}>
    {children}
  </div>
)

const Button = ({ children, variant = "primary", size = "md", className = "", onClick, disabled, ...props }) => {
  return (
    <button
      className={`btn btn-${variant} btn-${size} ${disabled ? "btn-disabled" : ""} ${className}`}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

const Badge = ({ children, variant = "default", className = "" }) => {
  return <span className={`badge badge-${variant} ${className}`}>{children}</span>
}

const Alert = ({ children, variant = "default", className = "" }) => {
  return <div className={`alert alert-${variant} ${className}`}>{children}</div>
}

const Modal = ({ isOpen, onClose, title, children, maxWidth = "large" }) => {
  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
        {/* Backdrop */}
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          className={`modal-content modal-${maxWidth}`}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.3 }}
        >
          {/* Header */}
          <div className="modal-header">
            <h2 className="modal-title">{title}</h2>
            <button onClick={onClose} className="modal-close">
              <X className="icon-sm" />
            </button>
          </div>

          {/* Content */}
          <div className="modal-body">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

const Table = ({ children, className = "" }) => (
  <div className={`table-container ${className}`}>
    <table className="table">{children}</table>
  </div>
)

const TableHeader = ({ children }) => <thead className="table-header">{children}</thead>

const TableBody = ({ children }) => <tbody className="table-body">{children}</tbody>

const TableRow = ({ children, className = "", ...props }) => (
  <tr className={`table-row ${className}`} {...props}>
    {children}
  </tr>
)

const TableHead = ({ children, className = "" }) => <th className={`table-head ${className}`}>{children}</th>

const TableCell = ({ children, className = "" }) => <td className={`table-cell ${className}`}>{children}</td>

const Skeleton = ({ className = "" }) => <div className={`skeleton ${className}`} />

const Dashboard = () => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [totalActivos, setTotalActivos] = useState(0)
  const [productosVencidos, setProductosVencidos] = useState([])
  const [productosBajoStock, setProductosBajoStock] = useState([])
  const [modalBajoStock, setModalBajoStock] = useState(false)
  const [modalVencidos, setModalVencidos] = useState(false)
  const navigate = useNavigate()

  const [searchTermBajoStock, setSearchTermBajoStock] = useState("")
  const [searchTermVencidos, setSearchTermVencidos] = useState("")
  const [currentPageBajoStock, setCurrentPageBajoStock] = useState(1)
  const [currentPageVencidos, setCurrentPageVencidos] = useState(1)
  const [itemsPerPageModal] = useState(8)

  const filteredProductosBajoStock = productosBajoStock.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(searchTermBajoStock.toLowerCase()) ||
      producto.id.toString().includes(searchTermBajoStock),
  )

  // Paginación para productos bajo stock
  const totalPagesBajoStock = Math.ceil(filteredProductosBajoStock.length / itemsPerPageModal)
  const startIndexBajoStock = (currentPageBajoStock - 1) * itemsPerPageModal
  const endIndexBajoStock = startIndexBajoStock + itemsPerPageModal
  const currentProductosBajoStock = filteredProductosBajoStock.slice(startIndexBajoStock, endIndexBajoStock)

  // Filtrado para productos vencidos
  const filteredProductosVencidos = productosVencidos.filter(
    (producto) =>
      producto.nombre.toLowerCase().includes(searchTermVencidos.toLowerCase()) ||
      producto.id.toString().includes(searchTermVencidos),
  )

  // Paginación para productos vencidos
  const totalPagesVencidos = Math.ceil(filteredProductosVencidos.length / itemsPerPageModal)
  const startIndexVencidos = (currentPageVencidos - 1) * itemsPerPageModal
  const endIndexVencidos = startIndexVencidos + itemsPerPageModal
  const currentProductosVencidos = filteredProductosVencidos.slice(startIndexVencidos, endIndexVencidos)

  // Funciones de manejo de búsqueda y paginación
  const handleSearchBajoStockChange = (e) => {
    setSearchTermBajoStock(e.target.value)
    setCurrentPageBajoStock(1)
  }

  const handleSearchVencidosChange = (e) => {
    setSearchTermVencidos(e.target.value)
    setCurrentPageVencidos(1)
  }

  const handlePageChangeBajoStock = (page) => {
    setCurrentPageBajoStock(page)
  }

  const handlePageChangeVencidos = (page) => {
    setCurrentPageVencidos(page)
  }

  // Componente de paginación reutilizable
  const PaginationControls = ({
    currentPage,
    totalPages,
    onPageChange,
    startIndex,
    endIndex,
    totalItems,
    itemName,
  }) => {
    if (totalPages <= 1) return null

    return (
      <div className="modal-pagination-section">
        <div className="modal-pagination-info">
          <span className="modal-pagination-text">
            Mostrando {startIndex + 1} - {Math.min(endIndex, totalItems)} de {totalItems} {itemName}
          </span>
        </div>
        <div className="modal-pagination-controls">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="modal-pagination-btn modal-pagination-prev"
          >
            <ChevronLeft className="icon-xs" />
            Anterior
          </button>

          <div className="modal-pagination-numbers">
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
                  onClick={() => onPageChange(pageNumber)}
                  className={`modal-pagination-number ${currentPage === pageNumber ? "modal-pagination-active" : ""}`}
                >
                  {pageNumber}
                </button>
              )
            })}
          </div>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="modal-pagination-btn modal-pagination-next"
          >
            Siguiente
            <ChevronRight className="icon-xs" />
          </button>
        </div>
      </div>
    )
  }

  // Componente de búsqueda reutilizable
  const SearchControls = ({ searchTerm, onSearchChange, placeholder, resultsCount, itemName }) => (
    <div className="modal-search-section">
      <div className="modal-search-container">
        <Search className="modal-search-icon" />
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={onSearchChange}
          className="modal-search-input"
        />
        {searchTerm && (
          <button onClick={() => onSearchChange({ target: { value: "" } })} className="modal-search-clear">
            <X className="icon-xs" />
          </button>
        )}
      </div>
      <div className="modal-search-results">
        {searchTerm && (
          <span className="modal-search-results-text">
            {resultsCount} {itemName}
            {resultsCount !== 1 ? "s" : ""} encontrado{resultsCount !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  )

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [activosRes, vencidosRes, bajoStockRes] = await Promise.all([
        getProductosActivos(),
        getProductosVencidos(),
        getProductosBajoStock(),
      ])

      setTotalActivos(activosRes.data.total_activos)
      setProductosVencidos(vencidosRes.data)
      setProductosBajoStock(bajoStockRes.data)
    } catch (err) {
      console.error("Error al cargar datos:", err)
      setError("Error al cargar datos. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
      },
    },
  }

  const cardHoverVariants = {
    hover: {
      scale: 1.02,
      y: -5,
      transition: {
        type: "spring",
        stiffness: 300,
      },
    },
  }

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <Skeleton className="skeleton-title" />
          <Skeleton className="skeleton-button" />
        </div>
        <div className="stats-grid">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="skeleton-card" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <Alert variant="destructive" className="error-alert">
          <div className="alert-content">
            <AlertTriangle className="icon-sm" />
            {error}
          </div>
        </Alert>
        <Button onClick={fetchDashboardData} className="retry-button">
          <RefreshCw className="icon-sm" />
          Reintentar
        </Button>
      </div>
    )
  }

  return (
    <>
      <motion.div className="dashboard-container" variants={containerVariants} initial="hidden" animate="visible">
        {/* Header */}
        <motion.div className="dashboard-header" variants={itemVariants}>
          <div className="header-content">
            <h1 className="dashboard-title">Dashboard de Inventario</h1>
            <p className="dashboard-subtitle">Gestiona tu inventario de manera inteligente</p>
          </div>
          <Button onClick={fetchDashboardData} variant="outline" className="refresh-button">
            <RefreshCw className="icon-sm" />
            Actualizar
          </Button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div className="stats-grid" variants={containerVariants}>
          {/* Total Productos Activos */}
          <motion.div variants={itemVariants} whileHover="hover">
            <motion.div variants={cardHoverVariants}>
              <Card className="stat-card stat-card-success">
                <div className="card-header">
                  <h3 className="card-title">Total Productos Activos</h3>
                </div>
                <div className="card-content">
                  <div className="stat-main">
                    <div className="stat-number">{totalActivos}</div>
                    <Package className="stat-icon" />
                  </div>
                  <div className="stat-footer">
                    <TrendingUp className="icon-sm" />
                    <span>Stock saludable</span>
                  </div>
                </div>
                <div className="card-decoration"></div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Productos Bajo Stock - Clickeable */}
          <motion.div variants={itemVariants} whileHover="hover">
            <motion.div variants={cardHoverVariants}>
              <Card className="stat-card stat-card-warning clickable-card" onClick={() => setModalBajoStock(true)}>
                <div className="card-header">
                  <div className="card-header-content">
                    <h3 className="card-title">Productos Bajo Stock</h3>
                    <Eye className="card-eye-icon" />
                  </div>
                </div>
                <div className="card-content">
                  <div className="stat-main">
                    <div className="stat-number">{productosBajoStock.length}</div>
                    <AlertTriangle className="stat-icon" />
                  </div>
                  <div className="stat-footer">
                    <BarChart3 className="icon-sm" />
                    <span>{productosBajoStock.length > 0 ? "Requiere atención" : "Todo en orden"}</span>
                  </div>
                </div>
                <div className="card-decoration"></div>
                <div className="card-hint">Click para ver detalles</div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Productos Vencidos - Clickeable */}
          <motion.div variants={itemVariants} whileHover="hover">
            <motion.div variants={cardHoverVariants}>
              <Card className="stat-card stat-card-danger clickable-card" onClick={() => setModalVencidos(true)}>
                <div className="card-header">
                  <div className="card-header-content">
                    <h3 className="card-title">Productos Vencidos</h3>
                    <Eye className="card-eye-icon" />
                  </div>
                </div>
                <div className="card-content">
                  <div className="stat-main">
                    <div className="stat-number">{productosVencidos.length}</div>
                    <Calendar className="stat-icon" />
                  </div>
                  <div className="stat-footer">
                    <AlertTriangle className="icon-sm" />
                    <span>{productosVencidos.length > 0 ? "Acción requerida" : "Todo en orden"}</span>
                  </div>
                </div>
                <div className="card-decoration"></div>
                <div className="card-hint">Click para ver detalles</div>
              </Card>
            </motion.div>
          </motion.div>

          {/* Acciones Rápidas */}
          <motion.div variants={itemVariants} whileHover="hover">
            <motion.div variants={cardHoverVariants}>
              <Card className="stat-card stat-card-primary">
                <div className="card-header">
                  <h3 className="card-title">Acciones Rápidas</h3>
                </div>
                <div className="card-content">
                  <div className="action-buttons">
                    <button className="action-button" onClick={() => navigate("/inventario")}>
                      <Package className="icon-sm" />
                      Inventario
                    </button>
                    <button className="action-button" onClick={() => navigate("/pedidos")}>
                      <ShoppingCart className="icon-sm" />
                      Nuevo Pedido
                    </button>
                  </div>
                </div>
                <div className="card-decoration"></div>
              </Card>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Mensaje informativo */}
        <motion.div variants={itemVariants}>
          <div className="info-tip">
            <p>
              💡 <strong>Tip:</strong> Haz clic en las tarjetas de "Productos Bajo Stock" y "Productos Vencidos" para
              ver los detalles
            </p>
          </div>
        </motion.div>
      </motion.div>

      {/* Modal Productos Bajo Stock */}
      <Modal
        isOpen={modalBajoStock}
        onClose={() => {
          setModalBajoStock(false)
          setSearchTermBajoStock("")
          setCurrentPageBajoStock(1)
        }}
        title={
          <div className="modal-title-content modal-title-warning">
            <AlertTriangle className="icon-md" />
            Productos Bajo Stock
            <Badge variant="warning" className="modal-badge">
              {productosBajoStock.length} productos
            </Badge>
          </div>
        }
        maxWidth="extra-large"
      >
        <AnimatePresence>
          {productosBajoStock.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <SearchControls
                searchTerm={searchTermBajoStock}
                onSearchChange={handleSearchBajoStockChange}
                placeholder="Buscar por nombre o ID del producto..."
                resultsCount={filteredProductosBajoStock.length}
                itemName="producto"
              />

              <div className="modal-table-container">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header-warning">
                      <TableHead>ID</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead className="text-right">Stock Actual</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProductosBajoStock.map((producto, index) => (
                      <motion.tr
                        key={producto.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="table-row-hover"
                      >
                        <TableCell className="modal-cell-id">{producto.id}</TableCell>
                        <TableCell className="modal-cell-name">
                          <div className="modal-product-info">
                            <Package className="modal-product-icon" />
                            <span>{producto.nombre}</span>
                          </div>
                        </TableCell>
                        <TableCell className="modal-cell-stock">
                          <div className="modal-stock-container">
                            <span className="modal-stock-value">{producto.existencias}</span>
                            <span className="modal-stock-unit">unidades</span>
                          </div>
                        </TableCell>
                        <TableCell className="modal-cell-status">
                          <Badge variant={producto.existencias < 10 ? "destructive" : "warning"}>
                            {producto.existencias < 10 ? "CRÍTICO" : "BAJO"}
                          </Badge>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                currentPage={currentPageBajoStock}
                totalPages={totalPagesBajoStock}
                onPageChange={handlePageChangeBajoStock}
                startIndex={startIndexBajoStock}
                endIndex={endIndexBajoStock}
                totalItems={filteredProductosBajoStock.length}
                itemName="productos"
              />
            </motion.div>
          ) : (
            <motion.div className="empty-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <CheckCircle2 className="empty-state-icon empty-state-success" />
              <h3 className="empty-state-title">¡Stock Saludable!</h3>
              <p className="empty-state-text">Todos los productos tienen stock suficiente</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>

      {/* Modal Productos Vencidos */}
      <Modal
        isOpen={modalVencidos}
        onClose={() => {
          setModalVencidos(false)
          setSearchTermVencidos("")
          setCurrentPageVencidos(1)
        }}
        title={
          <div className="modal-title-content modal-title-danger">
            <Calendar className="icon-md" />
            Productos Vencidos
            <Badge variant="destructive" className="modal-badge">
              {productosVencidos.length} productos
            </Badge>
          </div>
        }
        maxWidth="extra-large"
      >
        <AnimatePresence>
          {productosVencidos.length > 0 ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <SearchControls
                searchTerm={searchTermVencidos}
                onSearchChange={handleSearchVencidosChange}
                placeholder="Buscar por nombre o ID del producto..."
                resultsCount={filteredProductosVencidos.length}
                itemName="producto"
              />

              <div className="modal-table-container">
                <Table>
                  <TableHeader>
                    <TableRow className="table-header-danger">
                      <TableHead>ID</TableHead>
                      <TableHead>Producto</TableHead>
                      <TableHead>Categoría</TableHead>
                      <TableHead>Fecha Vencimiento</TableHead>
                      <TableHead>Días Vencido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProductosVencidos.map((producto, index) => {
                      const fechaVenc = new Date(producto.fechaVencimiento)
                      const hoy = new Date()
                      const diffTime = hoy - fechaVenc
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

                      return (
                        <motion.tr
                          key={producto.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="table-row-hover"
                        >
                          <TableCell className="modal-cell-id">{producto.id}</TableCell>
                          <TableCell className="modal-cell-name">
                            <div className="modal-product-info">
                              <Package className="modal-product-icon" />
                              <span>{producto.nombre}</span>
                            </div>
                          </TableCell>
                          <TableCell className="modal-cell-category">{producto.categoria || "Sin categoría"}</TableCell>
                          <TableCell className="modal-cell-date">{fechaVenc.toLocaleDateString()}</TableCell>
                          <TableCell className="modal-cell-status">
                            <Badge variant={diffDays > 30 ? "destructive" : "warning"} className="font-bold">
                              {diffDays} días
                            </Badge>
                          </TableCell>
                        </motion.tr>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              <PaginationControls
                currentPage={currentPageVencidos}
                totalPages={totalPagesVencidos}
                onPageChange={handlePageChangeVencidos}
                startIndex={startIndexVencidos}
                endIndex={endIndexVencidos}
                totalItems={filteredProductosVencidos.length}
                itemName="productos"
              />
            </motion.div>
          ) : (
            <motion.div className="empty-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
              <CheckCircle2 className="empty-state-icon empty-state-success" />
              <h3 className="empty-state-title">¡Excelente!</h3>
              <p className="empty-state-text">No hay productos vencidos</p>
              <p className="empty-state-subtext">Todos los productos están dentro de su fecha de caducidad</p>
            </motion.div>
          )}
        </AnimatePresence>
      </Modal>
    </>
  )
}

export default Dashboard
