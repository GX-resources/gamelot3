// Camera system management
class CameraSystem {
    constructor(game) {
        this.game = game;
        this.codyTriggeredThisRun = false;
        this.cameraPanel = document.getElementById('camera-panel');
        this.currentCamLabel = document.getElementById('current-cam-label');
        this.cameraErrorLabel = document.getElementById('camera-error-label');
        this.playSoundBtn = document.getElementById('play-sound-btn');
        this.shockHawkingBtn = document.getElementById('shock-hawking-btn');
        this.currentSoundToggle = false;
        this.staticVideo = document.getElementById('camera-static-video');
        
        // Sound button state
        this.soundButtonCooldown = false;
        this.soundButtonUseCount = 0;
        this.maxSoundUses = 5; // Camera fails after 5 consecutive uses
        this.cooldownTime = 8000; // 8 second cooldown
        this.cooldownInterval = null; // Cooldown animation timer
        
        // Consecutive attract count per location
        this.locationAttractCount = {}; // { 'cam11': 2, 'cam8': 1, ... }
        this.maxLocationAttractCount = 2; // Max 2 consecutive attracts at same location
        this.lastEpLocation = null; // Track EP's previous location to detect movement
        
        // EP character config - references EnemyAI config (set after game init)
        this.characterImages = null;
        this.characterPositions = null;
        this.characterBrightness = null;
        this.characterRotation = null;
        
        this.bindEvents();
    }
    
    // Initialize EP config (from EnemyAI)
    initEPConfig() {
        if (this.game.enemyAI) {
            this.characterImages = this.game.enemyAI.characterImages;
            this.characterPositions = this.game.enemyAI.characterPositions;
            this.characterBrightness = this.game.enemyAI.characterBrightness;
            this.characterRotation = this.game.enemyAI.characterRotation;
            console.log('EP config initialized from EnemyAI');
        }
    }

    bindEvents() {
        if (this.playSoundBtn) {
            this.playSoundBtn.addEventListener('click', () => this.playAmbientSound());
        }
        if (this.shockHawkingBtn) {
            this.shockHawkingBtn.addEventListener('click', () => this.shockHawking());
        }
    }

    toggle() {
        // console.log('📷 Camera toggle called, current state:', this.game.state.cameraOpen);
        if (this.game.state.cameraOpen) {
            this.close();
        } else {
            this.open();
        }
    }

    open() {
        // console.log('📷 Opening camera...');
        // console.log('📷 Camera panel element:', this.cameraPanel);
        // console.log('📷 Camera panel classes before:', this.cameraPanel.className);
        
        this.game.state.cameraOpen = true;
        this.cameraPanel.classList.remove('hidden');
        this.cameraPanel.classList.add('show');

        // Check for Cody easter egg (3 fails in a row, first camera open, never seen before)
        if (!localStorage.getItem('fnae_cody_seen')) {
            const failStreak = parseInt(localStorage.getItem('fnae_fail_streak') || '0');
            const lastFailNight = parseInt(localStorage.getItem('fnae_last_fail_night') || '0');
            if (failStreak >= 3 && lastFailNight === this.game.state.currentNight && !this.codyTriggeredThisRun) {
                this.codyTriggeredThisRun = true;
                // Slight delay so camera opens first, then hijacks
                setTimeout(() => this.game.triggerCodyEasterEgg(), 100);
                return;
            }
        }

        this.game.tryShowDylan();
        
        // console.log('📷 Camera panel classes after:', this.cameraPanel.className);
        // console.log('📷 Camera panel display:', window.getComputedStyle(this.cameraPanel).display);
        // console.log('📷 Camera panel opacity:', window.getComputedStyle(this.cameraPanel).opacity);
        // console.log('📷 Camera panel transform:', window.getComputedStyle(this.cameraPanel).transform);
        
        this.game.assets.playSound('crank1');
        
        // Start looping low volume static sound
        this.game.assets.playSound('staticLoop', true, 0.3);
        
        this.createCameraGrid();
        
        // Update shock button display
        this.updateShockButtonVisibility();
        
        // Update Hawking warning position (from fan left to map)
        if (this.game.enemyAI && this.game.enemyAI.hawking.active) {
            this.game.enemyAI.updateHawkingWarningDisplay();
        }
        
        // If camera failed, show failure effect
        if (this.game.state.cameraFailed) {
            console.log('📷 Camera is failed, showing failure effect');
            this.showCameraFailure();
        } else {
            console.log('📷 Camera is normal, showing normal view');
            // Normal state, ensure all failure effects removed
            this.cameraPanel.classList.remove('transitioning');
            
            // Hide ERR label
            if (this.cameraErrorLabel) {
                this.cameraErrorLabel.classList.remove('active');
            }
            
            // Stop static
            this.stopStatic();
            
            // Show map
            const cameraGrid = document.getElementById('camera-grid');
            if (cameraGrid) {
                cameraGrid.style.display = 'block';
            }
            
            // Update view
            this.updateView();
        }
        
        // Stop view rotation
        this.game.isRotatingLeft = false;
        this.game.isRotatingRight = false;
    }
    
