// Asset manager
class AssetManager {
    constructor() {
        this.images = {};
        this.sounds = {};
        this.loaded = false;
        
        // Volume settings by category
        this.volumeSettings = this.loadVolumeSettings();
    }
    
    // Load volume settings from localStorage
    loadVolumeSettings() {
        const saved = localStorage.getItem('fnan_volume_settings');
        if (saved) {
            return JSON.parse(saved);
        }
        // Default volume settings
        return {
            master: 0.7,
            gameBg: 0.7,
            menuMusic: 0.7,
            jumpscare: 0.7,
            ventCrawling: 0.7
        };
    }
    
    // Save volume settings
    saveVolumeSettings() {
        localStorage.setItem('fnan_volume_settings', JSON.stringify(this.volumeSettings));
    }
    
    // Set volume for a specific category
    setVolume(type, volume) {
        this.volumeSettings[type] = Math.max(0, Math.min(1, volume));
        this.saveVolumeSettings();
    }
    
    // Get volume for a specific category
    getVolume(type) {
        return this.volumeSettings[type] || 0.7;
    }
    
    // Get all volume settings
    getAllVolumes() {
        return this.volumeSettings;
    }

    async loadAssets() {
        // Get base path for assets
        const basePath = this.getBasePath();
        
        // Image assets
        const imagePaths = {
            office: `${basePath}assets/images/original.png`,
            cam1: `${basePath}assets/images/Cam1.png`,
            cam2: `${basePath}assets/images/Cam2.png`,
            cam3: `${basePath}assets/images/Cam3.png`,
            cam4: `${basePath}assets/images/Cam4.png`,
            cam5: `${basePath}assets/images/Cam5.png`,
            cam6: `${basePath}assets/images/Cam6.png`,
            cam7: `${basePath}assets/images/Cam7.png`,
            cam8: `${basePath}assets/images/Cam8.png`,
            cam9: `${basePath}assets/images/Cam9.png`,
            cam10: `${basePath}assets/images/Cam10.png`,
            cam11: `${basePath}assets/images/Cam11.png`,
            Edward: `${basePath}assets/images/edward.png`,
            jumpscare: `${basePath}assets/images/jump.png`, // Nash jumpscare image
            NickJumpscare: `${basePath}assets/images/jumpNick.png`, // Nick jumpscare image
            JaxJumpscare: `${basePath}assets/images/scaryJaxson.png`, // Jax jumpscare image
            Jax: `${basePath}assets/images/Jaxson.png`, // Jax cam6 display
            cody: `${basePath}assets/images/cody.png`, // Cody easter egg
        };

        const soundPaths = {
            ambient: `${basePath}assets/sounds/music.ogg`,
            static: `${basePath}assets/sounds/Static_sound.ogg`,
            staticLoop: `${basePath}assets/sounds/Static_sound.ogg`,
            vents: `${basePath}assets/sounds/vents.ogg`,
            ventCrawling: `${basePath}assets/sounds/vent-crawling.mp3`,
            jumpscare: `${basePath}assets/sounds/jumpcare.ogg`,
            JaxJumpscare: `${basePath}assets/sounds/Jaxsonjumpscare.ogg`, // Jax jumpscare sound
            blip: `${basePath}assets/sounds/Blip.ogg`,
            win: `${basePath}assets/sounds/winmusic.ogg`,
            chimes: `${basePath}assets/sounds/chimes.ogg`,
            crank1: `${basePath}assets/sounds/Crank1.ogg`,
            crank2: `${basePath}assets/sounds/Crank2.ogg`,
            ekg: `${basePath}assets/sounds/ekg.wav`,
            Jax_shock: `${basePath}assets/sounds/Jaxson_shock.wav`,
            Edward: `${basePath}assets/sounds/Edward.ogg`, // Ed sound
            why: `${basePath}assets/sounds/why.wav`, // Cody easter egg sound
        };

        // Load images
        for (const [key, path] of Object.entries(imagePaths)) {
            try {
                this.images[key] = await this.loadImage(path);
            } catch (e) {
                console.warn(`Failed to load image: ${path}`);
            }
        }

        // Load audio
        for (const [key, path] of Object.entries(soundPaths)) {
            try {
                this.sounds[key] = new Audio(path);
            } catch (e) {
                console.warn(`Failed to load sound: ${path}`);
            }
        }

        this.loaded = true;
    }

    getBasePath() {
        // Check if running in iframe
        const currentPath = window.location.pathname;
        if (currentPath.includes('/FNAN-HTML5-1.2.2-fix/')) {
            return '/FNAN-HTML5-1.2.2-fix/';
        }
        // Local dev environment
        return './';
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    playSound(key, loop = false, volume = 1.0) {
        if (this.sounds[key]) {
            this.sounds[key].loop = loop;
            
            // Apply volume based on sound category
            let categoryVolume = this.volumeSettings.master;
            
            if (key === 'music' || key === 'music3') {
                categoryVolume *= this.volumeSettings.menuMusic;
            } else if (key === 'jumpscare' || key === 'JaxJumpscare' || key === 'NickJumpscare') {
                categoryVolume *= this.volumeSettings.jumpscare;
            } else if (key === 'ventCrawling') {
                categoryVolume *= this.volumeSettings.ventCrawling;
            } else if (key === 'vents' || key === 'ambience' || key === 'staticLoop' || key === 'static' || key === 'blip' || key === 'Blip') {
                // Game background sounds: vents, static noise, camera blips, etc.
                categoryVolume *= this.volumeSettings.gameBg;
            }
            
            this.sounds[key].volume = Math.min(1, volume * categoryVolume);
            this.sounds[key].play();
        }
    }

    stopSound(key) {
        if (this.sounds[key]) {
            this.sounds[key].pause();
            this.sounds[key].currentTime = 0;
        }
    }

    setSoundVolume(key, volume) {
        if (this.sounds[key]) {
            this.sounds[key].volume = volume;
        }
    }
}
