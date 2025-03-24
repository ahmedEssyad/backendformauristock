const express = require('express');
const router = express.Router();
const Company = require('../models/Company');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid'); // UUID için ekleme
const Product = require('../models/Product');

// Récupérer toutes les entreprises
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('categories_id')
      .populate('subcategories_id');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Une erreur est survenue lors du chargement des entreprises.' });
  }
});

// Créer une entreprise
router.post('/', auth, upload.single('logo'), async (req, res) => {
  try {
    const companyData = {
      ...req.body,
      id: uuidv4(), // Benzersiz bir id oluştur
      categories_id: Array.isArray(req.body.categories_id)
        ? req.body.categories_id
        : req.body.categories_id
        ? req.body.categories_id.split(',')
        : [],
      subcategories_id: Array.isArray(req.body.subcategories_id)
        ? req.body.subcategories_id
        : req.body.subcategories_id
        ? req.body.subcategories_id.split(',')
        : [],
      logo: req.file ? `/uploads/${req.file.filename}` : undefined,
    };

    const company = new Company(companyData);
    await company.save();

    const savedCompany = await Company.findById(company._id)
      .populate('categories_id')
      .populate('subcategories_id');

    res.status(201).json(savedCompany);
  } catch (error) {
    console.error('Error creating company:', error.message);
    res.status(400).json({ 
      message: 'Une erreur est survenue lors de l\'enregistrement de l\'entreprise.',
      error: error.message,
    });
  }
});

// Mettre à jour une entreprise
router.put('/:id', auth, upload.single('logo'), async (req, res) => {
  try {
    
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Entreprise introuvable.' });
    }

    // Eski logoyu sil (gerekliyse)
    if (req.file && company.logo) {
      const oldLogoPath = path.join(__dirname, '..', company.logo);
      if (fs.existsSync(oldLogoPath)) {
        fs.unlinkSync(oldLogoPath);
      }
    }

    // Güncellemeleri işle
    const updates = {
      ...req.body,
      categories_id: Array.isArray(req.body.categories_id)
        ? req.body.categories_id
        : req.body.categories_id
        ? req.body.categories_id.split(',')
        : company.categories_id, // Mevcut kategorileri kullan
      subcategories_id: Array.isArray(req.body.subcategories_id)
        ? req.body.subcategories_id
        : req.body.subcategories_id
        ? req.body.subcategories_id.split(',')
        : company.subcategories_id, // Mevcut alt kategorileri kullan
      ...(req.file && { logo: `/uploads/${req.file.filename}` }), // Yeni logo yüklenmişse
    };

    // Şirketi güncelle
    const updatedCompany = await Company.findByIdAndUpdate(req.params.id, updates, { new: true })
      .populate('categories_id')
      .populate('subcategories_id');

    res.json(updatedCompany);
  } catch (error) {
    console.error('Error updating company:', error.message);
    res.status(400).json({
      message: 'Une erreur est survenue lors de la mise à jour de l\'entreprise.',
      error: error.message,
    });
  }
});

// Supprimer une entreprise
router.delete('/:id', auth, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: 'Entreprise introuvable.' });
    }

    if (company.logo) {
      const logoPath = path.join(__dirname, '..', company.logo);
      if (fs.existsSync(logoPath)) {
        fs.unlinkSync(logoPath);
      }
    }

    await company.deleteOne();
    res.json({ message: 'L\'entreprise a été supprimée avec succès.' });
  } catch (error) {
    res.status(500).json({ message: 'Une erreur est survenue lors de la suppression de l\'entreprise.' });
  }
});

// Kategoriye göre şirketleri getir
router.get('/by-category/:categoryId', async (req, res) => {
  try {
    // Önce bu kategoriye ait ürünleri bulalım
    const products = await Product.find({
      categoriesa_id: req.params.categoryId
    }).distinct('Company_id'); // Benzersiz şirket ID'lerini alalım

    // Şimdi bu şirketleri getirelim
    const companies = await Company.find({
      _id: { $in: products }
    }).populate('categories_id')
      .populate('subcategories_id');

    res.json(companies);
  } catch (error) {
    console.error('Error in companies route:', error);
    res.status(500).json({ 
      message: 'Error fetching companies',
      error: error.message 
    });
  }
});

module.exports = router;
