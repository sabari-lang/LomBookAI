/**
 * Route Validation Script
 * 
 * Scans src/services/** for API calls and compares against tools/backendRoutes.json
 * Prints invalid routes (called but not in backend) and missing routes (exist but never used)
 * 
 * Usage: node tools/validateRoutes.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Load backend routes catalog
const routesCatalogPath = path.join(__dirname, 'backendRoutes.json');
let backendRoutes = [];

try {
    const catalogContent = fs.readFileSync(routesCatalogPath, 'utf8');
    const catalog = JSON.parse(catalogContent);
    backendRoutes = catalog.routes || [];
} catch (error) {
    console.error('⚠️  Could not load backendRoutes.json:', error.message);
    console.log('Continuing with empty route catalog...');
}

// Build route lookup map (method + normalized path)
const routeMap = new Map();
backendRoutes.forEach(route => {
    // Normalize path: remove parameter placeholders {param} -> *
    const normalizedPath = route.path.replace(/\{[^}]+\}/g, '*');
    const key = `${route.method}:${normalizedPath}`;
    routeMap.set(key, route);
});

// Find all service files
const servicesDir = path.join(__dirname, '..', 'src', 'services');
const componentApiDir = path.join(__dirname, '..', 'src', 'components', 'logisticsservices');

function findServiceFiles(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const filePath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                findServiceFiles(filePath, fileList);
            } else if (entry.name.endsWith('.js') && (entry.name.includes('Api') || entry.name.includes('Service') || entry.name === 'api.js')) {
                fileList.push(filePath);
            }
        }
    } catch (error) {
        // Skip if directory can't be read
    }
    
    return fileList;
}

// Also check component API files
const allFiles = [
    ...findServiceFiles(servicesDir),
    ...findServiceFiles(componentApiDir)
];

// Extract API calls from files
const foundRoutes = new Map(); // key: method:path, value: { files: Set, count: number }

allFiles.forEach(filePath => {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(path.join(__dirname, '..'), filePath);
        
        // Match patterns like: logisticsApi.get("/path", ...) or api.post("/path", ...)
        // Match patterns like: logisticsApi.get(`/path/${var}`, ...) or api.put(`/path/${var}`, ...)
        const apiCallRegex = /(?:logisticsApi|api)\.(get|post|put|delete|patch)\s*\([`'"]([^`'"]+)[`'"]/gi;
        
        let match;
        while ((match = apiCallRegex.exec(content)) !== null) {
            const method = match[1].toUpperCase();
            let routePath = match[2];
            
            // Normalize template literals: remove ${var} -> *
            routePath = routePath.replace(/\$\{[^}]+\}/g, '*');
            
            // Remove query string if present
            routePath = routePath.split('?')[0];
            
            const key = `${method}:${routePath}`;
            
            if (!foundRoutes.has(key)) {
                foundRoutes.set(key, { files: new Set(), count: 0 });
            }
            foundRoutes.get(key).files.add(relativePath);
            foundRoutes.get(key).count++;
        }
    } catch (error) {
        console.warn(`⚠️  Could not read ${filePath}:`, error.message);
    }
});

// Validate routes
const invalidRoutes = [];
const validRoutes = [];

foundRoutes.forEach((info, routeKey) => {
    const [method, pathPattern] = routeKey.split(':');
    
    // Try to match against backend routes
    // Convert our pattern to regex: * -> .+
    const patternRegex = new RegExp('^' + pathPattern.replace(/\*/g, '.+') + '$');
    
    let matched = false;
    for (const [backendKey, backendRoute] of routeMap.entries()) {
        const [backendMethod, backendPath] = backendKey.split(':');
        if (backendMethod === method && patternRegex.test(backendPath)) {
            matched = true;
            validRoutes.push({
                frontend: routeKey,
                backend: backendKey,
                files: Array.from(info.files),
                count: info.count
            });
            break;
        }
    }
    
    // Also check if it's a known pattern (composite routes with job/house keys)
    if (!matched) {
        // Allow composite routes like /{mode}/houses/job/{jobNo}/hawb/{hawb}/...
        const compositePattern = /^[A-Z]+:\/\w+-\w+\/(house|houses)\/job\/\*\/\w+\/\*\/.+/;
        if (compositePattern.test(routeKey)) {
            // Likely valid composite route - mark as valid with warning
            validRoutes.push({
                frontend: routeKey,
                backend: 'COMPOSITE_ROUTE (not in catalog)',
                files: Array.from(info.files),
                count: info.count,
                warning: 'Composite route - verify against backend'
            });
            matched = true;
        }
    }
    
    if (!matched) {
        invalidRoutes.push({
            route: routeKey,
            files: Array.from(info.files),
            count: info.count
        });
    }
});

// Find missing backend routes (exist in catalog but never used)
const missingRoutes = [];
backendRoutes.forEach(route => {
    const normalizedPath = route.path.replace(/\{[^}]+\}/g, '*');
    const key = `${route.method}:${normalizedPath}`;
    
    let found = false;
    foundRoutes.forEach((info, frontendKey) => {
        const [method, pathPattern] = frontendKey.split(':');
        const patternRegex = new RegExp('^' + pathPattern.replace(/\*/g, '.+') + '$');
        const [backendMethod, backendPath] = key.split(':');
        
        if (backendMethod === method && patternRegex.test(backendPath)) {
            found = true;
        }
    });
    
    if (!found) {
        missingRoutes.push(route);
    }
});

// Print results
console.log('\n═══════════════════════════════════════════════════════════════');
console.log('  ROUTE VALIDATION REPORT');
console.log('═══════════════════════════════════════════════════════════════\n');

console.log(`📊 Summary:`);
console.log(`   Total backend routes in catalog: ${backendRoutes.length}`);
console.log(`   Total frontend API calls found: ${foundRoutes.size}`);
console.log(`   ✅ Valid routes: ${validRoutes.length}`);
console.log(`   ❌ Invalid routes: ${invalidRoutes.length}`);
console.log(`   ⚠️  Unused backend routes: ${missingRoutes.length}\n`);

if (invalidRoutes.length > 0) {
    console.log('❌ INVALID ROUTES (called in frontend but not in backend catalog):');
    console.log('─────────────────────────────────────────────────────────────\n');
    invalidRoutes.forEach((item, index) => {
        console.log(`${index + 1}. ${item.route}`);
        console.log(`   Called ${item.count} time(s) in:`);
        item.files.forEach(file => console.log(`     - ${file}`));
        console.log('');
    });
} else {
    console.log('✅ No invalid routes found!\n');
}

if (missingRoutes.length > 0 && missingRoutes.length <= 50) {
    console.log('⚠️  UNUSED BACKEND ROUTES (exist in catalog but never called):');
    console.log('─────────────────────────────────────────────────────────────\n');
    missingRoutes.slice(0, 20).forEach((route, index) => {
        console.log(`${index + 1}. ${route.method} ${route.path}`);
        if (route.description) console.log(`   ${route.description}`);
    });
    if (missingRoutes.length > 20) {
        console.log(`\n   ... and ${missingRoutes.length - 20} more (informational only)\n`);
    }
}

// Exit with error code if invalid routes found
if (invalidRoutes.length > 0) {
    console.log('⚠️  ACTION REQUIRED: Fix or remove invalid routes above\n');
    process.exit(1);
} else {
    console.log('✅ All routes are valid!\n');
    process.exit(0);
}

