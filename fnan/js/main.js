// Game entry point - initializes all modules
let game;
let staticNoise;

// Block play on weekdays between 7:30 AM and 2:12 PM Eastern time
function isBlockedSchoolHours() {
    const now = new Date();

    // Get Eastern time parts regardless of the visitor's local timezone
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/New_York',
        weekday: 'short',
        hour: 'numeric',
        minute: 'numeric',
        hour12: false
    }).formatToParts(now);

    const map = {};
    for (const p of parts) map[p.type] = p.value;

    const weekday = map.weekday;      // "Mon", "Tue", ...
    const hour = parseInt(map.hour, 10);
    const minute = parseInt(map.minute, 10);

    const isWeekday = !['Sat', 'Sun'].includes(weekday);
    const minutesNow = hour * 60 + minute;
    const startMinutes = 7 * 60 + 30;   // 7:30 AM
    const endMinutes = 14 * 60 + 12;    // 2:12 PM

    return isWeekday && minutesNow >= startMinutes && minutesNow < endMinutes;
}

function showSchoolHoursBlock() {
    document.title = 'Unavailable';
    document.documentElement.innerHTML = '';
    const style = document.createElement('style');
    style.textContent = `
        html, body {
            margin: 0; padding: 0; height: 100%; background: #000;
            display: flex; align-items: center; justify-content: center;
            font-family: monospace;
        }
        #block-msg {
            color: #ff3b3b; text-align: center; padding: 24px;
            max-width: 600px; font-size: 1.1rem; line-height: 1.6;
        }
    `;
    document.head.appendChild(style);
    const div = document.createElement('div');
    div.id = 'block-msg';
    div.textContent = "This game can't be played during school hours (weekdays, 7:30 AM–2:12 PM Eastern).";
    document.body.appendChild(div);
}

if (isBlockedSchoolHours()) {
    showSchoolHoursBlock();
    throw new Error('Blocked: school hours');
}

// Preload progress tracking
let loadedAssets = 0;
let totalAssets = 0;

// Disable browser defaults to improve game experience
function disableBrowserDefaults() {
    // Disable right-click menu
    document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    }, { capture: true });
    
    // Disable drag
    document.addEventListener('dragstart', (e) => {
        e.preventDefault();
        return false;
    }, { capture: true });
    
    // Disable text selection (double click, long press, etc.)
    document.addEventListener('selectstart', (e) => {
        e.preventDefault();
        return false;
    }, { capture: true });
    
    // Disable copy
    document.addEventListener('copy', (e) => {
        e.preventDefault();
        return false;
    }, { capture: true });
    
    // Disable cut
    document.addEventListener('cut', (e) => {
        e.preventDefault();
        return false;
    }, { capture: true });
    
    // Disable certain keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // Disable Ctrl+A (select all)
        if (e.ctrlKey && e.key === 'a') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+C (copy)
        if (e.ctrlKey && e.key === 'c') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+X (cut)
        if (e.ctrlKey && e.key === 'x') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+S (save)
        if (e.ctrlKey && e.key === 's') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+P (print)
        if (e.ctrlKey && e.key === 'p') {
            e.preventDefault();
            return false;
        }
        // Disable Ctrl+U (view source)
        if (e.ctrlKey && e.key === 'u') {
            e.preventDefault();
            return false;
        }
    }, { capture: true });
    
    // Disable long-press menu on touch devices
    document.addEventListener('touchstart', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false, capture: true });
    
    // Disable pinch-to-zoom
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 1) {
            e.preventDefault();
        }
    }, { passive: false, capture: true });
    
    // Prevent mouse text selection
    document.addEventListener('mousedown', (e) => {
        // Allow button clicks
        if (e.target.tagName === 'BUTTON' || e.target.closest('button')) {
            return true;
        }
        // Block mousedown on other elements (prevents drag-select)
        if (e.detail > 1) { // Double or multi-click
            e.preventDefault();
            return false;
        }
    }, { capture: true });
}

// Update preload progress bar
function updatePreloadProgress(progress) {
    const progressBar = document.getElementById('progress-bar');
    const percentage = document.getElementById('preloader-percentage');
    const titleCoverBar = document.getElementById('title-cover-bar');
    
    if (progressBar && percentage) {
        progressBar.style.width = progress + '%';
        percentage.textContent = Math.round(progress) + '%';
    }
    
    // Shrink the bar from right as loading progresses
    if (titleCoverBar) {
        titleCoverBar.style.width = (100 - progress) + '%';
    }
}

