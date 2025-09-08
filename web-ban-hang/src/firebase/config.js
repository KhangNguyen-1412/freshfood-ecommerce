// src/firebase/config.js

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Cấu hình Firebase của bạn
const firebaseConfig = {
  apiKey: "AIzaSyBUDgZxTdJt7-1PLOpRP6UrP0DvBDZawnM",
  authDomain: "qlwebbhtp.firebaseapp.com",
  projectId: "qlwebbhtp",
  storageBucket: "qlwebbhtp.appspot.com",
  messagingSenderId: "286804686984",
  appId: "1:286804686984:web:dcc6083336be4c17f6073d",
  measurementId: "G-VPSY49QQX3",
};

// Khởi tạo ứng dụng Firebase
const app = initializeApp(firebaseConfig);

// Khởi tạo các dịch vụ và export ra ngoài
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
