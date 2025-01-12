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
window.WorldTime = WorldTime;
class World {
    constructor() {
        window.WorldScene = new THREE.Scene();
        this.lodManager = new LODManager();
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

        // Set initial camera to top-down view
        MainCamera.position.set(0, APP_SETTINGS.camera.debug.position.y, 0);
        MainCamera.rotation.set(
            APP_SETTINGS.camera.debugRotation.x,
            APP_SETTINGS.camera.debugRotation.y,
            APP_SETTINGS.camera.debugRotation.z
        );

        // Add AudioListener with safe position
        const listener = new THREE.AudioListener();
        const cameraPos = {
            x: APP_SETTINGS.camera.debug.position.x,
            y: APP_SETTINGS.camera.debug.position.y,
            z: APP_SETTINGS.camera.debug.position.z
        };
        listener.position.set(cameraPos.x, cameraPos.y, cameraPos.z);
        MainCamera.add(listener);
        console.log('Camera initialized with validated position:', cameraPos);
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
                NavMesh: NavMesh,
                dungeonManager: window.GameWorld.dungeonManager
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

        // Update LOD levels based on camera position
        if (this.lodManager && MainCamera) {
            this.lodManager.updateLODs(MainCamera);
        }

        GameRenderer.render();
    }

}
window.World = World;