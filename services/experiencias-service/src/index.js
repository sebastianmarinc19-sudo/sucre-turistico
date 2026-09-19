const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4004;

app.get('/health', (req, res) => {
  res.json({ service: 'experiencias-service', status: 'ok' });
});

// TODO: rutas de experiencias-service

app.listen(PORT, () => {
  console.log(`experiencias-service escuchando en el puerto ${PORT}`);
});
