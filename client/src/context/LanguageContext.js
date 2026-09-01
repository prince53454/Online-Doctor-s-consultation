import React, { createContext, useContext, useState, useCallback } from 'react';

const translations = {
  en: {
    // Navbar
    nav_findDoctors: 'Find Doctors',
    nav_aiCheck: 'AI Symptom Check',
    nav_appointments: 'My Appointments',
    nav_reports: 'Reports',
    nav_records: 'Medical Records',
    nav_dashboard: 'Dashboard',
    nav_earnings: '💰 Earnings',
    nav_login: 'Login',
    nav_signup: 'Sign Up',
    nav_profile: '👤 My Profile',
    nav_myAppointments: '📅 My Appointments',
    nav_myReports: '📋 My Reports',
    nav_medicalRecords: '🏥 Medical Records',
    nav_adminDashboard: '🛡️ Admin Dashboard',
    nav_pendingApproval: '⏳ Approval Pending',
    nav_logout: '🚪 Logout',

    // Home
    home_heroTitle1: 'Your Health,',
    home_heroTitle2: 'Our Priority',
    home_heroDesc: 'Connect with top-rated doctors, book appointments instantly, and access quality healthcare through video calls, chat, or in-person visits — all from one platform.',
    home_searchPlaceholder: 'Search doctors, specialties, diseases...',
    home_searchBtn: 'Search',
    home_statDoctors: 'Expert Doctors',
    home_statPatients: 'Happy Patients',
    home_statAppointments: 'Appointments',
    home_statRating: 'Average Rating',
    home_featuredDoctors: 'Featured Doctors',
    home_specialties: 'Our Specialties',
    home_features: 'Why Choose MediConnect',
    home_bookNow: 'Book Now',
    home_viewProfile: 'View Profile',

    // Doctors
    doctors_title: 'Find Your Doctor',
    doctors_subtitle: 'Search from our network of verified and experienced healthcare professionals',
    doctors_noResults: 'No doctors found',
    doctors_perVisit: 'per visit',

    // Auth
    auth_welcomeBack: 'Welcome Back to MediConnect',
    auth_welcomeDesc: 'Access world-class healthcare from anywhere.',
    auth_signIn: 'Sign In',
    auth_email: 'Email Address',
    auth_password: 'Password',
    auth_rememberMe: 'Remember me',
    auth_forgotPassword: 'Forgot password?',
    auth_signInBtn: 'Sign In',
    auth_noAccount: "Don't have an account?",
    auth_signUpFree: 'Sign Up Free',
    auth_orContinue: 'or continue with',
    auth_demoCredentials: 'Demo Credentials:',

    // Booking
    book_title: 'Book Appointment',
    book_selectDate: 'Select Date',
    book_selectTime: 'Select Time Slot',
    book_type: 'Appointment Type',
    book_symptoms: 'Describe Your Symptoms',
    book_fees: 'Consultation Fee',
    book_payNow: 'Pay & Book Now',
    book_processing: 'Processing...',
    book_success: 'Appointment booked successfully!',

    // Doctor Dashboard
    doc_welcome: 'Welcome back, Dr.',
    doc_todayAppointments: "Today's Appointments",
    doc_pending: 'Pending Bookings',
    doc_completed: 'Completed',
    doc_earnings: 'Total Earnings',
    doc_overview: '📊 Overview',
    doc_appointments: '📅 Appointments',
    doc_patients: '👥 Patients',
    doc_messages: '💬 Messages',
    doc_schedule: '🕐 Schedule',
    doc_earningsTab: '💰 Earnings',
    doc_confirm: '✓ Confirm',
    doc_decline: '✕ Decline',
    doc_reschedule: '📅 Reschedule',

    // Admin
    admin_dashboard: 'Dashboard',
    admin_welcome: 'Welcome back, Admin',
    admin_totalDoctors: 'Total Doctors',
    admin_totalPatients: 'Total Patients',
    admin_totalAppointments: 'Total Appointments',
    admin_totalRevenue: 'Total Revenue',
    admin_pendingApprovals: 'Pending Approvals',
    admin_activeAppointments: 'Active Appointments',
    admin_doctors: '👨‍⚕️ Doctors',
    admin_appointments: '📅 Appointments',
    admin_users: '👥 Users',
    admin_revenue: '💰 Revenue',
    admin_settings: '⚙️ Settings',
    admin_approve: '✓ Approve',
    admin_reject: '✗ Reject',

    // Labs
    labs_title: '🔬 Book Lab Tests & Diagnostics',
    labs_subtitle: 'Find trusted diagnostic labs near you. Compare prices, book tests, and get reports online.',
    labs_searchPlaceholder: 'Search tests (e.g., CBC, Thyroid, X-Ray, MRI...)',
    labs_allTests: 'All Tests',
    labs_bloodTests: 'Blood Tests',
    labs_imaging: 'Imaging',
    labs_packages: 'Health Packages',
    labs_viewTests: 'View Tests & Book →',
    labs_nabl: 'NABL Accredited',
    labs_homeCollection: '🏠 Home Collection',

    // Common
    common_loading: 'Loading...',
    common_error: 'Something went wrong',
    common_save: 'Save',
    common_cancel: 'Cancel',
    common_delete: 'Delete',
    common_edit: 'Edit',
    common_back: '← Back',
    common_close: 'Close',
    common_viewAll: 'View All',
    common_noData: 'No data available',
    common_rupee: '₹',
  },
  hi: {
    // Navbar
    nav_findDoctors: 'डॉक्टर खोजें',
    nav_aiCheck: 'AI लक्षण जांच',
    nav_appointments: 'मेरी अपॉइंटमेंट',
    nav_reports: 'रिपोर्ट',
    nav_records: 'मेडिकल रिकॉर्ड',
    nav_dashboard: 'डैशबोर्ड',
    nav_earnings: '💰 कमाई',
    nav_login: 'लॉगिन',
    nav_signup: 'साइन अप',
    nav_profile: '👤 मेरी प्रोफ़ाइल',
    nav_myAppointments: '📅 मेरी अपॉइंटमेंट',
    nav_myReports: '📋 मेरी रिपोर्ट',
    nav_medicalRecords: '🏥 मेडिकल रिकॉर्ड',
    nav_adminDashboard: '🛡️ एडमिन डैशबोर्ड',
    nav_pendingApproval: '⏳ अप्रूवल पेंडिंग',
    nav_logout: '🚪 लॉगआउट',

    // Home
    home_heroTitle1: 'आपका स्वास्थ्य,',
    home_heroTitle2: 'हमारी प्राथमिकता',
    home_heroDesc: 'शीर्ष रेटेड डॉक्टरों से जुड़ें, तुरंत अपॉइंटमेंट बुक करें, और वीडियो कॉल, चैट, या व्यक्तिगत विज़िट के माध्यम से गुणवत्तापूर्ण स्वास्थ्य सेवा तक पहुँचें।',
    home_searchPlaceholder: 'डॉक्टर, विशेषज्ञता, बीमारियाँ खोजें...',
    home_searchBtn: 'खोजें',
    home_statDoctors: 'विशेषज्ञ डॉक्टर',
    home_statPatients: 'खुश मरीज़',
    home_statAppointments: 'अपॉइंटमेंट',
    home_statRating: 'औसत रेटिंग',
    home_featuredDoctors: 'प्रमुख डॉक्टर',
    home_specialties: 'हमारी विशेषज्ञता',
    home_features: 'MediConnect क्यों चुनें',
    home_bookNow: 'अभी बुक करें',
    home_viewProfile: 'प्रोफ़ाइल देखें',

    // Doctors
    doctors_title: 'अपना डॉक्टर खोजें',
    doctors_subtitle: 'हमारे सत्यापित और अनुभवी स्वास्थ्य पेशेवरों के नेटवर्क में खोजें',
    doctors_noResults: 'कोई डॉक्टर नहीं मिला',
    doctors_perVisit: 'प्रति विज़िट',

    // Auth
    auth_welcomeBack: 'MediConnect में वापसी',
    auth_welcomeDesc: 'कहीं से भी विश्व स्तरीय स्वास्थ्य सेवा तक पहुँचें।',
    auth_signIn: 'साइन इन',
    auth_email: 'ईमेल पता',
    auth_password: 'पासवर्ड',
    auth_rememberMe: 'मुझे याद रखें',
    auth_forgotPassword: 'पासवर्ड भूल गए?',
    auth_signInBtn: 'साइन इन',
    auth_noAccount: 'खाता नहीं है?',
    auth_signUpFree: 'मुफ्त साइन अप',
    auth_orContinue: 'या इसके साथ जारी रखें',
    auth_demoCredentials: 'डेमो क्रेडेंशियल:',

    // Booking
    book_title: 'अपॉइंटमेंट बुक करें',
    book_selectDate: 'तारीख चुनें',
    book_selectTime: 'समय स्लॉट चुनें',
    book_type: 'अपॉइंटमेंट का प्रकार',
    book_symptoms: 'अपने लक्षण बताएं',
    book_fees: 'परामर्श शुल्क',
    book_payNow: 'भुगतान करें और बुक करें',
    book_processing: 'प्रसंस्करण...',
    book_success: 'अपॉइंटमेंट सफलतापूर्वक बुक हो गई!',

    // Doctor Dashboard
    doc_welcome: 'वापसी पर स्वागत है, डॉ.',
    doc_todayAppointments: 'आज की अपॉइंटमेंट',
    doc_pending: 'पेंडिंग बुकिंग',
    doc_completed: 'पूर्ण',
    doc_earnings: 'कुल कमाई',
    doc_overview: '📊 अवलोकन',
    doc_appointments: '📅 अपॉइंटमेंट',
    doc_patients: '👥 मरीज़',
    doc_messages: '💬 संदेश',
    doc_schedule: '🕐 शेड्यूल',
    doc_earningsTab: '💰 कमाई',
    doc_confirm: '✓ पुष्टि करें',
    doc_decline: '✕ अस्वीकार करें',
    doc_reschedule: '📅 पुनर्निर्धारित करें',

    // Admin
    admin_dashboard: 'डैशबोर्ड',
    admin_welcome: 'वापसी पर स्वागत है, एडमिन',
    admin_totalDoctors: 'कुल डॉक्टर',
    admin_totalPatients: 'कुल मरीज़',
    admin_totalAppointments: 'कुल अपॉइंटमेंट',
    admin_totalRevenue: 'कुल राजस्व',
    admin_pendingApprovals: 'पेंडिंग अप्रूवल',
    admin_activeAppointments: 'सक्रिय अपॉइंटमेंट',
    admin_doctors: '👨‍⚕️ डॉक्टर',
    admin_appointments: '📅 अपॉइंटमेंट',
    admin_users: '👥 उपयोगकर्ता',
    admin_revenue: '💰 राजस्व',
    admin_settings: '⚙️ सेटिंग्स',
    admin_approve: '✓ स्वीकृत करें',
    admin_reject: '✗ अस्वीकार करें',

    // Labs
    labs_title: '🔬 लैब टेस्ट और डायग्नोस्टिक बुक करें',
    labs_subtitle: 'अपने पास विश्वसनीय डायग्नोस्टिक लैब खोजें। कीमतें तुलना करें, टेस्ट बुक करें और ऑनलाइन रिपोर्ट प्राप्त करें।',
    labs_searchPlaceholder: 'टेस्ट खोजें (जैसे CBC, थायरॉयड, एक्स-रे, MRI...)',
    labs_allTests: 'सभी टेस्ट',
    labs_bloodTests: 'ब्लड टेस्ट',
    labs_imaging: 'इमेजिंग',
    labs_packages: 'स्वास्थ्य पैकेज',
    labs_viewTests: 'टेस्ट देखें और बुक करें →',
    labs_nabl: 'NABL प्रमाणित',
    labs_homeCollection: '🏠 होम कलेक्शन',

    // Common
    common_loading: 'लोड हो रहा है...',
    common_error: 'कुछ गलत हो गया',
    common_save: 'सहेजें',
    common_cancel: 'रद्द करें',
    common_delete: 'हटाएं',
    common_edit: 'संपादित करें',
    common_back: '← वापस',
    common_close: 'बंद करें',
    common_viewAll: 'सभी देखें',
    common_noData: 'कोई डेटा उपलब्ध नहीं',
    common_rupee: '₹',
  }
};

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'en');

  const t = useCallback((key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  }, [lang]);

  const toggleLanguage = useCallback(() => {
    const newLang = lang === 'en' ? 'hi' : 'en';
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, toggleLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
