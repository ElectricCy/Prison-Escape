# Prison-Escape
Prison Escape game made with Three.js ROT.js and Rosebud.ai


# Rosebud AI Game Development Framework

## Code Structure Overview

This game development framework uses a hybrid approach that combines a main code file with dynamically loaded script assets. This structure is specifically designed to work with Rosebud AI's assistance capabilities.

### Main Code File

The primary code file contains:
- Core game initialization
- Essential class definitions
- Base configuration settings
- Asset definitions
- Core game loop and management

### Dynamic Script Loading

Additional functionality is loaded through external script assets:
```javascript
const SCRIPT_ASSETS = [{
    name: "rot-js",
    url: "https://unpkg.com/rot-js"
}, {
    name: "script_gunManager",
    url: "https://play.rosebud.ai/assets/script_gunManager.js"
    // ... more scripts
}];
```javascript
Why This Structure?
AI Assistance:

Rosebud AI can analyze and modify the main code file while being aware of the external scripts
This allows for contextual suggestions and improvements while maintaining modularity
Modularity:

Core game logic remains in one file for easy version control
Specialized functionality is separated into modules
Makes it easier to update individual components
Asset Management:

Clear separation between core code and assets
Efficient loading and management of models, sounds, and images
Centralized asset configuration
Development Workflow:

Edit main file for core changes
Use external scripts for specific features
Rosebud AI can suggest changes while understanding the full context
Working with Rosebud AI
When requesting changes or improvements:

Share the main code file
Reference external scripts as needed
Rosebud AI will provide suggestions that work within this structure
Benefits
Maintainability: Clear separation of concerns
Scalability: Easy to add new features through modules
AI-Friendly: Structure optimized for AI assistance
Version Control: Better management of core code changes
Performance: Efficient loading of necessary components
Best Practices
Keep core game logic in the main file
Use external scripts for specific features
Maintain clear asset organization
Document script dependencies
Use consistent naming conventions