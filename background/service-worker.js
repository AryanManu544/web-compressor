/**
 * background/service-worker.js
 * ──────────────────────────────────────────────────────────────────
 * Extension Lifecycle & Keep-Alive Manager.
 * * In Manifest V3, service workers are aggressively terminated by Chrome 
 * after 30 seconds of inactivity. This script prevents the extension from 
 * falling asleep during heavy WebAssembly/Encoding tasks running in the UI.
 * * Assigned to: Prakhar (Background Architecture)
 * ──────────────────────────────────────────────────────────────────
 */

let keepAliveInterval = null;

// Log when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
    console.log("MACS-FC Extension successfully installed and background worker active.");
});

// Listen for lifecycle triggers from the UI router
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
    if (message.action === 'START_HEAVY_PROCESSING') {
        console.log("[Service Worker] Heavy processing started. Initiating keep-alive protocol...");
        
        // Prakhar's Keep-Alive trick:
        // Calling getPlatformInfo regularly resets the Service Worker termination timer
        if (!keepAliveInterval) {
            keepAliveInterval = setInterval(() => {
                chrome.runtime.getPlatformInfo((info) => {
                    // Silent ping to keep the extension awake
                });
            }, 20000); // 20 seconds is safely under Chrome's 30-second kill threshold
        }
        sendResponse({ status: "Keep-alive active" });
    } 
    
    else if (message.action === 'STOP_HEAVY_PROCESSING') {
        console.log("[Service Worker] Processing complete. Releasing keep-alive.");
        
        if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
            keepAliveInterval = null;
        }
        sendResponse({ status: "Keep-alive deactivated" });
    }

    // Return true to keep the message channel open for async responses
    return true; 
});