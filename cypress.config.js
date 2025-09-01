import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    // Base URL for the application
    baseUrl: 'http://localhost:3000',
    
    // Cypress 15.0.0 - Enable experimental Studio for AI-assisted test creation
    // experimentalStudio: true,
    
    // Test patterns
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    
    // Viewport settings
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Video and screenshot settings
    video: true,
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    
    // Test execution settings
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    
    // Test isolation and cleanup
    testIsolation: true,
    
    // Environment variables
    env: {
      // Test data
      validEmail: 'student@classavo.com',
      validPassword: 'password123',
      unverifiedEmail: 'unverified@classavo.com',
      validCourseCode: 'CS101',
      validCoursePassword: 'intro2023',
      invalidCourseCode: 'INVALID',
      invalidCoursePassword: 'wrong',
      
      // Cypress-grep configuration
      grepFilterSpecs: true,
      grepOmitFiltered: true
    },
    
    setupNodeEvents(on, config) {
      // Implement node event listeners here
      
      // Add cypress-grep plugin
      require('@cypress/grep/src/plugin')(config);
      
      // Example: Add custom tasks
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
      
      // Example: Handle file operations
      on('task', {
        resetAppState() {
          // Custom task to reset application state if needed
          return null;
        }
      });
      
      return config;
    },
  },
  
  // Component testing configuration (if needed in future)
  // Removed webpack bundler reference for Cypress 15 compatibility
  // Re-enable and configure when component testing is needed
  // component: {
  //   devServer: {
  //     framework: 'html',
  //     bundler: 'vite', // or configure webpack 5+ if needed
  //   },
  // },
});
