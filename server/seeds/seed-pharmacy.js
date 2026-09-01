const mongoose = require('mongoose');
require('dotenv').config({ override: true });

const Medicine = require('../models/Medicine');
const Pharmacy = require('../models/Pharmacy');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mediconnect_pro';

const medicines = [
  // OTC Medicines
  { name: 'Paracetamol 500mg', genericName: 'Acetaminophen', slug: 'paracetamol-500mg', category: 'otc', subcategory: 'Pain Relief', description: 'Effective relief from fever and mild to moderate pain', composition: 'Paracetamol 500mg', manufacturer: 'Cipla Ltd', dosageForm: 'tablet', strength: '500mg', packSize: '1 strip of 10', price: 25, discountPrice: 18, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['fever', 'pain', 'headache'], rating: 4.5, reviewCount: 342, totalSold: 15000, inStock: true },
  { name: 'Ibuprofen 400mg', genericName: 'Ibuprofen', slug: 'ibuprofen-400mg', category: 'otc', subcategory: 'Pain Relief', description: 'Anti-inflammatory pain reliever for headaches, muscle pain, and arthritis', composition: 'Ibuprofen 400mg', manufacturer: 'Dr. Reddy\'s', dosageForm: 'tablet', strength: '400mg', packSize: '1 strip of 10', price: 35, discountPrice: 28, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['pain', 'anti-inflammatory', 'headache'], rating: 4.4, reviewCount: 256, totalSold: 12000, inStock: true },
  { name: 'Cetirizine 10mg', genericName: 'Cetirizine', slug: 'cetirizine-10mg', category: 'otc', subcategory: 'Allergy', description: '24-hour allergy relief from sneezing, runny nose, and itchy eyes', composition: 'Cetirizine HCl 10mg', manufacturer: 'Sun Pharma', dosageForm: 'tablet', strength: '10mg', packSize: '1 strip of 10', price: 30, discountPrice: 22, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['allergy', 'antihistamine'], rating: 4.3, reviewCount: 198, totalSold: 9800, inStock: true },
  { name: 'Omeprazole 20mg', genericName: 'Omeprazole', slug: 'omeprazole-20mg', category: 'otc', subcategory: 'Digestive', description: 'Relief from acidity, heartburn, and acid reflux', composition: 'Omeprazole 20mg', manufacturer: 'AstraZeneca', dosageForm: 'capsule', strength: '20mg', packSize: '1 strip of 14', price: 65, discountPrice: 52, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['acidity', 'heartburn', 'acid-reflux'], rating: 4.6, reviewCount: 412, totalSold: 11000, inStock: true },
  { name: 'Crocin Advance', genericName: 'Paracetamol', slug: 'crocin-advance', category: 'otc', subcategory: 'Pain Relief', description: 'Fast-acting paracetamol for quick relief from fever and pain', composition: 'Paracetamol 500mg', manufacturer: 'GSK', dosageForm: 'tablet', strength: '500mg', packSize: '1 strip of 10', price: 28, discountPrice: 24, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['fever', 'pain', 'fast-acting'], rating: 4.7, reviewCount: 567, totalSold: 22000, inStock: true, requirePrescription: false },
  { name: 'Digene Gel', genericName: 'Antacid', slug: 'digene-gel', category: 'otc', subcategory: 'Digestive', description: 'Instant relief from acidity, gas, and bloating', composition: 'Mag Hydroxide + Simethicone + Al Hydroxide', manufacturer: 'Abbott', dosageForm: 'gel', strength: '17g', packSize: '1 sachet', price: 12, discountPrice: 10, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['acidity', 'gas', 'bloating'], rating: 4.2, reviewCount: 234, totalSold: 18000, inStock: true },

  // Prescription Medicines
  { name: 'Amoxicillin 500mg', genericName: 'Amoxicillin', slug: 'amoxicillin-500mg', category: 'prescription', subcategory: 'Antibiotics', description: 'Broad-spectrum antibiotic for bacterial infections', composition: 'Amoxicillin Trihydrate 500mg', manufacturer: 'Cipla Ltd', dosageForm: 'capsule', strength: '500mg', packSize: '1 strip of 10', price: 85, discountPrice: 72, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['antibiotic', 'infection'], rating: 4.4, reviewCount: 156, totalSold: 8500, inStock: true, requirePrescription: true },
  { name: 'Metformin 500mg', genericName: 'Metformin HCl', slug: 'metformin-500mg', category: 'prescription', subcategory: 'Diabetes', description: 'First-line medication for type 2 diabetes management', composition: 'Metformin HCl 500mg', manufacturer: 'USV Ltd', dosageForm: 'tablet', strength: '500mg', packSize: '1 strip of 10', price: 32, discountPrice: 27, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['diabetes', 'blood-sugar'], rating: 4.5, reviewCount: 321, totalSold: 14000, inStock: true, requirePrescription: true },
  { name: 'Amlodipine 5mg', genericName: 'Amlodipine Besylate', slug: 'amlodipine-5mg', category: 'prescription', subcategory: 'Cardiovascular', description: 'Calcium channel blocker for high blood pressure', composition: 'Amlodipine Besylate 5mg', manufacturer: 'Pfizer', dosageForm: 'tablet', strength: '5mg', packSize: '1 strip of 10', price: 45, discountPrice: 38, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['blood-pressure', 'hypertension'], rating: 4.6, reviewCount: 289, totalSold: 11500, inStock: true, requirePrescription: true },
  { name: 'Atorvastatin 10mg', genericName: 'Atorvastatin Calcium', slug: 'atorvastatin-10mg', category: 'prescription', subcategory: 'Cardiovascular', description: 'Statin medication to lower cholesterol levels', composition: 'Atorvastatin Calcium 10mg', manufacturer: 'Ranbaxy', dosageForm: 'tablet', strength: '10mg', packSize: '1 strip of 10', price: 55, discountPrice: 45, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['cholesterol', 'statin'], rating: 4.3, reviewCount: 198, totalSold: 9200, inStock: true, requirePrescription: true },
  { name: 'Pantoprazole 40mg', genericName: 'Pantoprazole', slug: 'pantoprazole-40mg', category: 'prescription', subcategory: 'Gastrointestinal', description: 'Proton pump inhibitor for GERD and ulcers', composition: 'Pantoprazole 40mg', manufacturer: 'Alkem', dosageForm: 'tablet', strength: '40mg', packSize: '1 strip of 10', price: 48, discountPrice: 39, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['gerd', 'ulcer', 'acid'], rating: 4.4, reviewCount: 167, totalSold: 7800, inStock: true, requirePrescription: true },

  // Wellness
  { name: 'Vitamin D3 1000 IU', genericName: 'Cholecalciferol', slug: 'vitamin-d3-1000iu', category: 'wellness', subcategory: 'Vitamins', description: 'Essential vitamin for bone health and immunity', composition: 'Cholecalciferol 1000 IU', manufacturer: 'HealthVit', dosageForm: 'capsule', strength: '1000 IU', packSize: '1 bottle of 60', price: 199, discountPrice: 159, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['vitamin', 'bone-health', 'immunity'], rating: 4.7, reviewCount: 445, totalSold: 19000, inStock: true },
  { name: 'Omega-3 Fish Oil', genericName: 'EPA + DHA', slug: 'omega-3-fish-oil', category: 'wellness', subcategory: 'Supplements', description: 'Heart and brain health supplement with EPA & DHA', composition: 'EPA 180mg + DHA 120mg', manufacturer: 'MuscleBlaze', dosageForm: 'capsule', strength: '1000mg', packSize: '1 bottle of 90', price: 449, discountPrice: 359, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['omega-3', 'heart', 'brain'], rating: 4.5, reviewCount: 312, totalSold: 8500, inStock: true },
  { name: 'Whey Protein Isolate', genericName: 'Protein Supplement', slug: 'whey-protein-isolate', category: 'wellness', subcategory: 'Nutrition', description: 'Premium whey protein for muscle recovery and growth', composition: 'Whey Protein Isolate 27g per serving', manufacturer: 'Optimum Nutrition', dosageForm: 'powder', strength: '2 lb', packSize: '1 tub', price: 2999, discountPrice: 2499, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['protein', 'muscle', 'gym'], rating: 4.8, reviewCount: 678, totalSold: 5200, inStock: true },
  { name: 'Multivitamin Complete', genericName: 'Multivitamin', slug: 'multivitamin-complete', category: 'wellness', subcategory: 'Vitamins', description: 'Complete daily multivitamin with 23 essential nutrients', composition: 'Vitamin A, B-complex, C, D3, E, Zinc, Iron, etc.', manufacturer: 'Centrum', dosageForm: 'tablet', strength: 'Complete', packSize: '1 bottle of 30', price: 349, discountPrice: 289, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['multivitamin', 'daily', 'immunity'], rating: 4.4, reviewCount: 234, totalSold: 11000, inStock: true },

  // Ayurvedic
  { name: 'Chyawanprash', genericName: 'Ayurvedic Supplement', slug: 'chyawanprash', category: 'ayurvedic', subcategory: 'Immunity', description: 'Traditional Ayurvedic immunity booster with Amla and herbs', composition: 'Amla, Ashwagandha, Giloy, Tulsi, Honey', manufacturer: 'Dabur', dosageForm: 'powder', strength: '1kg', packSize: '1 jar', price: 320, discountPrice: 269, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['ayurvedic', 'immunity', 'herbal'], rating: 4.6, reviewCount: 567, totalSold: 15000, inStock: true },
  { name: 'Ashwagandha Capsules', genericName: 'Withania Somnifera', slug: 'ashwagandha-capsules', category: 'ayurvedic', subcategory: 'Stress Relief', description: 'Adaptogenic herb for stress relief and energy', composition: 'Ashwagandha Root Extract 500mg', manufacturer: 'Himalaya', dosageForm: 'capsule', strength: '500mg', packSize: '1 bottle of 60', price: 249, discountPrice: 199, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['ayurvedic', 'stress', 'energy', 'adaptogen'], rating: 4.5, reviewCount: 389, totalSold: 12000, inStock: true },
  { name: 'Giloy Juice', genericName: 'Tinospora Cordifolia', slug: 'giloy-juice', category: 'ayurvedic', subcategory: 'Immunity', description: 'Pure giloy juice for immunity and detoxification', composition: 'Tinospora Cordifolia Juice', manufacturer: 'Patanjali', dosageForm: 'syrup', strength: '500ml', packSize: '1 bottle', price: 150, discountPrice: 125, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['ayurvedic', 'immunity', 'detox'], rating: 4.2, reviewCount: 178, totalSold: 8500, inStock: true },

  // Personal Care
  { name: 'Dove Body Wash', genericName: 'Body Wash', slug: 'dove-body-wash', category: 'personal-care', subcategory: 'Skin Care', description: 'Moisturizing body wash with ¼ moisturizing cream', composition: 'Gentle cleansers + Moisturizing cream', manufacturer: 'HUL', dosageForm: 'gel', strength: '500ml', packSize: '1 bottle', price: 285, discountPrice: 229, image: 'https://images.unsplash.com/photo-1556228578-0d85b1a4d571?w=200&h=200&fit=crop', tags: ['body-wash', 'moisturizing', 'skin'], rating: 4.3, reviewCount: 445, totalSold: 9800, inStock: true },
  { name: 'Sensodyne Toothpaste', genericName: 'Desensitizing Toothpaste', slug: 'sensodyne-toothpaste', category: 'personal-care', subcategory: 'Oral Care', description: 'Daily care toothpaste for sensitive teeth', composition: 'Potassium Nitrate + Stannous Fluoride', manufacturer: 'GSK', dosageForm: 'gel', strength: '150g', packSize: '1 tube', price: 175, discountPrice: 149, image: 'https://images.unsplash.com/photo-1559599238-308793637427?w=200&h=200&fit=crop', tags: ['toothpaste', 'sensitive-teeth', 'oral'], rating: 4.5, reviewCount: 367, totalSold: 14000, inStock: true },

  // Diabetic Care
  { name: 'Glucometer Kit', genericName: 'Blood Glucose Monitor', slug: 'glucometer-kit', category: 'diabetic-care', subcategory: 'Monitoring', description: 'Digital blood glucose monitoring system with 25 strips', composition: 'Glucometer + 25 test strips + Lancets', manufacturer: 'OneTouch', dosageForm: 'sachet', strength: 'Kit', packSize: '1 kit', price: 999, discountPrice: 799, image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=200&h=200&fit=crop', tags: ['diabetes', 'glucometer', 'monitoring'], rating: 4.6, reviewCount: 234, totalSold: 6500, inStock: true },

  // Baby Care
  { name: 'Nestle Lactogen 1', genericName: 'Infant Formula', slug: 'nestle-lactogen-1', category: 'baby-care', subcategory: 'Formula', description: 'Infant formula for babies 0-6 months (when mother\'s milk is insufficient)', composition: 'Demineralized Whey, Palm Olein, Soy Oil, DHA, ARA', manufacturer: 'Nestle', dosageForm: 'powder', strength: '400g', packSize: '1 tin', price: 475, discountPrice: 425, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop', tags: ['baby', 'formula', 'infant'], rating: 4.4, reviewCount: 189, totalSold: 4200, inStock: true, requirePrescription: true },
  { name: 'Himalaya Baby Powder', genericName: 'Baby Powder', slug: 'himalaya-baby-powder', category: 'baby-care', subcategory: 'Skin Care', description: 'Gentle baby powder with olive oil and almond oil', composition: 'Olive Oil, Almond Oil, Zinc Oxide', manufacturer: 'Himalaya', dosageForm: 'powder', strength: '100g', packSize: '1 pack', price: 95, discountPrice: 79, image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=200&h=200&fit=crop', tags: ['baby', 'powder', 'gentle'], rating: 4.5, reviewCount: 312, totalSold: 7800, inStock: true },

  // Homeopathy
  { name: 'Arnica Montana 30C', genericName: 'Homeopathic remedy', slug: 'arnica-montana-30c', category: 'homeopathy', subcategory: 'Pain Relief', description: 'Homeopathic remedy for muscle pain, bruises, and sprains', composition: 'Arnica Montana 30C dilution', manufacturer: 'SBL', dosageForm: 'tablet', strength: '30C', packSize: '1 bottle of 200', price: 120, discountPrice: 99, image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=200&h=200&fit=crop', tags: ['homeopathy', 'pain', 'bruises'], rating: 4.1, reviewCount: 145, totalSold: 3200, inStock: true }
];

const pharmacies = [
  {
    name: 'Apollo Pharmacy', slug: 'apollo-pharmacy', description: 'India\'s leading pharmacy chain with genuine medicines', address: 'MG Road, Brigade Road', city: 'Bangalore', state: 'Karnataka', pincode: '560001', phone: '080-12345678', email: 'apollo@mediconnect.com', avatar: 'https://images.unsplash.com/photo-1631549916768-4f14e2e56b06?w=300&h=150&fit=crop', isVerified: true, rating: 4.7, reviewCount: 1234, totalOrders: 15600, deliveryTime: '1-2 hours', freeDeliveryAbove: 400, deliveryFee: 35, tags: ['24x7', 'fast-delivery', 'verified'], licenseNumber: 'KA-PH-1234'
  },
  {
    name: 'MedPlus', slug: 'medplus', description: 'Affordable medicines with doorstep delivery', address: 'HSR Layout, Sector 2', city: 'Bangalore', state: 'Karnataka', pincode: '560102', phone: '080-23456789', email: 'medplus@mediconnect.com', avatar: 'https://images.unsplash.com/photo-1631549916768-4f14e2e56b06?w=300&h=150&fit=crop', isVerified: true, rating: 4.5, reviewCount: 892, totalOrders: 12300, deliveryTime: '2-3 hours', freeDeliveryAbove: 500, deliveryFee: 40, tags: ['verified', 'affordable'], licenseNumber: 'KA-PH-5678'
  },
  {
    name: 'Netmeds Pharmacy', slug: 'netmeds', description: 'Online pharmacy with pan-India delivery', address: 'Koramangala, 5th Block', city: 'Bangalore', state: 'Karnataka', pincode: '560095', phone: '080-34567890', email: 'netmeds@mediconnect.com', avatar: 'https://images.unsplash.com/photo-1631549916768-4f14e2e56b06?w=300&h=150&fit=crop', isVerified: true, rating: 4.4, reviewCount: 678, totalOrders: 9800, deliveryTime: '2-4 hours', freeDeliveryAbove: 500, deliveryFee: 49, tags: ['pan-india', 'verified'], licenseNumber: 'KA-PH-9012'
  },
  {
    name: '1mg Pharmacy', slug: '1mg', description: 'Trusted online pharmacy with lab tests and doctor consults', address: 'Indiranagar, 12th Main', city: 'Bangalore', state: 'Karnataka', pincode: '560038', phone: '080-45678901', email: '1mg@mediconnect.com', avatar: 'https://images.unsplash.com/photo-1631549916768-4f14e2e56b06?w=300&h=150&fit=crop', isVerified: true, rating: 4.6, reviewCount: 1567, totalOrders: 18900, deliveryTime: '1-3 hours', freeDeliveryAbove: 300, deliveryFee: 0, tags: ['24x7', 'fast-delivery', 'verified', 'lab-tests'], licenseNumber: 'KA-PH-3456'
  },
  {
    name: 'PharmEasy', slug: 'pharmeasy', description: 'Discounted medicines with easy ordering', address: 'Whitefield, ITPL Road', city: 'Bangalore', state: 'Karnataka', pincode: '560066', phone: '080-56789012', email: 'pharmeasy@mediconnect.com', avatar: 'https://images.unsplash.com/photo-1631549916768-4f14e2e56b06?w=300&h=150&fit=crop', isVerified: true, rating: 4.3, reviewCount: 543, totalOrders: 8700, deliveryTime: '2-4 hours', freeDeliveryAbove: 500, deliveryFee: 39, tags: ['discounts', 'verified'], licenseNumber: 'KA-PH-7890'
  },
  {
    name: 'Local Care Pharmacy', slug: 'local-care', description: 'Your neighborhood pharmacy with personal care', address: 'HSR Layout, Sector 1', city: 'Bangalore', state: 'Karnataka', pincode: '560102', phone: '080-67890123', email: 'localcare@mediconnect.com', avatar: 'https://images.unsplash.com/photo-1631549916768-4f14e2e56b06?w=300&h=150&fit=crop', isVerified: false, rating: 4.1, reviewCount: 123, totalOrders: 2300, deliveryTime: '3-4 hours', freeDeliveryAbove: 600, deliveryFee: 55, tags: ['neighborhood', 'personal-care'], licenseNumber: 'KA-PH-2345'
  }
];

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected');

    // Clear existing
    await Medicine.deleteMany({});
    await Pharmacy.deleteMany({});
    console.log('🗑️ Cleared existing data');

    // Insert medicines
    const createdMedicines = await Medicine.insertMany(medicines);
    console.log(`✅ Inserted ${createdMedicines.length} medicines`);

    // Create pharmacies with random medicine assignments
    const pharmaciesWithMedicines = pharmacies.map(p => ({
      ...p,
      medicines: createdMedicines
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 15) + 10)
        .map(m => m._id)
    }));

    const createdPharmacies = await Pharmacy.insertMany(pharmaciesWithMedicines);
    console.log(`✅ Inserted ${createdPharmacies.length} pharmacies`);

    await mongoose.disconnect();
    console.log('🎉 Pharmacy seed complete!');
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
