const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4002;

app.get('/health', (req, res) => {
  res.json({ service: 'alojamiento-service', status: 'ok' });
});

// TODO: rutas de alojamiento-service

app.listen(PORT, () => {
  console.log(`alojamiento-service escuchando en el puerto ${PORT}`);
});
