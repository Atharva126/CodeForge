const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.send('OK'));
app.post('/api/test', (req, res) => {
    console.log('Body:', req.body);
    res.json({ received: req.body });
});

app.listen(5000, () => console.log('Test server on 5000'));
