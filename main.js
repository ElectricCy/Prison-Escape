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
const SCRIPT_ASSETS = [{
    name: "rot-js",
    url: "https://unpkg.com/rot-js",
}, {
    name: "script_gunManager",
    url: "https://play.rosebud.ai/assets/script_gunManager.js?TaNM",
}, {
    name: "script_gunController",
    url: "https://play.rosebud.ai/assets/script_gunController.js?RERM",
}, {
    name: "script_imageLoader",
    url: "https://play.rosebud.ai/assets/script_imageLoader.js?907f",
}, {
    name: "script_gunHUDContainer",
    url: "https://play.rosebud.ai/assets/script_gunHUDContainer.js?o6vM",
}, {
    name: "script_gunLoadoutPanel",
    url: "https://play.rosebud.ai/assets/script_gunLoadoutPanel.js?dmV4",
}, {
    name: "script_ammoDisplay",
    url: "https://play.rosebud.ai/assets/script_ammoDisplay.js?dARF",
}, {
    name: "script_modelLoader",
    url: "https://play.rosebud.ai/assets/script_modelLoader.js?GSPF",
}, {
    name: "script_gunMount",
    url: "https://play.rosebud.ai/assets/script_gunMount.js?CRmh",
}, {
    name: "script_enemyAnimationController",
    url: "https://play.rosebud.ai/assets/script_enemyAnimationController.js?cwUg",
}, {
    name: "script_skybox",
    url: "https://play.rosebud.ai/assets/script_skybox.js?SO34",
}, {
    name: "script_particleEffect",
    url: "https://play.rosebud.ai/assets/script_particleEffect.js?U8DF",
}, {
    name: "script_tilemapGen",
    url: "https://play.rosebud.ai/assets/script_tilemapGen.js?oYxY",
}, {
    name: "script_tilemap",
    url: "https://play.rosebud.ai/assets/script_tilemap.js?0e6W",
}, {
    name: "script_obstacle",
    url: "https://play.rosebud.ai/assets/script_obstacle.js?dJlW",
}, {
    name: "script_tile",
    url: "https://play.rosebud.ai/assets/script_tile.js?a9JQ",
}, {
    name: "script_wall",
    url: "https://play.rosebud.ai/assets/script_wall.js?v8so",
}, {
    name: "script_crosshair",
    url: "https://play.rosebud.ai/assets/script_crosshair.js?Iej3"
}, {
    name: "script_cameraController",
    url: "https://play.rosebud.ai/assets/script_cameraController.js?rcjl"
}, {
    name: "script_audioManager",
    url: "https://play.rosebud.ai/assets/script_audioManager.js?wXNR"
}, {
    name: "script_ray",
    url: "https://play.rosebud.ai/assets/script_ray.js?zuLL"
}, {
    name: "script_astar",
    url: "https://play.rosebud.ai/assets/script_astar.js?V21Z"
}, {
    name: "script_navmesh",
    url: "https://play.rosebud.ai/assets/script_navmesh.js?L5JX"
}, {
    name: "script_inputHandler",
    url: "https://play.rosebud.ai/assets/script_inputHandler.js?UbaD"
}];
const MODEL_ASSETS = {
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

const SOUND_ASSETS = {
    gunshot_pistol: {
        url: 'https://play.rosebud.ai/assets/snd_reload.wav?yfCA',
        volume: 0.1,
        type: 'effects',
        key: 'gunshot_pistol'
    }
};
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
const APP_SETTINGS = {
    dungeon: {
        showCeiling: true // Control ceiling visibility
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
            y: 200,
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
}; // Audio parameter validation functions
const AudioValidator = {
    isValidVolume(value) {
        return Number.isFinite(value) && value >= 0 && value <= 1;
    },

    isValidPlaybackRate(value) {
        return Number.isFinite(value) && value > 0 && value <= 4;
    },

    isValidDistance(value) {
        return Number.isFinite(value) && value >= 0;
    },

    clampVolume(value) {
        if (!this.isValidVolume(value)) return 1.0;
        return Math.max(0, Math.min(1, value));
    },

    clampPlaybackRate(value) {
        if (!this.isValidPlaybackRate(value)) return 1.0;
        return Math.max(0.1, Math.min(4, value));
    },

    clampDistance(value) {
        if (!this.isValidDistance(value)) return 1000;
        return Math.max(0, value);
    }
};
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
        this.defaults = params.defaults || {
            volume: 1.0,
            playbackRate: 1.0,
            maxDistance: 1000,
            refDistance: 1,
            rolloffFactor: 1
        };
        // Initialize audio listener
        this.initAudioListener();

        // Sound storage
        this.sounds = new Map();
        this.audioLoader = new this.THREE.AudioLoader(this.LoadingManager);
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
                AudioValidator.clampVolume(this.defaults.volume)
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
                            type: asset.type || 'effects'
                        });
                        console.log(`Loaded sound asset: ${key}`);
                    } catch (err) {
                        console.warn(`Failed to load sound asset ${key}:`, err);
                    }
                });
            await Promise.all(loadPromises);
            console.log('All audio assets loaded successfully');
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
            const validatedVolume = AudioValidator.clampVolume(this.defaults.volume);
            const validatedPlaybackRate = AudioValidator.clampPlaybackRate(this.defaults.playbackRate);
            const validatedRefDistance = AudioValidator.clampDistance(this.defaults.refDistance);
            const validatedMaxDistance = AudioValidator.clampDistance(this.defaults.maxDistance);
            const validatedRolloff = AudioValidator.clampDistance(this.defaults.rolloffFactor);
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

            const safeVolume = AudioValidator.clampVolume(volume);
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
}class TileMapGenerator {
    constructor(params) {
        const requiredDeps = {
            THREE: 'THREE graphics library',
            CANNON: 'CANNON physics engine',
            Materials: 'Materials manager',
            settings: 'Application settings',
            scene: 'THREE.Scene instance',
            physicsWorld: 'CANNON.World instance',
            Tile: 'Tile class',
            Wall: 'Wall class',
            Obstacle: 'Obstacle class',
            NavMesh: 'NavMesh class'
        };
        // Check for required params
        if (!params) {
            throw new Error('TileMapGenerator: params object is required');
        }
        // Validate all required dependencies
        for (const [key, desc] of Object.entries(requiredDeps)) {
            if (!params[key]) {
                throw new Error(`TileMapGenerator: ${desc} (${key}) is required`);
            }
        }
        // Store dependencies as instance properties
        this.THREE = params.THREE;
        this.CANNON = params.CANNON;
        this.Materials = params.Materials;
        this.settings = params.settings;
        this.scene = params.scene;
        this.physicsWorld = params.physicsWorld;
        this.Tile = params.Tile;
        this.Wall = params.Wall;
        this.Obstacle = params.Obstacle;
        this.NavMesh = params.NavMesh;
    }
    generateMap() {
        const tileMap = new TileMap({
            THREE: this.THREE,
            CANNON: this.CANNON,
            Materials: this.Materials,
            settings: this.settings,
            scene: window.WorldScene,
            physicsWorld: window.GameWorld.physicsWorld,
            Tile: this.Tile,
            Wall: this.Wall,
            Obstacle: this.Obstacle,
            NavMesh: this.NavMesh
        });

        tileMap.createTiles();
        // Create and add tilemap mesh
        const tilemapMesh = tileMap.render();
        window.WorldScene.add(tilemapMesh);
        // Create and add grid lines  
        const gridLines = tileMap.createGridLines();
        window.WorldScene.add(gridLines);


        // Place obstacles 
        tileMap.placeObstacles();

        // Place walls
        tileMap.placeWalls();

        // Initialize NavMesh after obstacles and walls are placed
        const navMeshParams = {
            THREE: this.THREE,
            tileMap: tileMap,
            settings: this.settings,
            scene: window.WorldScene,
            pointSize: 1.5,
            pointColor: '#ff0000',
            lineColor: '#ffff00',
            lineWidth: 3,
            maxConnectionDistance: 1.5,
            visualization: {
                pointColor: 0xff0000,
                lineColor: 0xffff00
            }
        };
        try {
            tileMap.navMesh = new this.NavMesh(navMeshParams);
        } catch (error) {
            console.error('Failed to initialize NavMesh:', error);
        }

        return tileMap;
    }

}

class TileMap {
    constructor(params) {
        // Initialize storage arrays
        this.obstaclesList = [];
        this.wallsList = [];
        // Validate core dependencies
        if (!params) {
            throw new Error('TileMap: params object is required');
        }
        const requiredDependencies = {
            THREE: 'THREE.js library',
            CANNON: 'CANNON.js physics engine',
            settings: 'Application settings',
            Materials: 'Materials manager',
            Tile: 'Tile class',
            Wall: 'Wall class',
            Obstacle: 'Obstacle class',
            NavMesh: 'NavMesh class',
            physicsWorld: 'Physics world'
        };
        // Validate all required dependencies
        Object.entries(requiredDependencies).forEach(([key, name]) => {
            if (!params[key]) {
                throw new Error(`TileMap: ${name} (${key}) is required`);
            }
        });
        // Store core dependencies
        this.THREE = params.THREE;
        this.CANNON = params.CANNON;
        this.settings = params.settings;
        this.Materials = window.Materials || params.Materials;
        this.physicsWorld = window.GameWorld?.physicsWorld || params.physicsWorld;
        // Store class dependencies
        this.Tile = params.Tile;
        this.Wall = params.Wall;
        this.Obstacle = params.Obstacle;
        this.NavMesh = params.NavMesh;
        if (!this.physicsWorld) {
            throw new Error('TileMap: Physics world not available');
        }
        // Initialize properties
        this.width = this.settings.tilemap.width;
        this.height = this.settings.tilemap.height;
        this.tileSize = this.settings.tilemap.tileSize;
        this.tiles = [];
        this.mapMesh = new this.THREE.Group();
        this.occupiedPositions = new Set();
        this.navMesh = null;
    }
    createTiles() {
        if (!this.Materials || !this.THREE) {
            throw new Error('TileMap: Required dependencies not available for tile creation');
        }
        // Create individual visual tiles
        for (let x = 0; x < this.width; x++) {
            for (let z = 0; z < this.height; z++) {
                const tileX = (x - this.width / 2 + 0.5) * this.tileSize;
                const tileZ = (z - this.height / 2 + 0.5) * this.tileSize;
                const tile = new this.Tile({
                    THREE: this.THREE,
                    Materials: this.Materials,
                    x: tileX,
                    z: tileZ,
                    size: this.tileSize,
                    materialSettings: this.settings.tilemap.tileMaterial || {
                        color: 0xFFFFFF,
                        roughness: 0.7,
                        metalness: 0.3
                    },
                    physicsWorld: this.physicsWorld,
                    collisionGroups: this.settings.physics.collisionGroups
                });
                this.tiles.push(tile);
                this.mapMesh.add(tile.mesh);
            }
        }
    }
    placeWallsAlongEdge(edge) {
        const placements = [];

        switch (edge) {
            case 'NORTH':
                ``
                for (let x = 0; x < this.width; x++) {
                    placements.push({
                        tile: {
                            x: x,
                            z: 0
                        },
                        edge: 'NORTH'
                    });
                }
                break;
            case 'SOUTH':
                for (let x = 0; x < this.width; x++) {
                    placements.push({
                        tile: {
                            x: x,
                            z: this.height - 1
                        },
                        edge: 'SOUTH'
                    });
                }
                break;
            case 'EAST':
                for (let z = 0; z < this.height; z++) {
                    placements.push({
                        tile: {
                            x: this.width - 1,
                            z: z
                        },
                        edge: 'EAST'
                    });
                }
                break;
            case 'WEST':
                for (let z = 0; z < this.height; z++) {
                    placements.push({
                        tile: {
                            x: 0,
                            z: z
                        },
                        edge: 'WEST'
                    });
                }
                break;
        }

        this.wallsList = []; // Clear existing walls
        placements.forEach(placement => {
            const wall = new this.Wall({
                THREE: this.THREE,
                CANNON: this.CANNON,
                tile: placement.tile,
                edge: placement.edge,
                tileMap: this,
                settings: this.settings
            });
            const wallMesh = wall.createMesh();
            if (wallMesh) {
                this.mapMesh.add(wallMesh);
                this.wallsList.push(wall);
            }
        });
    }

