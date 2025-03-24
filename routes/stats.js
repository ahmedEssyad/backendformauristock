const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Product = require('../models/Product');
const Company = require('../models/Company');

router.get('/', async (req, res) => {
  try {
    let stats = {
      categories: 0,
      products: 0,
      companies: 0
    };

    try {
      stats.categories = await Category.countDocuments();
    } catch (error) {
      console.error('Categories count error:', error);
    }

    try {
      stats.products = await Product.countDocuments();
    } catch (error) {
      console.error('Products count error:', error);
    }

    try {
      stats.companies = await Company.countDocuments();
    } catch (error) {
      console.error('Companies count error:', error);
    }

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.json({
      categories: 0,
      products: 0,
      companies: 0
    });
  }
});

module.exports = router; 