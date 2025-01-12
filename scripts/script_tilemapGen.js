class TileMapGenerator {
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
            NavMesh: 'NavMesh class',
            dungeonManager: 'DungeonManager class'
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
        this.dungeonManager = params.dungeonManager;
    }
    generateMap() {
        // Generate dungeon layout
        const dungeonGen = new DungeonGenerator(this.dungeonManager);
        dungeonGen.generate();

        // Validate dungeon generation
        const validationResults = this.validateDungeon(dungeonGen);
        if (!validationResults.isValid) {
            console.error('Dungeon validation failed:', validationResults.errors);
            // Regenerate if validation fails
            dungeonGen.generate();
            const retryValidation = this.validateDungeon(dungeonGen);
            if (!retryValidation.isValid) {
                throw new Error('Failed to generate valid dungeon after retry');
            }
        }

        // Create rooms from dungeon layout
        for (let x = 0; x < dungeonGen.width; x++) {
            for (let z = 0; z < dungeonGen.height; z++) {
                if (dungeonGen.map[x][z] === 0) { // Floor tile
                    this.dungeonManager.addRoom({
                        id: `room_${x}_${z}`,
                        type: 'STANDARD',
                        left: x,
                        right: x,
                        top: z,
                        bottom: z,
                        center: {
                            x,
                            z
                        }
                    });
                }
            }
        }
        // Now create tilemap with initialized dungeon manager
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
            NavMesh: this.NavMesh,
            dungeonManager: this.dungeonManager,
            dungeonGen: dungeonGen
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
    validateDungeon(dungeonGen) {
        console.group('Dungeon Validation');
        const results = {
            isValid: true,
            errors: []
        };

        // Check if dungeon has minimal required dimensions
        console.log('Checking dimensions:', {
            width: dungeonGen.width,
            height: dungeonGen.height
        });
        if (dungeonGen.width < 10 || dungeonGen.height < 10) {
            results.errors.push('Dungeon dimensions too small');
        }

        // Check if map array exists and has correct dimensions
        console.log('Checking map structure:', {
            hasMap: !!dungeonGen.map,
            isArray: Array.isArray(dungeonGen.map)
        });
        if (!dungeonGen.map || !Array.isArray(dungeonGen.map)) {
            results.errors.push('Invalid dungeon map structure');
        }
        // Count room types
        const roomCounts = {
            STANDARD: 0,
            SAFE: 0,
            BOSS: 0,
            LOOT: 0,
            SPAWN: 0
        };
        console.log('Starting room validation');
        // Validate individual rooms and connections
        for (const [id, room] of this.dungeonManager.rooms) {
            // Check room type
            if (!this.dungeonManager.roomTypes.has(room.type)) {
                results.errors.push(`Invalid room type for room ${id}: ${room.type}`);
            }
            // Count room types
            if (room.type in roomCounts) {
                roomCounts[room.type]++;
            }
            // Check room bounds
            if (!room.bounds ||
                room.bounds.left > room.bounds.right ||
                room.bounds.top > room.bounds.bottom) {
                results.errors.push(`Invalid room bounds for room ${id}`);
            }
            // Check room connections
            if (!room.connections || !(room.connections instanceof Set)) {
                results.errors.push(`Invalid connections for room ${id}`);
            }
            // Validate tiles
            if (!room.tiles || room.tiles.size === 0) {
                results.errors.push(`Room ${id} has no tiles`);
            }
        }
        // Verify minimum room type requirements
        console.log('Room type counts:', roomCounts);
        if (roomCounts.SAFE === 0) results.errors.push('No SAFE rooms generated');
        if (roomCounts.SPAWN === 0) results.errors.push('No SPAWN rooms generated');
        if (roomCounts.STANDARD === 0) results.errors.push('No STANDARD rooms generated');

        // Check total room count
        const totalRooms = Object.values(roomCounts).reduce((a, b) => a + b, 0);
        console.log('Total rooms:', totalRooms);
        if (totalRooms < 5) {
            results.errors.push(`Insufficient total rooms: ${totalRooms}`);
        }

        // Set validation status
        results.isValid = results.errors.length === 0;
        console.log('Validation results:', {
            isValid: results.isValid,
            errors: results.errors
        });
        console.groupEnd();

        return results;
    }
}
window.TileMapGenerator = TileMapGenerator