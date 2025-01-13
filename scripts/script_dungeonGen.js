class DungeonGenerator {
    constructor(dungeonManager) {
        this.gridCellSize = 20; // Size of each grid cell in world units (matching APP_SETTINGS.tilemap.tileSize)
        this.gridSize = 31; // Total size of dungeon grid
        this.gridCenter = Math.floor(this.gridSize / 2); // Center point of grid
        this.spatialGrid = {}; // Grid-based spatial partitioning
        const width = 31;
        const height = 31;
        this.width = width;
        this.height = height;
        this.dungeonGen = new ROT.Map.Digger(width, height, {
            roomWidth: [2, 6],
            roomHeight: [2, 6],
            corridorLength: [2, 8],
            dugPercentage: 0.4,
            timeLimit: 2000,
            corridorDirections: [1, 2, 3, 4],
            canConnectDiagonally: false
        });
        this.dungeonManager = dungeonManager;
        this.map = {};
        this.rooms = [];
        this.corridors = [];
        this.processedRooms = []; // Store processed room data
    }
    generate() {
        console.group('Dungeon Generation Process');
        console.log('Starting dungeon generation...');

        // Store dig callback context for map generation
        const digCallback = (x, y, value) => {
            if (!this.map[x]) this.map[x] = [];
            this.map[x][y] = value;

            // Mark corridor tiles as floor in DungeonManager's grid
            if (value === 0) { // 0 indicates walkable space in ROT.js
                if (!this.dungeonManager.grid[x]) this.dungeonManager.grid[x] = [];
                if (!this.dungeonManager.grid[x][y]) {
                    this.dungeonManager.grid[x][y] = {
                        walkable: false,
                        roomId: null,
                        type: 'wall',
                        objects: new Set()
                    };
                }
                this.dungeonManager.grid[x][y].walkable = true;
                this.dungeonManager.grid[x][y].type = 'floor';
            }
        };
        // Helper function to process room data with boundary validation
        const processRoom = (room, index, totalRooms) => {
            const left = room.getLeft();
            const right = room.getRight();
            const top = room.getTop();
            const bottom = room.getBottom();
            // Validate boundaries
            if (left >= right || top >= bottom) {
                console.warn('Invalid room boundaries detected:', {
                    left,
                    right,
                    top,
                    bottom
                });
                return null;
            }
            const width = right - left + 1;
            const height = bottom - top + 1;
            const area = width * height;
            let roomType = 'STANDARD';
            if (index === 0) {
                roomType = 'SPAWN';
            } else if (index === totalRooms - 1) {
                roomType = 'BOSS';
            } else if (area > 30) {
                roomType = 'LOOT';
            } else if (Math.random() < 0.2) {
                roomType = 'SAFE';
            }
            return {
                id: Math.random().toString(36).substr(2, 9),
                type: roomType,
                left,
                right,
                top,
                bottom,
                center: {
                    x: Math.floor((left + right) / 2),
                    z: Math.floor((top + bottom) / 2)
                },
                width,
                height,
                area,
                isConnected: false,
                neighbors: [],
                boundaries: {
                    left,
                    right,
                    top,
                    bottom
                }
            };
        };
        // Generate map with multiple attempts if needed
        let attempts = 0;
        const maxAttempts = 5;
        console.log(`Maximum generation attempts: ${maxAttempts}`);
        do {
            console.log(`\nAttempt ${attempts + 1} of ${maxAttempts}`);
            this.map = Array(this.width).fill().map(() => Array(this.height).fill(1));
            attempts++;

            console.log('Creating new dungeon layout...');
            this.dungeonGen.create(digCallback.bind(this));

            this.rooms = this.dungeonGen.getRooms();
            this.corridors = this.dungeonGen.getCorridors();

            console.log(`Generated ${this.rooms.length} rooms and ${this.corridors.length} corridors`);
        } while (attempts < maxAttempts && (this.rooms.length < 8 || this.corridors.length < 10));
        // Process and store room data
        const processedRoomIds = new Set();
        this.processedRooms = [];
        this.processedRooms = this.rooms
            .map((room, index) => {
                const processedRoom = processRoom(room, index, this.rooms.length);

                if (!processedRoom) {
                    console.warn('Skipping invalid room');
                    return null;
                }
                const roomKey = `${processedRoom.boundaries.left},${processedRoom.boundaries.right},${processedRoom.boundaries.top},${processedRoom.boundaries.bottom}`;

                if (processedRoomIds.has(roomKey)) {
                    console.warn(`Skipping duplicate room: ${roomKey}`);
                    return null;
                }

                processedRoomIds.add(roomKey);
                // Create validated room data
                const roomData = {
                    id: processedRoom.id,
                    type: processedRoom.type,
                    left: processedRoom.boundaries.left,
                    right: processedRoom.boundaries.right,
                    top: processedRoom.boundaries.top,
                    bottom: processedRoom.boundaries.bottom,
                    center: processedRoom.center,
                    width: processedRoom.width,
                    height: processedRoom.height,
                    area: processedRoom.area,
                    isConnected: false,
                    neighbors: [],
                    boundaries: processedRoom.boundaries
                };
                const addedRoom = this.dungeonManager.addRoom(roomData);
                if (!addedRoom) {
                    console.warn('Failed to add room to DungeonManager');
                }
                return processedRoom;
            })
            .filter(room => room !== null);



        // Process room connectivity
        this.processRoomConnectivity();

    }
    processRoomConnectivity() {
        this.processedRooms.forEach((room, i) => {
            const thisRoom = this.dungeonManager.rooms.get(room.id);
            // Get ROT.js room and collect door positions
            const rotRoom = this.rooms.find(r =>
                r.getLeft() === room.boundaries.left &&
                r.getTop() === room.boundaries.top &&
                r.getRight() === room.boundaries.right &&
                r.getBottom() === room.boundaries.bottom
            );
            if (rotRoom) {
                if (!thisRoom.doors) thisRoom.doors = new Set();
                // Collect door positions from ROT.js room
                rotRoom.getDoors((x, y) => {
                    thisRoom.doors.add({
                        x,
                        z: y
                    }); // Note: using z instead of y for consistency
                });
            }
            this.processedRooms.forEach((otherRoom, j) => {
                if (i !== j) {
                    const otherDungeonRoom = this.dungeonManager.rooms.get(otherRoom.id);
                    if (!thisRoom.doors) thisRoom.doors = new Set();

                    // Check if rooms are adjacent or connected
                    const isAdjacent = (
                        (room.left === otherRoom.right + 1 || room.right === otherRoom.left - 1) &&
                        (room.top <= otherRoom.bottom && room.bottom >= otherRoom.top)
                    ) || (
                        (room.top === otherRoom.bottom + 1 || room.bottom === otherRoom.top - 1) &&
                        (room.left <= otherRoom.right && room.right >= otherRoom.left)
                    );

                    if (isAdjacent) {
                        for (let x = room.boundaries.left; x <= room.boundaries.right; x++) {
                            for (let z = room.boundaries.top; z <= room.boundaries.bottom; z++) {
                                if (otherDungeonRoom.tiles.has(`${x},${z}`)) {
                                    ROT.DIRS[4].forEach(tile => {
                                        const adjX = x + tile[0];
                                        const adjY = z + tile[1];
                                        if (!this.dungeonManager.isWalkable(adjX, adjY) && (
                                                adjX < room.bounds.left || adjX > room.bounds.right ||
                                                adjY < room.bounds.top || adjY > room.bounds.bottom
                                            )) {
                                            const door = {
                                                x,
                                                z
                                            };
                                            thisRoom.doors.add(door);
                                            if (!otherDungeonRoom.doors) otherDungeonRoom.doors = new Set();
                                            otherDungeonRoom.doors.add(door);
                                        }
                                    });
                                }
                            }
                        }

                        if (!thisRoom.connections) thisRoom.connections = new Set();
                        if (!otherDungeonRoom.connections) otherDungeonRoom.connections = new Set();

                        if (!thisRoom.connections.has(otherRoom.id)) thisRoom.connections.add(otherRoom.id);
                        if (!otherDungeonRoom.connections.has(thisRoom.id)) otherDungeonRoom.connections.add(thisRoom.id);
                    }
                    const distance = Math.sqrt(
                        Math.pow(room.center.x - otherRoom.center.x, 2) +
                        Math.pow(room.center.z - otherRoom.center.z, 2)
                    );
                    if (distance < 15) {
                        room.neighbors.push({
                            id: otherRoom.id,
                            distance: distance
                        });
                    }
                }
            });
            room.isConnected = room.neighbors && room.neighbors.length > 0;
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
        const baseCeilingMaterial = new THREE.MeshStandardMaterial({
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
        // Helper function to check if a wall is needed at this position
        const isWallNeeded = (x, y) => {
            // Skip if out of bounds
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) return false;

            // Check if current position is a wall
            if (this.map[x]?.[y] !== 1) return false;

            // Check all adjacent tiles (including diagonals)
            const adjacent = [{
                x: -1,
                y: 0
            }, {
                x: 1,
                y: 0
            }, {
                x: 0,
                y: -1
            }, {
                x: 0,
                y: 1
            }, {
                x: -1,
                y: -1
            }, {
                x: -1,
                y: 1
            }, {
                x: 1,
                y: -1
            }, {
                x: 1,
                y: 1
            }];

            // Wall is needed if any adjacent tile is a floor (0)
            return adjacent.some(dir => {
                const checkX = x + dir.x;
                const checkY = y + dir.y;
                return this.map[checkX]?.[checkY] === 0;
            });
        };

        // Helper function to create a wall segment with proper geometry
        const createWallSegment = (startX, startY, length, direction) => {
            // Only create wall segments that are needed
            if (!isWallNeeded(startX, startY)) return null;
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
        const visited = Array(this.width).fill().map(() => Array(this.height).fill(false));
        // Process walls
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const checkTile = this.dungeonManager.getTileAt(x, y);
                if (checkTile && checkTile.type === 'wall' && isWallNeeded(x, y)) {
                    if (!visited[x][y]) {
                        // Try horizontal first
                        const horizontalLength = findConnectedWalls(x, y, 'horizontal');
                        const verticalLength = findConnectedWalls(x, y, 'vertical');
                        if (horizontalLength >= verticalLength) {
                            // Create horizontal wall segment
                            const wallSegment = createWallSegment(x, y, horizontalLength, 'horizontal');
                            if (wallSegment) {
                                wallsGroup.add(wallSegment);
                                // Mark tiles as visited
                                for (let i = 0; i < horizontalLength; i++) {
                                    visited[x + i][y] = true;
                                }
                            }
                        } else {
                            // Create vertical wall segment
                            const wallSegment = createWallSegment(x, y, verticalLength, 'vertical');
                            if (wallSegment) {
                                wallsGroup.add(wallSegment);
                                // Mark tiles as visited
                                for (let i = 0; i < verticalLength; i++) {
                                    visited[x][y + i] = true;
                                }
                            }
                        }
                    }
                }
            }
        }
        // Create floors with proper iteration
        for (let x = 0; x < this.width; x++) {
            for (let z = 0; z < this.height; z++) {
                const checkTile = this.dungeonManager.getTileAt(x, z);
                if (checkTile && checkTile.type === 'floor') {
                    const floorGeometry = new THREE.BoxGeometry(5, 0.5, 5);
                    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
                    floor.position.set((parseInt(x) - 25) * 5, 0, (parseInt(z) - 25) * 5);
                    floor.receiveShadow = true;
                    floorsGroup.add(floor);
                }
            }
        }
        // Remove duplicate floor creation
        // Create ceiling with consistent measurements and texture
        const ceilingHeight = 40; // Height of the ceiling
        const tileSize = APP_SETTINGS.tilemap.tileSize; // Use the tilemap's tileSize

        // Load ceiling texture
        const textureLoader = new THREE.TextureLoader();
        const ceilingTexture = textureLoader.load('https://play.rosebud.ai/assets/empty-gray-background.jpg?Bgwg');
        ceilingTexture.wrapS = THREE.RepeatWrapping;
        ceilingTexture.wrapT = THREE.RepeatWrapping;
        ceilingTexture.repeat.set(1, 1); // Larger tiles (2x)

        // Create ceiling material with texture
        const texturedCeilingMaterial = new THREE.MeshStandardMaterial({
            map: ceilingTexture,
            roughness: 0.95,
            metalness: 0.05,
            side: THREE.FrontSide,
            envMapIntensity: 0.2
        });
        // Create ceiling tiles individually
        for (let x = 0; x < this.gridSize; x++) {
            for (let y = 0; y < this.gridSize; y++) {
                const checkTile = this.dungeonManager.getTileAt(x, y);
                if (checkTile && checkTile.type === 'floor') {
                    const ceilingGeometry = new THREE.BoxGeometry(tileSize, 1, tileSize);
                    const ceilingTile = new THREE.Mesh(ceilingGeometry, texturedCeilingMaterial);
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
        // Create room lights and furniture
        const roomLights = new THREE.Group();
        const furnitureGroup = new THREE.Group();

        // Process each room to add lights
        this.processedRooms.forEach(async room => {
            // Get ROT.js room data for accurate positioning
            const rotRoom = this.rooms.find(r =>
                r.getLeft() === room.boundaries.left &&
                r.getTop() === room.boundaries.top &&
                r.getRight() === room.boundaries.right &&
                r.getBottom() === room.boundaries.bottom
            );

            if (!rotRoom) {
                console.warn('Could not find ROT.js room data for lighting');
                return;
            }

            // Get room data from DungeonManager
            const dungeonRoom = this.dungeonManager.rooms.get(room.id);
            if (!dungeonRoom) {
                console.warn(`Could not find room ${room.id} in DungeonManager for lighting.`);
                return;
            }


            // Calculate world position using tilemap coordinates
            const gridCenter = Math.floor(this.gridSize / 2);
            const tileSize = APP_SETTINGS.tilemap.tileSize;
            const worldX = (dungeonRoom.center.x - gridCenter) * tileSize + (tileSize / 2);
            const worldZ = (dungeonRoom.center.z - gridCenter) * tileSize + (tileSize / 2);
            // Create point light with corrected position and adjusted height
            const light = new THREE.SpotLight(0xFFFFAA, 1.2, 60, Math.PI / 3, 0.5, 1.5);
            light.position.set(worldX, ceilingHeight - 5, worldZ);
            light.target.position.set(worldX, 0, worldZ);
            light.castShadow = true;
            light.shadow.mapSize.width = 512;
            light.shadow.mapSize.height = 512;
            light.shadow.radius = 2;
            light.shadow.bias = -0.001;
            roomLights.add(light.target);
            // Define the desired height extension
            const additionalHeight = 20; // Adjust this value as needed

            // Calculate the new height
            const newHeight = 30 + additionalHeight;

            // Create the light cone mesh with the new height
            const coneGeometry = new THREE.ConeGeometry(12, newHeight, 32, 1, true, 0, Math.PI * 2);
            const coneMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFAA,
                transparent: true,
                opacity: 0.01,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                fog: false
            });
            const lightCone = new THREE.Mesh(coneGeometry, coneMaterial);

            // Position light cone using tilemap coordinates
            lightCone.position.set(worldX, ceilingHeight - 5 - additionalHeight / 2, worldZ);

            // Add the cone to the scene
            roomLights.add(lightCone);


            // Place cabinets based on room size
            // Room data is already available from earlier in the code
            if (!dungeonRoom) {
                console.warn(`Room ${room.id} not found in DungeonManager`);
                return;
            }
            // Calculate number of cabinets based on room area
            const roomArea = dungeonRoom.width * dungeonRoom.height;
            // More crates based on room size with randomization
            const baseCrates = roomArea > 30 ? 8 : roomArea > 20 ? 6 : roomArea > 12 ? 4 : 2;
            const randomExtra = Math.floor(Math.random() * 3); // 0-2 extra crates
            const numCabinets = baseCrates + randomExtra;

            console.log(`Room ${room.id}: Planning ${numCabinets} cabinets`, {
                area: roomArea,
                dimensions: {
                    width: dungeonRoom.width,
                    height: dungeonRoom.height
                },
                center: dungeonRoom.center,
                bounds: dungeonRoom.bounds
            });
            // Load crate models using GLTFLoader
            try {
                const gltfLoader = new GLTFLoader(window.LoadingManager);
                // Randomly choose between stacked or adjacent crates
                const crateType = Math.random() < 0.5 ? 'stacked' : 'adjacent';
                const crateUrl = crateType === 'stacked' ?
                    'https://play.rosebud.ai/assets/stackedCrates.glb?0gF5' :
                    'https://play.rosebud.ai/assets/adjacentCrates.glb?3Eai';

                gltfLoader.load(
                    crateUrl,
                    (gltf) => {
                        console.log(`${crateType} crates model loaded successfully`);
                        const crateModel = gltf.scene;
                        // Store the first mesh's material for reuse
                        let crateMaterial = null;
                        crateModel.traverse((child) => {
                            if (child.isMesh) {
                                if (!crateMaterial) {
                                    crateMaterial = child.material.clone();
                                }
                                child.castShadow = true;
                                child.receiveShadow = true;
                            }
                        });
                        const scale = 20;
                        crateModel.scale.set(scale, scale, scale);
                        // Get valid floor positions for crate placement
                        const floorPositions = [];
                        // Get door positions and create buffer zones
                        const doorBuffer = 2; // Buffer size around doors
                        const doorPositions = new Set();

                        // Get all doors connected to this room
                        if (dungeonRoom.doors) {
                            dungeonRoom.doors.forEach(door => {
                                // Use ROT.js DIRS to get all adjacent positions (8-directional)
                                ROT.DIRS[8].forEach(dir => {
                                    const adjX = door.x + dir[0];
                                    const adjZ = door.z + dir[1];

                                    // Add the adjacent position
                                    doorPositions.add(`${adjX},${adjZ}`);

                                    // Add extended buffer positions
                                    for (let dx = -doorBuffer; dx <= doorBuffer; dx++) {
                                        for (let dz = -doorBuffer; dz <= doorBuffer; dz++) {
                                            const distance = Math.abs(dx) + Math.abs(dz);
                                            if (distance <= doorBuffer) {
                                                const bufferX = adjX + dx;
                                                const bufferZ = adjZ + dz;
                                                doorPositions.add(`${bufferX},${bufferZ}`);
                                            }
                                        }
                                    }
                                });

                                // Add the door position itself
                                doorPositions.add(`${door.x},${door.z}`);
                            });
                        }
                        // Calculate room boundaries in world coordinates using DungeonManager data
                        const roomLeft = ((dungeonRoom.bounds.left - gridCenter) * APP_SETTINGS.tilemap.tileSize);
                        const roomRight = ((dungeonRoom.bounds.right - gridCenter) * APP_SETTINGS.tilemap.tileSize);
                        const roomTop = ((dungeonRoom.bounds.top - gridCenter) * APP_SETTINGS.tilemap.tileSize);
                        const roomBottom = ((dungeonRoom.bounds.bottom - gridCenter) * APP_SETTINGS.tilemap.tileSize);

                        // Add buffer from walls for better placement
                        const wallBuffer = APP_SETTINGS.tilemap.tileSize * 0.3;

                        // Function to check if position is away from doors using ROT.js functionality
                        const isAwayFromDoors = (gridX, gridZ) => {
                            // Check if the position itself is a door
                            const isDoor = Array.from(dungeonRoom.doors).some(door =>
                                door.x === gridX && door.z === gridZ
                            );
                            if (isDoor) return false;

                            // Check adjacent positions using ROT.DIRS[8]
                            return !ROT.DIRS[8].some(dir => {
                                const adjX = gridX + dir[0];
                                const adjZ = gridZ + dir[1];
                                return Array.from(dungeonRoom.doors).some(door =>
                                    door.x === adjX && door.z === adjZ
                                );
                            });
                        };
                        // Get valid wall positions using ROT.js room data
                        const rotRoom = this.rooms.find(r =>
                            r.getLeft() === Math.floor((roomLeft / APP_SETTINGS.tilemap.tileSize) + gridCenter) &&
                            r.getTop() === Math.floor((roomTop / APP_SETTINGS.tilemap.tileSize) + gridCenter));

                        if (rotRoom) {
                            // Get floor positions within the ROT.js room
                            for (let x = rotRoom.getLeft(); x <= rotRoom.getRight(); x++) {
                                for (let z = rotRoom.getTop(); z <= rotRoom.getBottom(); z++) {
                                    // Check if current position is a floor tile
                                    if (this.map[x]?.[z] === 0) { // 0 represents floor in ROT.js
                                        // Check if position is away from doors and walls
                                        if (isAwayFromDoors(x, z)) {
                                            const worldX = (x - gridCenter) * APP_SETTINGS.tilemap.tileSize;
                                            const worldZ = (z - gridCenter) * APP_SETTINGS.tilemap.tileSize;

                                            // Random rotation for more variety
                                            const rotation = Math.random() * Math.PI * 2;

                                            floorPositions.push({
                                                x: worldX,
                                                z: worldZ,
                                                rotation: rotation,
                                                gridPos: {
                                                    x,
                                                    z
                                                }
                                            });
                                        }
                                    }
                                }
                            }
                        }
                        // Randomly select positions for cabinets
                        // Shuffle floor positions for random distribution
                        floorPositions.sort(() => Math.random() - 0.5);

                        // Try to place crates
                        let placedCrates = 0;
                        for (let i = 0; i < numCabinets && floorPositions.length > 0 && placedCrates < floorPositions.length; i++) {
                            try {
                                const randomIndex = Math.floor(Math.random() * floorPositions.length);
                                const position = floorPositions.splice(randomIndex, 1)[0];

                                console.log(`Placing cabinet ${i + 1}/${numCabinets} at:`, {
                                    x: position.x,
                                    z: position.z,
                                    rotation: position.rotation
                                });
                                const crate = crateModel.clone();
                                // Apply the stored material to all meshes in the clone
                                crate.traverse((child) => {
                                    if (child.isMesh && crateMaterial) {
                                        child.material = crateMaterial;
                                    }
                                });
                                const yOffset = crateType === 'stacked' ? 10 : 5; // Adjust based on crate type
                                crate.position.set(position.x, yOffset, position.z);
                                crate.rotation.y = position.rotation;
                                // Add physics body for crates
                                const crateSize = crateType === 'stacked' ?
                                    new CANNON.Vec3(5, 10, 5) // Taller for stacked
                                    :
                                    new CANNON.Vec3(10, 5, 5); // Wider for adjacent
                                const crateShape = new CANNON.Box(crateSize);
                                const crateBody = new CANNON.Body({
                                    mass: 0,
                                    position: new CANNON.Vec3(position.x, yOffset, position.z),
                                    shape: crateShape,
                                    collisionFilterGroup: APP_SETTINGS.physics.collisionGroups.OBSTACLE,
                                    collisionFilterMask: APP_SETTINGS.physics.collisionGroups.PLAYER |
                                        APP_SETTINGS.physics.collisionGroups.PROJECTILE
                                });
                                crateBody.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), position.rotation);

                                if (window.GameWorld?.physicsWorld) {
                                    window.GameWorld.physicsWorld.addBody(crateBody);
                                    console.log(`Added physics body for ${crateType} crates`);
                                }
                                // Add crate to scene and track it
                                WorldScene.add(crate);
                                console.log(`Added ${crateType} crates to scene`);
                                // Store reference to crate
                                if (!window.GameWorld.crates) {
                                    window.GameWorld.crates = [];
                                }
                                window.GameWorld.crates.push({
                                    type: crateType,
                                    mesh: crate,
                                    body: crateBody
                                });
                            } catch (error) {
                                console.error('Failed to place cabinet:', error);
                            }
                        }
                    },
                    (xhr) => {
                        console.log(`Cabinet loading: ${(xhr.loaded / xhr.total) * 100}% loaded`);
                    },
                    (error) => {
                        console.error('Error loading cabinet model:', error);
                    }
                );
            } catch (error) {
                console.error('Error in cabinet placement setup:', error);
            }
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
                    // Get room data from DungeonManager
                    const dungeonRoom = this.dungeonManager.rooms.get(room.id);
                    if (dungeonRoom) {
                        // Use ROT.js grid coordinates for positioning
                        const gridCenter = Math.floor(this.gridSize / 2);
                        const tileSize = APP_SETTINGS.tilemap.tileSize;

                        // Calculate world position from ROT.js grid coordinates
                        const worldX = (dungeonRoom.center.x - gridCenter) * tileSize + (tileSize / 2);
                        const worldZ = (dungeonRoom.center.z - gridCenter) * tileSize + (tileSize / 2);
                        fixture.position.set(
                            worldX,
                            ceilingHeight+4,
                            worldZ
                        );
                    }
                    // Maintain existing rotation
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