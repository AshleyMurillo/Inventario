"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  Zap,
  TrendingUp,
  BarChart3,
  Package,
  Target,
  Calculator,
  AlertCircle,
  CheckCircle2,
  Search,
  ChevronDown,
} from "lucide-react"
import { Bar } from "react-chartjs-2"
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from "chart.js"
import "../styles/PromotionSimulationModal.css"

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend)

const PromotionSimulationModal = ({ isOpen, onClose, productos = [] }) => {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [promotionPercentage, setPromotionPercentage] = useState(15)
  const [simulationResult, setSimulationResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [showProductDropdown, setShowProductDropdown] = useState(false)

  // Filtrar productos por búsqueda
  const filteredProducts = productos.filter(
    (producto) =>
      producto.Product_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      producto.Product_ID.toString().includes(searchTerm),
  )

  // Reset al cerrar modal
  useEffect(() => {
    if (!isOpen) {
      setSelectedProduct(null)
      setPromotionPercentage(15)
      setSimulationResult(null)
      setError(null)
      setSearchTerm("")
      setShowProductDropdown(false)
    }
  }, [isOpen])

  const handleSimulation = async () => {
    if (!selectedProduct) {
      setError("Por favor selecciona un producto")
      return
    }

    if (promotionPercentage <= 0 || promotionPercentage > 100) {
      setError("El porcentaje debe estar entre 1 y 100")
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch(
        `http://localhost:5000/api/inventario/simular-promocion/${selectedProduct.Product_ID}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            porcentaje_promocion: promotionPercentage,
          }),
        },
      )

      if (!response.ok) {
        throw new Error("Error al simular promoción")
      }

      const data = await response.json()
      setSimulationResult(data)
    } catch (err) {
      console.error("Error en simulación:", err)
      setError("Error al realizar la simulación. Intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const generateChartData = () => {
    if (!simulationResult) return null

    return {
      labels: ["Demanda Anual", "EOQ Óptimo"],
      datasets: [
        {
          label: "Situación Actual",
          data: [Math.round(simulationResult["Demanda Anual Actual"]), Math.round(simulationResult["EOQ Actual"])],
          backgroundColor: "rgba(59, 130, 246, 0.8)",
          borderColor: "rgba(59, 130, 246, 1)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
        {
          label: "Con Promoción",
          data: [
            Math.round(simulationResult["Demanda Anual Simulada"]),
            Math.round(simulationResult["EOQ con Promoción"]),
          ],
          backgroundColor: "rgba(16, 185, 129, 0.8)",
          borderColor: "rgba(16, 185, 129, 1)",
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        },
      ],
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: {
          font: {
            size: 12,
            weight: "500",
          },
          color: "#374151",
          usePointStyle: true,
          pointStyle: "circle",
        },
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
          label: (context) => `${context.dataset.label}: ${context.parsed.y.toLocaleString()} unidades`,
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
          callback: (value) => value.toLocaleString() + " u",
        },
      },
    },
    animation: {
      duration: 1000,
      easing: "easeOutQuart",
    },
  }

  const handleProductSelect = (product) => {
    setSelectedProduct(product)
    setSearchTerm(product.Product_Name)
    setShowProductDropdown(false)
    setSimulationResult(null)
    setError(null)
  }

  // Función para generar análisis dinámico con redondeos
  const generateDynamicAnalysis = (result, percentage) => {
    const diferencia = result["Diferencia EOQ"]
    const eoqActual = result["EOQ Actual"]
    const eoqPromocion = result["EOQ con Promoción"]
    const demandaActual = result["Demanda Anual Actual"]
    const demandaSimulada = result["Demanda Anual Simulada"]

    // Calcular porcentajes de cambio
    const cambioEOQ = (((eoqPromocion - eoqActual) / eoqActual) * 100).toFixed(1)
    const aumentoDemanda = demandaSimulada - demandaActual

    // Determinar el impacto
    let impactoEOQ = ""
    let recomendacion = ""
    let tipoImpacto = ""

    if (diferencia > 0) {
      if (cambioEOQ > 50) {
        impactoEOQ = "un aumento significativo"
        tipoImpacto = "alto"
        recomendacion =
          "Este aumento considerable del EOQ sugiere que deberías considerar negociar mejores términos con proveedores, evaluar descuentos por volumen, y asegurar suficiente capacidad de almacenamiento antes de implementar la promoción."
      } else if (cambioEOQ > 20) {
        impactoEOQ = "un aumento moderado"
        tipoImpacto = "medio"
        recomendacion =
          "El aumento moderado del EOQ indica que la promoción es viable. Considera ajustar tu stock de seguridad y planificar pedidos más grandes pero menos frecuentes para optimizar costos."
      } else {
        impactoEOQ = "un aumento leve"
        tipoImpacto = "bajo"
        recomendacion =
          "El impacto en el EOQ es mínimo, lo que hace esta promoción muy atractiva. Puedes implementarla sin cambios significativos en tu estrategia de pedidos actual."
      }
    } else {
      impactoEOQ = "una reducción"
      tipoImpacto = "positivo"
      recomendacion =
        "Sorprendentemente, el EOQ se reduce con esta promoción. Esto podría indicar eficiencias en la demanda que permiten pedidos más frecuentes y menores costos de almacenamiento."
    }

    return {
      analisisTexto: `La promoción del ${percentage}% en el producto "${result.Producto}" generará un aumento en la demanda anual de ${Math.round(aumentoDemanda).toLocaleString()} unidades (${percentage}% de incremento).

Como resultado, el EOQ experimentará ${impactoEOQ} de ${Math.round(Math.abs(diferencia)).toLocaleString()} unidades, representando un cambio del ${cambioEOQ}% respecto al EOQ actual de ${Math.round(eoqActual).toLocaleString()} unidades.`,

      recomendacionTexto: recomendacion,
      tipoImpacto: tipoImpacto,
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        className="promotion-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="promotion-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        <motion.div
          className="promotion-modal-content"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", duration: 0.4 }}
        >
          {/* Header */}
          <div className="promotion-modal-header">
            <div className="promotion-modal-title-section">
              <div className="promotion-modal-icon">
                <Zap className="promotion-icon" />
              </div>
              <div>
                <h2 className="promotion-modal-title">Simulador de Promociones</h2>
                <p className="promotion-modal-subtitle">Analiza el impacto de promociones en tu inventario</p>
              </div>
            </div>
            <button className="promotion-modal-close" onClick={onClose}>
              <X className="icon-sm" />
            </button>
          </div>

          {/* Body */}
          <div className="promotion-modal-body">
            {/* Configuration Section */}
            <div className="promotion-config-section">
              <h3 className="promotion-section-title">
                <Calculator className="icon-sm" />
                Configuración de Simulación
              </h3>

              <div className="promotion-config-grid">
                {/* Product Selector */}
                <div className="promotion-form-group">
                  <label className="promotion-form-label">Producto a Promocionar</label>
                  <div className="promotion-product-selector">
                    <div className="promotion-search-container">
                      <Search className="promotion-search-icon" />
                      <input
                        type="text"
                        placeholder="Buscar producto por nombre o ID..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value)
                          setShowProductDropdown(true)
                          if (!e.target.value) {
                            setSelectedProduct(null)
                          }
                        }}
                        onFocus={() => setShowProductDropdown(true)}
                        className="promotion-search-input"
                      />
                      <ChevronDown className="promotion-dropdown-icon" />
                    </div>

                    {showProductDropdown && (
                      <motion.div
                        className="promotion-dropdown"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                      >
                        <div className="promotion-dropdown-content">
                          {filteredProducts.length > 0 ? (
                            filteredProducts.slice(0, 8).map((product) => (
                              <button
                                key={product.Product_ID}
                                className="promotion-dropdown-item"
                                onClick={() => handleProductSelect(product)}
                              >
                                <Package className="promotion-dropdown-icon-sm" />
                                <div className="promotion-dropdown-item-content">
                                  <span className="promotion-dropdown-item-name">{product.Product_Name}</span>
                                  <span className="promotion-dropdown-item-id">ID: {product.Product_ID}</span>
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="promotion-dropdown-empty">
                              <AlertCircle className="promotion-dropdown-empty-icon" />
                              <span>No se encontraron productos</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Percentage Input */}
                <div className="promotion-form-group">
                  <label className="promotion-form-label">Aumento de Demanda (%)</label>
                  <div className="promotion-percentage-container">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={promotionPercentage}
                      onChange={(e) => setPromotionPercentage(Number(e.target.value))}
                      className="promotion-percentage-input"
                    />
                    <div className="promotion-percentage-slider-container">
                      <input
                        type="range"
                        min="1"
                        max="100"
                        value={promotionPercentage}
                        onChange={(e) => setPromotionPercentage(Number(e.target.value))}
                        className="promotion-percentage-slider"
                      />
                      <div className="promotion-percentage-labels">
                        <span>1%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="promotion-action-section">
                <button
                  onClick={handleSimulation}
                  disabled={loading || !selectedProduct}
                  className="promotion-simulate-btn"
                >
                  {loading ? (
                    <>
                      <div className="promotion-spinner" />
                      Simulando...
                    </>
                  ) : (
                    <>
                      <Target className="icon-sm" />
                      Simular Promoción
                    </>
                  )}
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div className="promotion-error" initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <AlertCircle className="promotion-error-icon" />
                  <span>{error}</span>
                </motion.div>
              )}
            </div>

            {/* Results Section */}
            {simulationResult && (
              <motion.div
                className="promotion-results-section"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h3 className="promotion-section-title">
                  <BarChart3 className="icon-sm" />
                  Resultados de la Simulación
                </h3>

                {/* Selected Product Info */}
                <div className="promotion-product-info">
                  <div className="promotion-product-card">
                    <Package className="promotion-product-card-icon" />
                    <div className="promotion-product-card-content">
                      <h4 className="promotion-product-card-title">{simulationResult.Producto}</h4>
                      <p className="promotion-product-card-subtitle">Promoción del {promotionPercentage}% en demanda</p>
                    </div>
                    <div className="promotion-success-badge">
                      <CheckCircle2 className="promotion-success-icon" />
                      <span>Simulación Exitosa</span>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="promotion-metrics-grid">
                  <div className="promotion-metric-card promotion-metric-current">
                    <div className="promotion-metric-header">
                      <TrendingUp className="promotion-metric-icon" />
                      <span className="promotion-metric-label">Situación Actual</span>
                    </div>
                    <div className="promotion-metric-values">
                      <div className="promotion-metric-item">
                        <span className="promotion-metric-item-label">Demanda Anual</span>
                        <span className="promotion-metric-item-value">
                          {Math.round(simulationResult["Demanda Anual Actual"]).toLocaleString()} u
                        </span>
                      </div>
                      <div className="promotion-metric-item">
                        <span className="promotion-metric-item-label">EOQ Actual</span>
                        <span className="promotion-metric-item-value">
                          {Math.round(simulationResult["EOQ Actual"]).toLocaleString()} u
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="promotion-metric-card promotion-metric-projected">
                    <div className="promotion-metric-header">
                      <Zap className="promotion-metric-icon" />
                      <span className="promotion-metric-label">Con Promoción</span>
                    </div>
                    <div className="promotion-metric-values">
                      <div className="promotion-metric-item">
                        <span className="promotion-metric-item-label">Demanda Simulada</span>
                        <span className="promotion-metric-item-value">
                          {Math.round(simulationResult["Demanda Anual Simulada"]).toLocaleString()} u
                        </span>
                      </div>
                      <div className="promotion-metric-item">
                        <span className="promotion-metric-item-label">EOQ con Promoción</span>
                        <span className="promotion-metric-item-value">
                          {Math.round(simulationResult["EOQ con Promoción"]).toLocaleString()} u
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="promotion-metric-card promotion-metric-difference">
                    <div className="promotion-metric-header">
                      <Target className="promotion-metric-icon" />
                      <span className="promotion-metric-label">Impacto</span>
                    </div>
                    <div className="promotion-metric-values">
                      <div className="promotion-metric-item">
                        <span className="promotion-metric-item-label">Diferencia EOQ</span>
                        <span
                          className={`promotion-metric-item-value ${
                            simulationResult["Diferencia EOQ"] > 0 ? "promotion-positive" : "promotion-negative"
                          }`}
                        >
                          {simulationResult["Diferencia EOQ"] > 0 ? "+" : ""}
                          {Math.round(simulationResult["Diferencia EOQ"]).toLocaleString()} u
                        </span>
                      </div>
                      <div className="promotion-metric-item">
                        <span className="promotion-metric-item-label">Cambio Porcentual</span>
                        <span className="promotion-metric-item-value promotion-positive">+{promotionPercentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Chart Section */}
                <div className="promotion-chart-section">
                  <h4 className="promotion-chart-title">
                    <BarChart3 className="icon-sm" />
                    Comparación Visual
                  </h4>
                  <div className="promotion-chart-container">
                    <Bar data={generateChartData()} options={chartOptions} />
                  </div>
                </div>

                {/* Analysis Section */}
                <div className="promotion-analysis-section">
                  <h4 className="promotion-analysis-title">
                    <TrendingUp className="icon-sm" />
                    Análisis de Impacto
                  </h4>
                  <div className="promotion-analysis-content">
                    <p className="promotion-analysis-text">
                      {generateDynamicAnalysis(simulationResult, promotionPercentage).analisisTexto}
                    </p>

                    <div
                      className={`promotion-recommendation promotion-recommendation-${generateDynamicAnalysis(simulationResult, promotionPercentage).tipoImpacto}`}
                    >
                      <div className="promotion-recommendation-icon">
                        {generateDynamicAnalysis(simulationResult, promotionPercentage).tipoImpacto === "alto" ? (
                          <AlertCircle className="icon-sm" />
                        ) : generateDynamicAnalysis(simulationResult, promotionPercentage).tipoImpacto ===
                          "positivo" ? (
                          <CheckCircle2 className="icon-sm" />
                        ) : (
                          <Target className="icon-sm" />
                        )}
                      </div>
                      <div className="promotion-recommendation-content">
                        <h5 className="promotion-recommendation-title">
                          {generateDynamicAnalysis(simulationResult, promotionPercentage).tipoImpacto === "alto"
                            ? "Precaución Requerida"
                            : generateDynamicAnalysis(simulationResult, promotionPercentage).tipoImpacto === "positivo"
                              ? "Oportunidad Excelente"
                              : generateDynamicAnalysis(simulationResult, promotionPercentage).tipoImpacto === "medio"
                                ? "Implementación Viable"
                                : "Impacto Mínimo"}
                        </h5>
                        <p className="promotion-recommendation-text">
                          {generateDynamicAnalysis(simulationResult, promotionPercentage).recomendacionTexto}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

export default PromotionSimulationModal
