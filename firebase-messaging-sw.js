// Service worker des notifications (Firebase Cloud Messaging) — co-NAÎTRE en mouvement
// À poser à côté de reservation.html, avec ce nom exact : firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.13.0/firebase-app-compat.js', 'https://www.gstatic.com/firebasejs/10.13.0/firebase-messaging-compat.js');
firebase.initializeApp({
  apiKey: "AIzaSyC9BmsyRf2MY7qxRO7bL1wRhkJuig0IcLQ",
  authDomain: "cooperation-familiale.firebaseapp.com",
  projectId: "cooperation-familiale",
  storageBucket: "cooperation-familiale.firebasestorage.app",
  messagingSenderId: "527954161214",
  appId: "1:527954161214:web:e3297a3109523e9fa1ab6f"
});
var messaging = firebase.messaging();
// Les messages sont envoyés en « data » seulement : c'est ici qu'on écrit la notification, avec un texte volontairement
// neutre (jamais le contenu du message : il s'affiche sur l'écran verrouillé).
// Petit chiffre sur l'icône de l'appli (« badge ») : on compte les messages reçus tant que l'appli n'a pas été ouverte.
// Le compteur est gardé dans le cache du navigateur (le service worker n'a pas de localStorage) ; l'appli le remet à zéro à l'ouverture.
// Cache distinct de celui de Mon espace co-NAÎTRE (même adresse de base sur GitHub Pages).
function badgeBump() {
  return caches.open('mouv-badge').then(function(c) {
    return c.match('badge-count').then(function(r) { return r ? r.text() : '0'; }).then(function(t) {
      var n = (parseInt(t, 10) || 0) + 1;
      return c.put('badge-count', new Response(String(n))).then(function() { return n; });
    });
  });
}
messaging.onBackgroundMessage(function(payload) {
  var d = (payload && payload.data) || {};
  return self.registration.showNotification(d.title || 'co-NAÎTRE en mouvement', {
    body: d.body || 'Tu as un nouveau message.',
    icon: 'icon-192.png', badge: 'icon-192.png', tag: d.tag || 'message', renotify: true, silent: false, vibrate: [200, 100, 200, 100, 200],
    data: { url: d.url || self.registration.scope }
  }).then(function() { return badgeBump(); }).then(function(n) {
    if (self.navigator && self.navigator.setAppBadge) return self.navigator.setAppBadge(n);
  }).catch(function() {});
});
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var url = (event.notification.data && event.notification.data.url) || self.registration.scope;
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
    for (var i = 0; i < list.length; i++) { if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) return list[i].focus(); }
    return clients.openWindow(url);
  }));
});
