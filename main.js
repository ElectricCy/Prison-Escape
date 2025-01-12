import * as THREE from 'three';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';
import {
    EffectComposer
} from 'three/addons/postprocessing/EffectComposer.js';
import {
    RenderPass
} from 'three/addons/postprocessing/RenderPass.js';
import {
    UnrealBloomPass
} from 'three/addons/postprocessing/UnrealBloomPass.js';
import {
    SMAAPass
} from 'three/addons/postprocessing/SMAAPass.js';
import {
    FBXLoader
} from 'three/addons/loaders/FBXLoader.js';
import {
    OBJLoader
} from 'three/addons/loaders/OBJLoader.js';
import {
    GLTFLoader
} from 'three/addons/loaders/GLTFLoader.js';
// Expose all imports to window object
window.THREE = THREE;
window.OrbitControls = OrbitControls;
window.EffectComposer = EffectComposer;
window.RenderPass = RenderPass;
window.UnrealBloomPass = UnrealBloomPass;
window.SMAAPass = SMAAPass;
window.FBXLoader = FBXLoader;
window.OBJLoader = OBJLoader;
window.GLTFLoader = GLTFLoader;
import {
    BasicSkyShader,
    MaterialManager,
    LightingManager,
    MeshManager
} from 'https://play.rosebud.ai/assets/ThreeJSScripts.js?saOk';
window.BasicSkyShader = BasicSkyShader;
window.MaterialManager = MaterialManager;
window.LightingManager = LightingManager;
window.MeshManager = MeshManager;
const SCRIPT_ASSETS = [{
        name: "script_modelLoader",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_modelLoader.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }, {
        name: "script_imageLoader",
        url: "https://play.rosebud.ai/assets/script_imageLoader.js?907f"
    }, {
        name: "script_LODManager",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_LODManager.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }, {
        name: "script_world",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_world.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }, {
        name: "script_enemy",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_enemy.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    }, {
        name: "rot-js",
        url: "https://unpkg.com/rot-js",
    }, {
        name: "script_gunManager",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_gunManager.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    }, {
        name: "script_gunController",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_gunController.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    }, {}, {
        name: "script_gunHUDContainer",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_gunHUDContainer.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    }, {
        name: "script_gunLoadoutPanel",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_gunLoadoutPanel.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    }, {
        name: "script_ammoDisplay",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_ammoDisplay.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    }, {
        name: "script_gunMount",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_gunMount.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    }, {
        name: "script_skybox",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_skybox.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    }, {
        name: "script_particleEffect",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_particleEffect.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    },
    //  {
    //     name: "script_tilemapGen",
    //     url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_tilemapGen.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    // },
    //  {
    //     name: "script_tilemap",
    //     url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_tilemap.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    // },
    // {
    //     name: "script_obstacle",
    //     url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_obstacle.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    // }, 
    // {
    //     name: "script_tile",
    //     url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_tile.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    // }, 
    {
        name: "script_wall",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_wall.js?v=124b99175beea51e432e8b8c1217a943ff9b960a",
    }, {
        name: "script_crosshair",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_crosshair.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }, {
        name: "script_cameraController",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_cameraController.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }, {
        name: "script_audioManager",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_audioManager.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }, {
        name: "script_ray",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_ray.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }, {
        name: "script_astar",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_astar.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }, {
        name: "script_navmesh",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_navmesh.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }, {
        name: "script_inputHandler",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_inputHandler.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    },
    // {
    //     name: "script_dungeonGen",
    //     url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_dungeonGen.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    // }, 
    {
        name: "script_player",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_player.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }, {
        name: "script_HUD",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_HUD.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }, {
        name: "script_dungeonManager",
        url: "https://cdn.jsdelivr.net/gh/ElectricCy/Prison-Escape@main/scripts/script_dungeonManager.js?v=124b99175beea51e432e8b8c1217a943ff9b960a"
    }
];
const MODEL_ASSETS = {
    CABINET: {
        url: 'https://play.rosebud.ai/assets/bloodstainedMetalCabinets.glb?gOxU',
        type: 'glb',
        scale: 1.0
    },
    SMG: {
        url: 'https://play.rosebud.ai/assets/mdl_mac-10.glb?i3GD',
        type: 'glb',
        scale: 0.25
    },
    PISTOL: {
        url: 'https://play.rosebud.ai/assets/semi_auto_pistol_g-17.glb?cJ4S',
        type: 'glb',
        scale: 2.5
    },
    LIGHT_FIXTURE: {
        url: 'https://play.rosebud.ai/assets/A_black_cone_shaped_c_0105042715_texture.fbx?tBjn',
        type: 'fbx',
        scale: 0.05,
        texture: 'https://play.rosebud.ai/assets/A_black_cone_shaped_c_0105042715_texture.png?U2Me'
    },
    ENEMY_ZOMBIE: {
        url: 'https://play.rosebud.ai/assets/Animation_Unsteady_Walk_withSkin.fbx?uu3L',
        type: 'fbx',
        scale: 0.1,
        animations: {
            walk: 'https://play.rosebud.ai/assets/Animation_Unsteady_Walk_withSkin.fbx?uu3L'
        }
    },
};
window.MODEL_ASSETS = MODEL_ASSETS