    // Show camera failure effect
    showCameraFailure() {
        console.log('Showing camera failure effect...');
        
        // Night 5: 30% chance to trigger Golden Hawking easter egg
        if (this.game.state.currentNight === 5 && Math.random() < 0.3) {
            this.game.showGoldenStephen();
        }
        
        // Hide background image and characters
        this.cameraPanel.classList.add('transitioning');
        
        // Hide map
        const cameraGrid = document.getElementById('camera-grid');
        if (cameraGrid) {
            cameraGrid.style.display = 'none';
            console.log('Camera grid hidden');
        }
        
        // Show ERR label
        if (this.cameraErrorLabel) {
            this.cameraErrorLabel.classList.add('active');
            console.log('ERR label shown');
        }
        
        // Show and play static video
        if (this.staticVideo) {
            console.log('Starting static video...');
            this.staticVideo.classList.add('active');
            this.staticVideo.currentTime = 0; // Play from beginning
            this.staticVideo.play().catch(e => console.log('Video playback failed:', e));
        } else {
            console.error('Static video element not found!');
        }
    }
    
    // Stop static effect
    stopStatic() {
        if (this.staticVideo) {
            this.staticVideo.classList.remove('active');
            this.staticVideo.pause();
            this.staticVideo.currentTime = 0;
        }
    }
    
    // Start static effect (for switching cameras)
    startStatic() {
        if (this.staticVideo) {
            this.staticVideo.classList.add('active');
            this.staticVideo.play().catch(e => console.log('Video playback failed:', e));
        }
    }
    
    // Restore camera normal display
    restoreCameraView() {
        console.log('Restoring camera view...');
        
        // Stop static
        this.stopStatic();
        console.log('Static video stopped');
        
        // Remove failure state
        this.cameraPanel.classList.remove('transitioning');
        console.log('Removed transitioning class');
        
        // Hide ERR label
        if (this.cameraErrorLabel) {
            this.cameraErrorLabel.classList.remove('active');
            console.log('ERR label hidden');
        }
        
        // Show map
        const cameraGrid = document.getElementById('camera-grid');
        if (cameraGrid) {
            cameraGrid.style.display = 'block';
            console.log('Camera grid shown');
        }
        
        // Update view
        this.updateView();
        console.log('View updated');
    }
    
    // Fix camera
    restartCamera() {
        // If control panel is busy, block action
        if (this.game.state.controlPanelBusy) {
            console.log('Control panel is busy, cannot restart camera');
            return;
        }
        
        console.log('Restarting camera system...');
        this.game.state.cameraRestarting = true;
        this.game.state.controlPanelBusy = true; // Lock control panel
        
        // Play EKG sound
        this.game.assets.playSound('ekg', false, 0.8);
        
        // Restore after 4 seconds
        setTimeout(() => {
            // Always restore normal state after restart
            this.game.state.cameraFailed = false;
            this.game.state.cameraRestarting = false;
            this.game.state.controlPanelBusy = false; // Unlock control panel
            
            // Stop static noise (if playing)
            this.game.assets.stopSound('static');
            
            // Reset sound button use count (restore 5 uses)
            this.resetSoundButtonCount();
            
            console.log('Camera system restored!');
            
            // If camera is open, immediately restore display
            if (this.game.state.cameraOpen) {
                console.log('Camera is open, restoring view...');
                this.restoreCameraView();
            }
        }, 4000);
    }

    close() {
        this.game.state.cameraOpen = false;
        this.cameraPanel.classList.add('closing');
        this.cameraPanel.classList.remove('show');
        
        // Stop looping static sound
        this.game.assets.stopSound('staticLoop');
        
        // Clear character display
        const characterOverlay = document.getElementById('character-overlay');
        if (characterOverlay) {
            characterOverlay.innerHTML = '';
            console.log('Character overlay cleared');
        }
        
        // Update Hawking warning position (from map to fan left)
        if (this.game.enemyAI && this.game.enemyAI.hawking.active) {
            this.game.enemyAI.updateHawkingWarningDisplay();
        }
        
        setTimeout(() => {
            this.cameraPanel.classList.add('hidden');
            this.cameraPanel.classList.remove('closing');
        }, 400);
        
        this.game.assets.playSound('crank2');
    }

