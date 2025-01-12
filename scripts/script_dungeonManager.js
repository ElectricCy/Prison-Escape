class DungeonManager {
    constructor() {
        this.rooms = new Map(); // Store rooms by ID
        this.corridors = new Map(); // Store corridors
        this.grid = []; // Store walkable/non-walkable grid
        this.spawnPoints = new Map(); // Store spawn points by type
        this.patrolPoints = new Map(); // Store patrol points by room
        this.navGraph = new Map(); // Store navigation graph
        this.roomTypes = new Set(['STANDARD', 'SAFE', 'BOSS', 'LOOT', 'SPAWN']); // Valid room types
        this.roomIndex = 1; // Counter for room numbering
        this.roomTiles = new Map(); // Store tiles for each room
        this.tileToRoom = new Map(); // Reverse mapping of tiles to rooms
    }
    initialize(dungeonData) {
        this.width = dungeonData.width;
        this.height = dungeonData.height;
        this.tileSize = dungeonData.tileSize;

        // Initialize grid
        this.grid = Array(this.width).fill().map(() =>
            Array(this.height).fill().map(() => ({
                walkable: false,
                roomId: null,
                type: 'wall',
                objects: new Set()
            }))
        );
    }
    /**
     * Room Data Structure Example:
     * {
     *   id: "abc123xyz",           // Unique room identifier
     *   type: "STANDARD",          // Room type (STANDARD, SAFE, BOSS, LOOT, SPAWN)
     *   left: 5,                   // Left boundary grid coordinate
     *   right: 8,                  // Right boundary grid coordinate
     *   top: 3,                    // Top boundary grid coordinate
     *   bottom: 6,                 // Bottom boundary grid coordinate
     *   center: {                  // Center point of the room
     *     x: 6,                    // Center X coordinate
     *     z: 4                     // Center Z coordinate
     *   },
     *   width: 4,                  // Room width in grid units
     *   height: 4,                 // Room height in grid units
     *   area: 16,                  // Total area of room (width * height)
     *   isConnected: false,        // Whether room is connected to others
     *   neighbors: []              // Array of connected room references
     * }
     */
    addRoom(roomData) {
        // Check if room with same boundaries already exists
        const existingRoom = Array.from(this.rooms.values()).find(room =>
            room.bounds.left === roomData.left &&
            room.bounds.right === roomData.right &&
            room.bounds.top === roomData.top &&
            room.bounds.bottom === roomData.bottom
        );
        if (existingRoom) {
            return existingRoom;
        }

        // Strict validation of room data
        if (!roomData || !roomData.id || !roomData.type ||
            typeof roomData.left !== 'number' ||
            typeof roomData.right !== 'number' ||
            typeof roomData.top !== 'number' ||
            typeof roomData.bottom !== 'number') {
            console.error('Invalid room data structure:', roomData);
            return null;
        }
        // Ensure room type is valid
        if (!this.roomTypes.has(roomData.type)) {
            roomData.type = 'STANDARD'; // Default to STANDARD if invalid type
        }
        const room = {
            id: roomData.id,
            name: this.generateRoomName(roomData.type),
            type: roomData.type,
            roomNumber: this.roomIndex++,
            bounds: {
                left: Math.floor(roomData.left),
                right: Math.floor(roomData.right),
                top: Math.floor(roomData.top),
                bottom: Math.floor(roomData.bottom)
            },
            center: roomData.center || {
                x: Math.floor((roomData.left + roomData.right) / 2),
                z: Math.floor((roomData.top + roomData.bottom) / 2)
            },
            connections: new Set(),
            spawnPoints: new Map(),
            patrolPoints: [],
            tiles: new Set(),
            category: null,
            isConnected: false,
            neighbors: []
        };
        const width = roomData.right - roomData.left + 1;
        const height = roomData.bottom - roomData.top + 1;
        const area = width * height;
        if (area <= 12) {
            room.category = 'small';
        } else if (area <= 25) {
            room.category = 'medium';
        } else {
            room.category = 'large';
        }

        // Validate dimensions
        if (width <= 0 || height <= 0) {
            console.error('Invalid room dimensions:', {
                width,
                height
            });
            return null;
        }
        room.width = width;
        room.height = height;
        room.area = area;
        // Set room category based on area
        if (area <= 12) {
            room.category = 'small';
        } else if (area <= 25) {
            room.category = 'medium';
        } else {
            room.category = 'large';
        }
        // Update grid for room tiles with boundary checking
        // Create a single room identifier for all tiles
        const roomTiles = new Set();
        const roomId = room.id;

        for (let x = room.bounds.left; x <= room.bounds.right; x++) {
            for (let y = room.bounds.top; y <= room.bounds.bottom; y++) {
                if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                    if (!this.grid[x]) this.grid[x] = [];
                    if (!this.grid[x][y]) {
                        this.grid[x][y] = {
                            walkable: false,
                            roomId: null,
                            type: 'wall',
                            objects: new Set()
                        };
                    }

                    this.grid[x][y].walkable = true;
                    this.grid[x][y].roomId = room.id;
                    this.grid[x][y].roomNumber = room.roomNumber;
                    this.grid[x][y].type = 'floor';

                    // Store tile coordinates
                    const tileKey = `${x},${y}`;
                    roomTiles.add(tileKey);
                    this.tileToRoom.set(tileKey, room.id);

                    // Add to room's tiles
                    room.tiles.add({
                        x,
                        y
                    });
                }
            }
        }

        // Store tiles for this room and update maps
        this.roomTiles.set(room.id, roomTiles);
        this.rooms.set(room.id, room);



        this.generateRoomFeatures(room);
        return room;
    }
    generateRoomName(type) {
        const prefixes = {
            STANDARD: ['Dark', 'Ancient', 'Dusty', 'Quiet', 'Stone'],
            SAFE: ['Safe', 'Secure', 'Protected', 'Hidden', 'Sanctuary'],
            BOSS: ['Ominous', 'Threatening', 'Dark', 'Forbidden', 'Cursed'],
            LOOT: ['Treasure', 'Golden', 'Valuable', 'Secret', 'Rich'],
            SPAWN: ['Entry', 'Starting', 'Beginning', 'Initial']
        };
        const suffixes = {
            STANDARD: ['Chamber', 'Room', 'Hall', 'Area'],
            SAFE: ['Haven', 'Room', 'Chamber', 'Refuge'],
            BOSS: ['Arena', 'Chamber', 'Lair', 'Domain'],
            LOOT: ['Vault', 'Chamber', 'Room', 'Storage'],
            SPAWN: ['Point', 'Area', 'Zone', 'Location']
        };
        const prefix = prefixes[type]?.[Math.floor(Math.random() * prefixes[type].length)] || 'Unknown';
        const suffix = suffixes[type]?.[Math.floor(Math.random() * suffixes[type].length)] || 'Room';

        return `${prefix} ${suffix}`;
    }
    generateRoomFeatures(room) {
        switch (room.type) {
            case 'SAFE':
                this.addSpawnPoint(room.id, 'respawn', room.center);
                const randomSafeTile = this.getRandomTileInRoom(room.id);
                if (randomSafeTile) {
                    this.addSpawnPoint(room.id, 'health', randomSafeTile);
                }
                break;
            case 'BOSS':
                this.addSpawnPoint(room.id, 'boss', room.center);
                const patrolPoints = [];
                for (let i = 0; i < 4; i++) {
                    const tile = this.getRandomTileInRoom(room.id);
                    if (tile) {
                        patrolPoints.push(tile);
                    }
                }
                room.patrolPoints = patrolPoints;
                this.patrolPoints.set(room.id, patrolPoints);
                break;
            case 'LOOT':
                const randomLootTile = this.getRandomTileInRoom(room.id);
                if (randomLootTile) {
                    this.addSpawnPoint(room.id, 'loot', randomLootTile);
                }
                break;
            default:
                const defaultPatrolPoints = [];
                for (let i = 0; i < 2; i++) {
                    const tile = this.getRandomTileInRoom(room.id);
                    if (tile) {
                        defaultPatrolPoints.push(tile);
                    }
                }
                room.patrolPoints = defaultPatrolPoints;
                this.patrolPoints.set(room.id, defaultPatrolPoints);
                break;
        }
    }
    addSpawnPoint(roomId, type, position) {
        const room = this.rooms.get(roomId);
        if (room) {
            room.spawnPoints.set(type, position);
            if (!this.spawnPoints.has(type)) {
                this.spawnPoints.set(type, new Set());
            }
            this.spawnPoints.get(type).add({
                roomId,
                position
            });
        }
    }
    generatePatrolPoints(room, count) {
        const points = [];
        const width = room.bounds.right - room.bounds.left;
        const height = room.bounds.bottom - room.bounds.top;
        for (let i = 0; i < count; i++) {
            const point = {
                x: room.bounds.left + Math.floor(Math.random() * width),
                z: room.bounds.top + Math.floor(Math.random() * height)
            };
            points.push(point);
        }
        room.patrolPoints = points;
        this.patrolPoints.set(room.id, points);
    }
    getRandomSpawnPoint(type) {
        const spawnPoints = this.spawnPoints.get(type);
        if (!spawnPoints || spawnPoints.size === 0) return null;

        const points = Array.from(spawnPoints);
        return points[Math.floor(Math.random() * points.length)];
    }
    getRoomAtPosition(x, z) {
        if (!this.grid[x] || !this.grid[x][z]) return null;
        const roomId = this.grid[x][z].roomId;
        return roomId ? this.rooms.get(roomId) : null;
    }
    isWalkable(x, z) {
        return this.grid[x]?.[z]?.walkable || false;
    }
    getTileAt(x, z) {
        return this.grid[x]?.[z] || null;
    }
    getNeighbors(x, z) {
        const neighbors = [];
        // Define only cardinal directions (no diagonals)
        const directions = [{
                x: 0,
                z: -1
            }, // North
            {
                x: 1,
                z: 0
            }, // East
            {
                x: 0,
                z: 1
            }, // South
            {
                x: -1,
                z: 0
            } // West
        ];

        for (const dir of directions) {
            const newX = x + dir.x;
            const newZ = z + dir.z;

            // Check if the new position is within bounds
            if (newX < 0 || newX >= this.width || newZ < 0 || newZ >= this.height) {
                continue;
            }

            // Only add neighbor if it's walkable
            if (this.isWalkable(newX, newZ)) {
                neighbors.push({
                    x: newX,
                    z: newZ,
                    cost: 1 // Uniform cost for cardinal movements
                });
            }
        }

        return neighbors;
    }
    findPath(startX, startZ, endX, endZ) {
        // A* pathfinding implementation
        const open = new Set();
        const closed = new Set();
        const cameFrom = new Map();
        const gScore = new Map();
        const fScore = new Map();
        const start = `${startX},${startZ}`;
        const goal = `${endX},${endZ}`;
        gScore.set(start, 0);
        fScore.set(start, this.heuristic(startX, startZ, endX, endZ));
        open.add(start);
        while (open.size > 0) {
            let current = this.getLowestFScore(open, fScore);
            if (current === goal) {
                return this.reconstructPath(cameFrom, current);
            }
            open.delete(current);
            closed.add(current);
            const [x, z] = current.split(',').map(Number);
            const neighbors = this.getNeighbors(x, z);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.x},${neighbor.z}`;
                if (closed.has(neighborKey)) continue;
                const tentativeGScore = gScore.get(current) + 1;
                if (!open.has(neighborKey)) {
                    open.add(neighborKey);
                } else if (tentativeGScore >= gScore.get(neighborKey)) {
                    continue;
                }
                cameFrom.set(neighborKey, current);
                gScore.set(neighborKey, tentativeGScore);
                fScore.set(neighborKey, tentativeGScore +
                    this.heuristic(neighbor.x, neighbor.z, endX, endZ));
            }
        }
        return null; // No path found
    }
    heuristic(x1, z1, x2, z2) {
        // Manhattan distance - perfect for cardinal-only movement
        // Multiply by 1.001 to break ties in favor of paths closer to the goal
        return (Math.abs(x1 - x2) + Math.abs(z1 - z2)) * 1.001;
    }
    getLowestFScore(openSet, fScore) {
        let lowest = null;
        let lowestScore = Infinity;
        for (const pos of openSet) {
            const score = fScore.get(pos);
            if (score < lowestScore) {
                lowest = pos;
                lowestScore = score;
            }
        }
        return lowest;
    }
    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            path.unshift(current);
        }
        return path.map(pos => {
            const [x, z] = pos.split(',').map(Number);
            return {
                x,
                z
            };
        });
    }
    // Get room by number
    getRoomByNumber(roomNumber) {
        for (const [_, room] of this.rooms) {
            if (room.roomNumber === roomNumber) {
                return room;
            }
        }
        return null;
    }
    // Get all tiles for a specific room
    getRoomTiles(roomId) {
        return Array.from(this.roomTiles.get(roomId) || []).map(tileKey => {
            const [x, y] = tileKey.split(',').map(Number);
            return {
                x,
                y
            };
        });
    }
    // Get room for a specific tile
    getRoomForTile(x, y) {
        const tileKey = `${x},${y}`;
        const roomId = this.tileToRoom.get(tileKey);
        return roomId ? this.rooms.get(roomId) : null;
    }
    // Get random tile position within a specific room
    getRandomTileInRoom(roomId) {
        const tiles = this.getRoomTiles(roomId);
        if (!tiles.length) return null;
        return tiles[Math.floor(Math.random() * tiles.length)];
    }
    // Get all rooms of a specific category
    getRoomsByCategory(category) {
        return Array.from(this.rooms.values())
            .filter(room => room.category === category);
    }
    // Get all rooms of a specific type
    getRoomsByType(type) {
        return Array.from(this.rooms.values())
            .filter(room => room.type === type);
    }
    // Get total number of rooms
    getTotalRooms() {
        return this.roomIndex - 1;
    }
}
window.DungeonManager = DungeonManager