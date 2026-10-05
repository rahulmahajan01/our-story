// Storage adapter: Firestore when configured, localStorage otherwise.
// Collections: loveNotes {for: 'him'|'her', text, year}, bucket {text, done}.
import { firebaseConfig } from './firebase-config.js';

let backend;

async function initFirebase() {
  const { initializeApp } = await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js');
  const { getFirestore, collection, getDocs, addDoc, updateDoc, doc } =
    await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js');
  const { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged } =
    await import('https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js');

  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  const auth = getAuth(app);

  return {
    mode: 'firebase',
    async list(col) {
      const snap = await getDocs(collection(db, col));
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    },
    async add(col, data) {
      await ensureSignIn();
      const ref = await addDoc(collection(db, col), data);
      return { id: ref.id, ...data };
    },
    async update(col, id, data) {
      await ensureSignIn();
      await updateDoc(doc(db, col, id), data);
    },
  };

  function ensureSignIn() {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(auth, (user) => {
        if (user) resolve(user);
        else signInWithPopup(auth, new GoogleAuthProvider()).then(resolve, reject);
      });
    });
  }
}

function initLocal() {
  const read = (col) => JSON.parse(localStorage.getItem('ourstory:' + col) || '[]');
  const write = (col, rows) => localStorage.setItem('ourstory:' + col, JSON.stringify(rows));
  return {
    mode: 'local',
    async list(col) { return read(col); },
    async add(col, data) {
      const rows = read(col);
      const row = { id: 'local-' + Date.now(), ...data };
      rows.push(row);
      write(col, rows);
      return row;
    },
    async update(col, id, data) {
      const rows = read(col).map((r) => (r.id === id ? { ...r, ...data } : r));
      write(col, rows);
    },
  };
}

export async function getStorage() {
  if (backend) return backend;
  backend = firebaseConfig ? await initFirebase() : initLocal();
  return backend;
}
