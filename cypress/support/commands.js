// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

/**
 * Custom command to login to the application
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {boolean} waitForRedirect - Whether to wait for redirect to course join form
 */
Cypress.Commands.add('login', (email, password, waitForRedirect = true) => {
  cy.get('[data-cy="email-input"]').clear().type(email);
  cy.get('[data-cy="password-input"]').clear().type(password);
  cy.get('[data-cy="login-button"]').click();
  
  if (waitForRedirect) {
    // Wait for successful login and redirect
    cy.get('#courseJoinForm').should('be.visible');
    cy.get('#loginForm').should('not.be.visible');
  }
});

/**
 * Custom command to join a course
 * @param {string} courseCode - Course code
 * @param {string} coursePassword - Course password
 * @param {boolean} waitForDashboard - Whether to wait for dashboard to load
 */
Cypress.Commands.add('joinCourse', (courseCode, coursePassword, waitForDashboard = true) => {
  cy.get('[data-cy="course-code-input"]').clear().type(courseCode);
  cy.get('[data-cy="course-password-input"]').clear().type(coursePassword);
  cy.get('[data-cy="join-course-button"]').click();
  
  if (waitForDashboard) {
    // Wait for successful course join and dashboard load
    cy.get('#courseDashboard').should('be.visible');
    cy.get('#courseJoinForm').should('not.be.visible');
  }
});

/**
 * Custom command to perform complete login and course join flow
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {string} courseCode - Course code
 * @param {string} coursePassword - Course password
 */
Cypress.Commands.add('loginAndJoinCourse', (email, password, courseCode, coursePassword) => {
  cy.login(email, password);
  cy.joinCourse(courseCode, coursePassword);
});

/**
 * Custom command to check if an element contains expected text
 * @param {string} selector - CSS selector or data-cy attribute
 * @param {string} text - Expected text content
 */
Cypress.Commands.add('shouldContainText', (selector, text) => {
  cy.get(selector).should('contain.text', text);
});

/**
 * Custom command to wait for loading to complete
 * @param {number} timeout - Timeout in milliseconds
 */
Cypress.Commands.add('waitForLoading', (timeout = 5000) => {
  // Wait for loading indicator to disappear
  cy.get('#loadingIndicator', { timeout }).should('not.be.visible');
  // Wait for start course button to appear
  cy.get('[data-cy="start-course-button"]', { timeout }).should('be.visible');
});

/**
 * Custom command to check for error messages
 * @param {string} errorSelector - Selector for error container
 * @param {string} expectedMessage - Expected error message
 */
Cypress.Commands.add('shouldShowError', (errorSelector, expectedMessage) => {
  // Wait for the error to become visible with a reasonable timeout
  cy.get(errorSelector, { timeout: 10000 })
    .should('be.visible')
    .and('contain.text', expectedMessage);
});

/**
 * Custom command to check for success messages
 * @param {string} successSelector - Selector for success container
 * @param {string} expectedMessage - Expected success message
 */
Cypress.Commands.add('shouldShowSuccess', (successSelector, expectedMessage) => {
  // Wait for the success message to become visible with a reasonable timeout
  cy.get(successSelector, { timeout: 10000 })
    .should('be.visible')
    .and('contain.text', expectedMessage);
});

/**
 * Custom command to reset application state
 */
Cypress.Commands.add('resetApp', () => {
  cy.window().then((win) => {
    if (win.resetApp) {
      win.resetApp();
    }
  });
});

/**
 * Custom command to get mock data from the application
 * @param {string} dataType - Type of mock data (users, courses)
 */
Cypress.Commands.add('getMockData', (dataType) => {
  return cy.window().then((win) => {
    switch (dataType) {
      case 'users':
        return win.mockUsers;
      case 'courses':
        return win.mockCourses;
      default:
        throw new Error(`Unknown mock data type: ${dataType}`);
    }
  });
});

/**
 * Custom command to verify application state
 * @param {string} stateType - Type of state to check (user, course, currentCourse)
 */
Cypress.Commands.add('verifyAppState', (stateType, expectedValue = null) => {
  cy.window().then((win) => {
    switch (stateType) {
      case 'user':
        expect(win.getCurrentUser()).to.equal(expectedValue);
        break;
      case 'course':
      case 'currentCourse': // Alias for backward compatibility
        expect(win.getCurrentCourse()).to.equal(expectedValue);
        break;
      default:
        throw new Error(`Unknown state type: ${stateType}`);
    }
  });
});

/**
 * Custom command for keyboard tab navigation using native cy.press()
 * Uses Cypress v14.3.0+ native Tab key support for more accurate browser behavior
 * 
 * This command leverages cy.press(Cypress.Keyboard.Keys.TAB) which dispatches
 * native keyboard events (keydown, press, keyup) directly to the browser,
 * allowing the browser's natural tab navigation to work as expected.
 */
Cypress.Commands.add('tab', { prevSubject: 'element' }, (subject) => {
  cy.log('Pressing Tab key using native cy.press() for natural browser navigation');
  
  // Use the new native cy.press() method introduced in Cypress v14.3.0
  // This dispatches real Tab key events, letting the browser handle focus naturally
  return cy.wrap(subject).then(() => {
    cy.press(Cypress.Keyboard.Keys.TAB);
    
    // Return the currently focused element after tab navigation
    // This maintains chainability and allows tests to verify the focused element
    return cy.focused();
  });
});


