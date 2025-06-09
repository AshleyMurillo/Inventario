    // src/components/Dashboard.jsx

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
  TableContainer, // Añadido
  Table,          // Añadido
  TableHead,      // Añadido
  TableBody,      // Añadido
  TableRow,       // Añadido
  TableCell       // Añadido
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

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalActivos, setTotalActivos] = useState(0);
  const [productosVencidos, setProductosVencidos] = useState([]);
  const [productosBajoStock, setProductosBajoStock] = useState([]);

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
  
  <Grid container spacing={3}>
    {/* Fila 1: Activos y Bajo Stock lado a lado */}
    <Grid item xs={12} md={6}>
      <Grid container spacing={3}>
        {/* Total de Productos Activos */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', bgcolor: 'primary.main', color: 'white' }}>
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
          <Paper elevation={3} sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
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
      </Grid>
    </Grid>
    
    {/* Productos Vencidos (fila completa debajo) */}
    <Grid item xs={12}>
      <Paper elevation={3} sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
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


    {/* Botones de Acción */}
            <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Button 
                variant="contained" 
                color="primary" 
                startIcon={<InventoryIcon />}
                sx={{ mb: 2, py: 1.5, fontWeight: 'bold' }}
                fullWidth
                >
                Inventario
                </Button>
                <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<AddShoppingCartIcon />}
                sx={{ py: 1.5, fontWeight: 'bold' }}
                fullWidth
                >
                Nuevo pedido
                </Button>
            </Paper>
            </Grid>

    </Box>
    
        
  );
};

export default Dashboard;



