importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBxypdLXBXs8g6G87-b_W5A2UI-DL_40qA",
  authDomain: "studio-8414277475-82477.firebaseapp.com",
  projectId: "studio-8414277475-82477",
  storageBucket: "studio-8414277475-82477.firebasestorage.app",
  messagingSenderId: "841306847068",
  appId: "1:841306847068:web:14649e913ef75fa24cb399"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png'
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
