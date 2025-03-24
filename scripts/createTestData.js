const mongoose = require('mongoose');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Product = require('../models/Product');
const Company = require('../models/Company');
require('dotenv').config();

async function createTestData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB bağlantısı başarılı');

    // Kategorileri temizle ve yeni kategori oluştur
    await Category.deleteMany({});
    const category = await Category.create({
      name: 'Test Kategori',
      logo: '/uploads/test-category.jpg'
    });
    console.log('Kategori oluşturuldu:', category);

    // Alt kategorileri temizle ve yeni alt kategori oluştur
    await Subcategory.deleteMany({});
    const subcategory = await Subcategory.create({
      name: 'Test Alt Kategori',
      categories_id: category._id
    });
    console.log('Alt kategori oluşturuldu:', subcategory);

    // Şirketleri temizle ve yeni şirket oluştur
    await Company.deleteMany({});
    const company = await Company.create({
      nom: 'Test Şirket',
      logo: '/uploads/test-company.jpg',
      categories_id: category._id,
      subcategories_id: subcategory._id
    });
    console.log('Şirket oluşturuldu:', company);

    // Ürünleri temizle ve yeni ürün oluştur
    await Product.deleteMany({});
    const product = await Product.create({
      type: 'Frais',
      nom: 'Test Ürün',
      description: 'Test ürün açıklaması',
      picture: '/uploads/test-product.jpg',
      features: 'Test özellikler',
      Company_id: company._id,
      categoriesa_id: category._id,
      subcategories_id: subcategory._id
    });
    console.log('Ürün oluşturuldu:', product);

    // İlişkileri kontrol et
    const populatedProduct = await Product.findById(product._id)
      .populate('Company_id')
      .populate('categoriesa_id')
      .populate('subcategories_id');
    console.log('İlişkili ürün detayları:', populatedProduct);

    await mongoose.connection.close();
    console.log('MongoDB bağlantısı kapatıldı');
  } catch (error) {
    console.error('Hata:', error);
  } finally {
    process.exit();
  }
}

createTestData(); 