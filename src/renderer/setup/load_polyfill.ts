import { BUILD_TARGET } from '../variables'

if (BUILD_TARGET === 'mobile_app') {
  import('core-js/actual').catch((error) => {
    // Optionally log or handle the import error
    console.error('Failed to load polyfills:', error)
  })
}
