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

}
window.TileMapGenerator = TileMapGenerator
