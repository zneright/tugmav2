// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyCoHpfd47Uul4D2saRfzZwNRl-UCFWxgno",
    authDomain: "tugma-8514e.firebaseapp.com",
    projectId: "tugma-8514e",
    storageBucket: "tugma-8514e.firebasestorage.app",
    messagingSenderId: "578517024363",
    appId: "1:578517024363:web:b62e0fe3344145b2f4bb2e",
    measurementId: "G-1H99LKNN4D"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);