const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4005;

app.get('/health', (req, res) => {
  res.json({ service: 'eventos-service', status: 'ok' });
});

// TODO: rutas de eventos-service

app.listen(PORT, () => {
  console.log(`eventos-service escuchando en el puerto ${PORT}`);
});
