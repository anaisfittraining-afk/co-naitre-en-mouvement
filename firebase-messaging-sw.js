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
    icon: d.icon || 'icon-192.png', badge: 'icon-192.png', tag: d.tag || 'message', renotify: true, silent: false, vibrate: [200, 100, 200, 100, 200],
    data: { url: d.url || self.registration.scope }
  }).then(function() { return badgeBump(); }).then(function(n) {
    if (self.navigator && self.navigator.setAppBadge) return self.navigator.setAppBadge(n);
  }).catch(function() {});
});
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  var target = new URL((event.notification.data && event.notification.data.url) || self.registration.scope, self.registration.scope).href;
  var base = function(u) { return String(u).split('#')[0].split('?')[0]; };
  event.waitUntil(clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(list) {
    var i;
    // 1) la page demandée est déjà ouverte : on la montre
    for (i = 0; i < list.length; i++) { if (base(list[i].url) === base(target) && 'focus' in list[i]) return list[i].focus(); }
    // 2) une autre page de l'appli est ouverte : on la fait aller sur la page demandée
    for (i = 0; i < list.length; i++) {
      if (list[i].url.indexOf(self.registration.scope) === 0 && 'focus' in list[i]) {
        return list[i].focus().then(function(w) { return (w && w.navigate) ? w.navigate(target) : clients.openWindow(target); }).catch(function() { return clients.openWindow(target); });
      }
    }
    return clients.openWindow(target);
  }));
});
