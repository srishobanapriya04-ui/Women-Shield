require('dotenv').config();
const express = require('express');
const twilio = require('twilio');

const app = express();
app.use(express.json());
app.use(express.static('public'));

const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
const FROM = process.env.TWILIO_FROM;

// Called by the page when the user does not respond to the safety check
app.post('/api/alert', async (req, res) => {
  const { to, name, lat, lng } = req.body || {};
  if (!/^\+\d{8,15}$/.test(to || '')) {
    return res.status(400).json({ error: 'Number must be in +countrycode format, e.g. +919876543210' });
  }
  const link = lat ? `https://maps.google.com/?q=${lat},${lng}` : 'location unavailable';
  try {
    // 1) SMS with live location
    await client.messages.create({
      from: FROM, to,
      body: `🆘 Women Shield: ${name || 'Your contact'} did not respond to a safety check. Location: ${link}`
    });
    // 2) Automated voice call
    await client.calls.create({
      from: FROM, to,
      twiml: '<Response><Say voice="alice" loop="2">Emergency alert from Women Shield. Your contact did not respond to a safety check. Please check your messages for her location and call her now.</Say></Response>'
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(process.env.PORT || 3000, () => console.log('Women Shield running on port ' + (process.env.PORT || 3000)));
