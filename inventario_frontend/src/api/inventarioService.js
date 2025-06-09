// src/api/inventarioService.js
import api from './axiosConfig';

export const getProductosActivos = () => api.get('/api/inventario/activos');
export const getProductosVencidos = () => api.get('/api/inventario/vencidos');
export const getProductosBajoStock = () => api.get('/api/inventario/bajo-stock');