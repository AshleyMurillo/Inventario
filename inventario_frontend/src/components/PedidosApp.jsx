import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Box, 
  Button, 
  Container, 
  FormControl, 
  Grid, 
  InputLabel, 
  MenuItem, 
  Paper, 
  Select, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  TextField,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { AddCircleOutline, ShoppingCartCheckout } from '@mui/icons-material';

const PedidosApp = () => {
  // Estados para la gestión de datos
  const [productos, setProductos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  
  // Estado para el formulario de nuevo pedido
  const [nuevoPedido, setNuevoPedido] = useState({
    Supplier_ID: '',
    Product_ID: '',
    Cantidad: ''
  });

  // Estados de carga y errores
  const [cargandoProductos, setCargandoProductos] = useState(true);
  const [cargandoProveedores, setCargandoProveedores] = useState(true);
  const [errorProductos, setErrorProductos] = useState(null);
  const [errorProveedores, setErrorProveedores] = useState(null);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  // Obtener productos al cargar el componente
  useEffect(() => {
    const obtenerProductos = async () => {
      try {
        setCargandoProductos(true);
        const respuesta = await axios.get('http://localhost:5000/api/inventario');
        
        // Ajustar para la estructura de la API
        const productosNormalizados = respuesta.data.map(producto => ({
          id: producto.Product_ID, // Usar Product_ID en lugar de id
          nombre: producto.Product_Name, // Usar Product_Name en lugar de nombre
          // Estos campos no vienen en la respuesta, así que los dejamos vacíos
          categoria: producto.Category || 'Sin categoría',
          precio: producto.Price || 0,
          existencias: producto.Stock_Quantity || 0,
          status: producto.Status || 'Active'
        }));
        
        console.log("Productos recibidos:", productosNormalizados);
        setProductos(productosNormalizados);
        setErrorProductos(null);
      } catch (err) {
        console.error('Error al obtener productos:', err);
        setErrorProductos('Error al cargar productos');
      } finally {
        setCargandoProductos(false);
      }
    };

    obtenerProductos();
  }, []);

  // Obtener proveedores al cargar el componente
  useEffect(() => {
    const obtenerProveedores = async () => {
      try {
        setCargandoProveedores(true);
        const respuesta = await axios.get('http://localhost:5000/api/proveedores');
        
        // Ajustar para la estructura de la API
        const proveedoresNormalizados = respuesta.data.map(proveedor => ({
          Supplier_ID: proveedor.Supplier_ID,
          Supplier_Name: proveedor.Supplier_Name
        }));
        
        console.log("Proveedores recibidos:", proveedoresNormalizados);
        setProveedores(proveedoresNormalizados);
        setErrorProveedores(null);
      } catch (err) {
        console.error('Error al obtener proveedores:', err);
        setErrorProveedores('Error al cargar proveedores');
      } finally {
        setCargandoProveedores(false);
      }
    };

    obtenerProveedores();
  }, []);

  // Manejar cambios en el formulario
  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoPedido({
      ...nuevoPedido,
      [name]: value
    });
  };

  // Enviar nuevo pedido
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje('');
    setError('');
    
    // Validar campos requeridos
    if (!nuevoPedido.Supplier_ID || !nuevoPedido.Product_ID || !nuevoPedido.Cantidad) {
      setError('Todos los campos son obligatorios');
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/pedidos', nuevoPedido);
      
      // Actualizar lista de pedidos
      setPedidos([...pedidos, response.data]);
      
      // Mostrar mensaje de éxito
      setMensaje('Pedido registrado exitosamente!');
      
      // Resetear formulario
      setNuevoPedido({
        Supplier_ID: '',
        Product_ID: '',
        Cantidad: ''
      });
    } catch (err) {
      console.error('Error al registrar pedido:', err);
      setError(err.response?.data?.error || 'Error al registrar pedido');
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#2c3e50' }}>
        Sistema de Gestión de Pedidos
      </Typography>
      
      <Grid container spacing={3}>
        {/* Formulario para nuevo pedido */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AddCircleOutline color="primary" /> Nuevo Pedido
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined" required>
                    <InputLabel>Proveedor</InputLabel>
                    <Select
                      name="Supplier_ID"
                      value={nuevoPedido.Supplier_ID}
                      onChange={handleChange}
                      label="Proveedor"
                      disabled={cargandoProveedores || errorProveedores}
                    // ESTILOS MEJORADOS PARA EL SELECT
                      sx={{
                        minWidth: 250,  // Ancho mínimo definido
                        '& .MuiSelect-select': {
                          minHeight: '1.4375em', // Altura mínima para evitar colapso
                          padding: '16.5px 14px', // Padding para mayor altura
                          display: 'flex',
                          alignItems: 'center',
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            minWidth: 300, // Ancho mínimo del menú desplegable
                          }
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        {cargandoProveedores ? 'Cargando proveedores...' : 'Seleccione un proveedor'}
                      </MenuItem>
                      {proveedores.map((proveedor) => (
                        <MenuItem key={proveedor.Supplier_ID} value={proveedor.Supplier_ID}>
                          {proveedor.Supplier_ID}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {errorProveedores && (
                    <Alert severity="error" sx={{ mt: 1 }}>{errorProveedores}</Alert>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <FormControl fullWidth variant="outlined" required>
                    <InputLabel>Producto</InputLabel>
                    <Select
                      name="Product_ID"
                      value={nuevoPedido.Product_ID}
                      onChange={handleChange}
                      label="Producto"
                      disabled={cargandoProductos || errorProductos}
                    
                       // ESTILOS MEJORADOS PARA EL SELECT
                      sx={{
                        minWidth: 250,  // Ancho mínimo definido
                        '& .MuiSelect-select': {
                          minHeight: '1.4375em', // Altura mínima para evitar colapso
                          padding: '16.5px 14px', // Padding para mayor altura
                          display: 'flex',
                          alignItems: 'center',
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            minWidth: 300, // Ancho mínimo del menú desplegable
                          }
                        }
                      }}
                    >
                      <MenuItem value="" disabled>
                        {cargandoProductos ? 'Cargando productos...' : 'Seleccione un producto'}
                      </MenuItem>
                      {productos.map((producto) => (
                        <MenuItem key={producto.id} value={producto.id}>
                          {producto.id}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  {errorProductos && (
                    <Alert severity="error" sx={{ mt: 1 }}>{errorProductos}</Alert>
                  )}
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Cantidad"
                    name="Cantidad"
                    type="number"
                    value={nuevoPedido.Cantidad}
                    onChange={handleChange}
                    variant="outlined"
                    required
                    inputProps={{ min: 1 }}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary" 
                    fullWidth
                    sx={{ py: 1.5, fontWeight: 'bold' }}
                    startIcon={<ShoppingCartCheckout />}
                    disabled={cargandoProductos || cargandoProveedores}
                  >
                    {cargandoProductos || cargandoProveedores 
                      ? 'Cargando datos...' 
                      : 'Registrar Pedido'}
                  </Button>
                </Grid>
              </Grid>
              
              {mensaje && (
                <Alert severity="success" sx={{ mt: 2 }}>
                  {mensaje}
                </Alert>
              )}
              
              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          </Paper>
        </Grid>
        
         {/* Listado de proveedores */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Proveedores Disponibles
            </Typography>
            
            {cargandoProductos ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : errorProductos ? (
              <Alert severity="error">{errorProductos}</Alert>
            ) : productos.length === 0 ? (
              <Alert severity="info">No se encontraron proveedores</Alert>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 300, width: 430  }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Nombre</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {proveedores.map((proveedor) => (
                        
                      <TableRow key={proveedor.Supplier_ID}>
                        <TableCell>{proveedor.Supplier_ID}</TableCell>
                        <TableCell>{proveedor.Supplier_Name}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        
        {/* Listado de productos */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Productos Disponibles
            </Typography>
            
            {cargandoProductos ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : errorProductos ? (
              <Alert severity="error">{errorProductos}</Alert>
            ) : productos.length === 0 ? (
              <Alert severity="info">No se encontraron productos</Alert>
            ) : (
              <TableContainer component={Paper} sx={{ maxHeight: 300, width: 430 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Nombre</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {productos.map((producto) => (
                      <TableRow key={producto.id}>
                        <TableCell>{producto.id}</TableCell>
                        <TableCell>{producto.nombre}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
        {/* Historial de pedidos */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>
              Historial de Pedidos
            </Typography>
            
            {pedidos.length === 0 ? (
              <Alert severity="info">No se han realizado pedidos aún</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Producto</TableCell>
                      <TableCell>Proveedor</TableCell>
                      <TableCell>Cantidad</TableCell>
                      <TableCell>Fecha Entrega</TableCell>
                      <TableCell>Estado</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pedidos.map((pedido, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {pedido.Product_ID}  {/* Solo muestra el ID del producto */}
                        </TableCell>
                        <TableCell>
                          {pedido.Supplier_ID}  {/* Solo muestra el ID del proveedor */}
                        </TableCell>
                        <TableCell>{pedido.Cantidad_Solicitada}</TableCell>
                        <TableCell>{pedido.Fecha_Entrega_Estimada}</TableCell>
                        <TableCell>
                          <Box 
                            sx={{
                              display: 'inline-block',
                              px: 1,
                              py: 0.5,
                              borderRadius: 1,
                              backgroundColor: pedido.Nuevo_Estado === 'Backordered' ? '#ff9800' : '#4caf50',
                              color: 'white',
                              fontWeight: 'bold'
                            }}
                          >
                            {pedido.Nuevo_Estado}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PedidosApp;