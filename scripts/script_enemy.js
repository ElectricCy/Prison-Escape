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
window.EnemyLoader = EnemyLoader;
class EnemyAnimationController {
    constructor(params) {
        if (!params) throw new Error('EnemyAnimationController: params is required');
        if (!params.THREE) throw new Error('EnemyAnimationController: THREE is required');
        if (!params.FBXLoader) throw new Error('EnemyAnimationController: FBXLoader is required');
        if (!params.settings) throw new Error('EnemyAnimationController: settings is required');
        if (!params.model) throw new Error('EnemyAnimationController: model is required');
        // Store dependencies
        this.THREE = params.THREE;
        this.FBXLoader = params.FBXLoader;
        this.settings = params.settings;
        this.model = params.model;

        // Initialize properties
        this.mixer = null;
        this.animations = new Map();
        this.currentAnimation = null;
        this.isDeathAnimationPlaying = false;
        if (this.model) {
            this.mixer = new this.THREE.AnimationMixer(this.model);
        }
    }
    async loadAnimation(name, url) {
        if (!this.model) {
            throw new Error('EnemyAnimationController: Model must be set before loading animations');
        }
        if (!url) {
            throw new Error('EnemyAnimationController: Animation URL is required');
        }
        // Initialize mixer if not already done
        if (!this.mixer) {
            this.mixer = new this.THREE.AnimationMixer(this.model);
        }
        try {
            const loader = new this.FBXLoader();
            const animationFBX = await new Promise((resolve, reject) => {
                loader.load(url, resolve, undefined, reject);
            });
            const animation = animationFBX.animations[0];
            if (!animation) {
                throw new Error(`No animation found in file: ${url}`);
            }
            const action = this.mixer.clipAction(animation);
            this.animations.set(name, action);
            console.log(`Animation loaded: ${name}`);
            return action;
        } catch (error) {
            console.error(`Failed to load animation ${name}:`, error);
            throw error;
        }
    }
    async loadAllAnimations() {
        try {
            if (!this.settings?.model?.animations) {
                throw new Error('EnemyAnimationController: No animations found in enemy model settings');
            }
            const modelAnimations = this.settings.model.animations;
            // Load animations if not already loaded
            if (this.animations.size === 0 && modelAnimations) {
                await Promise.all(
                    Object.entries(modelAnimations).map(([name, url]) =>
                        this.loadAnimation(name, url)
                    )
                );
            }
            // Play or restart idle animation
            this.playAnimation('walk'); // Changed from 'idle' to 'walk' since that's our only animation
        } catch (error) {
            console.error('Failed to load animations:', error);
            throw error;
        }
    }
    getAnimation(name) {
        const action = this.animations.get(name);
        if (!action) {
            console.warn(`Animation not found: ${name}`);
            return null;
        }
        return action.getClip();
    }
    playAnimation(name) {
        const action = this.animations.get(name);
        if (!action) {
            console.warn(`Animation not found: ${name}`);
            return;
        }
        action.reset();
        action.play();
        this.currentAnimation = name;
    }
    transitionToAnimation(newAnimation) {
        if (this.currentAnimation === newAnimation) return;
        const fadeTime = 0.5;
        const oldAction = this.animations.get(this.currentAnimation);
        const newAction = this.animations.get(newAnimation);
        if (newAction) {
            newAction.reset();
            newAction.play();
            if (oldAction) {
                newAction.crossFadeFrom(oldAction, fadeTime, true);
            }
            this.currentAnimation = newAnimation;
        }
    }