    switchCamera(camNum) {
        // If camera failed, cannot switch
        if (this.game.state.cameraFailed) {
            console.log('Camera system is offline! Cannot switch cameras.');
            return;
        }
        
        // Add transition state, hide background image
        this.cameraPanel.classList.add('transitioning');
        
        // Hide map
        const cameraGrid = document.getElementById('camera-grid');
        if (cameraGrid) {
            cameraGrid.style.display = 'none';
        }
        
        // Hide characters
        const characterOverlay = document.getElementById('character-overlay');
        if (characterOverlay) {
            characterOverlay.style.display = 'none';
        }
        
        // Temporarily lower looping static volume
        this.game.assets.setSoundVolume('staticLoop', 0.1);
        
        // Play static at normal volume
        this.game.assets.playSound('static', false, 1.0);
        
        // Stop static sound after 1000ms
        setTimeout(() => {
            this.game.assets.stopSound('static');
        }, 1000);
        
        // Show static effect
        this.startStatic();
        
        // Switch camera after 500ms
        setTimeout(() => {
            // If camera already failed, stop switch animation, show failure effect
            if (this.game.state.cameraFailed) {
                console.log('Camera failed during switch, showing failure effect');
                this.showCameraFailure();
                return;
            }
            
            this.game.state.currentCam = `cam${camNum}`;
            this.updateView();
            this.createCameraGrid();
            
            // After another 500ms fade out static, restore background
            setTimeout(() => {
                // Check again if failed
                if (this.game.state.cameraFailed) {
                    console.log('Camera failed during switch, showing failure effect');
                    this.showCameraFailure();
                    return;
                }
                
                this.stopStatic();
                this.cameraPanel.classList.remove('transitioning');
                
                // Show map
                if (cameraGrid) {
                    cameraGrid.style.display = 'block';
                }
                
                // Show characters
                if (characterOverlay) {
                    characterOverlay.style.display = 'block';
                }
                
                // Update shock button display (based on current cam)
                this.updateShockButtonVisibility();
                
                // Restore looping static volume
                this.game.assets.setSoundVolume('staticLoop', 0.3);
            }, 500);
        }, 500);
    }

    updateView() {
        // If camera failed, don't update view
        if (this.game.state.cameraFailed) {
            return;
        }
        
        // Update camera panel background image
        if (this.game.assets.images[this.game.state.currentCam]) {
            this.cameraPanel.style.backgroundImage = `url('${this.game.assets.images[this.game.state.currentCam].src}')`;
        }
        
        // Update camera label
        const camNum = this.game.state.currentCam.replace('cam', '');
        this.currentCamLabel.textContent = `CAM ${camNum}`;
        
        // Update character display
        this.updateCharacterDisplay();
        
        // Update shock button display
        this.updateShockButtonVisibility();
    }
    
