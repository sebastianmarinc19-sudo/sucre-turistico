const { createApp } = require('./app');

const PORT = process.env.PORT || 4000;

createApp().listen(PORT, () => {
  console.log(`API Gateway escuchando en el puerto ${PORT}`);
});
