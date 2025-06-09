import React, { useState } from 'react';
import axios from 'axios';
import { Button, TextField, Box, Typography } from '@mui/material';

const ProductoFormulario = () => {
  const [formData, setFormData] = useState({
    nombre: '',
    categoria: '',
    precio: '',
    existencias: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3000/api/inventario/activos', {
        ...formData,
        precio: parseFloat(formData.precio),
        existencias: parseInt(formData.existencias)
      });
      
      alert('Producto agregado exitosamente!');
      setFormData({
        nombre: '',
        categoria: '',
        precio: '',
        existencias: ''
      });
    } catch (error) {
      console.error('Error al agregar producto:', error);
      alert('Error al agregar producto');
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
      <Typography variant="h6" gutterBottom>
        Agregar Nuevo Producto
      </Typography>
      
      <TextField
        label="Nombre"
        name="nombre"
        value={formData.nombre}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      
      <TextField
        label="Categoría"
        name="categoria"
        value={formData.categoria}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      
      <TextField
        label="Precio"
        name="precio"
        type="number"
        value={formData.precio}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      
      <TextField
        label="Existencias"
        name="existencias"
        type="number"
        value={formData.existencias}
        onChange={handleChange}
        fullWidth
        required
        margin="normal"
      />
      
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Agregar Producto
      </Button>
    </Box>
  );
};

export default ProductoFormulario;
