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
window.DebugText = DebugText;

class Joystick {
    constructor(container, options = {}) {
        this.container = container;
        this.active = false;
        this.name = options.name || 'movement';
        this.startPosition = {
            x: 0,
            y: 0
        };
        this.currentPosition = {
            x: 0,
            y: 0
        };
        this.vector = {
            x: 0,
            y: 0
        };

        // Create joystick elements
        this.base = document.createElement('div');
        this.stick = document.createElement('div');

        // Style base
        this.base.style.position = 'absolute';

        // Apply position from options
        if (options.position) {
            Object.entries(options.position).forEach(([key, value]) => {
                this.base.style[key] = value;
            });
        }
        this.base.style.width = '100px';
        this.base.style.height = '100px';
        this.base.style.borderRadius = '50%';
        this.base.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        this.base.style.border = '2px solid rgba(255, 255, 255, 0.4)';
        this.base.style.pointerEvents = 'auto';

        // Style stick
        this.stick.style.position = 'absolute';
        this.stick.style.width = '50px';
        this.stick.style.height = '50px';
        this.stick.style.borderRadius = '50%';
        this.stick.style.backgroundColor = 'rgba(255, 255, 255, 0.5)';
        this.stick.style.left = '25px';
        this.stick.style.top = '25px';
        this.stick.style.pointerEvents = 'none';

        this.base.appendChild(this.stick);
        this.container.appendChild(this.base);

        // Add event listeners
        this.base.addEventListener('touchstart', this.onStart.bind(this));
        this.base.addEventListener('touchmove', this.onMove.bind(this));
        this.base.addEventListener('touchend', this.onEnd.bind(this));

        // For desktop testing
        this.base.addEventListener('mousedown', this.onStart.bind(this));
        document.addEventListener('mousemove', this.onMove.bind(this));
        document.addEventListener('mouseup', this.onEnd.bind(this));
    }

    onStart(e) {
        this.active = true;
        const pos = this.getEventPosition(e);
        this.startPosition = this.getElementPosition(this.base);
        this.currentPosition = {
            x: pos.x - this.startPosition.x,
            y: pos.y - this.startPosition.y
        };
        this.updateStickPosition();
    }

    onMove(e) {
        if (!this.active) return;
        e.preventDefault();
        const pos = this.getEventPosition(e);
        this.currentPosition = {
            x: pos.x - this.startPosition.x,
            y: pos.y - this.startPosition.y
        };

        // Calculate vector from center
        const deltaX = this.currentPosition.x - 50;
        const deltaY = this.currentPosition.y - 50;
        const distance = Math.min(50, Math.sqrt(deltaX * deltaX + deltaY * deltaY));
        const angle = Math.atan2(deltaY, deltaX);
        // Implement 16-way directional movement
        const sectors = 16;
        const sectorSize = (Math.PI * 2) / sectors;
        const snappedAngle = Math.round(angle / sectorSize) * sectorSize;
        // Calculate normalized vector components
        const normalizedDistance = distance / 50;
        this.vector = {
            x: Math.cos(snappedAngle) * normalizedDistance,
            y: Math.sin(snappedAngle) * normalizedDistance
        };

        this.updateStickPosition();
    }

    onEnd() {
        this.active = false;
        this.vector = {
            x: 0,
            y: 0
        };
        this.stick.style.left = '25px';
        this.stick.style.top = '25px';
        // Trigger an immediate input update
        if (window.Player) {
            window.Player.handleMovementInput();
        }
    }

    getEventPosition(e) {
        if (e.touches && e.touches[0]) {
            return {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        }
        return {
            x: e.clientX,
            y: e.clientY
        };
    }

    getElementPosition(el) {
        const rect = el.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top
        };
    }

    updateStickPosition() {
        const deltaX = this.currentPosition.x - 50;
        const deltaY = this.currentPosition.y - 50;
        const distance = Math.min(50, Math.sqrt(deltaX * deltaX + deltaY * deltaY));

        // Use the snapped angle for visual feedback
        const sectors = 16;
        const sectorSize = (Math.PI * 2) / sectors;
        const angle = Math.atan2(deltaY, deltaX);
        const snappedAngle = Math.round(angle / sectorSize) * sectorSize;
        const x = 25 + (distance * Math.cos(snappedAngle));
        const y = 25 + (distance * Math.sin(snappedAngle));
        this.stick.style.left = x + 'px';
        this.stick.style.top = y + 'px';
    }

    getInput() {
        return this.vector;
    }
}
window.Joystick = Joystick
class HUD {
    constructor(params) {
        // Validate required parameters
        if (!params) {
            throw new Error('HUD: params object is required');
        }
        this.isVisible = false;
        this.roomDisplay = null;
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
        this.components = {
            Crosshair: null,
            Joystick: null,
            CameraJoystick: null,
        };
    }
    init() {
        try {
            // Create room display element
            this.roomDisplay = document.createElement('div');
            this.roomDisplay.style.position = 'absolute';
            this.roomDisplay.style.top = '20px';
            this.roomDisplay.style.left = '50%';
            this.roomDisplay.style.transform = 'translateX(-50%)';
            this.roomDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            this.roomDisplay.style.color = 'white';
            this.roomDisplay.style.padding = '10px 20px';
            this.roomDisplay.style.borderRadius = '5px';
            this.roomDisplay.style.fontFamily = 'Arial, sans-serif';
            this.roomDisplay.style.fontSize = '16px';
            this.roomDisplay.style.zIndex = '1000';
            this.roomDisplay.style.pointerEvents = 'none';
            this.container.appendChild(this.roomDisplay);
            this.components.Crosshair = new this.Crosshair({
                uiContainer: this.container
            });

            // Initialize movement joystick (left)
            this.components.Joystick = new Joystick(this.container, {
                position: {
                    bottom: '100px',
                    left: '100px'
                },
                name: 'movement'
            });

            // Initialize camera joystick (right)
            this.components.CameraJoystick = new Joystick(this.container, {
                position: {
                    bottom: '100px',
                    right: '100px'
                },
                name: 'camera'
            });

        } catch (error) {
            console.error('HUD: Failed to initialize components:', error);
            throw error;
        }
    }

    show() {
        this.isVisible = true;
        if (this.roomDisplay) {
            this.roomDisplay.style.display = 'block';
        }
    }
    hide() {
        this.isVisible = false;
        if (this.roomDisplay) {
            this.roomDisplay.style.display = 'none';
        }
    }
    update() {
        try {
            if (this.isVisible && window.Player && window.GameWorld?.tilemap && window.DungeonManager) {
                const playerPos = window.Player.getPosition();
                // Convert world position to grid position
                const gridPos = window.GameWorld.tilemap.worldToGridPosition(playerPos.x, playerPos.z);

                // Get room at player's position
                const room = window.DungeonManager.getRoomAtPosition(gridPos.x, gridPos.z);

                if (room) {
                    this.roomDisplay.textContent = `${room.name}`;
                    this.roomDisplay.style.display = 'block';
                } else {
                    this.roomDisplay.textContent = 'Corridor';
                    this.roomDisplay.style.display = 'block';
                }
            } else {
                this.roomDisplay.style.display = 'none';
            }
        } catch (error) {
            console.warn('HUD: Error during update:', error);
        }
    }
}
window.HUD = HUD;
