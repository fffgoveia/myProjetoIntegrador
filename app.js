const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const moment = require('moment');
const { Chart } = require('chart.js');

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect('mongodb://localhost:27017/coleta-de-produtos', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const ProdutoReciclavel = mongoose.model('ProdutoReciclavel', {
  tipoMaterial: String,
  quantidade: Number,
  dataHoraColeta: String,
});

app.use(bodyParser.json());
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

app.get('/', async (req, res) => {
  try {
    const dadosReciclagem = await ProdutoReciclavel.aggregate([
      {
        $group: {
          _id: '$tipoMaterial',
          totalQuantidade: { $sum: '$quantidade' },
        },
      },
    ]);

    const labels = dadosReciclagem.map((item) => item._id);
    const data = dadosReciclagem.map((item) => item.totalQuantidade);

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Quantidade de Materiais Reciclados',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };

    res.render('dashboard', { chartData });
  } catch (error) {
    res.status(500).json({ error: 'Ocorreu um erro ao obter os dados de reciclagem.' });
  }
});

app.get('/registrar', (req, res) => {
  res.send(`
    <form method="post" action="/registrar">
      <label for="tipoMaterial">Tipo de Material:</label>
      <input type="text" id="tipoMaterial" name="tipoMaterial" required>
      
      <label for="quantidade">Quantidade:</label>
      <input type="number" id="quantidade" name="quantidade" required>

      <label for="dataHoraColeta">Data e Hora da Coleta:</label>
      <input type="datetime-local" id="dataHoraColeta" name="dataHoraColeta" required>
      
      <button type="submit">Registrar</button>
    </form>
  `);
});

app.post('/registrar', async (req, res) => {
  try {
    const { tipoMaterial, quantidade, dataHoraColeta } = req.body;

    const dataHoraFormatada = moment(dataHoraColeta).format('YYYY-MM-DD HH:mm:ss');

    const produtoReciclavel = new ProdutoReciclavel({
      tipoMaterial,
      quantidade,
      dataHoraColeta: dataHoraFormatada,
    });

    await produtoReciclavel.save();

    res.send('Produto reciclável registrado com sucesso!');
  } catch (error) {
    res.status(500).json({ error: 'Ocorreu um erro ao registrar o produto reciclável.' });
  }
});

app.get('/dados-reciclagem', async (req, res) => {
  try {
    const dadosReciclagem = await ProdutoReciclavel.aggregate([
      {
        $group: {
          _id: '$tipoMaterial',
          totalQuantidade: { $sum: '$quantidade' },
        },
      },
    ]);

    const labels = dadosReciclagem.map((item) => item._id);
    const data = dadosReciclagem.map((item) => item.totalQuantidade);

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Quantidade de Materiais Reciclados',
          data,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };

    res.json(chartData);
  } catch (error) {
    res.status(500).json({ error: 'Ocorreu um erro ao obter os dados de reciclagem.' });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