const SOUND_ASSETS = {
    gunshot_pistol: {
        url: 'https://play.rosebud.ai/assets/snd_reload.wav?yfCA',
        volume: 0.1,
        type: 'effects',
        key: 'gunshot_pistol'
    },
    footsteps: {
        url: 'https://play.rosebud.ai/assets/Ominous_footsteps.mp3?ftxP',
        volume: 0.6,
        type: 'effects',
        key: 'footsteps',
        loop: true
    },
    heartbeat: {
        url: 'https://play.rosebud.ai/assets/Heartbeat_that_start.mp3?IBeg',
        volume: 0.5,
        type: 'effects',
        key: 'heartbeat',
        loop: true
    },
    robotAttack: {
        url: 'https://play.rosebud.ai/assets/Robot_attacking_soun.mp3?1zzt',
        volume: 0.4,
        type: 'effects',
        key: 'robotAttack',
        loop: true
    },
    jumpScare: {
        url: 'https://play.rosebud.ai/assets/Jump_scare_enemy_sou.mp3?AGWj',
        volume: 0.8,
        type: 'effects',
        key: 'jumpScare',
        loop: false
    }
};
window.SOUND_ASSETS = SOUND_ASSETS
const IMAGE_ASSETS = {

    PISTOL_ICON: {
        url: 'https://play.rosebud.ai/assets/pistol_icon.png?59yr',
        type: 'png',
        scale: 1.0,
        flipX: true,
        iconSize: {
            width: '32px',
            height: '24px'
        }
    },

};
window.IMAGE_ASSETS = IMAGE_ASSETS
const APP_SETTINGS = {
    dungeon: {
        showCeiling: true // Control ceiling visibility
    },
    lod: {
        enabled: true,
        distances: {
            high: 0, // Full detail (0-3 units)
            medium: 3, // Medium detail (3-8 units)
            low: 8, // Low detail (8-15 units)
            ultraLow: 15, // Ultra low detail (15-25 units)
            minimal: 25, // Minimal detail (25-35 units)
            culled: 35 // Remove from rendering (35+ units)
        },
        levels: {
            high: {
                geometryReduction: 1,
                textureSize: 1,
                shadowCasting: true,
                useFullMaterial: true,
                usePhysics: true
            },
            medium: {
                geometryReduction: 0.1, // 90% reduction
                textureSize: 0.1,
                shadowCasting: false,
                useFullMaterial: false,
                usePhysics: true
            },
            low: {
                geometryReduction: 0.05, // 95% reduction
                textureSize: 0.05,
                shadowCasting: false,
                useFullMaterial: false,
                usePhysics: false
            },
            ultraLow: {
                geometryReduction: 0.02, // 98% reduction
                textureSize: 0.02,
                shadowCasting: false,
                useFullMaterial: false,
                usePhysics: false
            },
            minimal: {
                geometryReduction: 0.01, // 99% reduction
                textureSize: 0.01,
                shadowCasting: false,
                useFullMaterial: false,
                usePhysics: false
            }
        }
    },
    enemySpawns: {
        positions: [{
            x: 3,
            z: 7
        }, {
            x: 6,
            z: 7
        }, {
            x: 3,
            z: 9,
        }, {
            x: 6,
            z: 9
        }],
        spawnHeight: 0 // Height above ground for enemy spawn
    },
    tilemap: {
        width: 30,
        height: 30,
        tileSize: 20,
        obstacles: [],
        dungeonParams: {
            roomWidth: [3, 6],
            roomHeight: [3, 6],
            corridorLength: [2, 8],
            dugPercentage: 0.4,
            timeLimit: 2000
        },
    },
    obstacles: {
        height: 50,
        physics: {
            mass: 0, // Static obstacles
            friction: 0.5,
            restitution: 0.3
        },
        material: {
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.2
        },
        wallTexture: {
            url: 'https://play.rosebud.ai/assets/image.webp?1iTc',
            wrapping: {
                wrapS: 'ClampToEdgeWrapping',
                wrapT: 'ClampToEdgeWrapping'
            },
            material: {
                roughness: 0.7,
                metalness: 0.2
            }
        }
    },
    controls: {
        createEnemyOnStart: true,
        enableMuzzleFlash: false,
        showNavMesh: false,
        showEnemyPath: false,
        enableSunMovement: false,
        enableGunRecoil: true,
        enableGunReload: true,
        enableEnemyChasing: false,
        showEnemyDebugText: false,
        enableEnemyRespawn: true,
        mouseSensitivity: {
            x: 0.005,
            y: 0.005
        },
        joystickSensitivity: {
            x: 0.1,
            y: 0.1
        },
        playerMoveSpeed: 30
    },
    renderer: {
        shadowMap: {
            enabled: true,
            type: THREE.PCFSoftShadowMap
        },
        colorSpace: {
            output: THREE.SRGBColorSpace,
            toneMapping: THREE.ACESFilmicToneMapping,
            toneMappingExposure: 1.2
        },
        antialias: true,
        pixelRatio: window.devicePixelRatio
    },
    world: {
        defaults: {
            skyColor: 0x0B1026, // Dark blue night sky
            groundColor: 0x1a1a1a // Dark ground
        },
    },
    enemyStates: {
        WAITING: 'WAITING'
    },
    physics: {
        gravity: {
            x: 0,
            y: -110,
            z: 0
        },
        defaultContactMaterial: {
            friction: 0.01,
            restitution: 0.6
        },
        solver: {
            iterations: 10,
            tolerance: 0.001
        },
        collisionGroups: {
            PLAYER: 1, // 0001 in binary
            OBSTACLE: 2, // 0010 in binary
            GROUND: 4, // 0100 in binary
            ENEMY: 8 // 1000 in binary
        }
    },
    camera: {
        fov: 75,
        near: 0.1,
        far: 1000,
        initialPosition: {
            x: 0,
            y: 15,
            z: 0
        },
        debugRotation: {
            x: -Math.PI / 2,
            y: 0,
            z: 0
        },
        debug: {
            enabled: true,
            position: {
                x: 0,
                y: 600,
                z: 0
            },
            types: ['PLAYER', 'ENEMY', 'TOPDOWN']
        }
    },
    // Player settings moved to Player class
    gameplay: {},
    lights: {
        moonlight: {
            color: 0x4d6bc5, // Soft blue moonlight color
            intensity: 0.8, // Lower intensity for night
            position: {
                x: -50,
                y: 60, // Higher position for moon
                z: 50
            },
            castShadow: false, // Disable shadow casting
            shadow: {
                mapSize: {
                    width: 2048,
                    height: 2048
                },
                camera: {
                    near: 10,
                    far: 1000,
                    left: -100,
                    right: 100,
                    top: 100,
                    bottom: -100
                },
                bias: -0.0001
            }
        }
    }
};
window.APP_SETTINGS = APP_SETTINGS // Audio parameter validation functions

