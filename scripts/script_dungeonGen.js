
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

        // Initialize DungeonManager
        window.DungeonManager = new DungeonManager();
        window.DungeonManager.initialize({
            width: this.gridSize,
            height: this.gridSize,
            tileSize: this.gridCellSize
        });
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
        this.processedRooms = this.rooms.map((room, index) => {
            const processedRoom = processRoom(room);

            // Assign room types based on position and size
            let roomType = 'STANDARD';
            if (index === 0) roomType = 'SPAWN';
            else if (index === this.rooms.length - 1) roomType = 'BOSS';
            else if (processedRoom.area > 30) roomType = 'LOOT';
            else if (Math.random() < 0.2) roomType = 'SAFE';
            processedRoom.type = roomType;

            // Add room to DungeonManager
            window.DungeonManager.addRoom(processedRoom);

            return processedRoom;
        });

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
window.DungeonGenerator = DungeonGenerator;
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
window.Room = Room;