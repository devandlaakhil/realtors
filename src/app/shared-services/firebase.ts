import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: 'AIzaSyC_9wXriZy0sZb03Ysg27gWBQu_OPI7ajg',
  authDomain: 'realtors-app-5e09a.firebaseapp.com',
  projectId: 'realtors-app-5e09a',
  storageBucket: 'realtors-app-5e09a.firebasestorage.app',
  messagingSenderId: '823591035398',
  appId: '1:823591035398:web:8227dbe28cc6401fb81987',
  measurementId: 'G-NQBV0076KQ',
};

export const firebaseApp = initializeApp(firebaseConfig);