    // Update character display (supports multiple enemies)
    updateCharacterDisplay() {
        const currentCam = this.game.state.currentCam;
        const epLocation = this.game.enemyAI.getCurrentLocation();
        const trumpLocation = this.game.enemyAI.getTrumpCurrentLocation();
        const hawkingActive = this.game.enemyAI.hawking.active;
        
        console.log(`updateCharacterDisplay - Current Cam: ${currentCam}, EP: ${epLocation}, Trump: ${trumpLocation}, Hawking: ${hawkingActive}, Night: ${this.game.state.currentNight}`);
        
        // Log z-index of all relevant elements
        console.log('🔍 Z-Index Debug:');
        console.log('  - cameraPanel:', window.getComputedStyle(this.cameraPanel).zIndex);
        const staticVideo = document.getElementById('camera-static-video');
        if (staticVideo) {
            console.log('  - staticVideo:', window.getComputedStyle(staticVideo).zIndex);
        }
        const existingOverlay = document.getElementById('character-overlay');
        if (existingOverlay) {
            console.log('  - characterOverlay:', window.getComputedStyle(existingOverlay).zIndex);
            console.log('  - characterOverlay display:', window.getComputedStyle(existingOverlay).display);
            console.log('  - characterOverlay children count:', existingOverlay.children.length);
        }
        
        // Get or create character container
        let characterOverlay = document.getElementById('character-overlay');
        if (!characterOverlay) {
            characterOverlay = document.createElement('div');
            characterOverlay.id = 'character-overlay';
            characterOverlay.style.position = 'absolute';
            characterOverlay.style.top = '0';
            characterOverlay.style.left = '0';
            characterOverlay.style.width = '100%';
            characterOverlay.style.height = '100%';
            characterOverlay.style.pointerEvents = 'none';
            characterOverlay.style.zIndex = '5';
            characterOverlay.style.overflow = 'hidden';
            this.cameraPanel.appendChild(characterOverlay);
        }
        
        // Clear previous characters
        characterOverlay.innerHTML = '';
        
        console.log('🔍 Character overlay cleared, checking EP display conditions...');
        console.log('🔍 EP hasSpawned:', this.game.enemyAI.epstein.hasSpawned);
        console.log('🔍 EP location matches current cam:', epLocation === currentCam);
        console.log('🔍 Has characterImages:', !!this.characterImages);
        console.log('🔍 Has image for current cam:', this.characterImages ? !!this.characterImages[currentCam] : 'N/A');
        
  if (hawkingActive && currentCam === 'cam6') {
            const hawkingImg = document.createElement('img');
            hawkingImg.src = 'assets/images/mrstephen.png';
            hawkingImg.style.position = 'absolute';
            hawkingImg.className = 'visible hawking-character';
            hawkingImg.style.zIndex = '3'; // Hawking on top layer
            hawkingImg.style.left = '54.8%';
            hawkingImg.style.bottom = '16.2%';
            hawkingImg.style.width = '23.4%';
            hawkingImg.style.transform = 'translateX(-50%) rotate(-2deg)';
            hawkingImg.style.filter = 'brightness(0.33) contrast(1) saturate(1)';
            
            characterOverlay.appendChild(hawkingImg);
            console.log(`✓ Displaying Hawking at cam6`);
        }
        
        // Show EP (if spawned and on current cam)
        // console.log('🔍 EP Display Check:', {
        //     hasSpawned: this.game.enemyAI.epstein.hasSpawned,
        //     epLocation: epLocation,
        //     currentCam: currentCam,
        //     match: epLocation === currentCam,
        //     hasImage: !!this.characterImages,
        //     imageForCam: this.characterImages ? !!this.characterImages[currentCam] : 'N/A'
        // });
        
        if (this.game.enemyAI.epstein.hasSpawned && epLocation === currentCam && this.characterImages && this.characterImages[currentCam]) {
            // Create EP container (holds EP image and lightning eyes)
            const epContainer = document.createElement('div');
            epContainer.className = 'ep-container';
            epContainer.style.position = 'absolute';
            epContainer.style.zIndex = '1';
            
            const pos = this.characterPositions[currentCam];
            if (pos) {
                if (pos.left) {
                    epContainer.style.left = pos.left;
                    epContainer.style.right = 'auto';
                } else if (pos.right) {
                    epContainer.style.right = pos.right;
                    epContainer.style.left = 'auto';
                }
                
                epContainer.style.bottom = pos.bottom;
                epContainer.style.width = pos.width;
                epContainer.style.transform = pos.transform || 'none';
            }
            
            // EP image
            const epImg = document.createElement('img');
            epImg.src = this.characterImages[currentCam];
            epImg.style.position = 'relative';
            epImg.style.width = '100%';
            epImg.style.height = 'auto';
            epImg.style.display = 'block';
            epImg.className = 'visible ep-character';
            
            // Apply brightness
            const brightness = this.characterBrightness[currentCam] || 100;
            epImg.style.filter = `brightness(${brightness}%)`;
            
            epContainer.appendChild(epImg);
            characterOverlay.appendChild(epContainer);
            console.log(`✓ Displaying EP at ${currentCam}`);
            
            // Night 6: Render lightning eye effect (as child of EP container)
            if (this.game.state.currentNight === 6) {
                this.renderLightningEyes(epContainer, currentCam);
            }
        }
        
        // Show Trump (if spawned, on current cam, not crawling, and trump config exists for this night)
        if (this.game.enemyAI.trump.hasSpawned && !this.game.enemyAI.trump.isCrawling && trumpLocation === currentCam && this.game.enemyAI.currentTrumpConfig) {
            const trumpImages = this.game.enemyAI.trumpImages;
            const trumpPositions = this.game.enemyAI.trumpPositions;
            const trumpBrightness = this.game.enemyAI.trumpBrightness;
            
            if (trumpImages[currentCam]) {
                const trumpImg = document.createElement('img');
                trumpImg.src = trumpImages[currentCam];
                trumpImg.style.position = 'absolute';
                trumpImg.className = 'visible trump-character';
                trumpImg.style.zIndex = (currentCam === 'cam6' || currentCam === 'cam11') ? '0' : '2'; // Behind EP on cam6 and cam11
                
                const pos = trumpPositions[currentCam];
                if (pos) {
                    if (pos.left) {
                        trumpImg.style.left = pos.left;
                        trumpImg.style.right = 'auto';
                    } else if (pos.right) {
                        trumpImg.style.right = pos.right;
                        trumpImg.style.left = 'auto';
                    }
                    
                    trumpImg.style.bottom = pos.bottom;
                    trumpImg.style.width = pos.width;
                    trumpImg.style.transform = pos.transform || 'none';
                }
                
                const brightness = trumpBrightness[currentCam] || 100;
                trumpImg.style.filter = `brightness(${brightness}%)`;
                
                characterOverlay.appendChild(trumpImg);
                console.log(`✓ Displaying Trump at ${currentCam}`);
            }
        }
        
        if (characterOverlay.children.length === 0) {
            console.log(`✗ No characters at current camera (viewing ${currentCam})`);
        }
    }

