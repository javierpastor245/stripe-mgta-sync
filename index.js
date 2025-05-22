require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { google } = require('googleapis');
const fs = require('fs');
const axios = require('axios');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

const auth = new google.auth.GoogleAuth({
  keyFile: './hojacalculoerasmus-cf910feb1889.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = '1xFRz3usk5cQx51iime3VAYATKpXczI170PKYvyQPBRk';
const SHEET_NAME = 'Página1';

app.get('/', (req, res) => {
  res.send('Servidor activo');
});

app.post('/procesar-pago', async (req, res) => {
  const { nombre, email, discoteca, fecha, pax } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Entrada Erasmus - ${discoteca}`,
          },
          unit_amount: 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://informervalencia.com/success',
      cancel_url: 'https://informervalencia.com/cancel',
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error procesando el pago');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});