class ProximityManager {
    constructor() {
        this.maxDistance = 150; // Maximum distance for audio to be heard
        this.minDistance = 10; // Distance at which audio is at max volume
        this.defaultVolume = 0; // Default volume when positions are invalid
    }
    // Validate position objects have required properties
    isValidPosition(pos) {
        // Check if it's a THREE.Vector3
        if (pos instanceof THREE.Vector3) {
            return true;
        }
        // Check if it's a basic position object with x, y, z
        return pos && typeof pos.x === 'number' && typeof pos.y === 'number' && typeof pos.z === 'number';
    }
    // Calculate volume based on distance with safety checks
    calculateVolumeByDistance(sourcePos, listenerPos) {
        if (!this.isValidPosition(sourcePos) || !this.isValidPosition(listenerPos)) {
            return this.defaultVolume;
        }
        try {
            // Convert to Vector3 if needed
            const source = sourcePos instanceof THREE.Vector3 ? sourcePos : new THREE.Vector3(sourcePos.x, sourcePos.y, sourcePos.z);
            const listener = listenerPos instanceof THREE.Vector3 ? listenerPos : new THREE.Vector3(listenerPos.x, listenerPos.y, listenerPos.z);

            // Calculate distance
            const distance = source.distanceTo(listener);

            // Quick bounds check
            if (distance <= this.minDistance) return 1;
            if (distance >= this.maxDistance) return 0;

            // Linear falloff
            return 1 - (distance - this.minDistance) / (this.maxDistance - this.minDistance);
        } catch (error) {
            console.warn('Error in volume calculation:', error);
            return this.defaultVolume;
        }
    }
}
window.ProximityManager = ProximityManager
class AudioManager {
    constructor(params) {
        if (!params.THREE) throw new Error('THREE is required');
        if (!params.camera) throw new Error('Camera is required');
        if (!params.LoadingManager) throw new Error('LoadingManager is required');
        if (!params.soundAssets) throw new Error('Sound assets are required');
        this.THREE = params.THREE;
        this.camera = params.camera;
        this.LoadingManager = params.LoadingManager;
        this.soundAssets = params.soundAssets;
        this.effectsEnabled = true;
        this.effectsVolume = 1.0;
        this.activeEffects = new Map();
        // Method to stop a sound effect
        this.stopEffect = (effectId) => {
            if (!effectId) return;
            const effect = this.activeEffects.get(effectId);
            if (effect) {
                if (effect.isPlaying) {
                    effect.stop();
                }
                effect.disconnect();
                this.activeEffects.delete(effectId);
            }
        };
        // Method to play sound effects
        this.playEffect = (key, position = null) => {
            if (!this.effectsEnabled) return null;
            // Check if this is a footsteps sound and if it's already playing
            if (key === 'footsteps') {
                // Check if there's already an active footsteps sound
                for (const [id, sound] of this.activeEffects.entries()) {
                    if (id.startsWith('footsteps_')) {
                        // Return the existing sound ID
                        return id;
                    }
                }
            }
            const soundData = this.sounds.get(key);
            if (!soundData) {
                console.warn(`Sound not found: ${key}`);
                return null;
            }

            // Create audio based on position
            const sound = position ?
                this.createPositionalSound(key, position) :
                new THREE.Audio(this.listener);

            if (!sound) return null;

            // Set up the sound
            sound.setBuffer(soundData.buffer);
            sound.setVolume(soundData.volume * this.effectsVolume);

            // Generate unique ID
            const effectId = `${key}_${Date.now()}`;

            // Store the effect
            this.activeEffects.set(effectId, sound);

            // Set up cleanup
            sound.onEnded = () => {
                this.activeEffects.delete(effectId);
                sound.disconnect();
            };

            // Play the sound
            sound.play();
            return effectId;
        };
        this.defaults = params.defaults || {
            volume: 1.0,
            playbackRate: 1.0,
            maxDistance: 1000,
            refDistance: 1,
            rolloffFactor: 1
        };

        // Sound effect specific properties
        this.effectsVolume = 1.0;
        this.activeEffects = new Map(); // Track currently playing effects
        this.effectsEnabled = true;
        // Initialize audio listener
        this.initAudioListener();

        // Sound storage
        this.sounds = new Map();
        this.audioLoader = new this.THREE.AudioLoader(this.LoadingManager);
    }
    isValidVolume(value) {
        return Number.isFinite(value) && value >= 0 && value <= 1;
    }

    isValidPlaybackRate(value) {
        return Number.isFinite(value) && value > 0 && value <= 4;
    }

    isValidDistance(value) {
        return Number.isFinite(value) && value >= 0;
    }

    clampVolume(value) {
        if (!this.isValidVolume(value)) return 1.0;
        return Math.max(0, Math.min(1, value));
    }

    clampPlaybackRate(value) {
        if (!this.isValidPlaybackRate(value)) return 1.0;
        return Math.max(0.1, Math.min(4, value));
    }