    createCameraGrid() {
        const grid = document.getElementById('camera-grid');
        grid.innerHTML = '';
        
        // Create map container
        const mapContainer = document.createElement('div');
        mapContainer.style.position = 'relative';
        mapContainer.style.width = '100%';
        mapContainer.style.height = '100%';
        
        // Add map image
        const mapImg = document.createElement('img');
        mapImg.src = 'assets/images/FNAE-Map-layout.png';
        mapImg.style.width = '100%';
        mapImg.style.height = 'auto';
        mapImg.style.display = 'block';
        mapContainer.appendChild(mapImg);
        
        // Add YOU marker (player position)
        const youMarker = document.createElement('div');
        youMarker.style.position = 'absolute';
        youMarker.style.left = '7.0%';
        youMarker.style.top = '82.6%';
        youMarker.style.width = '13.0%';
        youMarker.style.height = '8.0%';
        youMarker.style.display = 'flex';
        youMarker.style.alignItems = 'center';
        youMarker.style.justifyContent = 'center';
        youMarker.style.fontSize = '0.7vw';
        youMarker.style.fontWeight = 'bold';
        youMarker.style.color = '#fff';
        youMarker.style.textShadow = '1px 1px 2px #000';
        youMarker.style.fontFamily = 'Arial, sans-serif';
        youMarker.style.background = 'rgba(0, 0, 0, 0.5)';
        youMarker.style.borderRadius = '4px';
        youMarker.textContent = 'YOU';
        mapContainer.appendChild(youMarker);
        
        // Define each camera position on the map (percentage)
        const cameraPositions = [
            { cam: 1, x: 25.7, y: 84.3, width: 13.0, height: 8.0 },
            { cam: 2, x: 35.0, y: 56.6, width: 13.0, height: 8.0 },
            { cam: 3, x: 51.5, y: 77.6, width: 13.0, height: 8.0 },
            { cam: 4, x: 57.7, y: 44.9, width: 12.9, height: 8.0 },
            { cam: 5, x: 75.4, y: 60.3, width: 12.9, height: 8.0 },
            { cam: 6, x: 77.2, y: 82.2, width: 13.0, height: 8.0 },
            { cam: 7, x: 52.0, y: 27.9, width: 12.9, height: 8.0 },
            { cam: 8, x: 80.2, y: 21.9, width: 12.8, height: 8.0 },
            { cam: 9, x: 24.4, y: 20.6, width: 12.9, height: 8.0 },
            { cam: 10, x: 7.9, y: 39.1, width: 12.8, height: 8.0 },
            { cam: 11, x: 72.9, y: 4.6, width: 13.0, height: 8.0 },
        ];
        
        // Create clickable hotspot for each camera
        cameraPositions.forEach(pos => {
            const hotspot = document.createElement('div');
            hotspot.className = 'camera-hotspot';
            hotspot.style.position = 'absolute';
            hotspot.style.left = pos.x + '%';
            hotspot.style.top = pos.y + '%';
            hotspot.style.width = pos.width + '%';
            hotspot.style.height = pos.height + '%';
            hotspot.style.cursor = 'pointer';
            hotspot.style.transition = 'all 0.2s';
            hotspot.style.display = 'flex';
            hotspot.style.alignItems = 'center';
            hotspot.style.justifyContent = 'center';
            hotspot.style.fontSize = '0.7vw';
            hotspot.style.fontWeight = 'bold';
            hotspot.style.color = '#fff';
            hotspot.style.textShadow = '1px 1px 2px #000';
            hotspot.style.fontFamily = 'Arial, sans-serif';
            hotspot.style.whiteSpace = 'nowrap';
            hotspot.style.borderRadius = '4px';
            hotspot.style.letterSpacing = '0.5px';
            
            // Add CAM label
            hotspot.textContent = `CAM ${pos.cam}`;
            
            // Currently selected camera green flicker
            if (this.game.state.currentCam === `cam${pos.cam}`) {
                hotspot.classList.add('camera-selected');
                hotspot.style.border = 'none';
            } else {
                hotspot.style.border = 'none';
                hotspot.style.background = 'transparent';
            }
            
            // Hover effect
            hotspot.addEventListener('mouseenter', () => {
                if (this.game.state.currentCam !== `cam${pos.cam}`) {
                    hotspot.style.background = 'rgba(255, 255, 255, 0.2)';
                }
            });
            
            hotspot.addEventListener('mouseleave', () => {
                if (this.game.state.currentCam !== `cam${pos.cam}`) {
                    hotspot.style.background = 'transparent';
                }
            });
            
            // Click to switch camera
            hotspot.addEventListener('click', () => this.switchCamera(pos.cam));
            
            mapContainer.appendChild(hotspot);
        });
        
        grid.appendChild(mapContainer);
    }

