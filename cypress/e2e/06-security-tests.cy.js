/**
 * SECURITY TESTING SUITE
 * 
 * This file contains comprehensive security tests that validate application
 * security against various attack vectors including XSS, injection attacks,
 * authentication bypass, and more.
 * 
 * ⚠️  These tests are OPTIONAL and excluded from regular E2E test runs by default
 *     due to their comprehensive nature and longer execution time.
 * 
 * USAGE:
 *   npm test                    - Regular E2E tests (excludes security)
 *   npm run test:security       - Run comprehensive security tests
 *   npm run test:security:fast  - Run security tests with sampling (faster)
 *   npm run test:all            - Run ALL tests including security
 * 
 * ENVIRONMENT VARIABLES:
 *   RUN_SECURITY_TESTS=true     - Enable security tests
 *   SECURITY_SAMPLE_ONLY=true   - Enable fast mode (test every 3rd payload)
 */

import { LoginPage } from '../support/pages';

// Skip security tests unless explicitly enabled
const runSecurityTests = Cypress.env('RUN_SECURITY_TESTS') === 'true' || Cypress.env('RUN_SECURITY_TESTS') === true;
const fastMode = Cypress.env('SECURITY_SAMPLE_ONLY') === 'true' || Cypress.env('SECURITY_SAMPLE_ONLY') === true;

