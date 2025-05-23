require('dotenv').config();
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { google } = require('googleapis');
const fs = require('fs');
const axios = require('axios');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.static('public')); // Para servir archivos como payment.html
app.get('/payment.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'payment.html'));
});

const PORT = process.env.PORT || 3000;

// Configuración de Google Sheets
const auth = new google.auth.GoogleAuth({
  keyFile: './hojacalculoerasmus-cf910feb1889.json',
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const SHEET_ID = '1xFRz3usk5cQx51iime3VAYATKpXczI170PKYvyQPBRk';
const SHEET_NAME = 'Página1';

// Ruta principal
app.get('/', (req, res) => {
  res.send('Servidor activo');
});

// Ruta original para Checkout clásico
app.post('/procesar-pago', async (req, res) => {
  const { nombre, email, discoteca, fecha, pax } = req.body;

  try {
    const cantidad = parseInt(pax) * 100; // pax x 1 € = total en céntimos

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Entrada Erasmus - ${discoteca}`,
          },
          unit_amount: cantidad, // total dinámico
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

// NUEVO endpoint para Stripe Elements
app.post('/crear-intento', async (req, res) => {
  const { nombre, email, discoteca, fecha, pax } = req.body;

  try {
    const cantidad = parseInt(pax) * 100; // 1 € por persona en céntimos

    const paymentIntent = await stripe.paymentIntents.create({
      amount: cantidad,
      currency: 'eur',
      description: `Entrada Erasmus - ${discoteca}`,
      metadata: {
        nombre,
        email,
        fecha,
        pax,
      },
    });

    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    console.error('Error creando PaymentIntent:', error);
    res.status(500).send('Error creando el intento de pago');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});