    placeWalls() {
        // Place walls along all edges without checking settings
        this.placeWallsAlongEdge('NORTH');
        this.placeWallsAlongEdge('SOUTH');
        this.placeWallsAlongEdge('EAST');
        this.placeWallsAlongEdge('WEST');
    }
    getTileAt(x, z) {
        return this.tiles[x * this.height + z];
    }

    render() {
        return this.mapMesh;
    }
    createGridLines() {
        if (!this.THREE) {
            throw new Error('TileMap: THREE dependency required for grid line creation');
        }

        const material = new this.THREE.LineBasicMaterial({
            color: this.settings.tilemap.gridColor || 0x000000
        });
        const points = [];
        // Create vertical lines
        for (let x = 0; x <= this.width; x++) {
            const xPos = (x - this.width / 2) * this.tileSize;
            points.push(new this.THREE.Vector3(xPos, 0.1, -this.height * this.tileSize / 2));
            points.push(new this.THREE.Vector3(xPos, 0.1, this.height * this.tileSize / 2));
        }
        // Create horizontal lines
        for (let z = 0; z <= this.height; z++) {
            const zPos = (z - this.height / 2) * this.tileSize;
            points.push(new this.THREE.Vector3(-this.width * this.tileSize / 2, 0.1, zPos));
            points.push(new this.THREE.Vector3(this.width * this.tileSize / 2, 0.1, zPos));
        }
        const geometry = new this.THREE.BufferGeometry().setFromPoints(points);
        return new this.THREE.LineSegments(geometry, material);
    }


    worldToGridPosition(worldX, worldZ) {
        const gridX = Math.floor((worldX + (this.width * this.tileSize) / 2) / this.tileSize);
        const gridZ = Math.floor((worldZ + (this.height * this.tileSize) / 2) / this.tileSize);
        return {
            x: gridX,
            z: gridZ
        };
    }

    gridToWorldPosition(gridX, gridZ) {
        const worldX = (gridX - this.width / 2 + 0.5) * this.tileSize;
        const worldZ = (gridZ - this.height / 2 + 0.5) * this.tileSize;
        return {
            x: worldX,
            z: worldZ
        };
    }

    isTileOccupied(gridX, gridZ) {
        return this.occupiedPositions.has(`${gridX},${gridZ}`);
    }

    markTileOccupied(gridX, gridZ) {
        const key = `${gridX},${gridZ}`;
        if (!this.occupiedPositions.has(key)) {
            this.occupiedPositions.add(key);
        }
    }

    toggleNavMeshVisualization() {
        if (this.navMesh) {
            if (this.navMesh.visualElements.visible) {
                this.navMesh.visualElements.visible = false;
            } else {
                this.navMesh.visualElements.visible = true;
            }
        }
    }
    initNavMesh() {
        if (this.navMesh) {
            this.navMesh.dispose();
        }
        this.navMesh = new NavMesh({
            THREE: this.THREE,
            tileMap: this,
            settings: this.settings,
            width: this.width,
            height: this.height,
            tileSize: this.tileSize
        });
    }

    placeObstacles() {
        this.dungeonGen = new DungeonGenerator();
        this.dungeonGen.generate();
        this.obstaclesList = []; // Clear existing obstacles
        let obstaclesPlaced = 0;
        let placementAttempts = 0;
        // Place obstacles based on dungeon walls
        for (let x = 0; x < this.width; x++) {
            for (let z = 0; z < this.height; z++) {
                if (this.dungeonGen.map[x]?.[z] === 1) { // Wall tile
                    placementAttempts++;
                    const worldPos = this.gridToWorldPosition(x, z);
                    try {
                        const obstacle = new this.Obstacle({
                            THREE: this.THREE,
                            position: new this.THREE.Vector3(
                                worldPos.x,
                                this.settings.obstacles.height / 2 + 0.05,
                                worldPos.z
                            ),
                            settings: this.settings,
                            scene: this.scene,
                            physicsWorld: this.physicsWorld
                        });

                        if (obstacle.mesh) {
                            this.mapMesh.add(obstacle.mesh);
                            this.markTileOccupied(x, z);
                            this.obstaclesList.push(obstacle);
                            obstaclesPlaced++;
                        }
                    } catch (error) {
                        console.warn(`Failed to create obstacle at position (${x}, ${z}):`, error);
                    }
                }
            }
        }

    }
    // Getter methods for obstacles and walls
    getObstacles() {
        return this.obstaclesList;
    }
    getWalls() {
        return this.wallsList;
    }

    getTiles() {
        return this.tiles;
    }
    // Get specific obstacle at grid position
    getObstacleAt(gridX, gridZ) {
        return this.obstaclesList.find(obstacle => {
            const pos = this.worldToGridPosition(obstacle.mesh.position.x, obstacle.mesh.position.z);
            return pos.x === gridX && pos.z === gridZ;
        });
    }
    // Get specific wall at grid position and edge
    getWallAt(gridX, gridZ, edge) {
        return this.wallsList.find(wall => {
            return wall.tile.x === gridX &&
                wall.tile.z === gridZ &&
                wall.edge === edge;
        });
    }
}