    update(deltaTime) {
        if (this.mixer) {
            this.mixer.update(deltaTime);
        }
    }
    stopAllAnimations() {
        if (this.mixer) {
            this.mixer.stopAllAction();
        }
    }
    dispose() {
        if (this.mixer) {
            this.mixer.stopAllAction();
            this.mixer.uncacheRoot(this.model);
            this.animations.clear();
            this.mixer = null;
        }
    }
}
window.EnemyAnimationController = EnemyAnimationController;
class Enemy {
    constructor(scene, settings) {
        if (!settings) {
            throw new Error('Enemy: settings are required');
        }
        this.floorOffset = 50; // Minimal gap from floor
        this.fixedHeight = 0.5; // Fixed height above ground
        this.mixer = null;
        this.footstepsSound = null;
        this.footstepsSoundId = null;
        this.proximityManager = new ProximityManager();
        this.baseFootstepsVolume = 0.6; // Store the base volume
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
        this.chaseSpeed = this.settings.chaseSpeed || 35; // Slower chase speed for better control
        this.patrolSpeed = this.settings.patrolSpeed || 20; // Slower patrol speed
        // Flash effect properties
        this.flashDuration = 3000;
        this.flashStartTime = 0;
        this.isFlashed = false;
    }
    async initializeWithPreloadedAssets() {
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
        // Create a new instance of EnemyAnimationController
        this.animationController = new EnemyAnimationController({
            THREE: THREE,
            FBXLoader: FBXLoader,
            settings: this.settings,
            model: this.model
        });
        // Load all animations
        await this.animationController.loadAllAnimations();
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
        // Stop footsteps if they're playing
        if (this.footstepsSoundId) {
            window.AudioManager.stopEffect(this.footstepsSoundId);
            this.footstepsSoundId = null;
        }
        switch (state) {
            case this.states.PATROL:
                this.moveSpeed = this.patrolSpeed;
                this.generatePatrolPoints();
                // Start footsteps sound only if not already playing
                if (window.AudioManager && window.AudioManager.playEffect && !this.footstepsSoundId) {
                    const position = this.getPosition();
                    this.footstepsSoundId = window.AudioManager.playEffect('footsteps', position);
                    console.log('Playing footsteps sound with ID:', this.footstepsSoundId);
                }
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
                if (this.animationController && typeof this.animationController.transitionToAnimation === 'function') {
                    this.animationController.transitionToAnimation('walk');
                } else {
                    console.warn('Animation controller not properly initialized');
                }
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
    moveInDirection(targetPosition, deltaTime, lookAtTarget = true) {
        if (!targetPosition || !this.physicsBody) return;
        // Get current positions
        const currentPos = this.getPosition();
        // Calculate direction
        const direction = new THREE.Vector3()
            .subVectors(targetPosition, currentPos)
            .setY(0);
        // Only move if we're not too close
        const distance = direction.length();
        if (distance > 0.1) { // Add minimum distance threshold
            direction.normalize();
            // Calculate new velocity with proper speed scaling
            const speed = this.moveSpeed * deltaTime * 60; // Scale speed by deltaTime and adjust for 60 FPS
            const newVelocity = new CANNON.Vec3(
                direction.x * speed,
                this.physicsBody.velocity.y, // Preserve vertical velocity
                direction.z * speed
            );
            // Force wake up physics body and apply velocity
            this.physicsBody.wakeUp(); // Always wake up when moving
            this.physicsBody.velocity.x = newVelocity.x;
            this.physicsBody.velocity.z = newVelocity.z;
            // Debug physics state
            console.log('Physics State:', {
                speed: this.moveSpeed,
                sleepState: this.physicsBody.sleepState,
                velocity: this.physicsBody.velocity,
                isAwake: !this.physicsBody.sleeping
            });
        }
        // Debug: Log movement direction and velocity
        console.log('Moving Direction:', direction);
        console.log('Current Velocity:', this.physicsBody.velocity);
        if (lookAtTarget && this.model) {
            this.updateTargetRotation(targetPosition);
        }
    }
    updateModelTransform() {
        if (!this.model) return;
        const physicsPos = this.getPosition();
        // Set position but maintain fixed height
        this.model.position.set(
            physicsPos.x,
            this.fixedHeight, // Use fixed height instead of physics Y
            physicsPos.z
        );
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
        // Add -90 degrees (negative PI/2) to correct the facing direction
        const rotationFix = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI - Math.PI / 2);
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
        let newState = this.currentState;
        switch (this.currentState) {
            case this.states.PATROL:
                if (distanceToPlayer <= this.detectionRange) {
                    newState = this.states.CHASE;
                }
                break;
            case this.states.CHASE:
                if (distanceToPlayer > this.detectionRange) {
                    newState = this.states.PATROL;
                } else if (distanceToPlayer < 2.0) {
                    newState = this.states.CAUGHT;
                }
                break;
            case this.states.CAUGHT:
                if (distanceToPlayer > 2.0) {
                    newState = this.states.CHASE;
                }
                break;
            case this.states.FLASHED:
                if (Date.now() - this.flashStartTime > this.flashDuration) {
                    this.isFlashed = false;
                    newState = this.states.PATROL;
                }
                break;
        }
        // Only change state if it's different from current state
        if (newState !== this.currentState) {
            this.exitState(this.currentState);
            this.currentState = newState;
            this.enterState(this.currentState);
        }
    }
    generatePatrolPoints() {
        const dungeonManager = window.DungeonManager;
        if (!dungeonManager) return;
        const currentPos = this.getPosition();
        const gridPos = window.GameWorld.tilemap.worldToGridPosition(currentPos.x, currentPos.z);
        const currentRoom = dungeonManager.getRoomAtPosition(gridPos.x, gridPos.z);
        if (!currentRoom) return;
        // Get patrol points for current room
        this.patrolPoints = [];
        const roomPatrolPoints = dungeonManager.patrolPoints.get(currentRoom.id);
        // Add current room center if found
        if (this.currentRoom) {
            const currentRoomCenter = tilemap.gridToWorldPosition(
                Math.floor((this.currentRoom.left + this.currentRoom.right) / 2),
                Math.floor((this.currentRoom.top + this.currentRoom.bottom) / 2)
            );
            this.patrolPoints.push(new THREE.Vector3(
                currentRoomCenter.x,
                this.settings.position.y,
                currentRoomCenter.z
            ));
        }
        // Add patrol points for all accessible rooms
        if (!dungeonManager) return;
        // Get all rooms from DungeonManager
        const allRooms = Array.from(dungeonManager.rooms.values());
        allRooms.forEach(room => {
            // Skip current room as it's already added
            if (this.currentRoom && room.id === this.currentRoom.id) return;
            // Calculate room center using bounds
            const centerX = Math.floor((room.bounds.left + room.bounds.right) / 2);
            const centerZ = Math.floor((room.bounds.top + room.bounds.bottom) / 2);
            const worldPos = window.GameWorld.tilemap.gridToWorldPosition(centerX, centerZ);
            // Add room center as patrol point
            this.patrolPoints.push(new THREE.Vector3(
                worldPos.x,
                this.settings.position.y,
                worldPos.z
            ));
        });
        // Debug: Log generated patrol points
        console.log('Generated Patrol Points:', this.patrolPoints);
    }
    executePatrolAction(deltaTime) {
        // Handle footsteps sound
        if (window.AudioManager && window.Player) {
            const enemyPosition = this.getPosition();
            const playerPosition = window.Player.getPosition();
            if (enemyPosition && playerPosition) {
                const volume = this.proximityManager.calculateVolumeByDistance(
                    enemyPosition,
                    playerPosition
                );
                // If we're in audible range and sound isn't playing
                if (volume > 0 && !this.footstepsSoundId) {
                    this.footstepsSoundId = window.AudioManager.playEffect('footsteps', enemyPosition);
                    console.log('Started footsteps sound with ID:', this.footstepsSoundId);
                }
                // Update existing sound
                if (this.footstepsSoundId) {
                    const sound = window.AudioManager.activeEffects.get(this.footstepsSoundId);
                    if (sound) {
                        // Update position and volume
                        sound.position.set(enemyPosition.x, enemyPosition.y, enemyPosition.z);
                        sound.setVolume(Math.max(0, Math.min(1, this.baseFootstepsVolume * volume)));
                    }
                }
                // Stop sound if out of range
                if (volume <= 0 && this.footstepsSoundId) {
                    window.AudioManager.stopEffect(this.footstepsSoundId);
                    this.footstepsSoundId = null;
                }
            }
        }
        if (this.patrolPoints.length === 0) {
            this.generatePatrolPoints();
            return;
        }
        const currentTime = Date.now();
        const targetPoint = this.patrolPoints[this.currentPatrolIndex];
        const currentPosition = this.getPosition();
        if (!targetPoint) {
            console.warn('Invalid patrol point');
            return;
        }
        // Ensure cardinal movement by using grid-aligned positions
        const tilemap = window.GameWorld.tilemap;
        const currentGrid = tilemap.worldToGridPosition(currentPosition.x, currentPosition.z);
        const targetGrid = tilemap.worldToGridPosition(targetPoint.x, targetPoint.z);
        // Calculate grid-space distances
        const dx = Math.abs(targetGrid.x - currentGrid.x);
        const dz = Math.abs(targetGrid.z - currentGrid.z);
        // Create target position with current Y height
        const targetPosition = new THREE.Vector3(
            targetPoint.x,
            currentPosition.y,
            targetPoint.z
        );
        // Calculate distance to target
        const distanceToTarget = currentPosition.distanceTo(targetPosition);
        // Debug logging
        console.log('Current Position:', currentPosition);
        console.log('Target Position:', targetPosition);
        console.log('Distance to target:', distanceToTarget);
        if (distanceToTarget < 1.0) {
            console.log('Reached patrol point:', targetPoint);
            this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
            this.waitStartTime = currentTime;
            return;
        }
        // Update pathfinding if needed
        if (Date.now() - this.pathUpdateTime > this.pathUpdateInterval) {
            this.pathUpdateTime = Date.now();
            const tilemap = window.GameWorld.tilemap;
            const enemyPos = this.getPosition();
            const tileSize = window.GameWorld.tilemap.tileSize;
            const gridPos = tilemap.worldToGridPosition(enemyPos.x, enemyPos.z);
            const targetGridPos = tilemap.worldToGridPosition(targetPoint.x, targetPoint.z);
            // Log positions for debugging
            console.log('Enemy world pos:', enemyPos);
            console.log('Enemy grid pos:', gridPos);
            console.log('Target grid pos:', targetGridPos);
            // Debug: Log grid positions
            console.log('Enemy Grid Position:', gridPos);
            console.log('Target Grid Position:', targetGridPos);
            // Generate path using A* algorithm
            const astar = new ROT.Path.AStar(
                targetGridPos.x,
                targetGridPos.z,
                (x, y) => !tilemap.isTileOccupied(x, y), {
                    topology: 8
                }
            );
            this.path = [];
            astar.compute(gridPos.x, gridPos.z, (x, y) => {
                const worldPos = tilemap.gridToWorldPosition(x, y);
                this.path.push(worldPos);
            });
            // Debug: Log generated path
            console.log('Generated Path:', this.path);
            if (this.path.length > 0) {
                this.path.shift(); // Remove the first point (current position)
            }
            this.currentPathIndex = 0;
        }
        // Follow the path
        if (this.path.length > 0 && this.currentPathIndex < this.path.length) {
            const pathTarget = this.path[this.currentPathIndex];
            const distanceToPathPoint = currentPosition.distanceTo(new THREE.Vector3(pathTarget.x, currentPosition.y, pathTarget.z));
            if (distanceToPathPoint < 1.0) {
                this.currentPathIndex++;
            } else {
                const targetPos = new THREE.Vector3(pathTarget.x, currentPosition.y, pathTarget.z);
                this.moveInDirection(targetPos, deltaTime, true);
                // Debug movement
                console.log('Moving to path target:', targetPos);
                console.log('Current velocity:', this.physicsBody.velocity);
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
        // Ensure we move in cardinal directions only
        if (this.path.length > 0 && this.currentPathIndex < this.path.length) {
            const currentTarget = this.path[this.currentPathIndex];
            const currentPos = this.getPosition();
            // Move strictly along grid lines
            const dx = Math.abs(currentTarget.x - currentPos.x);
            const dz = Math.abs(currentTarget.z - currentPos.z);
            // Choose either horizontal or vertical movement, not both
            let moveTarget;
            if (dx > dz) {
                // Move horizontally first
                moveTarget = new THREE.Vector3(
                    currentTarget.x,
                    currentPos.y,
                    currentPos.z
                );
            } else {
                // Move vertically first
                moveTarget = new THREE.Vector3(
                    currentPos.x,
                    currentPos.y,
                    currentTarget.z
                );
            }
            // Check if we've reached the current target point
            if (dx < 1 && dz < 1) {
                this.currentPathIndex++;
            } else {
                this.moveInDirection(moveTarget, deltaTime, true);
            }
        } else {
            // Direct movement if no path is available
            this.moveInDirection(playerPosition, deltaTime, true);
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
    updatePathfinding(targetPosition) {
        if (this.currentState !== this.states.CHASE && this.currentState !== this.states.PATROL) return;
        const currentTime = Date.now();
        if (currentTime - this.pathUpdateTime < this.pathUpdateInterval) return;
        const dungeonManager = window.DungeonManager;
        if (!dungeonManager) return;
        const enemyPos = this.getPosition();
        const enemyGridPos = window.GameWorld.tilemap.worldToGridPosition(enemyPos.x, enemyPos.z);
        const targetGridPos = window.GameWorld.tilemap.worldToGridPosition(targetPosition.x, targetPosition.z);
        if (!dungeonManager.isWalkable(targetGridPos.x, targetGridPos.z)) return;
        // Calculate path using dungeon manager's pathfinding
        const path = dungeonManager.findPath(
            enemyGridPos.x,
            enemyGridPos.z,
            targetGridPos.x,
            targetGridPos.z
        );
        // Convert path to world coordinates
        this.path = path ? path.map(point => {
            const worldPos = window.GameWorld.tilemap.gridToWorldPosition(point.x, point.z);
            return {
                x: worldPos.x,
                y: this.physicsBody.position.y,
                z: worldPos.z
            };
        }) : [];
        // Remove first path point (current position)
        if (this.path.length > 0) {
            this.path.shift();
        }
        this.currentPathIndex = 0;
        this.pathUpdateTime = currentTime;
        // Create path visualization (optional)
        if (this.path.length > 0 && this.pathLine) {
            const points = [enemyPos];
            this.path.forEach(point => {
                points.push(new THREE.Vector3(point.x, enemyPos.y + 1, point.z));
            });
            this.pathGeometry.setFromPoints(points);
            this.pathLine = new THREE.Line(this.pathGeometry, this.pathMaterial);
            this.scene.add(this.pathLine);
        }
    }
    isPositionValid(x, y) {
        const dungeonManager = window.DungeonManager;
        return dungeonManager && dungeonManager.isWalkable(x, y);
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
window.Enemy = Enemy;