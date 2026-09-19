const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4001;

app.get('/health', (req, res) => {
  res.json({ service: 'destinos-service', status: 'ok' });
});

// TODO: rutas de destinos-service

app.listen(PORT, () => {
  console.log(`destinos-service escuchando en el puerto ${PORT}`);
});