class Renderer {
    constructor() {
        this.postProcessing = null;
        this.renderer = new THREE.WebGLRenderer({
            antialias: APP_SETTINGS.renderer.antialias,
            canvas: canvas,
            powerPreference: "high-performance"
        });
        this.activeCamera = 'PLAYER'; // Default to player camera
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



class WorldTime {
    constructor() {
        this.currentTime = 0; // Time in seconds
        this.timeScale = 1; // 1 second real time = 1 second game time
        this.tweening = false;
        this.tweenStartTime = 0;
        this.tweenEndTime = 0;
        this.tweenDuration = 0;
    }
    update(deltaTime) {
        if (this.tweening) {
            this.updateTween(deltaTime);
        } else {
            this.currentTime += deltaTime * this.timeScale;
        }
    }
    setTimeScale(scale) {
        this.timeScale = scale;
    }
    getHours() {
        return Math.floor(this.currentTime / 3600) % 24;
    }
    getMinutes() {
        return Math.floor((this.currentTime % 3600) / 60);
    }
    getSeconds() {
        return Math.floor(this.currentTime % 60);
    }
    getTimeString() {
        const hours = this.getHours().toString().padStart(2, '0');
        const minutes = this.getMinutes().toString().padStart(2, '0');
        const seconds = this.getSeconds().toString().padStart(2, '0');
        return `${hours}:${minutes}:${seconds}`;
    }
    setTime(hours) {
        const targetTime = hours * 3600; // Convert hours to seconds
        this.tweenStartTime = this.currentTime;
        this.tweenEndTime = targetTime;
        this.tweenDuration = 2; // Duration of the tween in seconds
        this.tweening = true;
    }
    updateTween(deltaTime) {
        const elapsedTime = Math.min(deltaTime, this.tweenDuration);
        const progress = elapsedTime / this.tweenDuration;
        this.currentTime = this.tweenStartTime + (this.tweenEndTime - this.tweenStartTime) * progress;
        this.tweenDuration -= elapsedTime;
        if (this.tweenDuration <= 0) {
            this.currentTime = this.tweenEndTime;
            this.tweening = false;
        }
    }
}

class World {
    constructor() {
        window.WorldScene = new THREE.Scene();
        this.skybox = new SkyBox({
            THREE: THREE,
            GLTFLoader: GLTFLoader,
            LoadingManager: window.LoadingManager,
            BasicSkyShader: BasicSkyShader,
            scene: window.WorldScene,
            settings: APP_SETTINGS,
            getLights: (name) => Lights.getLight(name)
        });
        this.lights = {};
        this.physicsWorld = new CANNON.World();
        this.playerPhysMaterial = new CANNON.Material('player');
        this.groundPhysMaterial = new CANNON.Material('ground');
        // Create contact material between player and ground
        const playerGroundContact = new CANNON.ContactMaterial(
            this.playerPhysMaterial,
            this.groundPhysMaterial, {
                friction: 0,
                restitution: 0,
                contactEquationStiffness: 1e8,
                contactEquationRelaxation: 3
            }
        );
        this.physicsWorld.addContactMaterial(playerGroundContact);
        this.setupPhysicsWorld();
        this.initCamera();
        this.initRenderer();
        this.initLights();
        this.tilemap = null;
        this.Time = new WorldTime();
    }
    setupPhysicsWorld() {
        this.physicsWorld.gravity.set(
            APP_SETTINGS.physics.gravity.x,
            APP_SETTINGS.physics.gravity.y,
            APP_SETTINGS.physics.gravity.z
        );
        this.physicsWorld.defaultContactMaterial.friction = APP_SETTINGS.physics.defaultContactMaterial.friction;
        this.physicsWorld.defaultContactMaterial.restitution = APP_SETTINGS.physics.defaultContactMaterial.restitution;
        this.physicsWorld.solver.iterations = APP_SETTINGS.physics.solver.iterations;
        this.physicsWorld.solver.tolerance = APP_SETTINGS.physics.solver.tolerance;
        this.groundPhysMaterial = new CANNON.Material('ground');
    }
    initLights() {
        const defaultSkyColor = new THREE.Color(APP_SETTINGS.world.defaults.skyColor);
        const defaultGroundColor = new THREE.Color(APP_SETTINGS.world.defaults.groundColor);
        const sunlightSettings = APP_SETTINGS.lights.sunlight;
        const moonlightSettings = APP_SETTINGS.lights.moonlight;
        Lights.createLight('moonLight', 'directional', {
            color: moonlightSettings.color,
            intensity: moonlightSettings.intensity,
            position: moonlightSettings.position,
            castShadow: false, // Disable shadow casting for moonlight
            shadow: moonlightSettings.shadow
        });
        Lights.createLight('hemiLight', 'hemisphere', {
            skyColor: defaultSkyColor,
            groundColor: defaultGroundColor,
            intensity: 0.3 // Reduced hemisphere light intensity for darker atmosphere
        });
        // Add subtle ambient light to prevent complete darkness
        Lights.createLight('ambientLight', 'ambient', {
            color: 0x152238, // Very dark blue ambient light
            intensity: 0.2
        });
        console.log('Lights initialized with default colors:', defaultSkyColor, defaultGroundColor);
    }
    getLight(name) {
        return Lights.getLight(name);
    }
    calculateSunRotation(time) {
        const rotationSpeed = 0.1; // Adjust this value to change the orbit speed
        const angle = time * rotationSpeed;
        const radius = 100; // Adjust this value to change the orbit radius
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const baseHeight = 80; // Increased from 50 to 80
        const verticalAmplitude = 30; // Increased from 20 to 30
        const y = baseHeight + Math.sin(angle * 0.5) * verticalAmplitude;
        return new THREE.Vector3(x, y, z);
    }
    updateMoonlight(playerPosition) {
        Lights.updateLight('moonLight', (moonLight) => {
            if (APP_SETTINGS.controls.enableSunMovement) {
                const offset = this.calculateSunRotation(this.Time.currentTime);
                moonLight.position.copy(playerPosition).add(offset);
            }
            if (!moonLight.target) {
                moonLight.target = new THREE.Object3D();
                WorldScene.add(moonLight.target);
            }
            moonLight.target.position.copy(playerPosition);
        });
        if (this.skybox) {
            this.skybox.updateSunPosition();
        }
    }
    initCamera() {
        window.MainCamera = new THREE.PerspectiveCamera(
            APP_SETTINGS.camera.fov,
            canvas.offsetWidth / canvas.offsetHeight,
            APP_SETTINGS.camera.near,
            APP_SETTINGS.camera.far
        );
        // Validate and set camera position with safety checks
        const initialX = Number.isFinite(APP_SETTINGS.camera.initialPosition.x) ? APP_SETTINGS.camera.initialPosition.x : 0;
        const initialY = Number.isFinite(APP_SETTINGS.camera.initialPosition.y) ? APP_SETTINGS.camera.initialPosition.y : 20;
        const initialZ = Number.isFinite(APP_SETTINGS.camera.initialPosition.z) ? APP_SETTINGS.camera.initialPosition.z : 0;

        MainCamera.position.set(initialX, initialY, initialZ);
        MainCamera.lookAt(0, 0, 0);

        // Add AudioListener with safe position
        const listener = new THREE.AudioListener();
        listener.position.set(initialX, initialY, initialZ);
        MainCamera.add(listener);

        console.log('Camera initialized with validated position:', {
            x: initialX,
            y: initialY,
            z: initialZ
        });
    }
    initRenderer() {
        window.GameRenderer = new Renderer(MainCamera);
        GameRenderer.initPostProcessing(WorldScene);
    }
    createTilemap() {
        if (this.tilemap) {
            return this.tilemap;
        }
        try {
            const tileMapGenerator = new TileMapGenerator({
                THREE: THREE,
                CANNON: CANNON,
                Materials: window.Materials,
                settings: APP_SETTINGS,
                scene: window.WorldScene,
                physicsWorld: this.physicsWorld,
                Tile: Tile,
                Wall: Wall,
                Obstacle: Obstacle,
                NavMesh: NavMesh
            });
            this.tilemap = tileMapGenerator.generateMap();

            // Add the dungeon ceiling to the scene
            if (this.tilemap.dungeonGen) {
                const dungeonMeshes = this.tilemap.dungeonGen.createMeshes();
                if (dungeonMeshes.ceiling) {
                    dungeonMeshes.ceiling.visible = APP_SETTINGS.dungeon.showCeiling;
                    WorldScene.add(dungeonMeshes.ceiling);
                }
                if (dungeonMeshes.lights) {
                    WorldScene.add(dungeonMeshes.lights);
                }
            }

            if (!this.tilemap) {
                throw new Error('TileMapGenerator failed to generate map');
            }
            return this.tilemap;
        } catch (error) {
            console.error('Failed to create tilemap:', error);
            throw error;
        }
    }
    update(deltaTime) {
        this.Time.update(deltaTime);
        this.physicsWorld.step(deltaTime);
        this.updateMoonlight(new THREE.Vector3(0, 0, 0));
        this.skybox.update(deltaTime);
        GameRenderer.render();
    }

}

class EnemyLoader {
    constructor({
        THREE,
        FBXLoader,
        LoadingManager
    }) {
        this.THREE = THREE;
        this.FBXLoader = FBXLoader;
        this.LoadingManager = LoadingManager;
    }
    async loadModel(modelSettings) {
        if (!modelSettings) {
            throw new Error('Model settings are required');
        }
        const model = await window.ModelLoader.loadModel(modelSettings);
        if (!model) {
            throw new Error('Failed to load enemy model');
        }
        model.traverse((child) => {
            if (child.isMesh) {
                child.raycast = THREE.Mesh.prototype.raycast;
            }
        });
        return model;
    }
    async loadAnimations(model, animationSettings) {
        const animations = new Map();

        // Load each animation
        for (const [name, path] of Object.entries(animationSettings)) {
            try {
                const fbxLoader = new this.FBXLoader(this.LoadingManager);
                const animData = await fbxLoader.loadAsync(path);
                if (animData.animations && animData.animations.length > 0) {
                    animations.set(name, animData.animations[0]);
                }
            } catch (error) {
                console.error(`Failed to load animation ${name}:`, error);
            }
        }

        return {
            getAnimation: (name) => animations.get(name),
            animations: animations
        };
    }
    async preloadEnemyAssets(enemySettings) {
        try {
            const model = await this.loadModel(enemySettings.model);
            const animationController = await this.loadAnimations(
                model,
                enemySettings.model.animations
            );
            return {
                model,
                animationController
            };
        } catch (error) {
            console.error('Failed to preload enemy assets:', error);
            throw error;
        }
    }
}

class Enemy {
    constructor(scene, settings) {
        if (!settings) {
            throw new Error('Enemy: settings are required');
        }
        this.mixer = null;
        this.activeAnimation = null;
        this.currentAnimation = null;
        this.pathLine = null;
        this.pathGeometry = new THREE.BufferGeometry();
        this.pathMaterial = new THREE.LineBasicMaterial({
            color: 0x0000ff,
            linewidth: 2
        });

        // Room patrol system
        this.currentRoom = null;
        this.patrolRooms = [];
        this.currentPatrolRoomIndex = 0;
        this.roomTransitionTime = 0;
        this.roomWaitTime = 3000; // Time to wait in each room (3 seconds)

        // Store complete settings first
        this.settings = {
            ...settings,
            patrolSettings: {
                waitTime: 2000, // Time to wait at each patrol point
                returnToSpawn: true, // Whether to return to spawn point
                currentPatrolIndex: 0
            }
        };

        this.scene = scene;
        this.deathEffect = null;
        this.isRespawning = false;
        this.respawnTime = 0;
        // Validate critical settings
        if (!this.settings.dimensions) {
            throw new Error('Enemy: dimensions are required in settings');
        }

        if (!this.settings.position) {
            throw new Error('Enemy: position is required in settings');
        }

        this.debugText = new DebugText({
            left: '20px',
            top: '50%'
        });
        if (!APP_SETTINGS.controls.showEnemyDebugText) {
            this.debugText.container.style.display = 'none';
        }
        this.maxHealth = 100;
        this.currentHealth = this.maxHealth;
        this.isDead = false;
        this.scene = scene;

        // Movement and rotation properties
        this.rotationSpeed = 7.0;
        this.targetQuaternion = new THREE.Quaternion();
        this.currentQuaternion = new THREE.Quaternion();
        this.bodyDimensions = new CANNON.Vec3(
            this.settings.dimensions.width,
            this.settings.dimensions.height,
            this.settings.dimensions.depth
        );
        this.physicsBody = this.createPhysicsBody(
            this.bodyDimensions,
            new CANNON.Vec3(
                this.settings.position.x,
                this.settings.position.y,
                this.settings.position.z
            )
        );
        this.moveSpeed = this.settings.chaseSpeed;
        this.model = null;
        this.isLoaded = false;
        this.animationController = null;

        // State machine setup
        this.states = {
            PATROL: 'PATROL',
            CHASE: 'CHASE',
            CAUGHT: 'CAUGHT',
            FLASHED: 'FLASHED'
        };
        this.currentState = this.states.PATROL;
        this.previousState = null;

        // Pathfinding properties
        this.path = [];
        this.currentPathIndex = 0;
        this.pathUpdateTime = 0;
        this.pathUpdateInterval = 500; // Update path every 500ms

        // Patrol properties
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        this.waitAtPointDuration = 2000;
        this.waitStartTime = 0;

        // Chase properties
        this.detectionRange = 20;
        this.chaseSpeed = this.settings.chaseSpeed || 45;
        this.patrolSpeed = this.settings.patrolSpeed || 25;

        // Flash effect properties
        this.flashDuration = 3000;
        this.flashStartTime = 0;
        this.isFlashed = false;
    }
    initializeWithPreloadedAssets() {
        if (!this.settings.preloadedAssets) {
            console.error('Enemy: Preloaded assets are missing');
            throw new Error('Preloaded assets are required');
        }

        // Store initial spawn position
        this.spawnPosition = new THREE.Vector3(
            this.settings.position.x,
            this.settings.position.y,
            this.settings.position.z
        );

        // Initialize animation controller and model
        const {
            model,
            animationController
        } = this.settings.preloadedAssets;
        this.model = model;
        this.animationController = animationController;
        if (!this.model || !this.animationController) {
            throw new Error('Model or animation controller not properly initialized');
        }
        if (this.model) {
            this.createHitbox();
            this.setPosition(new THREE.Vector3(
                this.physicsBody.position.x,
                this.physicsBody.position.y,
                this.physicsBody.position.z
            ));
            // Initialize animation mixer
            this.mixer = new THREE.AnimationMixer(this.model);

            // Get the walk animation and set it as default
            const walkClip = this.animationController.getAnimation('walk');
            if (walkClip) {
                this.activeAnimation = this.mixer.clipAction(walkClip);
                this.activeAnimation.play();
                this.currentAnimation = 'walk';
            }
            this.model.visible = true;
            this.scene.add(this.model);
            this.isLoaded = true;
        }
    }
    createHitbox() {
        // Create a hitbox with specified dimensions and offset
        const hitboxGeometry = new THREE.BoxGeometry(
            this.settings.dimensions.width,
            this.settings.dimensions.height,
            this.settings.dimensions.depth
        );

        // Create transparent material with wireframe
        const hitboxMaterial = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            wireframe: false,
            depthTest: false
        });
        this.hitboxMesh = new THREE.Mesh(hitboxGeometry, hitboxMaterial);
        this.hitboxMesh.visible = false; // Initially invisible
        this.hitboxMesh.userData.type = 'enemy'; // Tag for raycasting
        this.hitboxMesh.raycast = THREE.Mesh.prototype.raycast; // Make it raycastable

        // Create wireframe for debugging
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            transparent: true,
            opacity: 0.5,
            depthTest: false
        });

        this.hitboxWireframe = new THREE.Mesh(hitboxGeometry, wireframeMaterial);
        this.hitboxWireframe.visible = false; // Initially hidden
        // Add both meshes to the scene
        this.scene.add(this.hitboxMesh);
        this.scene.add(this.hitboxWireframe);
    }
    toggleHitboxVisibility() {
        if (this.hitboxWireframe) {
            this.hitboxWireframe.visible = !this.hitboxWireframe.visible;
        }
    }
    createPhysicsBody(dimensions, position) {
        const shape = new CANNON.Box(dimensions);
        const enemyMaterial = new CANNON.Material('enemyMaterial');

        const body = new CANNON.Body({
            mass: 70,
            shape: shape,
            material: enemyMaterial,
            position: position,
            linearDamping: 0.4,
            angularDamping: 0.99,
            fixedRotation: true,
            allowSleep: false
        });
        body.collisionFilterGroup = APP_SETTINGS.physics.collisionGroups.ENEMY;
        body.collisionFilterMask =
            APP_SETTINGS.physics.collisionGroups.OBSTACLE |
            APP_SETTINGS.physics.collisionGroups.GROUND;
        window.GameWorld.physicsWorld.addBody(body);
        return body;
    }

    getPosition() {
        return new THREE.Vector3(
            this.physicsBody.position.x,
            this.physicsBody.position.y,
            this.physicsBody.position.z
        );
    }
    getWorldPosition() {
        if (!this.model) {
            return this.getPosition();
        }
        const worldPos = new THREE.Vector3();
        this.model.getWorldPosition(worldPos);
        return worldPos;
    }

    getWorldDirection() {
        if (!this.model) {
            return new THREE.Vector3(0, 0, 1);
        }
        const direction = new THREE.Vector3(0, 0, 1);
        this.model.getWorldDirection(direction);
        return direction;
    }
    setPosition(newPosition) {
        this.physicsBody.position.set(newPosition.x, newPosition.y, newPosition.z);
    }

    enterState(state) {
        const currentTime = Date.now();
        this.previousState = this.currentState;

        switch (state) {
            case this.states.PATROL:
                this.moveSpeed = this.patrolSpeed;
                this.generatePatrolPoints();
                if (this.model && this.model.animations && this.model.animations.length > 0) {
                    // Setup animation mixer if not already created
                    if (!this.mixer) {
                        this.mixer = new THREE.AnimationMixer(this.model);
                        // Play the walking animation
                        const walkAnimation = this.model.animations[0];
                        const action = this.mixer.clipAction(walkAnimation);
                        action.play();
                    }
                }
                break;

            case this.states.CHASE:
                this.moveSpeed = this.chaseSpeed;
                this.path = [];
                this.currentPathIndex = 0;
                this.animationController?.transitionToAnimation('walk');
                break;

            case this.states.CAUGHT:
                this.moveSpeed = 0;
                this.animationController?.transitionToAnimation('idle');
                break;

            case this.states.FLASHED:
                this.moveSpeed = 0;
                this.flashStartTime = currentTime;
                this.isFlashed = true;
                this.animationController?.transitionToAnimation('idle');
                break;
        }
    }
    executeStateAction(state, deltaTime, playerPosition) {
        switch (state) {
            case this.states.PATROL:
                this.executePatrolAction(deltaTime);
                break;

            case this.states.CHASE:
                this.executeChaseAction(deltaTime, playerPosition);
                break;

            case this.states.CAUGHT:
                this.executeCaughtAction(deltaTime);
                break;

            case this.states.FLASHED:
                this.executeFlashedAction(deltaTime);
                break;
        }
    }

    exitState(state) {
        switch (state) {

            case APP_SETTINGS.enemyStates.WAITING:
                break;
        }
    }
    isPointWithinMapBounds(point) {
        if (!window.GameWorld?.tilemap) return false;
        const gridPos = window.GameWorld.tilemap.worldToGridPosition(point.x, point.z);
        const mapSize = 50; // Size of the dungeon map
        return gridPos.x >= 0 && gridPos.x < mapSize &&
            gridPos.z >= 0 && gridPos.z < mapSize;
    }
    moveInDirection(targetPosition, deltaTime, lookAtTarget = true) {
        // Boundary check for targetPosition
        if (!this.isPointWithinMapBounds(targetPosition)) {
            return; // Do not move if the target is outside the map
        }
        const currentPos = this.getPosition();
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, currentPos)
            .setY(0)
            .normalize();
        const newVelocity = new CANNON.Vec3(
            direction.x * this.moveSpeed,
            this.physicsBody.velocity.y,
            direction.z * this.moveSpeed
        );
        this.physicsBody.velocity.copy(newVelocity);
        if (lookAtTarget && this.model) {
            this.updateTargetRotation(targetPosition);
        }
    }
    executeWaitAction(deltaTime, playerPosition) {
        const previousMoveSpeed = this.moveSpeed;
        this.moveSpeed = 0;
        this.moveInDirection(playerPosition, true);
        this.moveSpeed = previousMoveSpeed;
    }

    calculateDirectionToPlayer(playerPosition) {
        const currentPosition = this.getPosition();
        return new THREE.Vector3(
            playerPosition.x - currentPosition.x,
            0,
            playerPosition.z - currentPosition.z
        );
    }
    updateModelTransform() {
        if (!this.model) return;
        const physicsPos = this.getPosition();
        this.model.position.copy(physicsPos);
        this.model.position.y = Math.max(physicsPos.y, 0.1);

        this.model.quaternion.slerp(this.targetQuaternion, this.rotationSpeed * this.deltaTime);
    }
    updateHitboxPosition() {
        if (!this.hitboxMesh || !this.hitboxWireframe || !this.model) return;
        const modelPosition = this.getPosition();
        const fixedHeight = APP_SETTINGS.enemySpawns.spawnHeight || 2; // Use spawn height or default to 2
        const hitboxOffset = this.settings.hitbox?.offset || {
            x: -1,
            y: 15,
            z: 1
        };
        const newPosition = new THREE.Vector3(
            modelPosition.x + hitboxOffset.x,
            fixedHeight + hitboxOffset.y, // Use fixed height instead of modelPosition.y
            modelPosition.z + hitboxOffset.z
        );
        this.hitboxMesh.position.copy(newPosition);
        this.hitboxWireframe.position.copy(newPosition);
    }
    updateTargetRotation(targetPosition) {
        if (!this.model) return;
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, this.model.position)
            .setY(0)
            .normalize();
        const lookAtMatrix = new THREE.Matrix4();
        lookAtMatrix.lookAt(new THREE.Vector3(), direction, new THREE.Vector3(0, 1, 0));
        this.targetQuaternion.setFromRotationMatrix(lookAtMatrix);
        const rotationFix = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
        this.targetQuaternion.multiply(rotationFix);
    }

    updateDebugText() {
        if (!this.debugText) return;

        this.debugText.container.style.display = APP_SETTINGS.controls.showEnemyDebugText ? 'block' : 'none';

        this.debugText.setText('State', this.currentState);
        this.debugText.setText('Health', `${this.currentHealth}/${this.maxHealth}`);
        this.debugText.setText('Status', this.isDead ? 'DEAD' : 'ACTIVE');

        if (this.isRespawning) {
            const timeLeft = Math.max(0, (this.respawnTime - Date.now()) / 1000).toFixed(1);
            this.debugText.setText('Respawn', `In ${timeLeft}s`);
        } else {
            this.debugText.setText('Respawn', 'Ready');
        }
    }

    update(deltaTime, playerPosition) {
        this.deltaTime = deltaTime;
        this.updateDebugText();
        this.updateHitboxPosition();
        // Update animation mixer
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }

        if (this.deathEffect && this.deathEffect.active) {
            this.deathEffect.update();
        }
        if (!this.model || !playerPosition || this.isDead) {
            return;
        }
        // Ensure model stays visible during updates
        if (!this.model.visible) {
            console.warn('Enemy model visibility was false, restoring visibility');
            this.model.visible = true;
        }
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
        this.updateModelTransform();

        // Handle state transitions
        this.updateState(playerPosition);

        // Execute current state action
        this.executeStateAction(this.currentState, deltaTime, playerPosition);

        // Update pathfinding if needed
        this.updatePathfinding(playerPosition);
    }
    updateState(playerPosition) {
        const distanceToPlayer = this.getPosition().distanceTo(playerPosition);
        const currentTime = Date.now();
        switch (this.currentState) {
            case this.states.PATROL:
                // Only switch to chase if we're not already transitioning animations
                if (distanceToPlayer <= this.detectionRange &&
                    (!this.animationController ||
                        !this.animationController.isTransitioning())) {
                    this.setState(this.states.CHASE);
                }
                break;
            case this.states.CHASE:
                if (distanceToPlayer > this.detectionRange) {
                    this.setState(this.states.PATROL);
                } else if (distanceToPlayer < 2) {
                    this.setState(this.states.CAUGHT);
                }
                break;
            case this.states.CAUGHT:
                if (distanceToPlayer > 2) {
                    this.setState(this.states.CHASE);
                }
                break;
            case this.states.FLASHED:
                if (currentTime - this.flashStartTime > this.flashDuration) {
                    this.isFlashed = false;
                    this.setState(this.states.PATROL);
                }
                break;
        }
    }
    generatePatrolPoints() {
        const tilemap = window.GameWorld?.tilemap;
        if (!tilemap?.dungeonGen?.dungeonGen) return;
        // Get all rooms from the dungeon
        const rooms = tilemap.dungeonGen.dungeonGen.getRooms();
        if (!rooms || rooms.length === 0) return;
        // Find current room if not set
        if (!this.currentRoom) {
            const currentPos = this.getPosition();
            const gridPos = tilemap.worldToGridPosition(currentPos.x, currentPos.z);
            this.currentRoom = rooms.find(room =>
                gridPos.x >= room.getLeft() && gridPos.x <= room.getRight() &&
                gridPos.z >= room.getTop() && gridPos.z <= room.getBottom()
            );
        }
        // Get connected rooms through corridors
        this.patrolRooms = rooms.filter(room => {
            // Check if room has any neighbors/connections
            const hasConnections = room.neighbors && room.neighbors.length > 0;
            const isNotCurrent = room !== this.currentRoom;
            return hasConnections && isNotCurrent;
        });

        // Generate patrol points from room centers
        this.patrolPoints = this.patrolRooms.map(room => {
            const centerX = Math.floor((room.getLeft() + room.getRight()) / 2);
            const centerZ = Math.floor((room.getTop() + room.getBottom()) / 2);
            const worldPos = tilemap.gridToWorldPosition(centerX, centerZ);

            return new THREE.Vector3(
                worldPos.x,
                this.settings.position.y,
                worldPos.z
            );
        });

        // Add current room as first patrol point
        if (this.currentRoom) {
            const centerX = Math.floor((this.currentRoom.getLeft() + this.currentRoom.getRight()) / 2);
            const centerZ = Math.floor((this.currentRoom.getTop() + this.currentRoom.getBottom()) / 2);
            const worldPos = tilemap.gridToWorldPosition(centerX, centerZ);

            this.patrolPoints.unshift(new THREE.Vector3(
                worldPos.x,
                this.settings.position.y,
                worldPos.z
            ));
        }

        // Fallback if no valid points found
        if (this.patrolPoints.length === 0) {
            console.warn('No valid patrol points, adding fallback');
            this.patrolPoints.push(new THREE.Vector3(0, this.settings.position.y, 0));
        }
    }
    executePatrolAction(deltaTime) {
        if (this.patrolPoints.length === 0) {
            this.generatePatrolPoints();
            return;
        }

        const currentTime = Date.now();

        // Check if we need to wait in current room
        if (this.isWaiting) {
            if (currentTime - this.roomTransitionTime < this.roomWaitTime) {
                // Still waiting in room
                this.updateTargetRotation(this.patrolPoints[this.currentPatrolIndex], true);
                return;
            }
            // Wait time is over, move to next room
            this.isWaiting = false;
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;

            // Update current room
            if (this.patrolRooms[this.currentPatrolIndex - 1]) {
                this.currentRoom = this.patrolRooms[this.currentPatrolIndex - 1];
            }
        }

        this.isWaiting = false;
        const currentPosition = this.getPosition();
        const targetPoint = this.patrolPoints[this.currentPatrolIndex];

        // Check if reached current patrol point
        const distanceToTarget = currentPosition.distanceTo(targetPoint);
        if (distanceToTarget < 2) {
            // Start waiting
            this.isWaiting = true;
            this.waitStartTime = currentTime;

            // Move to next patrol point
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            return;
        }
        // Update pathfinding if needed
        if (Date.now() - this.pathUpdateTime > this.pathUpdateInterval) {
            this.pathUpdateTime = Date.now();
            const tilemap = window.GameWorld.tilemap;

            const astar = new ROT.Path.AStar(
                targetPoint.x,
                targetPoint.z,
                (x, y) => !tilemap.isTileOccupied(x, y), {
                    topology: 8
                }
            );

            this.path = [];
            const callback = (x, y) => {
                const worldPos = tilemap.gridToWorldPosition(x, y);
                this.path.push(worldPos);
            };

            const enemyPos = this.getPosition();
            const gridPos = tilemap.worldToGridPosition(enemyPos.x, enemyPos.z);
            astar.compute(gridPos.x, gridPos.z, callback);

            if (this.path.length > 0) {
                this.path.shift();
            }
            this.currentPathIndex = 0;
        }
        // Follow current path
        if (this.path.length > 0 && this.currentPathIndex < this.path.length) {
            const pathTarget = this.path[this.currentPathIndex];
            const distanceToPathPoint = currentPosition.distanceTo(
                new THREE.Vector3(pathTarget.x, currentPosition.y, pathTarget.z)
            );

            if (distanceToPathPoint < 1) {
                this.currentPathIndex++;
            } else {
                this.moveInDirection(
                    new THREE.Vector3(pathTarget.x, currentPosition.y, pathTarget.z),
                    deltaTime
                );
            }
        } else {
            // Direct movement if no path is available
            this.moveInDirection(targetPoint, deltaTime);
        }
    }
    executeChaseAction(deltaTime, playerPosition) {
        if (!playerPosition) return;

        const currentPosition = this.getPosition();
        const distanceToPlayer = currentPosition.distanceTo(playerPosition);

        // Update path to player more frequently during chase
        if (Date.now() - this.pathUpdateTime > this.pathUpdateInterval / 2) {
            this.updatePathfinding(playerPosition);
        }

        if (this.path.length > 0) {
            const currentTarget = this.path[this.currentPathIndex];
            const distanceToTarget = currentPosition.distanceTo(
                new THREE.Vector3(currentTarget.x, currentPosition.y, currentTarget.z)
            );

            if (distanceToTarget < 1) {
                this.currentPathIndex++;
                if (this.currentPathIndex >= this.path.length) {
                    this.path = [];
                    this.currentPathIndex = 0;
                }
            } else {
                this.moveInDirection(
                    new THREE.Vector3(currentTarget.x, currentPosition.y, currentTarget.z),
                    deltaTime,
                    true // Always look at target while chasing
                );
            }
        } else {
            // Direct movement if no path is available
            this.moveInDirection(playerPosition, deltaTime, true);
        }
    }
    executeCaughtAction(deltaTime) {
        // Implement caught behavior (e.g., game over logic)
    }
    executeFlashedAction(deltaTime) {
        // Implement stunned behavior
        this.moveSpeed = 0;
    }
    updatePathfinding(playerPosition) {
        if (this.currentState !== this.states.CHASE) return;
        const currentTime = Date.now();
        if (currentTime - this.pathUpdateTime < this.pathUpdateInterval) return;
        // Remove previous path line if it exists
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine = null;
        }
        this.pathUpdateTime = currentTime;
        const tilemap = window.GameWorld.tilemap;
        // Create ROT.js pathfinder
        const astar = new ROT.Path.AStar(
            playerPosition.x,
            playerPosition.z,
            (x, y) => {
                return !tilemap.isTileOccupied(x, y);
            }, {
                topology: 8
            }
        );
        // Calculate new path
        this.path = [];
        const callback = (x, y) => {
            const worldPos = tilemap.gridToWorldPosition(x, y);
            this.path.push(worldPos);
        };
        const enemyPos = this.getPosition();
        const gridPos = tilemap.worldToGridPosition(enemyPos.x, enemyPos.z);
        astar.compute(gridPos.x, gridPos.z, callback);
        // Remove first path point (current position)
        if (this.path.length > 0) {
            this.path.shift();
        }
        this.currentPathIndex = 0;
        // Create path visualization
        if (this.path.length > 0) {
            const points = [enemyPos]; // Start with enemy's current position
            this.path.forEach(point => {
                points.push(new THREE.Vector3(point.x, enemyPos.y + 1, point.z)); // Slightly above ground
            });

            this.pathGeometry.setFromPoints(points);
            this.pathLine = new THREE.Line(this.pathGeometry, this.pathMaterial);
            this.scene.add(this.pathLine);
        }
    }

    handleHit(damage) {
        if (this.isDead || !this.model || !this.model.visible) return;


        this.currentHealth = Math.max(0, this.currentHealth - damage);

        if (this.currentHealth <= 0) {
            this.die();
        }
    }
    die() {
        if (this.isDead) return;
        // Start death sequence with animations and effects
        this.startDeathSequence();
        // Set respawn timer if enabled in settings
        if (APP_SETTINGS.controls.enableEnemyRespawn) {
            setTimeout(() => {
                this.respawn();
            }, 1000); // 1 second respawn delay
        }
    }

    removePathVisualization() {
        if (this.pathLine) {
            this.scene.remove(this.pathLine);
            this.pathLine = null;
        }
    }

    startDeathSequence() {
        this.removePathVisualization();
        // Immediately hide the model
        if (this.model) {
            this.model.visible = false;
        }
        this.isDead = true;
        this.updateDebugText();
        if (this.model) {
            this.deathEffect = new ParticleDeathEffect({
                THREE: THREE,
                scene: this.scene,
                model: this.model,
                duration: 1000 // Optional, defaults to 1000ms
            });
            this.deathEffect.start();
        }
        if (this.physicsBody) {
            this.physicsBody.sleep();
        }
    }
    respawn() {
        if (!this.isDead) return;
        this.currentHealth = this.maxHealth;
        this.isDead = false;
        const spawnPositions = APP_SETTINGS.enemySpawns.positions;
        const randomIndex = Math.floor(Math.random() * spawnPositions.length);
        const spawnPoint = spawnPositions[randomIndex];

        // Validate spawn point exists
        if (!spawnPoint || typeof spawnPoint.x === 'undefined' || typeof spawnPoint.z === 'undefined') {
            console.error('Invalid spawn point selected:', spawnPoint);
            return;
        }

        const worldXZ = window.GameWorld.tilemap.gridToWorldPosition(spawnPoint.x, spawnPoint.z);

        // Validate world position conversion
        if (!worldXZ || typeof worldXZ.x === 'undefined' || typeof worldXZ.z === 'undefined') {
            console.error('Invalid world position calculated:', worldXZ);
            return;
        }

        const newPosition = new THREE.Vector3(
            worldXZ.x,
            APP_SETTINGS.enemySpawns.spawnHeight,
            worldXZ.z
        );

        console.log('Enemy respawning at position:', newPosition);
        this.setPosition(newPosition);
        if (this.model) {
            this.model.position.copy(newPosition);
            this.model.visible = true;
        }
        if (this.physicsBody) {
            this.physicsBody.wakeUp();
        }

        this.updateDebugText();
        console.log('Enemy respawned');
    }
}


