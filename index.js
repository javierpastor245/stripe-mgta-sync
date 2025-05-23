require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { google } = require('googleapis');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Google Sheets Auth
const auth = new google.auth.GoogleAuth({
  keyFile: './hojacalculoerasmus-cf910feb1889.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const SHEET_ID = '1xFRz3usk5cQx51iime3VAYATKpXczI170PKYvyQPBRk';
const SHEET_NAME = 'Página1';

// 👉 Endpoint para crear intento de pago
app.post('/crear-intento', async (req, res) => {
  const { nombre, email, discoteca, fecha, pax } = req.body;

  try {
    const cantidad = parseInt(pax) * 100;

    const paymentIntent = await stripe.paymentIntents.create({
      amount: cantidad,
      currency: 'eur',
      description: `Entrada Erasmus - ${discoteca}`,
      metadata: {
        nombre,
        email,
        discoteca,
        fecha,
        pax
      }
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('❌ Error creando PaymentIntent:', error);
    res.status(500).send('Error creando el intento de pago');
  }
});

// 👉 Endpoint para registrar en Google Sheets tras pago exitoso
app.post('/registrar', async (req, res) => {
  const { nombre, email, discoteca, fecha, pax } = req.body;

  try {
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });

    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      requestBody: {
        values: [[nombre, email, discoteca, fecha, pax, new Date().toLocaleString()]],
      },
    });

    res.send({ message: 'Registro guardado correctamente' });
  } catch (error) {
    console.error('❌ Error guardando en la hoja:', error);
    res.status(500).send('Error al guardar en la hoja');
  }
});

// 🟢 Confirmación
app.get('/', (req, res) => {
  res.send('Servidor activo');
});

app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});