const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });
const Lab = require('../models/Lab');

const labs = [
  {
    name: 'Thyrocare Aarogyam Center',
    description: 'India\'s leading diagnostic chain with 2000+ test locations. NABL accredited with same-day reports.',
    avatar: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=150&h=150&fit=crop',
    rating: 4.6,
    totalReviews: 2340,
    address: '42, Rajouri Garden, Main Market',
    city: 'Delhi',
    state: 'Delhi',
    phone: '+91-11-25467890',
    email: 'delhi@thyrocare.com',
    location: { type: 'Point', coordinates: [77.1280, 28.6448] },
    homeCollectionAvailable: true,
    homeCollectionFee: 0,
    totalTests: 85,
    totalBookings: 12400,
    isNABL: true,
    tags: ['blood test', 'thyroid', 'diabetes', 'health checkup'],
    tests: [
      { name: 'Complete Blood Count (CBC)', category: 'blood', description: 'Measures RBC, WBC, hemoglobin, platelets', price: 350, discountPrice: 280, fastingRequired: false, reportTime: '6 hours', homeCollection: true, popular: true },
      { name: 'Thyroid Profile (T3, T4, TSH)', category: 'blood', description: 'Complete thyroid function test', price: 600, discountPrice: 450, fastingRequired: false, reportTime: '12 hours', homeCollection: true, popular: true },
      { name: 'Diabetes Profile (HbA1c + Fasting)', category: 'blood', description: 'HbA1c, fasting glucose, post-prandial glucose', price: 800, discountPrice: 599, fastingRequired: true, reportTime: '24 hours', homeCollection: true, popular: true },
      { name: 'Lipid Profile', category: 'blood', description: 'Total cholesterol, HDL, LDL, triglycerides', price: 500, discountPrice: 380, fastingRequired: true, reportTime: '12 hours', homeCollection: true, popular: true },
      { name: 'Liver Function Test (LFT)', category: 'blood', description: 'SGOT, SGPT, bilirubin, albumin, ALP', price: 550, discountPrice: 420, fastingRequired: false, reportTime: '24 hours', homeCollection: true },
      { name: 'Kidney Function Test (KFT)', category: 'blood', description: 'Creatinine, BUN, uric acid, electrolytes', price: 500, discountPrice: 380, fastingRequired: false, reportTime: '24 hours', homeCollection: true },
      { name: 'Vitamin D Test', category: 'blood', description: '25-Hydroxy Vitamin D level', price: 1200, discountPrice: 899, fastingRequired: false, reportTime: '48 hours', homeCollection: true, popular: true },
      { name: 'Vitamin B12 Test', category: 'blood', description: 'Cyanocobalamin level', price: 900, discountPrice: 699, fastingRequired: false, reportTime: '48 hours', homeCollection: true },
      { name: 'Iron Studies', category: 'blood', description: 'Serum iron, ferritin, TIBC', price: 700, discountPrice: 550, fastingRequired: true, reportTime: '24 hours', homeCollection: true },
      { name: 'Urine Routine Examination', category: 'urine', description: 'Complete urinalysis with microscopy', price: 200, discountPrice: 150, fastingRequired: false, reportTime: '6 hours', homeCollection: true },
      { name: 'Urine Culture & Sensitivity', category: 'urine', description: 'Detects bacterial infection and antibiotic sensitivity', price: 450, discountPrice: 350, fastingRequired: false, reportTime: '48 hours', homeCollection: true },
      { name: 'Full Body Checkup - Silver', category: 'package', description: 'CBC, LFT, KFT, Lipid, Thyroid, Sugar, Urine + 40 tests', price: 1999, discountPrice: 1499, fastingRequired: true, reportTime: '24 hours', homeCollection: true, popular: true },
      { name: 'Full Body Checkup - Gold', category: 'package', description: 'Silver + Vitamin D, B12, Cardiac markers, Cancer markers + 65 tests', price: 3999, discountPrice: 2999, fastingRequired: true, reportTime: '48 hours', homeCollection: true, popular: true },
      { name: 'Executive Health Package', category: 'package', description: '80+ tests including cardiac, cancer, hormonal panels', price: 6999, discountPrice: 4999, fastingRequired: true, reportTime: '72 hours', homeCollection: true }
    ]
  },
  {
    name: 'Dr Lal PathLabs',
    description: 'Trusted diagnostic lab network across India. 4000+ tests with advanced technology and quick turnaround.',
    avatar: 'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=150&h=150&fit=crop',
    rating: 4.5,
    totalReviews: 3100,
    address: '15, Connaught Place, Block A',
    city: 'Delhi',
    state: 'Delhi',
    phone: '+91-11-23456789',
    email: 'delhi@lalpathlabs.com',
    location: { type: 'Point', coordinates: [77.2167, 28.6328] },
    homeCollectionAvailable: true,
    homeCollectionFee: 0,
    totalTests: 120,
    totalBookings: 18900,
    isNABL: true,
    tags: ['blood test', 'imaging', 'x-ray', 'MRI', 'health checkup'],
    tests: [
      { name: 'Complete Blood Count (CBC)', category: 'blood', description: 'Detailed blood cell analysis', price: 380, discountPrice: 320, fastingRequired: false, reportTime: '6 hours', homeCollection: true, popular: true },
      { name: 'Thyroid Profile', category: 'blood', description: 'T3, T4, TSH evaluation', price: 650, discountPrice: 520, fastingRequired: false, reportTime: '12 hours', homeCollection: true },
      { name: 'HbA1c Test', category: 'blood', description: 'Glycated hemoglobin for diabetes monitoring', price: 550, discountPrice: 440, fastingRequired: false, reportTime: '24 hours', homeCollection: true, popular: true },
      { name: 'C-Reactive Protein (CRP)', category: 'blood', description: 'Inflammation marker', price: 400, discountPrice: 320, fastingRequired: false, reportTime: '24 hours', homeCollection: true },
      { name: 'Prostate PSA Test', category: 'blood', description: 'Prostate-Specific Antigen screening', price: 800, discountPrice: 640, fastingRequired: false, reportTime: '48 hours', homeCollection: true },
      { name: 'X-Ray Chest (PA View)', category: 'imaging', description: 'Chest X-ray for lung and heart assessment', price: 500, discountPrice: 400, fastingRequired: false, reportTime: '2 hours', homeCollection: false, popular: true },
      { name: 'X-Ray Knee (Both Views)', category: 'imaging', description: 'Knee joint X-ray evaluation', price: 600, discountPrice: 480, fastingRequired: false, reportTime: '2 hours', homeCollection: false },
      { name: 'Ultrasound Abdomen', category: 'imaging', description: 'Complete abdominal ultrasound', price: 1200, discountPrice: 960, fastingRequired: true, reportTime: '4 hours', homeCollection: false, popular: true },
      { name: 'ECG (12-Lead)', category: 'cardiac', description: 'Electrocardiogram heart rhythm test', price: 300, discountPrice: 240, fastingRequired: false, reportTime: '30 minutes', homeCollection: false, popular: true },
      { name: 'Echocardiography', category: 'cardiac', description: 'Heart ultrasound with color Doppler', price: 2500, discountPrice: 2000, fastingRequired: false, reportTime: '24 hours', homeCollection: false },
      { name: 'Premium Health Package', category: 'package', description: '50+ tests: CBC, LFT, KFT, Lipid, Thyroid, Cardiac, Cancer markers', price: 4999, discountPrice: 3499, fastingRequired: true, reportTime: '48 hours', homeCollection: true, popular: true }
    ]
  },
  {
    name: 'SRL Diagnostics',
    description: 'Advanced diagnostic laboratory with cutting-edge technology. Pan-India network with accurate and timely reports.',
    avatar: 'https://images.unsplash.com/photo-1551076805-e1869033e561?w=150&h=150&fit=crop',
    rating: 4.4,
    totalReviews: 1890,
    address: '78, Andheri West, Link Road',
    city: 'Mumbai',
    state: 'Maharashtra',
    phone: '+91-22-26789012',
    email: 'mumbai@srl.com',
    location: { type: 'Point', coordinates: [72.8347, 19.1197] },
    homeCollectionAvailable: true,
    homeCollectionFee: 50,
    totalTests: 95,
    totalBookings: 9800,
    isNABL: true,
    tags: ['blood test', 'imaging', 'MRI', 'CT scan', 'health checkup'],
    tests: [
      { name: 'Complete Blood Count', category: 'blood', price: 400, discountPrice: 320, fastingRequired: false, reportTime: '6 hours', homeCollection: true, popular: true },
      { name: 'Thyroid Profile', category: 'blood', price: 700, discountPrice: 560, fastingRequired: false, reportTime: '12 hours', homeCollection: true },
      { name: 'Diabetes Panel', category: 'blood', price: 850, discountPrice: 680, fastingRequired: true, reportTime: '24 hours', homeCollection: true, popular: true },
      { name: 'Hormone Panel (Female)', category: 'hormone', description: 'Estrogen, Progesterone, FSH, LH', price: 2200, discountPrice: 1760, fastingRequired: false, reportTime: '72 hours', homeCollection: true },
      { name: 'CT Scan Chest', category: 'imaging', price: 4500, discountPrice: 3600, fastingRequired: false, reportTime: '24 hours', homeCollection: false },
      { name: 'MRI Brain', category: 'imaging', price: 6000, discountPrice: 4800, fastingRequired: false, reportTime: '48 hours', homeCollection: false },
      { name: 'Whole Body Checkup', category: 'package', price: 5999, discountPrice: 4499, fastingRequired: true, reportTime: '72 hours', homeCollection: true, popular: true }
    ]
  },
  {
    name: 'Metropolis Healthcare',
    description: 'Global diagnostics brand with 20+ years of expertise. Known for accurate results and fast turnaround.',
    avatar: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=150&h=150&fit=crop',
    rating: 4.7,
    totalReviews: 2800,
    address: '22, Koramangala, 5th Block',
    city: 'Bangalore',
    state: 'Karnataka',
    phone: '+91-80-25678901',
    email: 'bangalore@metropolis.com',
    location: { type: 'Point', coordinates: [77.6167, 12.9352] },
    homeCollectionAvailable: true,
    homeCollectionFee: 0,
    totalTests: 110,
    totalBookings: 15600,
    isNABL: true,
    tags: ['blood test', 'genetic', 'hormone', 'health checkup'],
    tests: [
      { name: 'Complete Blood Count', category: 'blood', price: 420, discountPrice: 350, fastingRequired: false, reportTime: '4 hours', homeCollection: true, popular: true },
      { name: 'Advanced Thyroid Panel', category: 'blood', price: 900, discountPrice: 720, fastingRequired: false, reportTime: '12 hours', homeCollection: true },
      { name: 'Genetic Health Screening', category: 'other', description: 'DNA-based health risk assessment', price: 9999, discountPrice: 7999, fastingRequired: false, reportTime: '15 days', homeCollection: true },
      { name: 'Female Hormone Panel', category: 'hormone', description: 'Complete reproductive hormone evaluation', price: 2500, discountPrice: 2000, fastingRequired: false, reportTime: '48 hours', homeCollection: true, popular: true },
      { name: 'Well Woman Package', category: 'package', price: 3999, discountPrice: 2999, fastingRequired: true, reportTime: '48 hours', homeCollection: true, popular: true },
      { name: 'Cardiac Risk Assessment', category: 'package', description: 'Lipid, CRP, homocysteine, troponin', price: 3500, discountPrice: 2800, fastingRequired: true, reportTime: '24 hours', homeCollection: true }
    ]
  },
  {
    name: 'Max Lab - Sarjapur Road',
    description: 'Part of Max Healthcare network. Premium diagnostic services with state-of-the-art equipment.',
    avatar: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=150&h=150&fit=crop',
    rating: 4.3,
    totalReviews: 1200,
    address: '45, Sarjapur Road, Near Wipro',
    city: 'Bangalore',
    state: 'Karnataka',
    phone: '+91-80-23456789',
    email: 'sarjapur@maxlab.com',
    location: { type: 'Point', coordinates: [77.7620, 12.9116] },
    homeCollectionAvailable: true,
    homeCollectionFee: 0,
    totalTests: 70,
    totalBookings: 7200,
    isNABL: true,
    tags: ['blood test', 'imaging', 'health checkup'],
    tests: [
      { name: 'CBC', category: 'blood', price: 380, discountPrice: 300, fastingRequired: false, reportTime: '6 hours', homeCollection: true, popular: true },
      { name: 'Thyroid Profile', category: 'blood', price: 650, discountPrice: 500, fastingRequired: false, reportTime: '12 hours', homeCollection: true },
      { name: 'Lipid Profile', category: 'blood', price: 550, discountPrice: 420, fastingRequired: true, reportTime: '12 hours', homeCollection: true },
      { name: 'X-Ray Chest', category: 'imaging', price: 550, discountPrice: 440, fastingRequired: false, reportTime: '2 hours', homeCollection: false },
      { name: 'Basic Health Package', category: 'package', price: 1499, discountPrice: 1199, fastingRequired: true, reportTime: '24 hours', homeCollection: true, popular: true }
    ]
  },
  {
    name: 'Apollo Diagnostics - T.Nagar',
    description: 'Apollo healthcare\'s diagnostic arm. Trusted for precision diagnostics and comprehensive health packages.',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop',
    rating: 4.5,
    totalReviews: 2100,
    address: '12, Usman Road, T. Nagar',
    city: 'Chennai',
    state: 'Tamil Nadu',
    phone: '+91-44-28345678',
    email: 'chennai@apollodiagnostics.com',
    location: { type: 'Point', coordinates: [80.2364, 13.0418] },
    homeCollectionAvailable: true,
    homeCollectionFee: 0,
    totalTests: 90,
    totalBookings: 11200,
    isNABL: true,
    tags: ['blood test', 'cardiac', 'health checkup'],
    tests: [
      { name: 'CBC', category: 'blood', price: 350, discountPrice: 280, fastingRequired: false, reportTime: '6 hours', homeCollection: true, popular: true },
      { name: 'Thyroid Profile', category: 'blood', price: 600, discountPrice: 480, fastingRequired: false, reportTime: '12 hours', homeCollection: true },
      { name: 'ECG', category: 'cardiac', price: 350, discountPrice: 280, fastingRequired: false, reportTime: '30 minutes', homeCollection: false, popular: true },
      { name: 'Cardiac Risk Profile', category: 'package', description: 'Lipid, CRP, homocysteine, ECG, Troponin', price: 3000, discountPrice: 2400, fastingRequired: true, reportTime: '24 hours', homeCollection: false, popular: true },
      { name: 'Senior Citizen Package', category: 'package', price: 3499, discountPrice: 2799, fastingRequired: true, reportTime: '48 hours', homeCollection: true }
    ]
  },
  {
    name: 'Redcliffe Labs - Sector 62',
    description: 'Noida\'s trusted diagnostic center with home collection and quick digital reports.',
    avatar: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=150&h=150&fit=crop',
    rating: 4.2,
    totalReviews: 980,
    address: '88, Sector 62, Near Fortis Hospital',
    city: 'Noida',
    state: 'Uttar Pradesh',
    phone: '+91-120-4567890',
    email: 'noida@redcliffelabs.com',
    location: { type: 'Point', coordinates: [77.3619, 28.6229] },
    homeCollectionAvailable: true,
    homeCollectionFee: 0,
    totalTests: 65,
    totalBookings: 5600,
    isNABL: true,
    tags: ['blood test', 'home collection', 'health checkup'],
    tests: [
      { name: 'CBC', category: 'blood', price: 300, discountPrice: 250, fastingRequired: false, reportTime: '6 hours', homeCollection: true, popular: true },
      { name: 'Thyroid Profile', category: 'blood', price: 550, discountPrice: 420, fastingRequired: false, reportTime: '12 hours', homeCollection: true },
      { name: 'Vitamin D + B12', category: 'blood', price: 1500, discountPrice: 1100, fastingRequired: false, reportTime: '48 hours', homeCollection: true, popular: true },
      { name: 'Essential Body Checkup', category: 'package', price: 999, discountPrice: 799, fastingRequired: true, reportTime: '24 hours', homeCollection: true, popular: true }
    ]
  },
  {
    name: 'City X-Ray & Lab - Jubilee Hills',
    description: 'Premium imaging and pathology center in Hyderabad with advanced MRI and CT scanners.',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=150&h=150&fit=crop',
    rating: 4.4,
    totalReviews: 1560,
    address: '34, Jubilee Hills, Road 36',
    city: 'Hyderabad',
    state: 'Telangana',
    phone: '+91-40-23678901',
    email: 'hyderabad@cityxray.com',
    location: { type: 'Point', coordinates: [78.4076, 17.4156] },
    homeCollectionAvailable: true,
    homeCollectionFee: 30,
    totalTests: 75,
    totalBookings: 8400,
    isNABL: true,
    tags: ['imaging', 'MRI', 'CT scan', 'X-ray', 'blood test'],
    tests: [
      { name: 'CBC', category: 'blood', price: 380, discountPrice: 300, fastingRequired: false, reportTime: '6 hours', homeCollection: true },
      { name: 'MRI Brain', category: 'imaging', price: 5500, discountPrice: 4400, fastingRequired: false, reportTime: '24 hours', homeCollection: false, popular: true },
      { name: 'CT Scan Abdomen', category: 'imaging', price: 4000, discountPrice: 3200, fastingRequired: false, reportTime: '24 hours', homeCollection: false, popular: true },
      { name: 'X-Ray Spine (Lateral)', category: 'imaging', price: 500, discountPrice: 400, fastingRequired: false, reportTime: '2 hours', homeCollection: false },
      { name: 'Ultrasound Pelvis', category: 'imaging', price: 1000, discountPrice: 800, fastingRequired: false, reportTime: '4 hours', homeCollection: false },
      { name: 'Master Health Checkup', category: 'package', price: 2999, discountPrice: 2299, fastingRequired: true, reportTime: '48 hours', homeCollection: true, popular: true }
    ]
  }
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mediconnect_pro');
    console.log('Connected to MongoDB');

    await Lab.deleteMany({});
    console.log('Cleared existing labs');

    const result = await Lab.insertMany(labs);
    console.log(`Seeded ${result.length} labs with tests`);

    // Count total tests
    let totalTests = 0;
    result.forEach(lab => totalTests += lab.tests.length);
    console.log(`Total tests seeded: ${totalTests}`);

    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  }
}

seed();
