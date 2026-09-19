const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4003;

app.get('/health', (req, res) => {
  res.json({ service: 'gastronomia-service', status: 'ok' });
});

// TODO: rutas de gastronomia-service

app.listen(PORT, () => {
  console.log(`gastronomia-service escuchando en el puerto ${PORT}`);
});