/* import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  Button,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Inventory as InventoryIcon, 
  AddShoppingCart as AddShoppingCartIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    totalActivos: 0,
    productosVencidos: [],
    productosBajoStock: []
  });

  const api = axios.create({
    baseURL: 'http://localhost:5000',
    timeout: 5000,
  });

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // CORRECCIÓN: Usar la instancia api en lugar de axios
      const [activosRes, vencidosRes, bajoStockRes] = await Promise.all([
        api.get('/api/inventario/activos'),
        api.get('/api/inventario/vencidos'),
        api.get('/api/inventario/bajo-stock')
      ]);

      // CORRECCIÓN: Usar total_activos en lugar de total
      setDashboardData({
        totalActivos: activosRes.data.total_activos,
        productosVencidos: vencidosRes.data,
        productosBajoStock: bajoStockRes.data
      });
      
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError('Error al cargar datos. Intente nuevamente.');
    } finally {
      setLoading(false);
    }
  };

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
      
      <Grid container spacing={3}>
        {/* Total de Productos Activos 
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', bgcolor: 'primary.main', color: 'white' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Total de productos activos
            </Typography>
            <Typography variant="h2" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
              {dashboardData.totalActivos}
            </Typography>
          </Paper>
        </Grid>
        
        {/* Productos Vencidos - CORREGIDO: dentro de Grid item
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'error.main' }}>
              Productos vencidos
            </Typography>
            {dashboardData.productosVencidos.length > 0 ? (
              dashboardData.productosVencidos.map((producto) => (
                <Box key={producto.id} sx={{ mb: 1, borderBottom: '1px solid #eee', pb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
                    {producto.nombre}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Vence: {new Date(producto.fechaVencimiento).toLocaleDateString()}
                  </Typography>
                </Box>
              ))
            ) : (
              <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                No hay productos vencidos
              </Typography>
            )}
          </Paper>
        </Grid>
        
        {/* Botones de Acción 
        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Button 
              variant="contained" 
              color="primary" 
              startIcon={<InventoryIcon />}
              sx={{ mb: 2, py: 1.5, fontWeight: 'bold' }}
              fullWidth
            >
              Inventario
            </Button>
            <Button 
              variant="contained" 
              color="secondary" 
              startIcon={<AddShoppingCartIcon />}
              sx={{ py: 1.5, fontWeight: 'bold' }}
              fullWidth
            >
              Nuevo pedido
            </Button>
          </Paper>
        </Grid>
        
        {/* Productos con Bajo Inventario 
        <Grid item xs={12}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'warning.dark' }}>
              Productos con bajo inventario
            </Typography>
            {dashboardData.productosBajoStock.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Categoría</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dashboardData.productosBajoStock.map((producto) => (
                      <TableRow key={producto.id}>
                        <TableCell>{producto.nombre}</TableCell>
                        <TableCell>{producto.categoria}</TableCell>
                        <TableCell align="right">{producto.existencias}</TableCell>
                        <TableCell align="center">
                          <Box 
                            sx={{
                              display: 'inline-block',
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
                            {producto.existencias < 10 ? 'CRÍTICO' : 'BAJO'}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                No hay productos con bajo inventario
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard; */
    /* import React from 'react';
    import { 
    Box, 
    Grid, 
    Typography, 
    Paper, 
    Table, 
    TableBody, 
    TableCell, 
    TableContainer, 
    TableHead, 
    TableRow,
    Button,
    useTheme
    } from '@mui/material';
    import { 
    Inventory as InventoryIcon, 
    AddShoppingCart as AddShoppingCartIcon 
    } from '@mui/icons-material';

    const Dashboard = () => {
    const theme = useTheme();
    
    // Datos de ejemplo - Estos vendrían de tu API
    const productosVencidos = [
        { id: 1, nombre: "Leche Entera", fecha: "2023-10-15" },
        { id: 2, nombre: "Yogurt de Fresa", fecha: "2023-10-18" },
        { id: 3, nombre: "Queso Fresco", fecha: "2023-10-20" },
        { id: 4, nombre: "Jamón de Pavo", fecha: "2023-10-22" },
    ];

    const productosBajoInventario = [
        { id: 1, nombre: "Arroz 1kg", stock: 50 },
        { id: 2, nombre: "Frijol Negro", stock: 45 },
        { id: 3, nombre: "Aceite Vegetal", stock: 40 },
        { id: 4, nombre: "Azúcar Refinada", stock: 48 },
        { id: 5, nombre: "Sal de Mesa", stock: 42 },
    ];

    return (
        <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: theme.palette.primary.dark }}>
            Dashboard de Inventario
        </Typography>
        
        <Grid container spacing={3}>
            {/* Total de Productos Activos 
            <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', backgroundColor: theme.palette.primary.light }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: 'white' }}>
                Total de productos activos
                </Typography>
                <Typography variant="h2" sx={{ textAlign: 'center', color: 'white', fontWeight: 'bold' }}>
                128
                </Typography>
            </Paper>
            </Grid>
            
            {/* Productos Vencidos 
            <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.error.main }}>
                Productos vencidos
                </Typography>
                <Box sx={{ maxHeight: 200, overflowY: 'auto' }}>
                {productosVencidos.map((producto) => (
                    <Box key={producto.id} sx={{ mb: 1, borderBottom: '1px solid #eee', pb: 1 }}>
                    <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{producto.nombre}</Typography>
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Vence: {producto.fecha}
                    </Typography>
                    </Box>
                ))}
                </Box>
            </Paper>
            </Grid>
            
            {/* Botones de Acción 
            <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <Button 
                variant="contained" 
                color="primary" 
                startIcon={<InventoryIcon />}
                sx={{ mb: 2, py: 1.5, fontWeight: 'bold' }}
                fullWidth
                >
                Inventario
                </Button>
                <Button 
                variant="contained" 
                color="secondary" 
                startIcon={<AddShoppingCartIcon />}
                sx={{ py: 1.5, fontWeight: 'bold' }}
                fullWidth
                >
                Nuevo pedido
                </Button>
            </Paper>
            </Grid>
            
            {/* Productos con Bajo Inventario 
            <Grid item xs={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.warning.dark }}>
                Productos con bajo inventario
                </Typography>
                <TableContainer>
                <Table size="small">
                    <TableHead>
                    <TableRow>
                        <TableCell sx={{ fontWeight: 'bold' }}>Nombre</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>Stock</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>Estado</TableCell>
                    </TableRow>
                    </TableHead>
                    <TableBody>
                    {productosBajoInventario.map((producto) => (
                        <TableRow key={producto.id}>
                        <TableCell>{producto.nombre}</TableCell>
                        <TableCell align="right">{producto.stock}</TableCell>
                        <TableCell align="center">
                            <Box 
                            sx={{
                                display: 'inline-block',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                backgroundColor: producto.stock < 45 
                                ? theme.palette.error.light 
                                : theme.palette.warning.light,
                                color: producto.stock < 45 
                                ? theme.palette.error.dark 
                                : theme.palette.warning.dark,
                                fontWeight: 'bold',
                                fontSize: '0.75rem'
                            }}
                            >
                            {producto.stock < 45 ? 'CRÍTICO' : 'BAJO'}
                            </Box>
                        </TableCell>
                        </TableRow>
                    ))}
                    </TableBody>
                </Table>
                </TableContainer>
            </Paper>
            </Grid>
        </Grid>
        </Box>
    );
    };

    export default Dashboard; */