// Paste your Firebase web-app config here (Firebase console → Project settings
// → Your apps → SDK setup and configuration). Until then the site runs in
// local mode: notes and bucket items save only on the device that wrote them.

export const firebaseConfig = {
  apiKey: "AIzaSyCyWa7-NUGqYA2ZmEBW61H5XHB-jLntCnM",
  authDomain: "our-story-rasta.firebaseapp.com",
  projectId: "our-story-rasta",
  storageBucket: "our-story-rasta.firebasestorage.app",
  messagingSenderId: "295966030310",
  appId: "1:295966030310:web:77e7aa4fafd73cc5377e27"
};



// Only these Google accounts may add notes / bucket items once Firebase is on.
// Must match the allowlist in your Firestore security rules (see README).
export const editors = ['rahul.mahajan1331@gmail.com', 'rahul.ynr03@gmail.com'];
