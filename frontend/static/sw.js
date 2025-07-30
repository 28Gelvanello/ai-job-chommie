/**
 * AI Job Chommie PWA Service Worker
 * Provides offline functionality, caching, and background sync
 * Version: 2.0.0
 */

const CACHE_NAME = 'ai-job-chommie-v2.0.0';
const OFFLINE_URL = '/offline.html';
const API_CACHE_NAME = 'ai-job-chommie-api-v2.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
    '/',
    '/index.html',
    '/offline.html',
    '/manifest.json',
    '/logo.png',
    '/professional-styles.css',
    '/api.js',
    '/payments.js',
    '/js/app.js',
    '/js/auth.js',
    '/js/threejs-background.js',
    '/js/ui-components.js',
    // Add critical CSS and JS inline in index.html to reduce network requests
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Exo+2:wght@300;400;600;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'
];

// API endpoints to cache
const API_CACHE_URLS = [
    '/api/health',
    '/api/status',
    '/api/auth/me'
];

// Background sync tags
const SYNC_TAGS = {
    APPLY_JOB: 'apply-job',
    UPDATE_PROFILE: 'update-profile',
    SEARCH_JOBS: 'search-jobs'
};

/**
 * Service Worker Installation
 */
self.addEventListener('install', event => {
    console.log('🚀 AI Job Chommie SW: Installing...');
    
    event.waitUntil(
        Promise.all([
            // Cache static files
            caches.open(CACHE_NAME).then(cache => {
                console.log('📦 SW: Caching static files');
                return cache.addAll(STATIC_CACHE_URLS);
            }),
            // Cache API responses
            caches.open(API_CACHE_NAME).then(cache => {
                console.log('🔌 SW: Setting up API cache');
                return Promise.resolve();
            }),
            // Skip waiting to activate immediately
            self.skipWaiting()
        ])
    );
});

/**
 * Service Worker Activation
 */
self.addEventListener('activate', event => {
    console.log('✅ AI Job Chommie SW: Activating...');
    
    event.waitUntil(
        Promise.all([
            // Clean up old caches
            caches.keys().then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
                            console.log('🗑️ SW: Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }),
            // Take control of all clients
            self.clients.claim()
        ])
    );
});

/**
 * Fetch Event Handler - Network-first with cache fallback
 */
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests for caching
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle static file requests
    event.respondWith(handleStaticRequest(request));
});

/**
 * Handle API Requests with caching strategy
 */
