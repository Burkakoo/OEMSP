# Build Configuration Documentation

## Overview

This document describes the Vite build configuration for the MERN Education Platform frontend application. The configuration is optimized for production builds with code splitting, asset handling, and performance optimizations.

## Configuration File

Location: `frontend/vite.config.ts`

## Key Features

### 1. Path Aliases

Path aliases are configured for cleaner imports throughout the application:

```typescript
'@': './src'
'@components': './src/components'
'@pages': './src/pages'
'@store': './src/store'
'@utils': './src/utils'
'@types': './src/types'
'@hooks': './src/hooks'
'@services': './src/services'
'@assets': './src/assets'
```

**Usage Example:**
```typescript
// Instead of: import Button from '../../../components/Button'
import Button from '@components/Button';
```

### 2. Code Splitting

The build configuration implements manual chunk splitting for optimal caching:

#### Vendor Chunks
- **react-vendor**: React core libraries (react, react-dom, react-router-dom)
- **redux-vendor**: Redux libraries (react-redux, @reduxjs/toolkit)

This separation ensures that:
- Vendor code is cached separately from application code
- Updates to application code don't invalidate vendor cache
- Parallel loading of vendor and application chunks

#### Feature-Based Chunks (Future)
As features are developed, additional chunks can be added:
```typescript
'auth': ['./src/features/auth'],
'courses': ['./src/features/courses'],
'quiz': ['./src/features/quiz'],
```

### 3. Asset Handling

Assets are organized by type with content-based hashing:

#### Images
- **Extensions**: png, jpg, jpeg, svg, gif, tiff, bmp, ico
- **Output**: `assets/images/[name]-[hash][extname]`

#### Fonts
- **Extensions**: woff, woff2, eot, ttf, otf
- **Output**: `assets/fonts/[name]-[hash][extname]`

#### Other Assets
- **Output**: `assets/[name]-[hash][extname]`

#### JavaScript Chunks
- **Output**: `assets/js/[name]-[hash].js`

### 4. Optimization Features

#### Minification
- **Engine**: esbuild (faster than terser)
- **Benefits**: Smaller bundle sizes, faster build times

#### CSS Code Splitting
- Enabled for better caching and parallel loading
- Each route/component can have its own CSS chunk

#### Asset Inlining
- **Threshold**: 4KB
- Assets smaller than 4KB are inlined as base64
- Reduces HTTP requests for small assets

#### Dependency Pre-bundling
Pre-bundled dependencies for faster dev server startup:
- react
- react-dom
- react-router-dom
- react-redux
- @reduxjs/toolkit

### 5. Build Targets

- **Target**: ES2015
- **Browser Support**: Modern browsers (Chrome, Firefox, Safari, Edge - latest 2 versions)
- Smaller bundle sizes by targeting modern JavaScript features

## Build Scripts

### Development
```bash
npm run dev
```
- Starts development server on port 3000
- Hot module replacement enabled
- API proxy to backend (http://localhost:5000)

### Production Build
```bash
npm run build
```
- TypeScript compilation check
- Production-optimized build
- Generates source maps for debugging
- Output directory: `dist/`

### Preview Production Build
```bash
npm run preview
```
- Serves production build locally
- Port: 3000
- Useful for testing production build before deployment

## Performance Optimizations

### 1. Chunk Size Management
- Warning threshold: 1000 KB
- Helps identify oversized chunks
- Encourages proper code splitting

### 2. Source Maps
- Enabled in production for debugging
- Can be disabled by setting `sourcemap: false` if needed

### 3. Browser Caching
- Content-based hashing in filenames
- Unchanged files retain same hash
- Optimal cache invalidation strategy

## Development Server Configuration

### Port
- Default: 3000

### API Proxy
- Proxies `/api` requests to `http://localhost:5000`
- Enables seamless backend integration during development
- Avoids CORS issues

## Future Enhancements

### 1. Environment-Specific Builds
Consider adding environment-specific configurations:
```typescript
export default defineConfig(({ mode }) => {
  return {
    // Different configs for 'development', 'staging', 'production'
  }
});
```

### 2. Bundle Analysis
Add bundle analyzer for visualizing bundle composition:
```bash
npm install --save-dev rollup-plugin-visualizer
```

### 3. Compression
Add gzip/brotli compression plugin:
```bash
npm install --save-dev vite-plugin-compression
```

### 4. PWA Support
Add Progressive Web App capabilities:
```bash
npm install --save-dev vite-plugin-pwa
```

### 5. Image Optimization
Add automatic image optimization:
```bash
npm install --save-dev vite-plugin-imagemin
```

## Troubleshooting

### Build Fails with "terser not found"
- Solution: Configuration uses esbuild instead of terser
- If terser is needed: `npm install --save-dev terser`

### Large Bundle Sizes
1. Check chunk size warnings
2. Review manual chunks configuration
3. Use dynamic imports for large features
4. Consider lazy loading routes

### Slow Build Times
1. Reduce source map generation in development
2. Disable CSS code splitting in development
3. Use `build.target: 'esnext'` for faster builds (development only)

### Path Alias Not Working
1. Ensure TypeScript is configured with matching paths in `tsconfig.json`
2. Restart development server after config changes

## Best Practices

1. **Use Path Aliases**: Cleaner imports, easier refactoring
2. **Lazy Load Routes**: Use React.lazy() for route components
3. **Dynamic Imports**: Split large features into separate chunks
4. **Optimize Images**: Compress images before adding to project
5. **Monitor Bundle Size**: Regularly check build output for size increases
6. **Test Production Builds**: Use `npm run preview` before deployment

## Related Documentation

- [Vite Configuration Reference](https://vitejs.dev/config/)
- [Rollup Options](https://rollupjs.org/configuration-options/)
- [Build Optimizations](https://vitejs.dev/guide/build.html)
