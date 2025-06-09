import React from 'react';
import ProductoLista from './components/ProductList';
import ProductoFormulario from './components/ProductForm';
import Dashboard from './components/Dashboard';
import { CssBaseline, Container, AppBar, Toolbar, Typography } from '@mui/material';

function App() {
  return (
    <div>
      <CssBaseline />
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Sistema de Inventario - Abarrotes
          </Typography>
        </Toolbar>
      </AppBar>
      

    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Dashboard />
    </Container>
    </div>
  );
}

export default App;