class Player {
    constructor(camera) {
        this.settings = {
            moveSpeed: 36,
            jumpSpeed: 45,
            offset: {
                y: 16
            },
            sensitivity: {
                x: 0.002,
                y: 0.002
            },
            dimensions: {
                width: 1,
                height: 15,
                depth: 1
            },
            position: {
                x: 0,
                y: 0,
                z: 120
            }
        };
        this.isGrounded = false;
        // State machine properties
        this.states = {
            IDLE: 'IDLE',
            MOVING: 'MOVING',
            JUMPING: 'JUMPING'
        };
        this.currentState = this.states.IDLE;
        this.previousState = null;
        this.moveSpeed = this.settings.moveSpeed;
        this.velocity = new THREE.Vector3();
        this.moveDirection = new CANNON.Vec3();
        this.camera = camera;
        this.position = new THREE.Vector3(
            this.settings.position.x,
            this.settings.position.y + this.settings.offset.y,
            this.settings.position.z
        );



        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            jumping: false
        };
        this.createPhysicsBody(
            new CANNON.Vec3(
                this.settings.dimensions.width,
                this.settings.dimensions.height,
                this.settings.dimensions.depth
            ),
            new CANNON.Vec3(
                this.settings.position.x,
                this.settings.position.y + this.settings.offset.y,
                this.settings.position.z
            )
        );
        this.initKeyBindings();
    }
    canJump() {
        return this.isGrounded && !this.keys.jumping;
    }
    jump() {
        if (this.canJump()) {
            this.physicsBody.velocity.y = this.settings.jumpSpeed;
            this.keys.jumping = true;
            this.setState(this.states.JUMPING);
        }
    }
    createPhysicsBody(dimensions, position) {
        const shape = new CANNON.Box(dimensions);
        this.physicsBody = new CANNON.Body({
            mass: 70,
            shape: shape,
            material: window.GameWorld.playerPhysMaterial,
            position: position,
            fixedRotation: true // Prevent player from tipping over
        });
        // Set collision groups
        this.physicsBody.collisionFilterGroup = APP_SETTINGS.physics.collisionGroups.PLAYER;
        this.physicsBody.collisionFilterMask =
            APP_SETTINGS.physics.collisionGroups.GROUND |
            APP_SETTINGS.physics.collisionGroups.OBSTACLE;
        // Add to physics world
        window.GameWorld.physicsWorld.addBody(this.physicsBody);
    }
    getPosition() {
        return this.position.clone();
    }
    getWorldPosition() {
        return this.camera.getWorldPosition(new THREE.Vector3());
    }
    getWorldDirection() {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);
        return direction;
    }

    initKeyBindings() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Space':
                    if (this.canJump()) {
                        this.jump();
                    }
                    break;
                case 'KeyW':
                    this.keys.forward = true;
                    break;
                case 'KeyS':
                    this.keys.backward = true;
                    break;
                case 'KeyA':
                    this.keys.left = true;
                    break;
                case 'KeyD':
                    this.keys.right = true;
                    break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW':
                    this.keys.forward = false;
                    break;
                case 'KeyS':
                    this.keys.backward = false;
                    break;
                case 'KeyA':
                    this.keys.left = false;
                    break;
                case 'KeyD':
                    this.keys.right = false;
                    break;
            }
        });
    }
    // State machine methods
    enterState(newState) {
        switch (newState) {
            case this.states.IDLE:
                this.moveDirection.set(0, 0, 0);
                break;
            case this.states.MOVING:
                break;
            case this.states.JUMPING:
                break;
        }
    }
    exitState(currentState) {
        switch (currentState) {
            case this.states.IDLE:
                break;
            case this.states.MOVING:
                this.moveDirection.set(0, 0, 0);
                break;
            case this.states.JUMPING:
                // Heavily dampen vertical velocity when landing
                this.physicsBody.velocity.y *= 0.1; // Reduce y velocity by 90%
                // Preserve horizontal velocity when transitioning from jumping
                this.moveDirection.x = this.physicsBody.velocity.x;
                this.moveDirection.z = this.physicsBody.velocity.z;
                break;
        }
    }
    setState(newState) {
        if (newState === this.currentState) return;

        // Exit current state
        this.exitState(this.currentState);

        // Store previous state before changing
        this.previousState = this.currentState;
        this.currentState = newState;

        // Enter new state
        this.enterState(newState);
    }
    executeStateAction(state, deltaTime) {
        switch (state) {
            case this.states.IDLE:
                // Handle idle behavior
                break;
            case this.states.MOVING:
            case this.states.JUMPING:
                // Handle movement behavior (both ground and air)
                const moveDirection = this.handleMovementInput();
                this.updatePhysics(moveDirection);
                break;
        }
    }
    update(deltaTime) {
        const isMouseDown = window.Input.isMouseDown;
        const wasGrounded = this.isGrounded;
        this.checkGrounded();
        // Handle state transitions
        const isMoving = this.keys.forward || this.keys.backward ||
            this.keys.left || this.keys.right;
        switch (this.currentState) {
            case this.states.IDLE:
                if (isMoving) {
                    this.setState(this.states.MOVING);
                } else if (!this.isGrounded) {
                    this.setState(this.states.JUMPING);
                }
                break;
            case this.states.MOVING:
                if (!isMoving) {
                    this.setState(this.states.IDLE);
                } else if (!this.isGrounded) {
                    this.setState(this.states.JUMPING);
                }
                break;
            case this.states.JUMPING:
                if (!wasGrounded && this.isGrounded) {
                    this.keys.jumping = false;
                    this.setState(this.states.IDLE);
                }
                break;
        }
        // Execute current state
        this.executeStateAction(this.currentState, deltaTime);

        const moveDirection = this.handleMovementInput();
        this.updatePhysics(moveDirection);
    }

    handleMovementInput() {
        const forward = window.CameraControl.getForwardVector();
        const right = window.CameraControl.getRightVector();
        forward.y = 0;
        right.y = 0;
        forward.normalize();
        right.normalize();

        // Reset move direction
        this.moveDirection.set(0, 0, 0);

        // Accumulate movement input
        if (this.keys.forward) this.moveDirection.vadd(new CANNON.Vec3(forward.x, 0, forward.z), this.moveDirection);
        if (this.keys.backward) this.moveDirection.vsub(new CANNON.Vec3(forward.x, 0, forward.z), this.moveDirection);
        if (this.keys.right) this.moveDirection.vadd(new CANNON.Vec3(right.x, 0, right.z), this.moveDirection);
        if (this.keys.left) this.moveDirection.vsub(new CANNON.Vec3(right.x, 0, right.z), this.moveDirection);

        // Normalize the movement direction if there is any movement
        if (this.moveDirection.length() > 0) {
            this.moveDirection.normalize();
        }

        return this.moveDirection;
    }
    setVelocity(x, y, z) {
        this.physicsBody.velocity.x = x;
        this.physicsBody.velocity.y = y;
        this.physicsBody.velocity.z = z;
    }
    setPosition(x, y, z) {
        // Validate input values
        if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) {
            console.warn('Player.setPosition received invalid coordinates:', {
                x,
                y,
                z
            });
            return;
        }
        // Update internal position with validated values
        this.position.set(x, y, z);
        // Update physics body with validation
        if (this.physicsBody) {
            this.physicsBody.position.set(x, y, z);
            if (!Number.isFinite(this.physicsBody.position.x) ||
                !Number.isFinite(this.physicsBody.position.y) ||
                !Number.isFinite(this.physicsBody.position.z)) {
                console.warn('Physics body position became invalid after update');
                this.physicsBody.position.set(0, 20, 0); // Reset to safe position
            }
        }
        // Update camera position with validation
        if (this.camera) {
            const safePosition = new THREE.Vector3(
                Number.isFinite(this.position.x) ? this.position.x : 0,
                Number.isFinite(this.position.y) ? this.position.y : 20,
                Number.isFinite(this.position.z) ? this.position.z : 0
            );
            this.camera.position.copy(safePosition);
        }
    }
    updatePhysics(moveDirection) {
        if (!this.physicsBody) return;
        // Always set velocity based on moveDirection, zero if no input
        const velocityX = moveDirection.length() > 0 ? moveDirection.x * this.moveSpeed : 0;
        const velocityZ = moveDirection.length() > 0 ? moveDirection.z * this.moveSpeed : 0;

        this.setVelocity(
            velocityX,
            this.physicsBody.velocity.y,
            velocityZ
        );
        // Update position after physics calculation
        this.updatePhysicsPosition();
    }
    updatePhysicsPosition() {
        if (this.physicsBody) {
            // Validate physics body position
            if (!Number.isFinite(this.physicsBody.position.x) ||
                !Number.isFinite(this.physicsBody.position.y) ||
                !Number.isFinite(this.physicsBody.position.z)) {
                console.warn('Invalid physics body position detected:', this.physicsBody.position);
                this.physicsBody.position.set(0, 20, 0); // Reset to safe position
                return;
            }
            // Calculate minimum allowed height with validation
            const minHeight = Number.isFinite(this.settings.position.y + this.settings.offset.y) ?
                this.settings.position.y + this.settings.offset.y :
                20;
            // Ensure y position never goes below minimum height
            const yPosition = Math.max(this.physicsBody.position.y, minHeight);
            // Validate velocity before updating
            if (this.physicsBody.position.y < minHeight) {
                const safeVelocity = Math.max(0, this.physicsBody.velocity.y);
                if (Number.isFinite(safeVelocity)) {
                    this.physicsBody.velocity.y = safeVelocity;
                } else {
                    this.physicsBody.velocity.y = 0;
                }
            }
            // Update position with validated values
            this.setPosition(
                this.physicsBody.position.x,
                yPosition,
                this.physicsBody.position.z
            );
        }
    }
    checkGrounded() {
        if (!window.GameWorld?.tilemap) {
            return false;
        }
        this.lastRayDistance = Infinity;
        // Initialize ray if not already created
        if (!this.groundRay) {
            this.groundRay = new Ray({
                THREE: THREE,
                far: 16.5 // Increased to match new offset
            });
        }
        // Start the ray from the actual physics body position
        const rayStart = new THREE.Vector3(
            this.physicsBody.position.x,
            this.physicsBody.position.y,
            this.physicsBody.position.z
        );
        this.lastRayStartY = rayStart.y;
        const direction = new THREE.Vector3(0, -1, 0);
        // Update ray position and direction
        this.groundRay.update(rayStart, direction);
        // Get all collidable objects from the tilemap
        const tiles = window.GameWorld.tilemap.getTiles();
        const obstacles = window.GameWorld.tilemap.getObstacles();
        const walls = window.GameWorld.tilemap.getWalls();
        this.isGrounded = false;
        // Function to check intersection with a mesh
        const checkMeshIntersection = (mesh) => {
            if (!mesh) return false;
            const intersection = this.groundRay.checkIntersection(mesh);
            if (intersection && intersection.distance < this.lastRayDistance) {
                this.lastRayDistance = intersection.distance;
                return true;
            }
            return false;
        };
        // Check intersection with tiles
        for (const tile of tiles) {
            if (tile?.mesh && checkMeshIntersection(tile.mesh)) {
                this.isGrounded = true;
            }
        }
        // Check intersection with obstacles
        for (const obstacle of obstacles) {
            if (obstacle?.mesh && checkMeshIntersection(obstacle.mesh)) {
                this.isGrounded = true;
            }
        }
        // Check intersection with walls
        for (const wall of walls) {
            if (wall?.mesh && checkMeshIntersection(wall.mesh)) {
                this.isGrounded = true;
            }
        }
        return this.isGrounded;
    }
}

