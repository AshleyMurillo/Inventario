      // src/components/Dashboard.jsx
  import React, { useState, useEffect } from 'react';
  import axios from 'axios';
  import api from '../api/axiosConfig';
  import { 
    Box, 
    Grid, 
    Typography, 
    Paper,
    CircularProgress,
    Alert,
    Button,
    TableContainer, 
    Table,          
    TableHead,    
    TableBody,      
    TableRow,     
    TableCell       
  } from '@mui/material';
  import { 
    Inventory as InventoryIcon, 
    AddShoppingCart as AddShoppingCartIcon,
    CheckCircleOutline as CheckCircleOutlineIcon,
    Refresh as RefreshIcon,
    Warning as WarningIcon
  } from '@mui/icons-material';
  import { 
    getProductosActivos,
    getProductosVencidos,
    getProductosBajoStock
  } from '../api/inventarioService';
  import {useNavigate} from 'react-router-dom';

  const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [totalActivos, setTotalActivos] = useState(0);
    const [productosVencidos, setProductosVencidos] = useState([]);
    const [productosBajoStock, setProductosBajoStock] = useState([]);
    const navigate=useNavigate();

    // Función para cargar solo los productos activos
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [activosRes, vencidosRes, bajoStockRes] = await Promise.all([
          getProductosActivos(),
          getProductosVencidos(),
          getProductosBajoStock()
        ]);
        
        setTotalActivos(activosRes.data.total_activos);
        setProductosVencidos(vencidosRes.data);
        setProductosBajoStock(bajoStockRes.data);

      } catch (err) {
        console.error('Error al cargar datos:', err);
        setError('Error al cargar datos. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
      fetchDashboardData();
    }, []);

    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress size={60} />
        </Box>
      );
    }

    if (error) {
      return (
        <Box sx={{ p: 3 }}>
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
          <Button 
            variant="contained" 
            startIcon={<RefreshIcon />}
            onClick={fetchDashboardData}
          >
            Reintentar
          </Button>
        </Box>
      );
    }

    return (
      <Box sx={{ p: 3 }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
        Dashboard de Inventario
      </Typography>
      <Button 
        variant="outlined" 
        startIcon={<RefreshIcon />}
        onClick={fetchDashboardData}
      >
        Actualizar
      </Button>
    </Box>
    
    <Grid container spacing={6}>
      
      {/* Fila 1: Activos y Bajo Stock lado a lado */}
      <Grid item xs={12} md={6}>
        <Grid container spacing={14}>
          {/* Total de Productos Activos */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2, height: '60%', width: '125%', bgcolor: 'primary.main', color: 'white' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                Total de productos activos
              </Typography>
              <Typography variant="h2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {totalActivos}
              </Typography>
            </Paper>
          </Grid>

          
          {/* Productos Bajo Stock */}
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 4, height: '100%', width: '120%',display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
                  Productos bajo stock
                </Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {productosBajoStock.length} productos
                </Typography>
              </Box>

              {productosBajoStock.length > 0 ? (
                <TableContainer sx={{ flex: 1, maxHeight: 200, overflowY: 'auto' }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productosBajoStock.map((producto) => (
                        <TableRow key={producto.id} hover>
                          <TableCell>{producto.nombre}</TableCell>
                          <TableCell align="right">{producto.existencias}</TableCell>
                          <TableCell>
                            <Box 
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                backgroundColor: producto.existencias < 10 
                                  ? 'error.light' 
                                  : 'warning.light',
                                color: producto.existencias < 10 
                                  ? 'error.dark' 
                                  : 'warning.dark',
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                              }}
                            >
                              {producto.existencias < 10 && (
                                <WarningIcon sx={{ fontSize: 16, mr: 0.5 }} />
                              )}
                              {producto.existencias < 10 ? 'CRÍTICO' : 'BAJO'}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  flex: 1,
                  p: 2,
                  textAlign: 'center'
                }}>
                  <InventoryIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                  <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 'bold' }}>
                    Stock saludable
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
          {/* Botones de Acción */}  
      <Grid item xs={12} md={6}>
        <Box sx={{ 
            display: 'flex',
            flexDirection: 'column',  // Dirección vertical
            gap: 4,
            mt: 6
          }}>
        <Button 
        variant="contained" 
        color="primary" 
        startIcon={<InventoryIcon />}
        sx={{ 
          fontWeight: 'bold',
          py: 1.5,
          width: '135%'  // Ancho completo
        }}
        onClick={() => navigate('/inventario')}
      >
        Inventario
      </Button>
      
      <Button 
        variant="contained" 
        color="secondary" 
        startIcon={<AddShoppingCartIcon />}
        sx={{ 
          fontWeight: 'bold',
          py: 1.5,
          width: '135%'  // Ancho completo
        }}
      >
        Nuevo pedido
      </Button>
    </Box>
  </Grid>

        </Grid>
      </Grid>
      
      {/* Productos Vencidos (fila completa debajo) */}
      <Grid item xs={12}>
        <Paper elevation={3} sx={{ p: 2, display: 'flex', width: '200%',flexDirection: 'column' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'error.main' }}>
              Productos vencidos
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {productosVencidos.length} productos
            </Typography>
          </Box>

          {productosVencidos.length > 0 ? (
            <TableContainer sx={{ flex: 1, maxHeight: 300, overflowY: 'auto' }}>
              <Table size="small" stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Producto</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Categoría</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Vencimiento</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: 'background.paper' }}>Días</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {productosVencidos.map((producto) => {
                    const fechaVenc = new Date(producto.fechaVencimiento);
                    const hoy = new Date();
                    const diffTime = hoy - fechaVenc;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    
                    return (
                      <TableRow key={producto.id} hover>
                        <TableCell>{producto.nombre}</TableCell>
                        <TableCell>{producto.categoria || 'Sin categoría'}</TableCell>
                        <TableCell>
                          {fechaVenc.toLocaleDateString()}
                        </TableCell>
                        <TableCell sx={{ 
                          color: diffDays > 30 ? 'error.dark' : 'warning.dark',
                          fontWeight: 'bold'
                        }}>
                          {diffDays} días
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              flex: 1,
              p: 3,
              textAlign: 'center'
            }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 60, color: 'success.main', mb: 1 }} />
              <Typography variant="body1" sx={{ color: 'success.dark', fontWeight: 'bold' }}>
                ¡Excelente! No hay productos vencidos
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1 }}>
                Todos los productos están dentro de su fecha de caducidad
              </Typography>
            </Box>
          )}
        </Paper>
      </Grid>
    </Grid>


          </Box>
      
          
    );
  };

  export default Dashboard;