    clampDistance(value) {
        if (!this.isValidDistance(value)) return 1000;
        return Math.max(0, value);
    }
    initAudioListener() {
        try {
            if (!this.camera) {
                throw new Error('Camera not available for AudioListener');
            }
            this.listener = new this.THREE.AudioListener();
            this.camera.add(this.listener);
            // Set safe default parameters
            this.listener.setMasterVolume(
                this.clampVolume(this.defaults.volume)
            );
        } catch (error) {
            console.error('Failed to initialize AudioListener:', error);
            // Create dummy listener as fallback
            this.listener = {
                context: {
                    listener: {
                        setPosition: () => {}
                    }
                },
                setMasterVolume: () => {}
            };
        }
    }
    async loadSoundAssets() {
        try {
            if (!this.soundAssets || typeof this.soundAssets !== 'object') {
                throw new Error('Invalid sound assets configuration');
            }
            const loadPromises = Object.entries(this.soundAssets)
                .filter(([_, asset]) => asset && asset.url) // Only process assets with URLs
                .map(async ([key, asset]) => {
                    try {
                        const buffer = await this.audioLoader.loadAsync(asset.url);
                        this.sounds.set(key, {
                            buffer,
                            volume: asset.volume || 1.0,
                            type: asset.type || 'effects',
                            category: asset.category || 'misc'
                        });
                        console.log(`Loaded sound asset: ${key}`);
                    } catch (err) {
                        console.warn(`Failed to load sound asset ${key}:`, err);
                    }
                });
            await Promise.all(loadPromises);
            console.log('All audio assets loaded successfully');

            // Initialize audio context if needed
            if (this.listener && this.listener.context && this.listener.context.state === 'suspended') {
                this.listener.context.resume().catch(console.error);
            }
        } catch (error) {
            console.error('Error loading audio assets:', error);
            throw error;
        }
    }
    createPositionalSound(key, position) {
        try {
            console.log(`Creating positional sound for key: ${key}`);
            const buffer = this.sounds.get(key);
            if (!buffer) {
                throw new Error(`Sound not found: ${key}`);
            }
            const sound = new this.THREE.PositionalAudio(this.listener);
            sound.setBuffer(buffer);
            // Validate and log parameters before setting
            const validatedVolume = this.clampVolume(this.defaults.volume);
            const validatedPlaybackRate = this.clampPlaybackRate(this.defaults.playbackRate);
            const validatedRefDistance = this.clampDistance(this.defaults.refDistance);
            const validatedMaxDistance = this.clampDistance(this.defaults.maxDistance);
            const validatedRolloff = this.clampDistance(this.defaults.rolloffFactor);
            console.log('Audio parameters:', {
                volume: validatedVolume,
                playbackRate: validatedPlaybackRate,
                refDistance: validatedRefDistance,
                maxDistance: validatedMaxDistance,
                rolloffFactor: validatedRolloff
            });
            // Set validated parameters
            sound.setVolume(validatedVolume);
            sound.setPlaybackRate(validatedPlaybackRate);
            sound.setRefDistance(validatedRefDistance);
            sound.setMaxDistance(validatedMaxDistance);
            sound.setRolloffFactor(validatedRolloff);
            if (position) {
                sound.position.copy(position);
            }
            return sound;
        } catch (error) {
            console.error('Error creating positional sound:', error);
            return null;
        }
    }
    updateListener(position) {
        try {
            console.log('Updating audio listener position:', position);

            // Validate position values
            if (!position) {
                throw new Error('Position is null or undefined');
            }

            if (!Number.isFinite(position.x) || !Number.isFinite(position.y) || !Number.isFinite(position.z)) {
                console.error('Invalid position values:', {
                    x: position.x,
                    y: position.y,
                    z: position.z
                });
                throw new Error('Non-finite values in position');
            }
            if (this.listener?.context?.listener?.setPosition) {
                this.listener.context.listener.setPosition(
                    position.x, position.y, position.z
                );
            }
        } catch (error) {
            console.warn('Error updating audio listener position:', error);
        }
    }
    setMasterVolume(volume) {
        try {
            console.log('Setting master volume:', volume);

            if (volume === undefined || volume === null) {
                throw new Error('Volume parameter is undefined or null');
            }

            const safeVolume = this.clampVolume(volume);
            console.log('Clamped volume value:', safeVolume);

            if (!this.listener) {
                throw new Error('Audio listener is not initialized');
            }

            if (!this.listener.setMasterVolume) {
                throw new Error('setMasterVolume method not available on listener');
            }

            this.listener.setMasterVolume(safeVolume);
            console.log('Master volume set successfully');
        } catch (error) {
            console.error('Error setting master volume:', error);
            console.error('Current listener state:', this.listener);
        }
    }
}
window.AudioManager = AudioManager;

class Renderer {
    constructor() {
        this.postProcessing = null;
        this.renderer = new THREE.WebGLRenderer({
            antialias: APP_SETTINGS.renderer.antialias,
            canvas: canvas,
            powerPreference: "high-performance"
        });
        this.activeCamera = 'TOPDOWN'; // Default to top-down camera
        this.init();
        this.createDebugButton();
    }
    createDebugButton() {
        const button = document.createElement('button');
        button.innerHTML = 'Switch Camera';
        button.style.position = 'fixed';
        button.style.top = '20px';
        button.style.right = '20px';
        button.style.padding = '10px';
        button.style.backgroundColor = '#333';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        button.style.fontFamily = 'Arial, sans-serif';

        button.onclick = () => {
            const cameras = APP_SETTINGS.camera.debug.types;
            const currentIndex = cameras.indexOf(this.activeCamera);
            const nextIndex = (currentIndex + 1) % cameras.length;
            this.activeCamera = cameras[nextIndex];
            this.updateCameraView();
        };

        document.body.appendChild(button);
    }
    updateCameraView() {
        switch (this.activeCamera) {
            case 'PLAYER':
                MainCamera.position.copy(window.Player.getPosition());
                // Don't reset rotation here as it's handled by Player class
                break;
            case 'ENEMY':
                if (window.Enemy && window.Enemy.model) {
                    const enemyPos = window.Enemy.getPosition();
                    MainCamera.position.set(
                        enemyPos.x,
                        enemyPos.y + 30,
                        enemyPos.z
                    );
                    MainCamera.lookAt(enemyPos);
                }
                break;
            case 'TOPDOWN':
                MainCamera.position.set(
                    APP_SETTINGS.camera.debug.position.x,
                    APP_SETTINGS.camera.debug.position.y,
                    APP_SETTINGS.camera.debug.position.z
                );
                MainCamera.rotation.set(
                    APP_SETTINGS.camera.debugRotation.x,
                    APP_SETTINGS.camera.debugRotation.y,
                    APP_SETTINGS.camera.debugRotation.z
                );
                break;
        }
    }
    init() {
        this.renderer.setPixelRatio(APP_SETTINGS.renderer.pixelRatio);
        this.renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
        this.renderer.shadowMap.enabled = APP_SETTINGS.renderer.shadowMap.enabled;
        this.renderer.shadowMap.type = APP_SETTINGS.renderer.shadowMap.type;
        this.renderer.outputColorSpace = APP_SETTINGS.renderer.colorSpace.output;
        this.renderer.toneMapping = APP_SETTINGS.renderer.colorSpace.toneMapping;
        this.renderer.toneMappingExposure = APP_SETTINGS.renderer.colorSpace.toneMappingExposure;
        console.log('Renderer initialized with APP_SETTINGS parameters');
    }
    initPostProcessing() {
        this.postProcessing = new PostProcessing(this.renderer, WorldScene, MainCamera);
        window.PostProcessing = this.postProcessing;
    }
    render() {
        // Update camera position before rendering
        this.updateCameraView();

        if (this.postProcessing) {
            this.postProcessing.render();
        } else {
            this.renderer.render(WorldScene, MainCamera);
        }
    }
    setSize(width, height) {
        this.renderer.setSize(width, height);
        if (this.postProcessing) {
            this.postProcessing.setSize(width, height);
        }
    }
}
window.Renderer = Renderer;
class PostProcessing {
    constructor() {
        this.composer = null;
        this.bloomPass = null;
        this.smaaPass = null;
        this.initComposer();
    }
    initComposer() {
        this.composer = new EffectComposer(GameRenderer.renderer);
        const renderPass = new RenderPass(WorldScene, MainCamera);
        this.composer.addPass(renderPass);
        this.bloomPass = new UnrealBloomPass(
            new THREE.Vector2(innerWidth, innerHeight),
            0.2, // bloom strength
            0.4, // radius
            0.9 // threshold
        );
        this.composer.addPass(this.bloomPass);
        this.smaaPass = new SMAAPass(
            innerWidth * GameRenderer.renderer.getPixelRatio(),
            innerHeight * GameRenderer.renderer.getPixelRatio()
        );
        this.composer.addPass(this.smaaPass);
    }
    setSize(width, height) {
        this.composer.setSize(width, height);
        this.bloomPass.resolution.set(width, height);
        this.smaaPass.setSize(width, height);
    }
    render() {
        this.composer.render();
    }
}



