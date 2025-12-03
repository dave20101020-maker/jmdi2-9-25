/**
 * ═══════════════════════════════════════════════════════════════════════════
 * PWA Configuration - Progressive Web App Support
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Enables offline functionality, install prompts, caching strategy
 * Works on iOS (Safari) and Android (Chrome) with home screen installation
 */

// public/manifest.json - Update with full PWA configuration
{
  "name": "NorthStar - AI Wellness Coach",
  "short_name": "NorthStar",
  "description": "Personalized AI wellness coaching across 8 life pillars",
  "start_url": "/",
  "scope": "/",
  "display": "standalone",
  "orientation": "portrait-primary",
  "background_color": "#ffffff",
  "theme_color": "#3B82F6",
  "icons": [
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icons/icon-192x192-maskable.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/screenshot-1.png",
      "sizes": "540x720",
      "type": "image/png",
      "form_factor": "narrow"
    },
    {
      "src": "/screenshots/screenshot-2.png",
      "sizes": "1280x720",
      "type": "image/png",
      "form_factor": "wide"
    }
  ],
  "categories": ["health", "productivity"],
  "shortcuts": [
    {
      "name": "Daily Checkin",
      "short_name": "Checkin",
      "description": "Quick daily wellness checkin",
      "url": "/checkin?mode=quick",
      "icons": [{ "src": "/icons/checkin-192.png", "sizes": "192x192" }]
    },
    {
      "name": "View Dashboard",
      "short_name": "Dashboard",
      "description": "See your wellness overview",
      "url": "/dashboard",
      "icons": [{ "src": "/icons/dashboard-192.png", "sizes": "192x192" }]
    }
  ],
  "share_target": {
    "action": "/share",
    "method": "POST",
    "enctype": "multipart/form-data",
    "params": {
      "title": "title",
      "text": "text",
      "url": "url"
    }
  }
}

// src/serviceWorker.js - Service worker with caching strategy
const CACHE_NAME = 'northstar-v1';
const RUNTIME_CACHE = 'northstar-runtime-v1';
const API_CACHE = 'northstar-api-v1';

const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/manifest.json',
  '/styles/main.css',
  '/js/main.js'
];

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('Caching assets for offline');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (![CACHE_NAME, RUNTIME_CACHE, API_CACHE].includes(cacheName)) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // API requests: network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          if (response.ok) {
            const cache = caches.open(API_CACHE);
            cache.then((c) => c.put(request, response.clone()));
          }
          return response;
        })
        .catch(() => {
          // Offline: return cached response
          return caches.match(request).then((cached) => {
            return cached || new Response('Offline - cached data unavailable', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        })
    );
  }
  // HTML/CSS/JS: cache first, network fallback
  else {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          // Cache new responses
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, response.clone());
          });
          return response;
        });
      })
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-habits') {
    event.waitUntil(syncHabits());
  } else if (event.tag === 'sync-ai-responses') {
    event.waitUntil(syncAIResponses());
  }
});

async function syncHabits() {
  try {
    const db = await openDB('northstar');
    const pendingHabits = await db.getAll('pendingHabits');
    
    for (const habit of pendingHabits) {
      const response = await fetch('/api/habits/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(habit)
      });
      
      if (response.ok) {
        await db.delete('pendingHabits', habit.id);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  const options = {
    body: event.data?.text() || 'NorthStar notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'northstar-notification',
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification('NorthStar', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (let client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// React component for PWA install prompt
import React, { useEffect, useState } from 'react';

export const PWAInstallPrompt = () => {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const { outcome } = await installPrompt.userChoice;
      console.log(`User response to install prompt: ${outcome}`);
      setShowPrompt(false);
      setInstallPrompt(null);
    }
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 bg-blue-500 text-white p-4 rounded-lg shadow-lg z-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold">Install NorthStar</h3>
          <p className="text-sm">Add to your home screen for quick access</p>
        </div>
        <button
          onClick={handleInstall}
          className="bg-white text-blue-500 px-4 py-2 rounded font-bold hover:bg-gray-100"
        >
          Install
        </button>
      </div>
    </div>
  );
};

// Register service worker
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/serviceWorker.js')
        .then((registration) => {
          console.log('Service Worker registered:', registration);
        })
        .catch((error) => {
          console.error('Service Worker registration failed:', error);
        });
    });
  }
};

export default {
  registerServiceWorker,
  PWAInstallPrompt,
};
