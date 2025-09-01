// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES6 syntax:
import './commands';
import './pages';
import './utils';
import './test-data';

// Import cypress-grep support
import registerCypressGrep from '@cypress/grep/src/support';
registerCypressGrep();

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Configure global Cypress settings
Cypress.on('uncaught:exception', (err, runnable) => {
  // Returning false here prevents Cypress from failing the test on uncaught exceptions
  // You can customize this based on specific error types you want to ignore
  if (err.message.includes('Script error')) {
    return false;
  }
  return true;
});

// Note: Global beforeEach removed for performance
// Individual test files now control their own setup/teardown for better optimization