class App {
    constructor() {
        this.createRenderDivs();
        this.clock = new THREE.Clock();
        this.initialLoadingComplete = false;
        this.spriteSheet = null;
        this.deltaTime = 0;
        this.enemyCamera = null;
        this.initAsync();
    }
    loadScript(scriptAsset) {
        return new Promise((resolve, reject) => {
            if (!scriptAsset || !scriptAsset.url) {
                reject(new Error('Invalid script asset'));
                return;
            }
            if (document.querySelector(`script[src="${scriptAsset.url}"]`)) {
                resolve();
                return;
            }
            const script = document.createElement('script');
            script.type = scriptAsset.type === 'module' ? 'module' : 'text/javascript';
            script.src = scriptAsset.url;
            script.onload = () => {
                console.log(`Loaded script: ${scriptAsset.name}`);
                resolve();
            };
            script.onerror = () => reject(new Error(`Script loading failed for ${scriptAsset.name}`));
            document.head.appendChild(script);
        });
    }

    async loadScripts() {
        try {
            for (const script of SCRIPT_ASSETS) {
                if (!script.url) continue; // Skip empty entries
                try {
                    await this.loadScript(script);
                } catch (error) {
                    console.warn(`Failed to load ${script.name}:`, error);
                    // Continue loading other scripts even if one fails
                }
            }
            // // Override the prototype method to add texture loading
            // Tile.prototype.createTileMaterial = function() {
            //     // Load the texture
            //     const textureLoader = new this.THREE.TextureLoader();
            //     const texture = textureLoader.load('https://play.rosebud.ai/assets/[texture]dirty dark concrete ground.png?Zjgb');

            //     // Configure texture settings
            //     texture.wrapS = this.THREE.RepeatWrapping;
            //     texture.wrapT = this.THREE.RepeatWrapping;
            //     texture.repeat.set(1, 1);

            //     // Create material settings with texture
            //     const materialSettingsWithTexture = {
            //         ...this.materialSettings,
            //         map: texture,
            //         roughness: 0.8,
            //         metalness: 0.2
            //     };

            //     return this.Materials.create('tileMaterial', 'standard', materialSettingsWithTexture);
            // };
        } catch (error) {
            console.error('Error loading scripts:', error);
        }
    }