class DebugText {
    constructor(options = {}) {
        this.container = document.createElement('div');
        this.container.style.position = 'fixed';
        this.container.style.left = options.left || '20px';
        this.container.style.top = options.top || '50%';
        this.container.style.transform = 'translateY(-50%)';
        this.container.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.container.style.padding = '10px';
        this.container.style.borderRadius = '5px';
        this.container.style.color = 'white';
        this.container.style.fontFamily = 'monospace';
        this.container.style.fontSize = '14px';
        this.container.style.zIndex = '1000';
        this.container.style.pointerEvents = 'none';
        this.container.style.lineHeight = '1.5';
        this.container.style.minWidth = '200px';

        document.body.appendChild(this.container);

        this.lines = new Map();
    }

    setText(key, value) {
        this.lines.set(key, value);
        this.updateDisplay();
    }

    updateDisplay() {
        let text = '';
        this.lines.forEach((value, key) => {
            text += `${key}: ${value}\n`;
        });
        this.container.innerHTML = text.replace(/\n/g, '<br>');
    }

    clear() {
        this.lines.clear();
        this.updateDisplay();
    }

    remove() {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}


class HUD {
    constructor(params) {
        // Validate required parameters
        if (!params) {
            throw new Error('HUD: params object is required');
        }
        this.isVisible = false;
        // Required dependencies
        const required = ['uiContainer', 'AmmoDisplay', 'Crosshair', 'GunLoadoutPanel', 'GunHUDContainer', 'settings'];
        for (const prop of required) {
            if (!params[prop]) {
                throw new Error(`HUD: ${prop} is required`);
            }
        }
        // Store dependencies
        this.container = params.uiContainer;
        this.Crosshair = params.Crosshair;
        this.Player = params.Player; // Optional, will be checked during update
        this.settings = params.settings;
        // Initialize components
        this.components = {
            Crosshair: null,
        };
    }
    init() {
        try {
            this.components.Crosshair = new this.Crosshair({
                uiContainer: this.container
            });
        } catch (error) {
            console.error('HUD: Failed to initialize components:', error);
            throw error;
        }
    }