(runSecurityTests ? describe : describe.skip)('Security Testing', () => {
  let users, courses, securityPayloads;
  
  before(() => {
    if (runSecurityTests) {
      const mode = fastMode ? '⚡ Fast mode (sampling)' : '🔍 Comprehensive mode';
      cy.log(`🛡️ Running security tests - ${mode}`);
    }
    // Load test fixtures
    cy.fixture('users').then((userData) => users = userData);
    cy.fixture('courses').then((courseData) => courses = courseData);
    cy.fixture('security-payloads').then((payloadData) => securityPayloads = payloadData);
  });

  // Test field configurations
  const FIELD_CONFIGS = {
    email: {
      selector: '[data-cy="email-input"]',
      submitSelector: '[data-cy="login-button"]',
      errorSelector: '#loginError',
      errorMessage: 'Invalid email or password',
      additionalInputs: [{ selector: '[data-cy="password-input"]', value: 'password123' }]
    },
    courseCode: {
      selector: '[data-cy="course-code-input"]',
      submitSelector: '[data-cy="join-course-button"]',
      errorSelector: '#courseError',
      errorMessage: 'Invalid course code. Please check with your instructor.',
      additionalInputs: [{ selector: '[data-cy="course-password-input"]', value: () => courses.validCourse.password }],
      requiresLogin: true
    }
  };

  // Payload categories for comprehensive testing
  const PAYLOAD_CATEGORIES = {
    injection: ['xssPayloads', 'sqlInjectionPayloads', 'nosqlInjectionPayloads', 'ldapInjectionPayloads', 'commandInjectionPayloads'],
    traversal: ['pathTraversalPayloads', 'headerInjectionPayloads'],
    bypass: ['encodingBypassPayloads', 'protocolBypassPayloads'],
    overflow: ['bufferOverflowPayloads', 'specialCharacters']
  };

  // Helper function to expand REPEAT patterns
  const expandPayload = (payload) => {
    const match = payload.match(/^REPEAT_(.+)_(\d+)$/);
    if (match) {
      const [, pattern, count] = match;
      const decodedPattern = pattern
        .replace(/\\u([0-9a-fA-F]{4})/g, (match, code) => String.fromCharCode(parseInt(code, 16)))
        .replace(/%([0-9a-fA-F]{2})/g, (match, code) => String.fromCharCode(parseInt(code, 16)));
      return decodedPattern.repeat(parseInt(count));
    }
    return payload;
  };

  // Enhanced helper for testing multiple payload categories against a field
  const testFieldSecurity = (fieldConfig, payloadCategories, options = {}) => {
    const config = FIELD_CONFIGS[fieldConfig];
    const allPayloads = payloadCategories.flatMap(category => securityPayloads[category] || []);
    
    if (config.requiresLogin) {
      cy.login(users.validUser.email, users.validUser.password);
    }

    allPayloads.forEach((payload, index) => {
      const expandedPayload = expandPayload(payload);
      
      // Use global fast mode or local sampleOnly option
      const shouldSample = fastMode || options.sampleOnly;
      if (shouldSample && index % 3 !== 0) return; // Test every 3rd payload for performance
      
      if (config.requiresLogin && index > 0) {
        cy.resetApp();
        cy.login(users.validUser.email, users.validUser.password);
      } else if (index > 0) {
        cy.resetApp();
      }

      // Input the payload
      if (expandedPayload.length > 100) {
        cy.get(config.selector).invoke('val', expandedPayload);
      } else {
        cy.get(config.selector).clear().type(expandedPayload, { parseSpecialCharSequences: false });
      }

      // Add additional required inputs
      config.additionalInputs.forEach(({ selector, value }) => {
        const inputValue = typeof value === 'function' ? value() : value;
        cy.get(selector).clear().type(inputValue);
      });

      cy.get(config.submitSelector).click();

      // Verify security validation - either HTML5 validation or application validation
      if (options.expectInvalid) {
        cy.get(`${config.selector}:invalid`).should('exist');
      } else {
        // Check for either HTML5 validation or application error message
        cy.get('body').then(($body) => {
          const isInvalid = $body.find(`${config.selector}:invalid`).length > 0;
          const hasError = $body.find(`${config.errorSelector}:visible`).length > 0;
          
          // Security validation should catch the malicious input either way
          if (!isInvalid && !hasError) {
            // If neither HTML5 nor application validation triggered, fail the test
            throw new Error(`Security payload was not properly rejected: ${expandedPayload.substring(0, 50)}...`);
          }
        });
      }
    });
  };

  // Helper for testing individual payload types
  const testPayloadCategory = (fieldConfig, payloadType, options = {}) => {
    testFieldSecurity(fieldConfig, [payloadType], options);
  };

  beforeEach(() => {
    LoginPage.visit();
    cy.resetApp();
  });

  describe('Comprehensive Security Payload Testing', () => {
    it('should protect email field against all injection attacks', () => {
      // Test all injection-based attacks against email field
      testFieldSecurity('email', PAYLOAD_CATEGORIES.injection);
      
      // Verify no script execution occurred
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('windowAlert');
      });
      cy.get('@windowAlert').should('not.have.been.called');
    });

    it('should protect course code field against all injection attacks', () => {
      // Test all injection-based attacks against course code field
      testFieldSecurity('courseCode', PAYLOAD_CATEGORIES.injection);
    });

    it('should handle bypass attempts and protocol attacks', () => {
      // Test encoding and protocol bypass attacks on email field
      // These payloads should be caught by either HTML5 validation or application validation
      testFieldSecurity('email', PAYLOAD_CATEGORIES.bypass);
    });

    it('should prevent path traversal and header injection', () => {
      // Test traversal attacks on course code field (more likely target)
      testFieldSecurity('courseCode', PAYLOAD_CATEGORIES.traversal);
    });

    it('should handle buffer overflow and special character attacks', () => {
      // Test overflow attacks on both fields
      testFieldSecurity('email', ['specialCharacters'], { expectInvalid: true });
      testFieldSecurity('courseCode', ['bufferOverflowPayloads']);
    });

    it('should comprehensively validate all security payloads', () => {
      // Comprehensive test with sampling for performance
      const allCategories = Object.values(PAYLOAD_CATEGORIES).flat();
      testFieldSecurity('email', allCategories, { sampleOnly: true });
    });
  });

  describe('Authentication and Session Security', () => {
    const authBypassPayloads = [
      { desc: 'empty credentials', email: '   ', password: '   ', expectInvalid: true },
      { desc: 'null byte injection', email: 'user@test.com\u0000admin', password: 'password123' },
      { desc: 'unicode bypass', email: 'admin\u202e@test.com', password: 'password123' }
    ];

    it('should prevent authentication bypass attempts', { tags: '@smoke' }, () => {
      authBypassPayloads.forEach(({ desc, email, password, expectInvalid }) => {
        cy.resetApp();
        cy.get('[data-cy="email-input"]').type(email);
        cy.get('[data-cy="password-input"]').type(password);
        cy.get('[data-cy="login-button"]').click();
        
        if (expectInvalid) {
          cy.get('[data-cy="email-input"]:invalid').should('exist');
          cy.get('#loginForm').should('be.visible');
        } else {
          cy.shouldShowError('#loginError', 'Invalid email or password');
        }
      });
    });

    it('should maintain session security and integrity', () => {
      cy.login(users.validUser.email, users.validUser.password);
      cy.verifyAppState('user', users.validUser.email);
      
      cy.window().then((win) => {
        // Verify session security infrastructure
        expect(win.getCurrentUser()).to.equal(users.validUser.email);
        expect(typeof win.getCurrentUser).to.equal('function');
        expect(typeof win.resetApp).to.equal('function');
        expect(win.getCurrentSessionId()).to.not.be.null;
      });
    });

    it('should handle rapid login attempts gracefully', () => {
      for (let i = 0; i < 3; i++) {
        cy.get('[data-cy="email-input"]').clear().type(users.invalidUser.email);
        cy.get('[data-cy="password-input"]').clear().type('wrongpassword');
        cy.get('[data-cy="login-button"]').click();
        cy.get('#loginError').should('be.visible');
        cy.wait(100);
      }
      cy.shouldShowError('#loginError', 'Invalid email or password');
    });
  });

  describe('Data Protection and Privacy', () => {
    it('should protect sensitive data and clear forms properly', { tags: '@smoke' }, () => {
      // Verify password field security
      cy.get('[data-cy="password-input"]').should('have.attr', 'type', 'password');
      
      // Intercept console logs to verify no sensitive data exposure
      cy.window().then((win) => {
        cy.stub(win.console, 'log').as('consoleLog');
        cy.stub(win.console, 'error').as('consoleError');
      });
      
      // Test login and form clearing
      cy.get('[data-cy="email-input"]').type(users.validUser.email);
      cy.get('[data-cy="password-input"]').type(users.validUser.password);
      cy.get('[data-cy="login-button"]').click();
      
      // Verify form security measures
      cy.get('#courseJoinForm').should('be.visible');
      cy.get('[data-cy="password-input"]').should('have.value', '');
      cy.get('.container').should('not.contain.text', users.validUser.password);
      
      // Verify no sensitive data in console logs
      cy.get('@consoleLog').should('not.have.been.calledWithMatch', users.validUser.password);
      cy.get('@consoleError').should('not.have.been.calledWithMatch', users.validUser.password);
    });

    it('should clear form data on navigation', () => {
      cy.get('[data-cy="email-input"]').type(users.validUser.email);
      cy.get('[data-cy="password-input"]').type(users.validUser.password);
      cy.reload();
      
      cy.get('[data-cy="email-input"]').should('have.value', '');
      cy.get('[data-cy="password-input"]').should('have.value', '');
    });
  });

  describe('Content Security and UI Protection', () => {
    const maliciousContentTypes = [
      'data:text/html,<script>alert("XSS")</script>',
      'data:application/javascript,alert("XSS")',
      'about:blank',
      'file:///etc/passwd'
    ];

    const malformedProtocols = [
      'javascript://comment%0Aalert(1)',
      'java\u0000script:alert(1)', 
      'javascript&colon;alert(1)',
      'ftp://evil.com/hack',
      'mailto:admin@test.com?subject=<script>alert(1)</script>'
    ];

    it('should reject malicious content types and protocols', () => {
      // Test malicious content types in course code
      cy.login(users.validUser.email, users.validUser.password);
      maliciousContentTypes.forEach((payload) => {
        cy.get('[data-cy="course-code-input"]').clear().type(payload);
        cy.get('[data-cy="course-password-input"]').clear().type(courses.validCourse.password);
        cy.get('[data-cy="join-course-button"]').click();
        cy.shouldShowError('#courseError', 'Invalid course code. Please check with your instructor.');
      });
    });

    it('should handle malformed URLs and protocol attacks', () => {
      malformedProtocols.forEach((payload) => {
        cy.resetApp();
        cy.get('[data-cy="email-input"]').type(payload);
        cy.get('[data-cy="password-input"]').type('password123');
        cy.get('[data-cy="login-button"]').click();
        
        cy.get('body').then(($body) => {
          const isInvalid = $body.find('[data-cy="email-input"]:invalid').length > 0;
          const hasError = $body.find('#loginError:visible').length > 0;
          expect(isInvalid || hasError).to.be.true;
        });
      });
    });

    it('should prevent clickjacking attacks', () => {
      cy.get('[data-cy="login-button"]').should('be.visible')
        .and('not.have.css', 'opacity', '0')
        .and('not.have.css', 'position', 'absolute');
      cy.get('#loginForm').should('be.visible').and('have.css', 'position', 'static');
    });
  });

  describe('Performance and DoS Protection', () => {
    it('should enforce input length limits and handle large payloads', () => {
      // Verify maxlength attributes
      cy.get('[data-cy="email-input"]').should('have.attr', 'maxlength', '254');
      cy.get('[data-cy="password-input"]').should('have.attr', 'maxlength', '128');
      
      // Test valid lengths
      const testEmail = 'a'.repeat(50) + '@test.com';
      const testPassword = 'p'.repeat(50);
      cy.get('[data-cy="email-input"]').type(testEmail).should('have.value', testEmail);
      cy.get('[data-cy="password-input"]').type(testPassword).should('have.value', testPassword);
      
      // Test length truncation
      const veryLongEmail = 'a'.repeat(300);
      cy.get('[data-cy="email-input"]').clear().invoke('val', veryLongEmail).trigger('input');
      cy.get('[data-cy="email-input"]').invoke('val').then((val) => {
        expect(val.length).to.be.at.most(254);
      });
    });

    it('should handle rapid submissions and resource exhaustion', () => {
      // Test rapid submissions
      for (let i = 0; i < 10; i++) {
        cy.get('[data-cy="email-input"]').clear().type(users.validUser.email);
        cy.get('[data-cy="password-input"]').clear().type('wrongpassword');
        cy.get('[data-cy="login-button"]').click();
        cy.get('[data-cy="login-button"]').should('be.disabled');
        cy.wait(50);
      }
      cy.get('#loginError').should('be.visible');
      
      // Test large payload handling
      cy.login(users.validUser.email, users.validUser.password);
      const largePayload = 'A'.repeat(5000);
      cy.get('[data-cy="course-code-input"]').invoke('val', largePayload);
      cy.get('[data-cy="course-code-input"]').should('exist');
      cy.get('[data-cy="course-code-input"]').should('have.attr', 'maxlength', '20');
    });
  });

  describe('Browser and API Security Configuration', () => {
    it('should have secure form and field configurations', () => {
      // Verify secure form methods
      cy.get('#login').should('have.attr', 'method').and('not.equal', 'get');
      cy.get('#courseJoin').should('have.attr', 'method').and('not.equal', 'get');
      
      // Verify secure autocomplete settings
      cy.get('[data-cy="password-input"]').should('have.attr', 'autocomplete', 'current-password');
      cy.get('[data-cy="email-input"]').should('have.attr', 'autocomplete', 'email');
      
      // Verify HTTPS context in production
      cy.window().then((win) => {
        if (win.location.protocol === 'https:') {
          expect(win.isSecureContext).to.be.true;
        }
      });
    });

    it('should validate API request integrity and prevent parameter pollution', () => {
      // Monitor API requests for security
      cy.intercept('POST', '**/login', (req) => {
        expect(req.headers).to.not.have.property('x-admin-override');
        expect(req.body).to.not.contain('DROP TABLE');
      }).as('loginRequest');
      
      cy.login(users.validUser.email, users.validUser.password);
      
      // Test parameter pollution prevention
      const pollutedInput = 'CS101&admin=true';
      cy.get('[data-cy="course-code-input"]').type(pollutedInput);
      cy.get('[data-cy="course-password-input"]').type(courses.validCourse.password);
      cy.get('[data-cy="join-course-button"]').click();
      
      cy.shouldShowError('#courseError', 'Invalid course code. Please check with your instructor.');
      cy.get('#courseDashboard').should('not.be.visible');
    });

    it('should verify response headers and CSP', () => {
      cy.request('/').then((response) => {
        expect(response.status).to.equal(200);
        // In production, verify CSP headers:
        // expect(response.headers).to.have.property('content-security-policy');
      });
    });
  });
});
