const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), override: true });

const User = require('../models/User');
const Doctor = require('../models/Doctor');

// Curated medical stock photos from Unsplash
const doctorPhotos = [
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1612531386530-97d3f89e36f5?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1666214280368-00e3e089b3e0?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1583912066983-764a16552b59?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1607990281513-2c110a25bd8c?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1551601651-2a8555f1a136?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1527613426441-4da17471b66d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1584820927498-cfe5211fd8bf?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1609234656386-69e63e4b8b94?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746790095-e5ab1b3f4b02?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1594824476967-48c8b964ac31?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1651008376811-b90baee60c1f?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1612531386530-97d3f89e36f5?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1638202993928-7267aad84c31?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1666214280368-00e3e089b3e0?w=400&h=400&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1583912066983-764a16552b59?w=400&h=400&fit=crop&crop=face',
];

const patientPhotos = [
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&h=200&fit=crop&crop=face',
  'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=200&h=200&fit=crop&crop=face',
];

async function updateImages() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB');

  // Update doctor avatars
  const doctors = await Doctor.find().populate('user');
  let i = 0;
  for (const doc of doctors) {
    const photo = doctorPhotos[i % doctorPhotos.length];
    await User.findByIdAndUpdate(doc.user._id, { avatar: photo });
    console.log(`✅ Updated ${doc.user.name} → photo ${i + 1}`);
    i++;
  }

  // Update patient avatars
  const patients = await User.find({ role: 'patient' });
  i = 0;
  for (const patient of patients) {
    const photo = patientPhotos[i % patientPhotos.length];
    await User.findByIdAndUpdate(patient._id, { avatar: photo });
    console.log(`✅ Updated ${patient.name} → photo ${i + 1}`);
    i++;
  }

  await mongoose.disconnect();
  console.log('\nDone! All avatars updated with real photos.');
}

updateImages().catch(e => { console.error(e); process.exit(1); });