async function handleApiRequest(request) {
    const url = new URL(request.url);
    const isHealthCheck = url.pathname === '/api/health' || url.pathname === '/api/status';
    
    try {
        // For health checks and critical APIs, try network first
        if (isHealthCheck) {
            const networkResponse = await fetch(request.clone());
            
            if (networkResponse.ok) {
                // Cache successful responses
                const cache = await caches.open(API_CACHE_NAME);
                cache.put(request, networkResponse.clone());
            }
            
            return networkResponse;
        }
        
        // For other APIs, try network with quick timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
        
        const networkResponse = await fetch(request.clone(), {
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (networkResponse.ok) {
            // Cache successful API responses
            const cache = await caches.open(API_CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('🔌 SW: Network failed for API, trying cache:', request.url);
        
        // Try to get from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('📦 SW: Serving API from cache:', request.url);
            return cachedResponse;
        }
        
        // Return offline response for failed API calls
        return new Response(
            JSON.stringify({
                error: 'Offline',
                message: 'You are currently offline. Some features may not be available.',
                cached: false
            }),
            {
                status: 503,
                statusText: 'Service Unavailable',
                headers: {
                    'Content-Type': 'application/json'
                }
            }
        );
    }
}

/**
 * Handle Static File Requests
 */
async function handleStaticRequest(request) {
    try {
        // Try network first for fresh content
        const networkResponse = await fetch(request);
        
        if (networkResponse.ok) {
            // Cache successful responses
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
        
    } catch (error) {
        console.log('📦 SW: Network failed, trying cache:', request.url);
        
        // Try to get from cache
        const cachedResponse = await caches.match(request);
        if (cachedResponse) {
            console.log('✅ SW: Serving from cache:', request.url);
            return cachedResponse;
        }
        
        // For navigation requests, serve the offline page
        if (request.mode === 'navigate') {
            console.log('🔌 SW: Serving offline page');
            return caches.match(OFFLINE_URL) || caches.match('/offline.html');
        }
        
        // For other requests, return a generic offline response
        return new Response('Offline - Content not available', {
            status: 503,
            statusText: 'Service Unavailable'
        });
    }
}

/**
 * Background Sync for offline actions
 */
self.addEventListener('sync', event => {
    console.log('🔄 SW: Background sync triggered:', event.tag);
    
    switch (event.tag) {
        case SYNC_TAGS.APPLY_JOB:
            event.waitUntil(syncJobApplications());
            break;
        case SYNC_TAGS.UPDATE_PROFILE:
            event.waitUntil(syncProfileUpdates());
            break;
        case SYNC_TAGS.SEARCH_JOBS:
            event.waitUntil(syncJobSearches());
            break;
        default:
            console.log('⚠️ SW: Unknown sync tag:', event.tag);
    }
});

/**
 * Sync pending job applications
 */
async function syncJobApplications() {
    try {
        console.log('💼 SW: Syncing job applications...');
        
        // Get pending applications from IndexedDB or localStorage
        const pendingApplications = await getPendingApplications();
        
        for (const application of pendingApplications) {
            try {
                const response = await fetch('/api/jobs/apply', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(application)
                });
                
                if (response.ok) {
                    console.log('✅ SW: Job application synced:', application.jobId);
                    await removePendingApplication(application.id);
                    
                    // Notify user of successful sync
                    await showNotification('Job application sent successfully!', {
                        icon: '/logo.png',
                        badge: '/logo.png',
                        tag: 'job-application-success'
                    });
                }
            } catch (error) {
                console.error('❌ SW: Failed to sync application:', error);
            }
        }
    } catch (error) {
        console.error('❌ SW: Background sync failed:', error);
    }
}

/**
 * Sync profile updates
 */
async function syncProfileUpdates() {
    try {
        console.log('👤 SW: Syncing profile updates...');
        
        const pendingUpdates = await getPendingProfileUpdates();
        
        for (const update of pendingUpdates) {
            try {
                const response = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(update.data)
                });
                
                if (response.ok) {
                    console.log('✅ SW: Profile update synced');
                    await removePendingProfileUpdate(update.id);
                }
            } catch (error) {
                console.error('❌ SW: Failed to sync profile update:', error);
            }
        }
    } catch (error) {
        console.error('❌ SW: Profile sync failed:', error);
    }
}

/**
 * Sync job searches
 */
async function syncJobSearches() {
    try {
        console.log('🔍 SW: Syncing job searches...');
        
        const pendingSearches = await getPendingJobSearches();
        
        for (const search of pendingSearches) {
            try {
                const response = await fetch('/api/jobs/search', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(search.params)
                });
                
                if (response.ok) {
                    console.log('✅ SW: Job search synced');
                    await removePendingJobSearch(search.id);
                    
                    const data = await response.json();
                    if (data.jobs && data.jobs.length > 0) {
                        await showNotification(`Found ${data.jobs.length} new job matches!`, {
                            icon: '/logo.png',
                            badge: '/logo.png',
                            tag: 'job-search-results'
                        });
                    }
                }
            } catch (error) {
                console.error('❌ SW: Failed to sync job search:', error);
            }
        }
    } catch (error) {
        console.error('❌ SW: Job search sync failed:', error);
    }
}

/**
 * Push Notification Handler
 */
self.addEventListener('push', event => {
    console.log('🔔 SW: Push notification received');
    
    const options = {
        body: 'Check out new job opportunities!',
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'View Jobs',
                icon: '/logo.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/logo.png'
            }
        ]
    };
    
    if (event.data) {
        const pushData = event.data.json();
        options.body = pushData.body || options.body;
        options.data = { ...options.data, ...pushData.data };
    }
    
    event.waitUntil(
        self.registration.showNotification('AI Job Chommie', options)
    );
});

/**
 * Notification Click Handler
 */
self.addEventListener('notificationclick', event => {
    console.log('🔔 SW: Notification clicked:', event.action);
    
    event.notification.close();
    
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then(clientList => {
            // If app is already open, focus it
            for (const client of clientList) {
                if (client.url === self.location.origin && 'focus' in client) {
                    return client.focus();
                }
            }
            
            // Otherwise, open new window
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});

/**
 * Helper Functions for IndexedDB operations
 */

async function getPendingApplications() {
    // Implementation for getting pending applications from IndexedDB
    // This would integrate with your app's offline storage
    return [];
}

async function removePendingApplication(id) {
    // Implementation for removing synced application
    return Promise.resolve();
}

async function getPendingProfileUpdates() {
    return [];
}

async function removePendingProfileUpdate(id) {
    return Promise.resolve();
}

async function getPendingJobSearches() {
    return [];
}

async function removePendingJobSearch(id) {
    return Promise.resolve();
}

async function showNotification(title, options = {}) {
    try {
        await self.registration.showNotification(title, {
            icon: '/logo.png',
            badge: '/logo.png',
            ...options
        });
    } catch (error) {
        console.error('❌ SW: Failed to show notification:', error);
    }
}

/**
 * Cache Management
 */
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(CACHE_NAME).then(cache => {
                return cache.addAll(event.data.urls);
            })
        );
    }
    
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            Promise.all([
                caches.delete(CACHE_NAME),
                caches.delete(API_CACHE_NAME)
            ]).then(() => {
                console.log('🗑️ SW: All caches cleared');
            })
        );
    }
});



console.log('🤖 AI Job Chommie Service Worker v2.0.0 loaded successfully!'); 