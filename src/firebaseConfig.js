// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries
const firebaseConfig = {
  apiKey: "AIzaSyAjACFIg1Y-qFGciwP02dUJWjCEYHsa7lI",
  authDomain: "proyojon-313ba.firebaseapp.com",
  projectId: "proyojon-313ba",
  storageBucket: "proyojon-313ba.firebasestorage.app",
  messagingSenderId: "525068306799",
  appId: "1:525068306799:web:194e07b2bc347d0273409a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth=getAuth(app);
const db=getFirestore(app);
const storage=getStorage(app);

export{auth,db,storage};