// Preload all game assets
async function preloadGameAssets() {
    const basePath = window.location.pathname.includes('/FNAE-HTML5-1.2.2-fix/') 
        ? '/FNAE-HTML5-1.2.2-fix/' 
        : './';
    
    // Define all assets to preload
    const imagePaths = [
        'assets/images/original.png',
        'assets/images/Cam1.png',
        'assets/images/Cam2.png',
        'assets/images/Cam3.png',
        'assets/images/Cam4.png',
        'assets/images/Cam5.png',
        'assets/images/Cam6.png',
        'assets/images/Cam7.png',
        'assets/images/Cam8.png',
        'assets/images/Cam9.png',
        'assets/images/Cam10.png',
        'assets/images/Cam11.png',
        'assets/images/jump.png',
        'assets/images/menubackground.png',
        'assets/images/cutscene.png',
        'assets/images/fa3.png',
        'assets/images/FNAE-Map-layout.png',
        'assets/images/enemyep1.png',
        'assets/images/ep1.png',
        'assets/images/ep4.png',
        'assets/images/enemyep4.png',
        'assets/images/scaryhawk.png',
        'assets/images/scaryhawking.png',
        'assets/images/scaryep.png',
        'assets/images/scarytrump.png',
        'assets/images/winscreen.png',  // Night 5 win screen
        'assets/images/goldenstephen.png',  // Golden Hawking
        'assets/images/mrstephen.png'
    ];
    
    const soundPaths = [
        'assets/sounds/music.ogg',
        'assets/sounds/music3.ogg',
        'assets/sounds/Static_sound.ogg',
        'assets/sounds/vents.ogg',
        'assets/sounds/jumpcare.ogg',
        'assets/sounds/Blip.ogg',
        'assets/sounds/winmusic.ogg',
        'assets/sounds/chimes.ogg',
        'assets/sounds/Crank1.ogg',
        'assets/sounds/Crank2.ogg',
        'assets/sounds/goldenstephenscare.ogg'  // Golden Hawking sound
    ];
    
    totalAssets = imagePaths.length + soundPaths.length;
    loadedAssets = 0;
    
    // Preload images
    const imagePromises = imagePaths.map(path => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                loadedAssets++;
                updatePreloadProgress((loadedAssets / totalAssets) * 100);
                resolve();
            };
            img.onerror = () => {
                console.warn(`Failed to load image: ${path}`);
                loadedAssets++;
                updatePreloadProgress((loadedAssets / totalAssets) * 100);
                resolve();
            };
            img.src = basePath + path;
        });
    });
    
    // Preload audio (non-blocking, fast load)
    const audioPromises = soundPaths.map(path => {
        return new Promise((resolve) => {
            const audio = new Audio();
            audio.addEventListener('canplaythrough', () => {
                loadedAssets++;
                updatePreloadProgress((loadedAssets / totalAssets) * 100);
                resolve();
            }, { once: true });
            audio.addEventListener('error', () => {
                console.warn(`Failed to load audio: ${path}`);
                loadedAssets++;
                updatePreloadProgress((loadedAssets / totalAssets) * 100);
                resolve();
            }, { once: true });
            audio.src = basePath + path;
            audio.load();
        });
    });
    
    // Wait for all assets to finish loading
    await Promise.all([...imagePromises, ...audioPromises]);
    
    // Ensure progress bar shows 100%
    updatePreloadProgress(100);
    
    // Brief pause so player can see 100%
    await new Promise(resolve => setTimeout(resolve, 500));
}

// Hide preloader
function hidePreloader() {
    const preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('fade-out');
        staticNoise.stop();
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500);
    }
}

// Start after page loads
window.addEventListener('DOMContentLoaded', async () => {
    // Disable browser defaults
    disableBrowserDefaults();
    
    // Start static noise during preloader
    staticNoise = new StaticNoise();
    staticNoise.start();
    
    // Preload all assets
    await preloadGameAssets();
    
    // Preload background images for scary face effect
    preloadBackgrounds();
    
    // Hide preloader
    hidePreloader();
    
    // Initialize game
    game = new Game();
    staticNoise = new StaticNoise();

    // Update Continue button display
    game.updateContinueButton();
    
    const mainMenu = document.getElementById('main-menu');
    
    // Check if launched from external page (autostart param)
    const urlParams = new URLSearchParams(window.location.search);
    const autostart = urlParams.get('autostart');
    
    // Start menu music
    const menuMusic = document.getElementById('menu-music');
    if (menuMusic) {
        menuMusic.volume = 0.5;
        
        if (autostart === '1') {
            menuMusic.play().catch(e => {
                setupManualPlayback();
            });
        } else {
            setupManualPlayback();
        }
        
        function setupManualPlayback() {
            const playMusic = () => {
                // Only play if main menu is still visible at the time of the click
                requestAnimationFrame(() => {
                    if (mainMenu && !mainMenu.classList.contains('hidden')) {
                        menuMusic.play().catch(e => {});
                    }
                });
                document.removeEventListener('click', playMusic);
                document.removeEventListener('keydown', playMusic);
            };
            
            document.addEventListener('click', playMusic);
            document.addEventListener('keydown', playMusic);
        }
    }
    
    // Watch for main menu show/hide to control static and flicker effects
    const observer = new MutationObserver(() => {
        if (mainMenu && !mainMenu.classList.contains('hidden')) {
            startScaryFaceFlicker();
            staticNoise.start();
        } else {
            stopScaryFaceFlicker();
            staticNoise.stop();
        }
    });
    
    if (mainMenu) {
        observer.observe(mainMenu, { attributes: true, attributeFilter: ['class'] });
        
        if (!mainMenu.classList.contains('hidden')) {
            startScaryFaceFlicker();
            staticNoise.start();
        }
    }
});

// Listen for messages from parent page (iframe communication)
window.addEventListener('message', (event) => {
    if (event.data.type === 'USER_CLICKED_PLAY') {
        const menuMusic = document.getElementById('menu-music');
        if (menuMusic) {
            menuMusic.volume = 0.5;
            menuMusic.play().catch(e => {});
        }
    }
});
