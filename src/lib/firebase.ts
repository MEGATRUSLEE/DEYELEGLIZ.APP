
// Import the functions you need from the SDKs you need
import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { 
  getAuth, 
  type Auth,
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  type User
} from "firebase/auth";
import { 
  getFirestore, 
  type Firestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
  GeoPoint,
  query,
  where,
  onSnapshot,
  increment,
  deleteDoc,
  orderBy,
  limit,
  type Timestamp,
  getDocs
} from "firebase/firestore";
import { 
    getStorage, 
    type FirebaseStorage,
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
} from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiZBhEa-UDBpWSck08_m9rMpuXIdYwJ4s",
  authDomain: "deye-legliz-pwa-ywv3l.firebaseapp.com",
  databaseURL: "https://deye-legliz-pwa-ywv3l-default-rtdb.firebaseio.com",
  projectId: "deye-legliz-pwa-ywv3l",
  storageBucket: "deye-legliz-pwa-ywv3l.appspot.com",
  messagingSenderId: "372087064605",
  appId: "1:372087064605:web:4ec837e605973d97851ef4"
};

// Initialize Firebase using a singleton pattern for stability
const app: FirebaseApp = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);
const storage: FirebaseStorage = getStorage(app);


export { 
    app, 
    db, 
    auth, 
    storage, 
    // Auth
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword,
    GoogleAuthProvider,
    signInWithPopup,
    updateProfile,
    RecaptchaVerifier,
    signInWithPhoneNumber,
    // Firestore
    doc,
    setDoc,
    getDoc,
    getDocs,
    updateDoc,
    addDoc,
    collection,
    serverTimestamp,
    GeoPoint,
    query,
    where,
    onSnapshot,
    increment,
    deleteDoc,
    orderBy,
    limit,
    // Storage
    ref,
    uploadBytes,
    getDownloadURL,
    deleteObject
};
export type { User, Firestore, FirebaseStorage, Timestamp };
