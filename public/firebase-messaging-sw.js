// public/firebase-messaging-sw.js
// Este service worker es esencial para recibir notificaciones en segundo plano.

// Importar los scripts de Firebase (se usa la versión de compatibilidad para service workers)
importScripts(
  "https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.22.1/firebase-messaging-compat.js"
);

// TODO: Reemplaza esto con la configuración de tu proyecto de Firebase.
// ¡Debe ser la misma configuración que usas en tu app de React!
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Inicializar la app de Firebase en el service worker
firebase.initializeApp(firebaseConfig);

// Obtener una instancia de Firebase Messaging para manejar los mensajes en segundo plano
const messaging = firebase.messaging();

// Opcional: Puedes agregar un listener para `onBackgroundMessage` si quieres
// personalizar cómo se muestran las notificaciones recibidas en segundo plano.
// Si no lo agregas, Firebase mostrará la notificación por defecto.
/* messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Mensaje recibido en segundo plano: ",
    payload
  );

  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
}); */