    playAmbientSound() {
        // Cannot use while on cooldown
        if (this.soundButtonCooldown) {
            console.log('Sound button on cooldown');
            return;
        }
        
        const currentCam = this.game.state.currentCam;
        
        // Check if EP moved; if so reset all location counts
        const currentEpLocation = this.game.enemyAI.getCurrentLocation();
        if (this.lastEpLocation !== currentEpLocation) {
            console.log(`EP moved from ${this.lastEpLocation} to ${currentEpLocation}, resetting all location counts`);
            this.locationAttractCount = {}; // Reset all location counts
            this.lastEpLocation = currentEpLocation;
        }
        
        // Alternate between Crank1.ogg and Crank2.ogg
        const soundFile = this.currentSoundToggle ? '2.ogg' : '1.ogg';
        this.currentSoundToggle = !this.currentSoundToggle;
        
        // Create and play audio
        const audio = new Audio(`assets/sounds/${soundFile}`);
        audio.play().catch(e => console.log('Audio play failed:', e));
        
        // Check if current location has been used 2 times
        let canAttract = true;
        if (this.locationAttractCount[currentCam] >= this.maxLocationAttractCount) {
            console.log(`Location ${currentCam} already used ${this.maxLocationAttractCount} times - wasting player's attempt`);
            canAttract = false;
        }
        
        // Try to lure EP to current camera position (if available)
        let attracted = false;
        if (canAttract) {
            attracted = this.game.enemyAI.attractToSound(currentCam);
            
            if (attracted) {
                // Lure successful, play transition animation
                this.playAttractionTransition();
                
                // Increment location count
                this.locationAttractCount[currentCam] = (this.locationAttractCount[currentCam] || 0) + 1;
                console.log(`Epstein attracted to ${currentCam}! Count: ${this.locationAttractCount[currentCam]}/${this.maxLocationAttractCount}`);
                
                // Update EP's last location record
                this.lastEpLocation = currentCam;
            } else {
                // Lure failed (not adjacent or other reason), no user feedback
                console.log('Attraction failed');
            }
        } else {
            // Location used up 2 times, wasted attempt
            console.log('Location maxed out - player wasted an attempt');
        }
        
        // Increment use count (regardless of success)
        this.soundButtonUseCount++;
        console.log(`Sound button used: ${this.soundButtonUseCount}/${this.maxSoundUses}`);
        
        // Check if max uses reached
        if (this.soundButtonUseCount >= this.maxSoundUses) {
            console.log('Sound button overused! Camera failure!');
            this.soundButtonUseCount = 0; // Reset count
            
            // If lure animation is playing, stop it immediately
            if (this.cameraPanel.classList.contains('transitioning')) {
                this.stopStatic();
                this.cameraPanel.classList.remove('transitioning');
            }
            
            // Trigger camera failure
            this.game.enemyAI.triggerCameraFailure();
        }
        
        // Start cooldown
        this.soundButtonCooldown = true;
        this.playSoundBtn.style.opacity = '0.5';
        this.playSoundBtn.style.cursor = 'not-allowed';
        
        // Add loading animation
        this.startCooldownAnimation();
        
        // End cooldown after 8 seconds
        setTimeout(() => {
            this.soundButtonCooldown = false;
            this.playSoundBtn.style.opacity = '1';
            this.playSoundBtn.style.cursor = 'pointer';
            this.stopCooldownAnimation();
        }, this.cooldownTime);
    }
    
    // Start cooldown动画
    startCooldownAnimation() {
        let dotCount = 0;
        this.cooldownInterval = setInterval(() => {
            dotCount = (dotCount + 1) % 4;
            const dots = '.'.repeat(dotCount);
            this.playSoundBtn.textContent = `PLAY SOUND${dots}`;
        }, 500);
    }
    
    // Stop cooldown animation
    stopCooldownAnimation() {
        if (this.cooldownInterval) {
            clearInterval(this.cooldownInterval);
            this.cooldownInterval = null;
        }
        this.playSoundBtn.textContent = 'PLAY SOUND';
    }
    