    show() {
        this.isVisible = true;
    }
    hide() {
        this.isVisible = false;
    }
    update() {
        try {

        } catch (error) {
            console.warn('HUD: Error during update:', error);
        }
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
        this.init();
    }
    loadScript(url) {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve();
                return;
            }
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Script loading failed for ' + url));
            document.head.appendChild(script);
        });
    }

    async loadScripts() {
        try {
            for (const script of SCRIPT_ASSETS) {
                await this.loadScript(script.url);
                console.log(`Script loaded: ${script.name}`);
            }
        } catch (error) {
            console.error('Error loading scripts:', error);
        }
    }

    async init() {
        await this.loadScripts();
        window.LoadingManager = new THREE.LoadingManager();
        this.setupLoadingManager();
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
        window.Player = new Player(MainCamera);
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
        const enemyLoader = new EnemyLoader({
            THREE: THREE,
            FBXLoader: FBXLoader,
            LoadingManager: window.LoadingManager
        });
        try {
            // Get all rooms from the dungeon generator
            const rooms = GameWorld.tilemap?.dungeonGen?.dungeonGen?.getRooms() || [];
            if (rooms.length === 0) {
                throw new Error('No rooms available for enemy spawn');
            }
            // Select a random room different from player's room
            let selectedRoom;
            let attempts = 0;
            const playerPos = window.Player.getPosition();
            const playerGridPos = GameWorld.tilemap.worldToGridPosition(playerPos.x, playerPos.z);
            do {
                const randomIndex = Math.floor(Math.random() * rooms.length);
                selectedRoom = rooms[randomIndex];
                const roomCenterX = Math.floor(selectedRoom.getLeft() + selectedRoom.getRight()) / 2;
                const roomCenterZ = Math.floor(selectedRoom.getTop() + selectedRoom.getBottom()) / 2;
                const distanceToPlayer = Math.sqrt(
                    Math.pow(roomCenterX - playerGridPos.x, 2) +
                    Math.pow(roomCenterZ - playerGridPos.z, 2)
                );
                // Ensure minimum distance from player (adjust value as needed)
                if (distanceToPlayer > 10) {
                    break;
                }
                attempts++;
            } while (attempts < 10);
            // Convert room center to world coordinates
            const centerX = Math.floor(selectedRoom.getLeft() + selectedRoom.getRight()) / 2;
            const centerZ = Math.floor(selectedRoom.getTop() + selectedRoom.getBottom()) / 2;
            const worldPos = GameWorld.tilemap.gridToWorldPosition(centerX, centerZ);
            const spawnPosition = {
                x: worldPos.x,
                y: APP_SETTINGS.enemySpawns.spawnHeight,
                z: worldPos.z
            };

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
            loadingScreen.innerHTML = `Loading...`;
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
        loadingScreen.innerHTML = 'Loading...';
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
        // First check if the world and tilemap are properly initialized
        if (!window.GameWorld || !window.GameWorld.tilemap) {
            console.error('GameWorld or tilemap not initialized');
            console.groupEnd();
            return {
                x: 0,
                y: APP_SETTINGS.camera.initialPosition.y,
                z: 0
            };
        }
        try {
            console.log('GameWorld and tilemap are initialized');
            // Get all rooms from the dungeon generator
            const rooms = window.GameWorld.tilemap.dungeonGen?.dungeonGen?.getRooms() || [];
            let selectedRoom;
            // Process rooms into the format we need
            const processedRooms = rooms.map(room => ({
                left: room.getLeft(),
                right: room.getRight(),
                top: room.getTop(),
                bottom: room.getBottom(),
                isConnected: true // All rooms from ROT.js are connected
            }));

            console.log('Processed rooms:', processedRooms);
            console.log('Retrieved rooms:', rooms);
            console.log('Total number of rooms:', rooms.length);

            // Log detailed room information
            rooms.forEach((room, index) => {
                console.group(`Room ${index + 1}`);
                console.log('Dimensions:', {
                    left: room.left,
                    right: room.right,
                    top: room.top,
                    bottom: room.bottom,
                    width: room.right - room.left + 1,
                    height: room.bottom - room.top + 1
                });
                console.log('Center:', {
                    x: Math.floor((room.left + room.right) / 2),
                    z: Math.floor((room.top + room.bottom) / 2)
                });
                console.log('Is Connected:', room.isConnected);
                console.log('Number of neighbors:', room.neighbors?.length || 0);
                console.groupEnd();
            });
            if (rooms.length === 0) {
                console.error('No rooms available in dungeon');
                console.groupEnd();
                throw new Error('No rooms available in dungeon');
            }

            for (const room of rooms) {
                if (room.isConnected) {
                    selectedRoom = room;
                    console.log('Found connected room:', {
                        position: {
                            left: room.left,
                            right: room.right,
                            top: room.top,
                            bottom: room.bottom
                        },
                        neighbors: room.neighbors?.length || 0
                    });
                    break;
                }
            }
            // If no connected room found, just take the first room
            if (!selectedRoom) {
                console.warn('No connected room found, using first available room');
                selectedRoom = rooms[0];
                console.log('Selected first room:', {
                    position: {
                        left: selectedRoom.left,
                        right: selectedRoom.right,
                        top: selectedRoom.top,
                        bottom: selectedRoom.bottom
                    }
                });
            }

            // Calculate center position in grid coordinates
            const centerX = Math.floor((selectedRoom.left + selectedRoom.right) / 2);
            const centerZ = Math.floor((selectedRoom.top + selectedRoom.bottom) / 2);
            console.log('Calculated room center:', {
                centerX,
                centerZ
            });
            // Convert to world coordinates with proper centering
            const gridSize = 31; // Total dungeon size
            const tileSize = window.GameWorld.tilemap.tileSize;
            const worldX = (centerX - (gridSize / 2)) * tileSize;
            const worldZ = (centerZ - (gridSize / 2)) * tileSize;
            const worldPosition = {
                x: worldX,
                z: worldZ
            };
            const offset = 0; // No additional offset needed with centered calculation
            console.log('Final spawn position:', {
                worldPosition,
                tileSize,
                offset,
                final: {
                    x: worldPosition.x + offset,
                    y: APP_SETTINGS.camera.initialPosition.y,
                    z: worldPosition.z + offset
                }
            });
            console.groupEnd();
            return {
                x: worldPosition.x + offset,
                y: APP_SETTINGS.camera.initialPosition.y,
                z: worldPosition.z + offset
            };
        } catch (error) {
            console.error('Error finding spawn position:', error);
            console.error('Error stack:', error.stack);
            console.groupEnd();
            // Return a safe default position if something goes wrong
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
class Room {
    constructor(params) {
        if (!params) throw new Error('Room: params are required');
        // Validate required dependencies
        const required = ['THREE', 'tileMap', 'settings'];
        required.forEach(prop => {
            if (!params[prop]) throw new Error(`Room: ${prop} is required`);
        });
        // Connection tracking
        this.connections = new Map(); // Map of connected rooms and their shared doors
        this.doors = new Set(); // Set of door positions
        this.connectedRooms = new Set(); // Set of connected room references
        // Store dependencies
        this.THREE = params.THREE;
        this.tileMap = params.tileMap;
        this.settings = params.settings;
        // Core properties
        this.id = params.id || Math.random().toString(36).substr(2, 9);
        this.type = params.type || 'STANDARD';
        this.name = params.name || `Room ${this.id}`;
        this.label = null; // THREE.Sprite for room label
        // Tile and position data
        this.tiles = new Set(); // Store tile references
        this.boundaries = {
            left: params.left,
            right: params.right,
            top: params.top,
            bottom: params.bottom
        };
        // Calculate dimensions
        this.dimensions = {
            width: this.boundaries.right - this.boundaries.left + 1,
            height: this.boundaries.bottom - this.boundaries.top + 1
        };
        // Calculate positions
        this.positions = {
            grid: {
                center: {
                    x: Math.floor((this.boundaries.left + this.boundaries.right) / 2),
                    z: Math.floor((this.boundaries.top + this.boundaries.bottom) / 2)
                }
            },
            world: this.calculateWorldPosition()
        };
        // Room features
        this.features = new Map(); // Map of feature name to feature object
        this.entities = new Set(); // Set of entities in the room
        this.initialized = false;
        // Initialize room
        this.init();
    }
    // Room connection methods
    addConnection(room, doorPosition) {
        if (!room || !(room instanceof Room)) {
            throw new Error('Invalid room provided for connection');
        }
        // Add door position
        this.doors.add(doorPosition);
        // Add connected room
        this.connectedRooms.add(room);
        // Store connection details
        this.connections.set(room.id, {
            room: room,
            doorPosition: doorPosition
        });
        // Add reciprocal connection if it doesn't exist
        if (!room.isConnectedTo(this)) {
            room.addConnection(this, doorPosition);
        }
    }
    removeConnection(room) {
        if (!room || !this.connections.has(room.id)) return;
        // Get connection details
        const connection = this.connections.get(room.id);
        // Remove door position
        this.doors.delete(connection.doorPosition);
        // Remove from connected rooms
        this.connectedRooms.delete(room);
        // Remove connection
        this.connections.delete(room.id);
        // Remove reciprocal connection
        if (room.isConnectedTo(this)) {
            room.removeConnection(this);
        }
    }
    isConnectedTo(room) {
        return this.connections.has(room.id);
    }
    getDoors() {
        // Return array of door positions without requiring a callback
        return Array.from(this.doors);
    }
    // Add helper method to check if room has doors
    hasDoors() {
        return this.doors.size > 0;
    }
    getConnectedRooms() {
        return Array.from(this.connectedRooms);
    }
    getConnectionDetails(room) {
        return this.connections.get(room.id);
    }
    init() {
        this.collectTiles();
        this.createRoomLabel();
        this.initializeRoomType();
    }
    calculateWorldPosition() {
        const gridCenter = Math.floor(this.tileMap.width / 2);
        const tileSize = this.tileMap.tileSize;

        return {
            center: {
                x: (this.positions.grid.center.x - gridCenter) * tileSize,
                y: 0,
                z: (this.positions.grid.center.z - gridCenter) * tileSize
            },
            bounds: {
                min: {
                    x: (this.boundaries.left - gridCenter) * tileSize,
                    z: (this.boundaries.top - gridCenter) * tileSize
                },
                max: {
                    x: (this.boundaries.right - gridCenter) * tileSize,
                    z: (this.boundaries.bottom - gridCenter) * tileSize
                }
            }
        };
    }
    collectTiles() {
        // Get all tiles within room boundaries
        for (let x = this.boundaries.left; x <= this.boundaries.right; x++) {
            for (let z = this.boundaries.top; z <= this.boundaries.bottom; z++) {
                const tile = this.tileMap.getTileAt(x, z);
                if (tile) {
                    this.tiles.add(tile);
                }
            }
        }
    }
    createRoomLabel() {
        // Create text sprite for room label
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 256;
        // Configure text style
        context.font = 'Bold 36px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        // Draw room name and type
        context.fillText(`${this.name}`, 128, 108);
        context.font = '24px Arial';
        context.fillText(`(${this.type})`, 128, 148);
        // Create sprite
        const texture = new this.THREE.CanvasTexture(canvas);
        const spriteMaterial = new this.THREE.SpriteMaterial({
            map: texture
        });
        this.label = new this.THREE.Sprite(spriteMaterial);
        // Position label above room center
        this.label.position.set(
            this.positions.world.center.x,
            20, // Height above ground
            this.positions.world.center.z
        );
        this.label.scale.set(10, 10, 1);
    }
    initializeRoomType() {
        if (this.initialized) return;
        switch (this.type) {
            case 'SAFE':
                this.initializeSafeRoom();
                break;
            case 'BOSS':
                this.initializeBossRoom();
                break;
            default:
                this.initializeStandardRoom();
        }
        this.initialized = true;
    }
    initializeSafeRoom() {
        // Add safe room specific features with positions
        this.features.set('RESPAWN_POINT', {
            position: this.positions.world.center,
            active: true
        });

        this.features.set('HEALTH_STATION', {
            position: {
                x: this.positions.world.center.x + 5,
                y: 0,
                z: this.positions.world.center.z
            },
            active: true
        });
        // Update room appearance for safe room
        this.tiles.forEach(tile => {
            if (tile.mesh) {
                tile.mesh.material.color.setHex(0x4444ff);
            }
        });
    }
    initializeStandardRoom() {
        if (Math.random() < 0.3) {
            this.features.set('LOOT_SPAWN', {
                position: this.positions.world.center,
                active: true,
                lootType: 'RANDOM'
            });
        }
    }
    initializeBossRoom() {
        this.features.set('BOSS_SPAWN', {
            position: this.positions.world.center,
            active: true,
            bossType: 'RANDOM'
        });
        this.features.set('LOOT_SPAWN', {
            position: {
                x: this.positions.world.center.x,
                y: 0,
                z: this.positions.world.center.z + 5
            },
            active: false, // Activated after boss defeat
            lootType: 'BOSS'
        });
        // Update room appearance for boss room
        this.tiles.forEach(tile => {
            if (tile.mesh) {
                tile.mesh.material.color.setHex(0xff4444);
            }
        });
    }
    // Utility methods
    addFeature(featureName, featureData) {
        this.features.set(featureName, featureData);
    }
    // Check if room has valid connections
    hasValidConnections() {
        return this.connections.size > 0 &&
            Array.from(this.connections.values()).every(conn =>
                conn.room && conn.doorPosition);
    }
    // Get number of connections
    getConnectionCount() {
        return this.connections.size;
    }
    removeFeature(featureName) {
        this.features.delete(featureName);
    }
    addEntity(entity) {
        this.entities.add(entity);
    }
    removeEntity(entity) {
        this.entities.delete(entity);
    }
    showLabel() {
        if (this.label && !this.label.parent) {
            this.tileMap.scene.add(this.label);
        }
    }
    hideLabel() {
        if (this.label && this.label.parent) {
            this.tileMap.scene.remove(this.label);
        }
    }
    // Get room data
    getRoomData() {
        return {
            id: this.id,
            type: this.type,
            name: this.name,
            position: this.positions,
            dimensions: this.dimensions,
            features: Array.from(this.features.entries()),
            entities: Array.from(this.entities),
            tileCount: this.tiles.size
        };
    }
}
class DungeonGenerator {
    constructor() {
        this.gridCellSize = 20; // Size of each grid cell in world units (matching APP_SETTINGS.tilemap.tileSize)
        this.gridSize = 31; // Total size of dungeon grid
        this.gridCenter = Math.floor(this.gridSize / 2); // Center point of grid
        this.spatialGrid = {}; // Grid-based spatial partitioning
        this.dungeonGen = new ROT.Map.Digger(31, 31, {
            roomWidth: [2, 6], // Adjusted room sizes for better gameplay
            roomHeight: [2, 6], // Adjusted room sizes for better gameplay            corridorLength: [2, 8], // More varied corridor lengths
            dugPercentage: 0.4, // Increase dug percentage for more corridors
            timeLimit: 2000, // Increase time limit for more complex generation
            corridorDirections: [1, 2, 3, 4], // Allow all directions for corridors
            canConnectDiagonally: false // Allow diagonal connections
        });
        this.map = {};
        this.rooms = [];
        this.corridors = [];
        this.processedRooms = []; // Store processed room data
    }
    generate() {
        console.group('Dungeon Generation Process');
        console.log('Starting dungeon generation...');
        // Store dig callback context
        const digCallback = (x, y, value) => {
            if (!this.map[x]) {
                this.map[x] = {};
            }
            this.map[x][y] = value;
        };
        // Helper function to process room data
        const processRoom = (room) => {
            return {
                id: Math.random().toString(36).substr(2, 9),
                left: room.getLeft(),
                right: room.getRight(),
                top: room.getTop(),
                bottom: room.getBottom(),
                center: {
                    x: Math.floor((room.getLeft() + room.getRight()) / 2),
                    z: Math.floor((room.getTop() + room.getBottom()) / 2)
                },
                width: room.getRight() - room.getLeft() + 1,
                height: room.getBottom() - room.getTop() + 1,
                area: (room.getRight() - room.getLeft() + 1) * (room.getBottom() - room.getTop() + 1),
                isConnected: false,
                neighbors: []
            };
        };

        // Generate map with multiple attempts if needed
        let attempts = 0;
        const maxAttempts = 5;
        console.log(`Maximum generation attempts: ${maxAttempts}`);
        do {
            console.log(`\nAttempt ${attempts + 1} of ${maxAttempts}`);
            // Clear previous map data
            this.map = {};
            attempts++;
            // Generate new map
            console.log('Creating new dungeon layout...');
            this.dungeonGen.create(digCallback.bind(this));
            // Get rooms and corridors
            this.rooms = this.dungeonGen.getRooms();
            this.corridors = this.dungeonGen.getCorridors();
            console.log(`Generated ${this.rooms.length} rooms and ${this.corridors.length} corridors`);

        } while (attempts < maxAttempts &&
            (this.rooms.length < 8 || this.corridors.length < 10));
        // Get final rooms and corridors
        this.rooms = this.dungeonGen.getRooms();
        this.corridors = this.dungeonGen.getCorridors();
        console.log('\nFinal dungeon statistics:');
        console.log(`- Total attempts: ${attempts}`);
        console.log(`- Final room count: ${this.rooms.length}`);
        console.log(`- Final corridor count: ${this.corridors.length}`);
        console.log(`- Generation ${attempts < maxAttempts ? 'succeeded' : 'reached max attempts'}`);

        console.groupEnd();
        // Process and store room data
        this.processedRooms = this.rooms.map(room => processRoom(room));

        // Process room connectivity
        this.processRoomConnectivity();

        console.log(`Processed ${this.processedRooms.length} rooms with connectivity`);
    }
    // Add new methods to work with rooms
    processRoomConnectivity() {
        this.processedRooms.forEach((room, i) => {
            this.processedRooms.forEach((otherRoom, j) => {
                if (i !== j) {
                    const distance = Math.sqrt(
                        Math.pow(room.center.x - otherRoom.center.x, 2) +
                        Math.pow(room.center.z - otherRoom.center.z, 2)
                    );
                    if (distance < 15) { // Adjust this threshold as needed
                        room.neighbors.push({
                            id: otherRoom.id,
                            distance: distance
                        });
                    }
                }
            });
            room.isConnected = room.neighbors.length > 0;
        });
    }
    getRooms() {
        return this.processedRooms;
    }
    getRandomRoom(excludeIds = []) {
        const availableRooms = this.processedRooms.filter(room =>
            !excludeIds.includes(room.id) && room.isConnected);

        if (availableRooms.length === 0) return null;

        return availableRooms[Math.floor(Math.random() * availableRooms.length)];
    }
    getRoomById(id) {
        return this.processedRooms.find(room => room.id === id);
    }
    getConnectedRooms(roomId) {
        const room = this.getRoomById(roomId);
        if (!room) return [];
        return room.neighbors.map(neighbor => this.getRoomById(neighbor.id));
    }
    getFarthestRooms() {
        let maxDistance = 0;
        let farthestPair = null;
        this.processedRooms.forEach((room1, i) => {
            this.processedRooms.forEach((room2, j) => {
                if (i < j) {
                    const distance = Math.sqrt(
                        Math.pow(room1.center.x - room2.center.x, 2) +
                        Math.pow(room1.center.z - room2.center.z, 2)
                    );
                    if (distance > maxDistance && room1.isConnected && room2.isConnected) {
                        maxDistance = distance;
                        farthestPair = [room1, room2];
                    }
                }
            });
        });
        return farthestPair;
    }
    // Helper method to initialize spatial grid
    initSpatialGrid() {
        this.spatialGrid = {};
        for (let x in this.map) {
            for (let y in this.map[x]) {
                if (this.map[x][y] === 1) { // If it's a wall
                    const gridX = Math.floor(x / this.gridCellSize);
                    const gridY = Math.floor(y / this.gridCellSize);
                    const gridKey = `${gridX},${gridY}`;

                    if (!this.spatialGrid[gridKey]) {
                        this.spatialGrid[gridKey] = [];
                    }
                    this.spatialGrid[gridKey].push({
                        x: parseInt(x),
                        y: parseInt(y)
                    });
                }
            }
        }
    }

    // Helper method to get nearby walls
    getNearbyWalls(position) {
        const gridX = Math.floor((position.x / this.gridCellSize) + this.gridCenter);
        const gridY = Math.floor((position.z / this.gridCellSize) + this.gridCenter);

        const nearbyWalls = [];
        // Check surrounding grid cells (including current cell)
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const checkGridKey = `${Math.floor(gridX / this.gridCellSize) + dx},${Math.floor(gridY / this.gridCellSize) + dy}`;
                if (this.spatialGrid[checkGridKey]) {
                    nearbyWalls.push(...this.spatialGrid[checkGridKey]);
                }
            }
        }
        return nearbyWalls;
    }
    createMeshes() {
        // Initialize spatial grid before creating meshes
        this.initSpatialGrid();
        const wallMaterial = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.7,
            metalness: 0.2,
            transparent: false,
            side: THREE.FrontSide
        });

        const ceilingMaterial = new THREE.MeshStandardMaterial({
            color: 0x505050,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.FrontSide
        });
        const wireframeMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            wireframe: true,
            wireframeLinewidth: 2
        });
        const floorMaterial = new THREE.MeshStandardMaterial({
            color: 0x505050,
            roughness: 0.8,
            metalness: 0.1
        });
        const wallsGroup = new THREE.Group();
        const floorsGroup = new THREE.Group();
        const ceilingGroup = new THREE.Group();
        // Helper function to find connected wall segments
        const findConnectedWalls = (startX, startY, direction) => {
            let length = 1;
            let x = startX;
            let y = startY;

            if (direction === 'horizontal') {
                x++;
                while (x < 50 && this.map[x]?.[y] === 1 &&
                    (!this.map[x]?.[y - 1] || this.map[x][y - 1] === 1) === (!this.map[startX]?.[y - 1] || this.map[startX][y - 1] === 1) &&
                    (!this.map[x]?.[y + 1] || this.map[x][y + 1] === 1) === (!this.map[startX]?.[y + 1] || this.map[startX][y + 1] === 1)) {
                    length++;
                    x++;
                }
            } else {
                y++;
                while (y < 50 && this.map[x]?.[y] === 1 &&
                    (!this.map[x - 1]?.[y] || this.map[x - 1][y] === 1) === (!this.map[x - 1]?.[startY] || this.map[x - 1][startY] === 1) &&
                    (!this.map[x + 1]?.[y] || this.map[x + 1][y] === 1) === (!this.map[x + 1]?.[startY] || this.map[x + 1][startY] === 1)) {
                    length++;
                    y++;
                }
            }
            return length;
        };
        // Helper function to create a wall segment with proper geometry
        const createWallSegment = (startX, startY, length, direction) => {
            // Check surrounding tiles to determine wall shape
            const hasNorth = startY > 0 && this.map[startX]?.[startY - 1] === 1;
            const hasSouth = startY < 49 && this.map[startX]?.[startY + 1] === 1;
            const hasWest = startX > 0 && this.map[startX - 1]?.[startY] === 1;
            const hasEast = startX < 49 && this.map[startX + 1]?.[startY] === 1;
            // Create geometry based on connections
            const wallGeometry = new THREE.BoxGeometry(
                direction === 'horizontal' ? length * 5 : 5,
                10, // height
                direction === 'horizontal' ? 5 : length * 5
            );
            const wall = new THREE.Mesh(wallGeometry, wallMaterial);
            const posX = (startX - 25) * 5 + (direction === 'horizontal' ? (length - 1) * 2.5 : 0);
            const posZ = (startY - 25) * 5 + (direction === 'horizontal' ? 0 : (length - 1) * 2.5);
            wall.position.set(posX, 5, posZ);
            wall.castShadow = true;
            wall.receiveShadow = true;
            const wireframe = new THREE.Mesh(wallGeometry, wireframeMaterial);
            wireframe.position.copy(wall.position);
            wireframe.scale.multiplyScalar(1.001);
            const wallGroup = new THREE.Group();
            wallGroup.add(wall);
            wallGroup.add(wireframe);
            return wallGroup;
        };
        // Create visited map to track processed tiles
        const visited = Array(50).fill().map(() => Array(50).fill(false));
        // Process walls
        for (let y = 0; y < 50; y++) {
            for (let x = 0; x < 50; x++) {
                if (!visited[x][y] && (this.map[x] && this.map[x][y] === 1)) {
                    // Try horizontal first
                    const horizontalLength = findConnectedWalls(x, y, 'horizontal');
                    const verticalLength = findConnectedWalls(x, y, 'vertical');
                    if (horizontalLength >= verticalLength) {
                        // Create horizontal wall segment
                        wallsGroup.add(createWallSegment(x, y, horizontalLength, 'horizontal'));
                        // Mark tiles as visited
                        for (let i = 0; i < horizontalLength; i++) {
                            visited[x + i][y] = true;
                        }
                    } else {
                        // Create vertical wall segment
                        wallsGroup.add(createWallSegment(x, y, verticalLength, 'vertical'));
                        // Mark tiles as visited
                        for (let i = 0; i < verticalLength; i++) {
                            visited[x][y + i] = true;
                        }
                    }
                }
            }
        }
        // Create floors with proper iteration
        for (let x = 0; x < 50; x++) {
            for (let y = 0; y < 50; y++) {
                if (this.map[x] && this.map[x][y] === 0) {
                    const floorGeometry = new THREE.BoxGeometry(5, 0.5, 5);
                    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
                    floor.position.set((parseInt(x) - 25) * 5, 0, (parseInt(y) - 25) * 5);
                    floor.receiveShadow = true;
                    floorsGroup.add(floor);
                }
            }
        }
        // Remove duplicate floor creation
        // Create ceiling with consistent measurements
        const ceilingHeight = 40; // Height of the ceiling
        const tileSize = APP_SETTINGS.tilemap.tileSize; // Use the tilemap's tileSize
        // Create ceiling tiles individually
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                if (this.map[x] && this.map[x][y] === 0) {
                    const ceilingGeometry = new THREE.BoxGeometry(tileSize, 1, tileSize);
                    const ceilingTile = new THREE.Mesh(ceilingGeometry, ceilingMaterial);

                    // Calculate world position using tilemap coordinates
                    const gridCenter = Math.floor(this.gridSize / 2);
                    const worldX = (x - gridCenter) * tileSize + (tileSize / 2);
                    const worldZ = (y - gridCenter) * tileSize + (tileSize / 2);

                    ceilingTile.position.set(
                        worldX,
                        ceilingHeight,
                        worldZ
                    );

                    ceilingTile.receiveShadow = true;
                    ceilingTile.castShadow = true;
                    ceilingGroup.add(ceilingTile);
                }
            }
        }
        // Create room lights
        const roomLights = new THREE.Group();

        // Process each room to add lights
        this.processedRooms.forEach(async room => {
            // Calculate center position for the light
            const gridCenter = Math.floor(this.gridSize / 2);
            const worldX = ((room.center.x - gridCenter) * APP_SETTINGS.tilemap.tileSize);
            const worldZ = ((room.center.z - gridCenter) * APP_SETTINGS.tilemap.tileSize);

            // Create point light
            const light = new THREE.PointLight(0xFFFFAA, 1.5, 150);
            light.position.set(worldX, 18, worldZ); // Just below ceiling
            light.castShadow = true;
            light.shadow.mapSize.width = 512;
            light.shadow.mapSize.height = 512;
            light.shadow.radius = 2;

            // Load light fixture model using FBXLoader directly
            const fbxLoader = new FBXLoader(window.LoadingManager);
            fbxLoader.load(MODEL_ASSETS.LIGHT_FIXTURE.url, (fixture) => {
                    // Apply texture if provided
                    if (MODEL_ASSETS.LIGHT_FIXTURE.texture) {
                        const textureLoader = new THREE.TextureLoader(window.LoadingManager);
                        textureLoader.load(MODEL_ASSETS.LIGHT_FIXTURE.texture, (texture) => {
                            fixture.traverse((child) => {
                                if (child.isMesh) {
                                    child.material.map = texture;
                                    child.material.needsUpdate = true;
                                }
                            });
                        });
                    }

                    // Apply scale from model assets
                    const scale = MODEL_ASSETS.LIGHT_FIXTURE.scale || 1;
                    fixture.scale.set(scale, scale, scale);

                    // Position and rotate the fixture
                    fixture.position.set(worldX, ceilingHeight - 4, worldZ);
                    // No rotation needed if the model is already oriented correctly
                    // If needed, you can adjust specific axes
                    fixture.rotation.set(0, 0, 0);

                    // Add to room lights group
                    roomLights.add(fixture);
                },
                undefined, // onProgress callback
                (error) => {
                    console.warn('Failed to load light fixture model:', error);
                });

            roomLights.add(light);
        });
        return {
            walls: wallsGroup,
            floors: floorsGroup,
            ceiling: ceilingGroup,
            lights: roomLights
        };
    }
}
window.Game = new App();
Game.start();