    async initAsync() {
        try {
            console.log('Starting script loading...');
            await this.loadScripts();
            console.log('All scripts loaded successfully');
            await this.init();
        } catch (error) {
            console.error('Initialization failed:', error);
            loadingScreen.innerHTML = 'Failed to initialize game. Please refresh the page.';
        }
    }
    async init() {
        console.log('Starting game initialization...');
        window.LoadingManager = new THREE.LoadingManager();
        this.setupLoadingManager();
        // Wait for ImageLoader to be available
        let attempts = 0;
        const maxAttempts = 10;
        while (typeof ImageLoader === 'undefined' && attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 100));
            attempts++;
        }

        if (typeof ImageLoader === 'undefined') {
            throw new Error('ImageLoader class failed to load after ' + maxAttempts + ' attempts');
        }

        window.ImageLoader = new ImageLoader({
            LoadingManager: window.LoadingManager,
            IMAGE_ASSETS: IMAGE_ASSETS
        });
        window.Materials = MaterialManager();
        window.Meshes = MeshManager();
        window.Lights = LightingManager();
        window.ModelLoader = new ModelLoader({
            THREE: THREE,
            GLTFLoader: GLTFLoader,
            FBXLoader: FBXLoader,
            OBJLoader: OBJLoader,
            LoadingManager: window.LoadingManager
        });
        if (typeof World === 'undefined') {
            throw new Error('World class not loaded');
        }
        window.GameWorld = new World();
        window.AudioManager = new AudioManager({
            THREE: THREE,
            camera: MainCamera,
            LoadingManager: window.LoadingManager,
            soundAssets: SOUND_ASSETS,
            defaults: {
                volume: 1.0,
                playbackRate: 1.0,
                maxDistance: Infinity,
                refDistance: 1,
                rolloffFactor: 0
            }
        });
        try {
            await window.AudioManager.loadSoundAssets();
        } catch (error) {
            console.error('Failed to load audio assets:', error);
            return;
        }

        window.Input = new InputHandler({
            THREE: THREE,
            canvas: canvas,
            settings: APP_SETTINGS
        });
        window.CameraControl = new CameraController({
            THREE: THREE,
            camera: MainCamera,
            settings: APP_SETTINGS
        });

        // Add euler property initialization to CameraController
        window.CameraControl.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        window.CameraControl.euler.setFromQuaternion(MainCamera.quaternion);

        // Add rotateCamera method to CameraController prototype
        CameraController.prototype.rotateCamera = function(deltaX, deltaY) {
            // Convert the joystick input to rotation angles
            this.euler.y -= deltaX;

            // Clamp vertical rotation to prevent over-rotation
            this.euler.x = Math.max(
                -Math.PI / 2.2, // Slightly less than 90 degrees up
                Math.min(Math.PI / 2.2, this.euler.x - deltaY) // Slightly less than 90 degrees down
            );

            // Apply the rotation to the camera
            this.camera.quaternion.setFromEuler(this.euler);
        };
        window.Player = new Player(MainCamera);

        // Override Player's handleMovementInput function after Player is initialized
        Player.prototype.handleMovementInput = function() {
            // Get camera vectors for movement direction
            const forward = window.CameraControl.getForwardVector();
            const right = window.CameraControl.getRightVector();
            forward.y = 0;
            right.y = 0;
            forward.normalize();
            right.normalize();
            // Reset move direction
            this.moveDirection.set(0, 0, 0);
            // Create vectors for keyboard and joystick input
            const keyboardDirection = new CANNON.Vec3(0, 0, 0);
            const joystickDirection = new CANNON.Vec3(0, 0, 0);
            // Handle keyboard input
            if (this.keys.forward) keyboardDirection.vadd(new CANNON.Vec3(forward.x, 0, forward.z), keyboardDirection);
            if (this.keys.backward) keyboardDirection.vsub(new CANNON.Vec3(forward.x, 0, forward.z), keyboardDirection);
            if (this.keys.right) keyboardDirection.vadd(new CANNON.Vec3(right.x, 0, right.z), keyboardDirection);
            if (this.keys.left) keyboardDirection.vsub(new CANNON.Vec3(right.x, 0, right.z), keyboardDirection);
            if (keyboardDirection.length() > 0) {
                keyboardDirection.normalize();
                this.moveDirection.vadd(keyboardDirection, this.moveDirection);
            }
            // Handle joystick input with analog control
            if (window.HUD?.components?.Joystick) {
                const joystickInput = window.HUD.components.Joystick.getInput();
                if (Math.abs(joystickInput.x) > 0.05 || Math.abs(joystickInput.y) > 0.05) {
                    // Calculate forward/backward movement
                    const forwardComponent = new CANNON.Vec3(
                        forward.x * -joystickInput.y,
                        0,
                        forward.z * -joystickInput.y
                    );
                    // Calculate left/right movement
                    const rightComponent = new CANNON.Vec3(
                        right.x * joystickInput.x,
                        0,
                        right.z * joystickInput.x
                    );

                    // Combine joystick movements
                    joystickDirection.vadd(forwardComponent, joystickDirection);
                    joystickDirection.vadd(rightComponent, joystickDirection);
                    // Calculate magnitude of joystick input
                    const inputMagnitude = Math.sqrt(joystickInput.x * joystickInput.x + joystickInput.y * joystickInput.y);

                    if (joystickDirection.length() > 0) {
                        joystickDirection.normalize();
                        joystickDirection.scale(Math.min(1.0, inputMagnitude));
                        this.moveDirection.vadd(joystickDirection, this.moveDirection);
                    }
                }
            }
            // Normalize final combined movement
            if (this.moveDirection.length() > 0) {
                this.moveDirection.normalize();
            }
            return this.moveDirection;
        };
        GameWorld.createTilemap();
        try {
            await window.ImageLoader.loadAllImages();
            window.HUD = new HUD({
                uiContainer: window.uiDiv,
                AmmoDisplay: AmmoDisplay,
                Crosshair: Crosshair,
                GunLoadoutPanel: GunLoadoutPanel,
                GunHUDContainer: GunHUDContainer,
                Player: window.Player,
                settings: APP_SETTINGS
            });
            window.HUD.init();
            window.HUD.hide(); // Initially hide the HUD
        } catch (error) {
            console.error('Failed to load images or initialize HUD:', error);
        }
        // Place player at available position
        // First place the player
        this.placePlayerAtAvailablePosition();
        // Then create and place the enemy, ensuring tilemap and player exist
        if (window.GameWorld?.tilemap && window.Player) {
            await this.createEnemy();
        } else {
            console.error('Failed to create enemy: tilemap or player not initialized');
        }
        try {
            // Set loading complete after everything is initialized
            this.initialLoadingComplete = true;
            loadingScreen.style.display = 'none';
            if (window.HUD) {
                window.HUD.show();
            }
            // Initialize enemy camera
            this.enemyCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            this.enemyCamera.position.set(0, 20, 0);
            window.EnemyCamera = this.enemyCamera;
        } catch (error) {
            console.error('Failed to initialize gun system:', error);
        }
        this.addEventListeners();
    }
    updateEnemyCamera() {
        if (!this.enemyCamera || !window.Enemy || !window.Enemy.model) return;
        // Get enemy's current position and rotation
        const enemyPosition = window.Enemy.getPosition();
        const enemyRotation = window.Enemy.model.rotation;
        // Camera offset from enemy (adjust these values as needed)
        const cameraOffset = new THREE.Vector3(0, 20, -20); // Behind and above the enemy
        // Apply enemy's rotation to the camera offset
        cameraOffset.applyQuaternion(window.Enemy.model.quaternion);
        // Set camera position relative to enemy
        this.enemyCamera.position.copy(enemyPosition).add(cameraOffset);
        // Make camera look at enemy's position, but slightly above
        const targetPosition = new THREE.Vector3(
            enemyPosition.x,
            enemyPosition.y + 10, // Look slightly above the enemy
            enemyPosition.z
        );
        this.enemyCamera.lookAt(targetPosition);
        // Update camera aspect ratio if needed
        if (this.enemyCamera.aspect !== window.innerWidth / window.innerHeight) {
            this.enemyCamera.aspect = window.innerWidth / window.innerHeight;
            this.enemyCamera.updateProjectionMatrix();
        }
    }


    async createEnemy() {
        if (!APP_SETTINGS.controls.createEnemyOnStart || !GameWorld.tilemap) {
            console.warn('Enemy creation skipped: createEnemyOnStart:',
                APP_SETTINGS.controls.createEnemyOnStart,
                'tilemap ready:', !!GameWorld.tilemap);
            return;
        }
        console.log('Starting enemy creation...');
        const enemyLoader = new EnemyLoader({
            THREE: THREE,
            FBXLoader: FBXLoader,
            LoadingManager: window.LoadingManager
        });
        try {
            const dungeonManager = window.DungeonManager;
            if (!dungeonManager) {
                throw new Error('DungeonManager not initialized');
            }
            // Get player's current room
            const playerPos = window.Player.getPosition();
            const playerGridPos = window.GameWorld.tilemap.worldToGridPosition(playerPos.x, playerPos.z);
            const playerRoom = dungeonManager.getRoomAtPosition(playerGridPos.x, playerGridPos.z);
            // Get all available rooms
            const availableRooms = Array.from(dungeonManager.rooms.values()).filter(room =>
                playerRoom ? room.id !== playerRoom.id : true
            );
            if (availableRooms.length === 0) {
                throw new Error('No available rooms for enemy spawn');
            }
            // Select a random room
            const spawnRoom = availableRooms[Math.floor(Math.random() * availableRooms.length)];
            // Get room center in world coordinates
            const roomCenter = {
                x: Math.floor((spawnRoom.bounds.left + spawnRoom.bounds.right) / 2),
                z: Math.floor((spawnRoom.bounds.top + spawnRoom.bounds.bottom) / 2)
            };
            const worldPos = window.GameWorld.tilemap.gridToWorldPosition(roomCenter.x, roomCenter.z);
            const spawnPosition = {
                x: worldPos.x,
                y: APP_SETTINGS.enemySpawns.spawnHeight,
                z: worldPos.z
            };

            console.log('Spawning enemy near player at:', spawnPosition);

            const enemySettings = {
                dimensions: {
                    width: 2,
                    height: 8,
                    depth: 2
                },
                hitbox: {
                    offset: {
                        x: 0,
                        y: 4,
                        z: 0
                    }
                },
                position: spawnPosition,
                waitDuration: 2000,
                respawnCooldown: 3000,
                model: MODEL_ASSETS.ENEMY_ZOMBIE,
                moveSpeed: 35,
                chaseSpeed: 45,
                rotationSpeed: 7.0,
                mass: 70,
                patrolSpeed: 10, // Normal walking speed
                chaseSpeed: 15, // Slightly faster when chasing
                health: {
                    max: 100,
                    current: 100
                },
                physics: {
                    linearDamping: 0.4,
                    angularDamping: 0.99,
                    fixedRotation: true,
                    allowSleep: false
                },
                mountPoints: {
                    gun: {
                        position: new THREE.Vector3(-0.5, 13.6, 5.5),
                        rotation: new THREE.Vector3(0, Math.PI + Math.PI / 2, 0)
                    }
                }
            };

            const preloadedAssets = await enemyLoader.preloadEnemyAssets(enemySettings);
            window.Enemy = new Enemy(WorldScene, {
                ...enemySettings,
                preloadedAssets
            });
            // Initialize the enemy with preloaded assets
            await window.Enemy.initializeWithPreloadedAssets();

            // Verify enemy creation and position
            if (window.Enemy && window.Enemy.model) {
                console.log('Enemy created successfully');
                console.log('Enemy position:', window.Enemy.getPosition());
                console.log('Enemy model visibility:', window.Enemy.model.visible);

                // Ensure model is visible
                window.Enemy.model.visible = true;

                // Verify model position matches physics body
                const physicsPos = window.Enemy.physicsBody.position;
                window.Enemy.model.position.set(physicsPos.x, physicsPos.y, physicsPos.z);
            } else {
                console.error('Enemy creation failed: model not initialized');
            }
        } catch (error) {
            console.error('Failed to create enemy:', error);
        }
    }

    setupLoadingManager() {
        LoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = Math.round((itemsLoaded / itemsTotal) * 100);
            loadingScreen.querySelector('div').innerHTML =
                `Loading ${progress}%<span class="dot1">.</span><span class="dot2">.</span><span class="dot3">.</span>`;
        };
        LoadingManager.onLoad = () => {
            console.log("Base assets loaded");
        };
        LoadingManager.onError = (url) => {
            console.error('Error loading:', url);
        };
    }
    addEventListeners() {
        addEventListener('resize', this.onWindowResize.bind(this));
        const resizeObserver = new ResizeObserver(this.onWindowResize.bind(this));
        resizeObserver.observe(parentDiv);
    }
    onWindowResize() {
        const width = parentDiv.clientWidth;
        const height = parentDiv.clientHeight;
        if (GameWorld) {
            MainCamera.aspect = width / height;
            MainCamera.updateProjectionMatrix();
            GameRenderer.setSize(width, height);
        }
    }
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.deltaTime = Math.min(this.clock.getDelta(), 0.1);
        if (this.initialLoadingComplete) {
            // Update camera based on active view
            if (GameRenderer.activeCamera === 'PLAYER') {
                if (window.CameraControl) {
                    window.CameraControl.update();
                }
            } else if (GameRenderer.activeCamera === 'ENEMY' && window.Enemy && window.Enemy.model) {
                this.updateEnemyCamera();
            }
            if (window.GameWorld) {
                window.GameWorld.update(this.deltaTime);
            }
            if (window.CameraControl) {
                // Handle camera joystick input
                if (window.HUD?.components?.CameraJoystick && window.Player) {
                    const joystickInput = window.HUD.components.CameraJoystick.getInput();
                    if (joystickInput.x !== 0 || joystickInput.y !== 0) {
                        // Use Player's handleJoystickRotation instead
                        window.Player.handleJoystickRotation(joystickInput);
                    }
                }
                window.CameraControl.update();
            }
            if (window.Player) {
                window.Player.update(this.deltaTime);
            }
            if (window.Input) {
                window.Input.update();
            }


            // Update HUD
            if (window.HUD) {
                window.HUD.update();
                if (window.HUD.components.weaponDisplay) {
                    window.HUD.components.weaponDisplay.update();
                }
            }

            // Update enemy if it's loaded
            if (APP_SETTINGS?.controls?.createEnemyOnStart &&
                window.Enemy &&
                window.Enemy.isLoaded &&
                window.Player) {
                const playerPosition = window.Player.getPosition();
                if (playerPosition) {
                    window.Enemy.update(this.deltaTime, playerPosition);
                }
            }
            if (this.worldClock) {
                this.worldClock.update(GameWorld.Time);
            } else {
                //console.warn('WorldClock not initialized');
            }
        }
    }
    start() {
        this.animate();
    }
    createRenderDivs() {
        // Can create global variables by assigning them to window.variableName. 
        window.parentDiv = document.getElementById('renderDiv');
        window.canvas = document.getElementById('threeRenderCanvas');
        window.loadingScreen = document.createElement('div');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'threeRenderCanvas';
            parentDiv.appendChild(canvas);
        }
        // Create loading screen
        loadingScreen.style.position = 'absolute';
        loadingScreen.style.top = '0';
        loadingScreen.style.left = '0';
        loadingScreen.style.width = '100%';
        loadingScreen.style.height = '100%';
        loadingScreen.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        loadingScreen.style.color = 'white';
        loadingScreen.style.display = 'flex';
        loadingScreen.style.justifyContent = 'center';
        loadingScreen.style.alignItems = 'center';
        loadingScreen.style.fontSize = '24px';
        loadingScreen.innerHTML = '<div>Loading<span class="dot1">.</span><span class="dot2">.</span><span class="dot3">.</span></div>';

        // Add styles for the dots
        const style = document.createElement('style');
        style.textContent = `
            @keyframes loadingDots {
                0% { opacity: 0; }
                50% { opacity: 1; }
                100% { opacity: 0; }
            }
            .dot1, .dot2, .dot3 {
                opacity: 0;
                animation: loadingDots 1.5s infinite;
            }
            .dot2 { animation-delay: 0.5s; }
            .dot3 { animation-delay: 1s; }
        `;
        document.head.appendChild(style);
        parentDiv.appendChild(loadingScreen);

        window.uiDiv = document.createElement('div');
        uiDiv.id = 'uiDiv';
        uiDiv.style.position = 'absolute';
        uiDiv.style.top = '0';
        uiDiv.style.left = '0';
        uiDiv.style.width = '100%';
        uiDiv.style.height = '100%';
        uiDiv.style.pointerEvents = 'none'; // Set to 'none' to allow events to pass through
        uiDiv.style.userSelect = 'none'; // Disable text selection
        uiDiv.style.webkitUserSelect = 'none'; // For Safari
        uiDiv.style.msUserSelect = 'none'; // For IE/Edge

        // Apply the same styles to parentDiv
        parentDiv.style.userSelect = 'none';
        parentDiv.style.webkitUserSelect = 'none';
        parentDiv.style.msUserSelect = 'none';

        parentDiv.appendChild(uiDiv);
    }
    findAvailableSpawnPosition() {
        console.group('Finding Available Spawn Position');

        if (!window.GameWorld || !window.GameWorld.tilemap || !window.DungeonManager) {
            console.error('Required systems not initialized');
            console.groupEnd();
            return {
                x: 0,
                y: APP_SETTINGS.camera.initialPosition.y,
                z: 0
            };
        }
        try {
            // Get spawn point from DungeonManager
            const spawnPoint = window.DungeonManager.getRandomSpawnPoint('respawn');

            if (!spawnPoint) {
                throw new Error('No spawn points available');
            }
            // Convert grid position to world coordinates
            const worldPosition = window.GameWorld.tilemap.gridToWorldPosition(
                spawnPoint.position.x,
                spawnPoint.position.z
            );
            console.log('Found spawn position:', {
                grid: spawnPoint.position,
                world: worldPosition
            });
            console.groupEnd();
            return {
                x: worldPosition.x,
                y: APP_SETTINGS.camera.initialPosition.y,
                z: worldPosition.z
            };
        } catch (error) {
            console.error('Error finding spawn position:', error);
            console.groupEnd();
            return {
                x: 0,
                y: APP_SETTINGS.camera.initialPosition.y,
                z: 0
            };
        }
    }

    placePlayerAtAvailablePosition() {
        if (!window.Player) {
            console.error('Player not initialized');
            return;
        }

        const spawnPosition = this.findAvailableSpawnPosition();

        if (spawnPosition) {
            window.Player.setPosition(
                spawnPosition.x,
                spawnPosition.y,
                spawnPosition.z
            );
        } else {
            console.warn('Using default player position');
        }
    }
}



async function startGame() {
    try {
        window.Game = new App();
        await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure constructor completes
        Game.start();
    } catch (error) {
        console.error('Failed to start game:', error);
        if (document.getElementById('loadingScreen')) {
            document.getElementById('loadingScreen').innerHTML =
                '<div style="color: red;">Failed to start game. Please refresh the page.</div>';
        }
    }
}
startGame();