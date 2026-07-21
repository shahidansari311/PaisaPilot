import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDD_o6XmgRiOsge_DvZTqKSNdvsoo3UBZM",
  authDomain: "paisapilot-3f362.firebaseapp.com",
  databaseURL: "https://paisapilot-3f362-default-rtdb.firebaseio.com",
  projectId: "paisapilot-3f362",
  storageBucket: "paisapilot-3f362.firebasestorage.app",
  messagingSenderId: "987201474849",
  appId: "1:987201474849:web:1d10f3ecee424aa996ae60",
  measurementId: "G-K6PHJRTTH3",
};

const app = initializeApp(firebaseConfig);
export const firebaseDB = getDatabase(app);
