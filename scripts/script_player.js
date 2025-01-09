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

    handleJoystickRotation(input) {
        if (!window.CameraControl) return;

        // Scale the joystick input using joystick sensitivity settings
        const rotationX = input.x * APP_SETTINGS.controls.joystickSensitivity.x * 2;
        const rotationY = input.y * APP_SETTINGS.controls.joystickSensitivity.y * 2;

        // Call the camera controller's rotateCamera method
        window.CameraControl.rotateCamera(rotationX, rotationY);
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
        // Store the current keyboard state
        const keyboardState = {
            forward: this.keys.forward,
            backward: this.keys.backward,
            left: this.keys.left,
            right: this.keys.right
        };
        // Check for joystick input
        if (window.HUD?.components?.Joystick) {
            const joystickInput = window.HUD.components.Joystick.getInput();
            if (Math.abs(joystickInput.x) < 0.2 && Math.abs(joystickInput.y) < 0.2) {
                // Only reset keys if they were set by joystick
                if (!keyboardState.forward) this.keys.forward = false;
                if (!keyboardState.backward) this.keys.backward = false;
                if (!keyboardState.left) this.keys.left = false;
                if (!keyboardState.right) this.keys.right = false;
            } else {
                // Set movement based on joystick input
                this.keys.forward = joystickInput.y < -0.2;
                this.keys.backward = joystickInput.y > 0.2;
                this.keys.left = joystickInput.x < -0.2;
                this.keys.right = joystickInput.x > 0.2;
            }
        }
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