const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

app.use('/book-covers', express.static(path.join(__dirname, '../../datasets/book-covers')));
app.use('/uploads/avatars', express.static(path.join(__dirname, '../uploads/avatars')));

app.get('/', (req, res) => {
    res.json({ message: 'Library API is running' });
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

module.exports = app;