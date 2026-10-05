// Paste your Firebase web-app config here (Firebase console → Project settings
// → Your apps → SDK setup and configuration). Until then the site runs in
// local mode: notes and bucket items save only on the device that wrote them.
export const firebaseConfig = null;
/* Example:
export const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "our-story-xxxx.firebaseapp.com",
  projectId: "our-story-xxxx",
  storageBucket: "our-story-xxxx.appspot.com",
  messagingSenderId: "...",
  appId: "..."
};
*/

// Only these Google accounts may add notes / bucket items once Firebase is on.
// Must match the allowlist in your Firestore security rules (see README).
export const editors = ['your-email@gmail.com', 'her-email@gmail.com'];
