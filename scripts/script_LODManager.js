class LODManager {
    constructor() {
        this.lodObjects = new Map(); // Store LOD objects
        this.enabled = APP_SETTINGS.lod.enabled;
        this.distances = {
            ...APP_SETTINGS.lod.distances
        }; // Clone distances for dynamic updates
        this.levels = APP_SETTINGS.lod.levels;
        this.currentRoom = null;
        this.visibleObjects = new Set(); // Track currently visible objects
    }
    createLODMesh(originalMesh, name) {
        if (!this.enabled) return originalMesh;
        const lod = new THREE.LOD();
        // Create high detail level (original)
        originalMesh.castShadow = this.levels.high.shadowCasting;
        originalMesh.receiveShadow = this.levels.high.shadowCasting;
        lod.addLevel(originalMesh, this.distances.high);
        // Create medium detail level
        const mediumMesh = this.createReducedMesh(originalMesh, this.levels.medium);
        mediumMesh.castShadow = this.levels.medium.shadowCasting;
        mediumMesh.receiveShadow = this.levels.medium.shadowCasting;
        lod.addLevel(mediumMesh, this.distances.medium);
        // Create low detail level
        const lowMesh = this.createReducedMesh(originalMesh, this.levels.low);
        lowMesh.castShadow = this.levels.low.shadowCasting;
        lowMesh.receiveShadow = this.levels.low.shadowCasting;
        lod.addLevel(lowMesh, this.distances.low);
        // Create ultra low detail level
        const ultraLowMesh = this.createReducedMesh(originalMesh, this.levels.ultraLow);
        ultraLowMesh.castShadow = this.levels.ultraLow.shadowCasting;
        ultraLowMesh.receiveShadow = this.levels.ultraLow.shadowCasting;
        lod.addLevel(ultraLowMesh, this.distances.ultraLow);
        // Store the LOD object
        this.lodObjects.set(name, lod);
        return lod;
    }
    createReducedMesh(originalMesh, levelSettings) {
        const mesh = originalMesh.clone();
        // Reduce geometry
        if (mesh.geometry) {
            const modifier = new THREE.SimplifyModifier();
            const vertexCount = Math.floor(mesh.geometry.attributes.position.count * levelSettings.geometryReduction);
            mesh.geometry = modifier.modify(mesh.geometry, vertexCount);
        }
        // Reduce texture resolution if exists
        if (mesh.material && mesh.material.map) {
            const originalTexture = mesh.material.map;
            const reducedWidth = Math.floor(originalTexture.image.width * levelSettings.textureSize);
            const reducedHeight = Math.floor(originalTexture.image.height * levelSettings.textureSize);
            const canvas = document.createElement('canvas');
            canvas.width = reducedWidth;
            canvas.height = reducedHeight;
            const ctx = canvas.getContext('2d');
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'low';
            ctx.drawImage(originalTexture.image, 0, 0, reducedWidth, reducedHeight);
            mesh.material.map = new THREE.CanvasTexture(canvas);
            mesh.material.map.minFilter = THREE.LinearFilter;
            mesh.material.map.magFilter = THREE.LinearFilter;
        }
        // Simplify material for lower detail levels
        if (levelSettings.geometryReduction < 0.3) {
            mesh.material = new THREE.MeshBasicMaterial({
                map: mesh.material.map,
                color: mesh.material.color
            });
        }
        return mesh;
    }
    updateLODs(camera) {
        if (!this.enabled) return;
        // Get player's current room from DungeonManager
        if (window.Player && window.DungeonManager) {
            const playerPos = window.Player.getPosition();
            const gridPos = window.GameWorld.tilemap.worldToGridPosition(playerPos.x, playerPos.z);
            this.currentRoom = window.DungeonManager.getRoomAtPosition(gridPos.x, gridPos.z);
        }
        // Update visible objects based on current room and connected rooms
        this.updateVisibility();
        // Update LOD levels for visible objects
        this.lodObjects.forEach((lod, objectId) => {
            if (this.visibleObjects.has(objectId)) {
                lod.visible = true;
                lod.update(camera);
            } else {
                lod.visible = false;
            }
        });
    }
    updateVisibility() {
        if (!this.currentRoom || !window.DungeonManager) return;
        this.visibleObjects.clear();
        // Add objects in current room
        this.addRoomObjectsToVisible(this.currentRoom);
        // Add objects in connected rooms
        if (this.currentRoom.connections) {
            this.currentRoom.connections.forEach(connectedRoomId => {
                const connectedRoom = window.DungeonManager.rooms.get(connectedRoomId);
                if (connectedRoom) {
                    this.addRoomObjectsToVisible(connectedRoom);
                }
            });
        }
    }
    addRoomObjectsToVisible(room) {
        // Add objects based on room bounds
        this.lodObjects.forEach((_, objectId) => {
            const objectPosition = this.getObjectPosition(objectId);
            if (objectPosition && this.isPositionInRoom(objectPosition, room)) {
                this.visibleObjects.add(objectId);
            }
        });
    }
    getObjectPosition(objectId) {
        const lod = this.lodObjects.get(objectId);
        return lod ? lod.position : null;
    }
    isPositionInRoom(position, room) {
        const gridPos = window.GameWorld.tilemap.worldToGridPosition(position.x, position.z);
        return gridPos.x >= room.bounds.left &&
            gridPos.x <= room.bounds.right &&
            gridPos.z >= room.bounds.top &&
            gridPos.z <= room.bounds.bottom;
    }
    dispose() {
        this.lodObjects.forEach(lod => {
            lod.levels.forEach(level => {
                if (level.object.geometry) level.object.geometry.dispose();
                if (level.object.material) {
                    if (level.object.material.map) level.object.material.map.dispose();
                    level.object.material.dispose();
                }
            });
        });
        this.lodObjects.clear();
    }
}
window.LODManager = LODManager;