import React, { useState, useEffect } from 'react';
import {
  Box, Button, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Modal, Divider
} from '@mui/material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, BarElement, CategoryScale, LinearScale,
  Tooltip, Legend
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

const Inventory = () => {
  const [productos, setProductos] = useState([]);
  const [modalData, setModalData] = useState(null);

  useEffect(() => {
    fetch('http://localhost:5000/api/inventario/con-eoq')
      .then(res => res.json())
      .then(setProductos)
      .catch(err => console.error('Error al cargar EOQ:', err));
  }, []);

  const handleDetalles = async (productId, nombre) => {
    try {
      const res = await fetch(`http://localhost:5000/api/inventario/detalles/${productId}`);
      const data = await res.json();
      setModalData({ nombre, ...data });
    } catch (error) {
      console.error('Error al obtener detalles:', error);
      setModalData({ nombre, error: true });
    }
  };

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 650,
    maxHeight: '90vh',
    overflowY: 'auto',
    bgcolor: '#1e293b',
    color: 'white',
    borderRadius: 2,
    boxShadow: 24,
    p: 4
  };

  const generarProsa = (data) => {
    return `El producto "${data.nombre}" tiene un stock actual de ${data["Stock actual"]} unidades. 
El Punto de Reorden (PRO) calculado es de ${data.PRO}, mientras que el nivel de stock de seguridad es de ${data["Stock seguro"]}. 
La cantidad óptima de pedido (EOQ) es de aproximadamente ${Math.round(data.EOQ)} unidades. 
Se sugiere realizar un pedido de ${data["Pedido sugerido"]} unidades. 
Estado del producto: ${data.Estado}.`;
  };

  const generarGrafico = (data) => {
    return {
      labels: ['Stock Actual', 'EOQ', 'Stock Seguro', 'PRO', 'Pedido Sugerido'],
      datasets: [{
        label: 'Cantidad',
        data: [
          data["Stock actual"],
          Math.round(data.EOQ),
          data["Stock seguro"],
          data.PRO,
          data["Pedido sugerido"]
        ],
        backgroundColor: '#3b82f6'
      }]
    };
  };

  const opcionesGrafico = {
    plugins: {
      legend: { labels: { color: 'white' } },
      tooltip: { enabled: true }
    },
    scales: {
      x: {
        ticks: {
          color: 'white',
          maxRotation: 0,
          minRotation: 0
        }
      },
      y: {
        ticks: {
          color: 'white'
        }
      }
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Paper elevation={3} sx={{ bgcolor: '#60a5fa', py: 2 }}>
        <Typography variant="h5" align="center" sx={{ fontWeight: 'bold', color: 'white' }}>
          Inventario
        </Typography>
      </Paper>

      <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ bgcolor: '#4b5563' }}>
              <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>ID</TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Nombre</TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>Stock</TableCell>
              <TableCell sx={{ color: 'black', fontWeight: 'bold' }}>EOQ</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {productos.map((p, i) => (
              <TableRow key={i}>
                <TableCell>{p.Product_ID}</TableCell>
                <TableCell>{p.Product_Name}</TableCell>
                <TableCell>{p.Stock_Quantity}</TableCell>
                <TableCell>{Math.round(p.EOQ)}</TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    size="small"
                    sx={{
                      borderRadius: 5,
                      textTransform: 'none',
                      backgroundColor: '#0a3b84'
                    }}
                    onClick={() => handleDetalles(p.Product_ID, p.Product_Name)}
                  >
                    Detalles
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: '#1e40af',
            borderRadius: '30px',
            px: 4,
            textTransform: 'none'
          }}
        >
          Simular promociones →
        </Button>
      </Box>

      <Modal open={Boolean(modalData)} onClose={() => setModalData(null)}>
        <Box sx={modalStyle}>
          {modalData ? (
            modalData.error ? (
              <>
                <Typography variant="h6" sx={{ color: '#f87171', mb: 2 }}>
                  Error en producto {modalData.nombre || 'desconocido'}
                </Typography>
                <Typography>Este producto no tiene datos suficientes para mostrar detalles.</Typography>
              </>
            ) : (
              <>
                <Typography variant="h6" sx={{ color: '#93c5fd', mb: 2 }}>
                  Detalles del {modalData.nombre}
                </Typography>

                {/* Bloque de datos */}
                <Box sx={{ mb: 3 }}>
                  <Typography>Stock: {modalData["Stock actual"]}</Typography>
                  <Typography>EOQ: {Math.round(modalData.EOQ)}</Typography>
                  <Typography>Stock seguro: {modalData["Stock seguro"]}</Typography>
                  <Typography>PRO: {modalData.PRO}</Typography>
                  <Typography>Pedido sugerido: {modalData["Pedido sugerido"]}</Typography>
                  <Typography>Estado: {modalData.Estado}</Typography>
                </Box>

                <Divider sx={{ my: 2, borderColor: 'gray' }} />

                {/* Gráfico */}
                <Box sx={{ mb: 3 }}>
                  <Bar data={generarGrafico(modalData)} options={opcionesGrafico} />
                </Box>

                <Divider sx={{ my: 2, borderColor: 'gray' }} />

                {/* Prosa */}
                <Typography sx={{ mt: 1, color: '#e0f2fe', fontStyle: 'italic' }}>
                  {generarProsa(modalData)}
                </Typography>
              </>
            )
          ) : null}

          <Button
            onClick={() => setModalData(null)}
            variant="contained"
            sx={{
              mt: 4,
              borderRadius: '20px',
              width: '100%',
              backgroundColor: '#1e3a8a',
              textTransform: 'none'
            }}
          >
            Cerrar
          </Button>
        </Box>
      </Modal>
    </Box>
  );
};

export default Inventory;