    // Lure success transition animation
    playAttractionTransition() {
        console.log('Playing attraction transition...');
        
        // Add transition state, hide background and map
        this.cameraPanel.classList.add('transitioning');
        
        // Hide map
        const cameraGrid = document.getElementById('camera-grid');
        if (cameraGrid) {
            cameraGrid.style.display = 'none';
        }
        
        // Hide characters
        const characterOverlay = document.getElementById('character-overlay');
        if (characterOverlay) {
            characterOverlay.style.display = 'none';
        }
        
        // Temporarily lower looping static volume
        this.game.assets.setSoundVolume('staticLoop', 0.1);
        
        // Play static at normal volume
        this.game.assets.playSound('static', false, 1.0);
        
        // Stop static sound after 1000ms
        setTimeout(() => {
            this.game.assets.stopSound('static');
        }, 1000);
        
        // Show static effect
        this.startStatic();
        
        // Update display after 500ms
        setTimeout(() => {
            // If camera already failed, stop animation and show failure
            if (this.game.state.cameraFailed) {
                console.log('Camera failed during attraction transition, showing failure effect');
                this.showCameraFailure();
                return;
            }
            
            this.updateCharacterDisplay();
            
            // After another 500ms, fade out static and restore background
            setTimeout(() => {
                // If camera already failed, stop animation and show failure
                if (this.game.state.cameraFailed) {
                    console.log('Camera failed during attraction transition, showing failure effect');
                    this.showCameraFailure();
                    return;
                }
                
                this.stopStatic();
                this.cameraPanel.classList.remove('transitioning');
                
                // Show map
                if (cameraGrid) {
                    cameraGrid.style.display = 'block';
                }
                
                // Show characters
                if (characterOverlay) {
                    characterOverlay.style.display = 'block';
                }
                
                // Restore looping static volume
                this.game.assets.setSoundVolume('staticLoop', 0.3);
            }, 500);
        }, 500);
    }
    
    // Reset sound button count (called after camera restart)
    resetSoundButtonCount() {
        this.soundButtonUseCount = 0;
    }
    
    // Transition animation when EP moves
    playMovementTransition() {
        console.log('Playing movement transition...');
        
        // If camera already failed, skip animation
        if (this.game.state.cameraFailed) {
            console.log('Camera already failed, skipping movement transition');
            return;
        }
        
        // Add transition state
        this.cameraPanel.classList.add('transitioning');
        
        // Hide map
        const cameraGrid = document.getElementById('camera-grid');
        if (cameraGrid) {
            cameraGrid.style.display = 'none';
        }
        
        // Hide characters
        const characterOverlay = document.getElementById('character-overlay');
        if (characterOverlay) {
            characterOverlay.style.display = 'none';
        }
        
        // Temporarily lower looping static volume
        this.game.assets.setSoundVolume('staticLoop', 0.1);
        
        // Play static at normal volume
        this.game.assets.playSound('static', false, 1.0);
        
        // Stop static sound after 1000ms
        setTimeout(() => {
            this.game.assets.stopSound('static');
        }, 1000);
        
        // Show static effect
        this.startStatic();
        
        // Update display after 500ms
        setTimeout(() => {
            // If camera already failed, stop animation and show failure
            if (this.game.state.cameraFailed) {
                console.log('Camera failed during movement transition, showing failure effect');
                this.showCameraFailure();
                return;
            }
            
            this.updateCharacterDisplay();
            
            // After another 500ms, fade out static and restore background
            setTimeout(() => {
                // If camera already failed, stop animation and show failure
                if (this.game.state.cameraFailed) {
                    console.log('Camera failed during movement transition, showing failure effect');
                    this.showCameraFailure();
                    return;
                }
                
                this.stopStatic();
                this.cameraPanel.classList.remove('transitioning');
                
                // Show map
                if (cameraGrid) {
                    cameraGrid.style.display = 'block';
                }
                
                // Show characters
                if (characterOverlay) {
                    characterOverlay.style.display = 'block';
                }
                
                // Restore looping static volume
                this.game.assets.setSoundVolume('staticLoop', 0.3);
            }, 500);
        }, 500);
    }
    
    // Shock Hawking
    shockHawking() {
        // Play sound immediately
        this.game.assets.playSound('hawking_shock', false, 1.0);
        
        // Show static transition animation
        this.cameraPanel.classList.add('transitioning');
        
        // Play static video
        if (this.staticVideo) {
            this.staticVideo.classList.add('active');
            this.staticVideo.currentTime = 0;
            this.staticVideo.play().catch(e => console.log('Video playback failed:', e));
        }
        
        // After 1 second, execute shock and restore view
        setTimeout(() => {
            if (this.game.enemyAI && this.game.enemyAI.shockHawking()) {
                console.log('Hawking shocked successfully!');
            }
            
            // Stop static video
            if (this.staticVideo) {
                this.staticVideo.classList.remove('active');
                this.staticVideo.pause();
            }
            
            // Restore camera view
            this.cameraPanel.classList.remove('transitioning');
            this.updateView();
        }, 1000);
    }
    
