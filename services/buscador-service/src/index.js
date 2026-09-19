const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4006;

app.get('/health', (req, res) => {
  res.json({ service: 'buscador-service', status: 'ok' });
});

// TODO: rutas de buscador-service

app.listen(PORT, () => {
  console.log(`buscador-service escuchando en el puerto ${PORT}`);
});
