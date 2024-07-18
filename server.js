const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/transactions', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Define Transaction Schema
const transactionSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  dateOfSale: { type: Date, required: true },
  productTitle: { type: String, required: true },
  productDescription: { type: String, required: true },
  price: { type: Number, required: true },
  category: { type: String, required: true },
  sold: { type: Boolean, required: true },
});

// Define Transaction Model
const Transaction = mongoose.model('Transaction', transactionSchema);

// Initialize database with seed data
const initDatabase = async () => {
  try {
    const response = await axios.get("https://s3.amazonaws.com/roxiler.com/product_transaction.json");
    const data = response.data;

    // Insert transactions into database
    await Transaction.insertMany(data.map(transaction => ({
      id: transaction.id,
      dateOfSale: new Date(transaction.dateOfSale),
      productTitle: transaction.productTitle,
      productDescription: transaction.productDescription,
      price: transaction.price,
      category: transaction.category,
      sold: transaction.sold,
    })));

    console.log('Database initialized with seed data.');
  } catch (err) {
    console.error('Error initializing database:', err);
  }
};

// Middleware
app.use(cors());
app.use(express.json());

// API for listing all transactions
app.get("/api/transactions", async (req, res) => {
  const month = req.query.month;
  const search = req.query.search || '';
  const page = parseInt(req.query.page) || 1;
  const perPage = parseInt(req.query.perPage) || 10;

  try {
    // Filter transactions by month
    const transactions = await Transaction.find({
      dateOfSale: { $month: month },
      $or: [
        { productTitle: { $regex: search, $options: 'i' } },
        { productDescription: { $regex: search, $options: 'i' } },
        { price: { $regex: search, $options: 'i' } },
      ]
    })
      .skip((page - 1) * perPage)
      .limit(perPage)
      .sort({ dateOfSale: -1 });

    res.json(transactions);
  } catch (err) {
    console.error('Error fetching transactions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API for statistics
app.get('/api/statistics', async (req, res) => {
  const month = req.query.month;

  try {
    // Calculate statistics
    const totalSaleAmount = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $month: month },
          sold: true,
        },
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: { $sum: '$price' },
        },
      },
    ]).exec();

    const totalSoldItems = await Transaction.countDocuments({ dateOfSale: { $month: month }, sold: true });
    const totalNotSoldItems = await Transaction.countDocuments({ dateOfSale: { $month: month }, sold: false });

    // Send statistics in response
    res.json({
      totalSaleAmount: totalSaleAmount[0] ? totalSaleAmount[0].totalSaleAmount : 0,
      totalSoldItems,
      totalNotSoldItems,
    });
  } catch (err) {
    console.error('Error fetching statistics:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API for bar chart data
app.get('/api/bar-chart', async (req, res) => {
  const month = req.query.month;

  try {
    // Calculate item counts in each price range
    const barChartData = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $month: month },
        },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $lte: ['$price', 100] },
              then: '0-100',
              elif: { $lte: ['$price', 200] },
              then: '101-200',
              elif: { $lte: ['$price', 300] },
              then: '201-300',
              elif: { $lte: ['$price', 400] },
              then: '301-400',
              elif: { $lte: ['$price', 500] },
              then: '401-500',
              elif: { $lte: ['$price', 600] },
              then: '501-600',
              elif: { $lte: ['$price', 700] },
              then: '601-700',
              elif: { $lte: ['$price', 800] },
              then: '701-800',
              elif: { $lte: ['$price', 900] },
              then: '801-900',
              else: '901-above',
            },
          },
          count: { $sum: 1 },
        },
      },
    ]).exec();

    // Send bar chart data in response
    res.json(barChartData);
  } catch (err) {
    console.error('Error fetching bar chart data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API for pie chart data
app.get('/api/pie-chart', async (req, res) => {
  const month = req.query.month;

  try {
    // Calculate item counts for each category
    const pieChartData = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $month: month },
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]).exec();

    // Send pie chart data in response
    res.json(pieChartData);
  } catch (err) {
    console.error('Error fetching pie chart data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// API for combined data
app.get('/api/combined-data', async (req, res) => {
  const month = req.query.month;

  try {
    // Fetch data from all 3 APIs
    const transactions = await Transaction.find({ dateOfSale: { $month: month } });
    const statistics = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $month: month },
          sold: true,
        },
      },
      {
        $group: {
          _id: null,
          totalSaleAmount: { $sum: '$price' },
        },
      },
    ]).exec();
    const barChartData = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $month: month },
        },
      },
      {
        $group: {
          _id: {
            $cond: {
              if: { $lte: ['$price', 100] },
              then: '0-100',
              elif: { $lte: ['$price', 200] },
              then: '101-200',
              elif: { $lte: ['$price', 300] },
              then: '201-300',
              elif: { $lte: ['$price', 400] },
              then: '301-400',
              elif: { $lte: ['$price', 500] },
              then: '401-500',
              elif: { $lte: ['$price', 600] },
              then: '501-600',
              elif: { $lte: ['$price', 700] },
              then: '601-700',
              elif: { $lte: ['$price', 800] },
              then: '701-800',
              elif: { $lte: ['$price', 900] },
              then: '801-900',
              else: '901-above',
            },
          },
          count: { $sum: 1 },
        },
      },
    ]).exec();
    const pieChartData = await Transaction.aggregate([
      {
        $match: {
          dateOfSale: { $month: month },
        },
      },
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 },
        },
      },
    ]).exec();

    // Send combined data in response
    res.json({
      transactions,
      statistics: {
        totalSaleAmount: statistics[0] ? statistics[0].totalSaleAmount : 0,
        totalSoldItems: statistics[0] ? statistics[0].totalSoldItems : 0,
        totalNotSoldItems: statistics[0] ? statistics[0].totalNotSoldItems : 0,
      },
      barChartData,
      pieChartData,
    });
  } catch (err) {
    console.error('Error fetching combined data:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start server
initDatabase();
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});