    // Update shock button display（Night 3-5 和 Custom Night 中 Hawking 激活时显示）
    updateShockButtonVisibility() {
        if (this.shockHawkingBtn) {
            const currentCam = this.game.state.currentCam;
            const night = this.game.state.currentNight;
            
            // Night 3-5 显示
            const isNormalNight = night >= 3 && night <= 5;
            
            // Custom Night 且 Hawking AI > 0 时显示
            const isCustomNightWithHawking = this.game.state.customNight && 
                                            night === 7 && 
                                            this.game.state.customAILevels.hawking > 0;
            
            if ((isNormalNight || isCustomNightWithHawking) && this.game.state.cameraOpen && currentCam === 'cam6') {
                this.shockHawkingBtn.style.display = 'block';
            } else {
                this.shockHawkingBtn.style.display = 'none';
            }
        }
    }
    
    // 渲染电眼特效（Night 6）- 作为EP容器的子元素
    renderLightningEyes(epContainer, currentCam) {
        const eyesConfig = this.game.enemyAI.lightningEyesConfig[currentCam];
        if (!eyesConfig) return;
        
        // 创建两只眼睛（相对于EP图片定位）
        [eyesConfig.eye1, eyesConfig.eye2].forEach((eyeConfig, index) => {
            // 眼睛容器
            const eyeContainer = document.createElement('div');
            eyeContainer.className = 'lightning-eye-container';
            eyeContainer.style.position = 'absolute';
            eyeContainer.style.left = eyeConfig.left;
            eyeContainer.style.top = eyeConfig.top;
            eyeContainer.style.width = eyeConfig.width;
            eyeContainer.style.height = eyeConfig.height;
            eyeContainer.style.transform = 'translate(-50%, -50%)';
            eyeContainer.style.transformOrigin = 'center center';
            eyeContainer.style.zIndex = '10';
            eyeContainer.style.pointerEvents = 'none';
            
            // 核心发光点
            const core = document.createElement('div');
            core.className = 'lightning-eye-core';
            core.style.position = 'absolute';
            core.style.top = '50%';
            core.style.left = '50%';
            core.style.width = '60%';
            core.style.height = '60%';
            core.style.transform = 'translate(-50%, -50%)';
            core.style.background = 'radial-gradient(circle, rgba(255, 255, 255, 1) 0%, rgba(0, 255, 255, 1) 40%, rgba(0, 200, 255, 0.6) 70%, transparent 100%)';
            core.style.borderRadius = '50%';
            core.style.filter = 'brightness(2)';
            core.style.animation = 'lightning-pulse 0.15s infinite';
            
            // 外层光晕
            const glow = document.createElement('div');
            glow.className = 'lightning-eye-glow';
            glow.style.position = 'absolute';
            glow.style.top = '50%';
            glow.style.left = '50%';
            glow.style.width = '100%';
            glow.style.height = '100%';
            glow.style.transform = 'translate(-50%, -50%)';
            glow.style.background = 'radial-gradient(ellipse at center, rgba(0, 255, 255, 0.8) 0%, rgba(0, 255, 255, 0.4) 30%, rgba(0, 200, 255, 0.2) 60%, transparent 100%)';
            glow.style.borderRadius = '50%';
            glow.style.boxShadow = `
                0 0 20px rgba(0, 255, 255, 1),
                0 0 40px rgba(0, 255, 255, 0.8),
                0 0 60px rgba(0, 255, 255, 0.6)
            `;
            glow.style.animation = 'lightning-flicker 0.1s infinite';
            
            // 雷电效果（多条随机闪电）
            for (let i = 0; i < 3; i++) {
                const lightning = document.createElement('div');
                lightning.className = 'lightning-bolt';
                lightning.style.position = 'absolute';
                lightning.style.top = '50%';
                lightning.style.left = '50%';
                lightning.style.width = '2px';
                lightning.style.height = `${30 + Math.random() * 40}%`;
                lightning.style.background = 'linear-gradient(to bottom, rgba(255, 255, 255, 1), rgba(0, 255, 255, 0.8), transparent)';
                lightning.style.transformOrigin = 'top center';
                lightning.style.transform = `translate(-50%, -50%) rotate(${Math.random() * 360}deg)`;
                lightning.style.boxShadow = '0 0 5px rgba(0, 255, 255, 1), 0 0 10px rgba(0, 255, 255, 0.8)';
                lightning.style.animation = `lightning-bolt ${0.1 + Math.random() * 0.1}s infinite`;
                lightning.style.animationDelay = `${Math.random() * 0.1}s`;
                lightning.style.opacity = '0.8';
                eyeContainer.appendChild(lightning);
            }
            
            eyeContainer.appendChild(glow);
            eyeContainer.appendChild(core);
            epContainer.appendChild(eyeContainer);
        });
        
        console.log(`⚡ Rendered lightning eyes with electric effects at ${currentCam}`);
    }
}
