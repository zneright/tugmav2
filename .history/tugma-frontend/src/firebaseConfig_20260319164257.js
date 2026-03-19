import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCoHpfd47Uul4D2saRfzZwNRl-UCFWxgno",
    authDomain: "tugma-8514e.firebaseapp.com",
    projectId: "tugma-8514e",
    storageBucket: "tugma-8514e.firebasestorage.app",
    messagingSenderId: "578517024363",
    appId: "1:578517024363:web:b62e0fe3344145b2f4bb2e",
    measurementId: "G-1H99LKNN4D"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the social providers!
export const googleProvider = new GoogleAuthProvider();