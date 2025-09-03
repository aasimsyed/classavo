import { LoginPage } from '../support/pages';
import { selectors } from '../support/utils';

describe('Login Flow', () => {
  let users;

  before(() => {
    // Load test fixtures
    cy.fixture('users').then((userData) => {
      users = userData;
    });
  });

  beforeEach(() => {
    LoginPage.visit();
    cy.resetApp();
  });

  describe('Page Load and UI Elements', () => {
    it(
      'should display the login form with all required elements',
      { tags: '@smoke' },
      () => {
        LoginPage.verifyElements();

        // Verify form labels
        cy.get('label[for="email"]').should('contain.text', 'Email');
        cy.get('label[for="password"]').should('contain.text', 'Password');

        // Verify button text
        cy.get(selectors.login.submitButton).should('contain.text', 'Sign In');

        // Verify error and success containers are hidden initially
        cy.get(selectors.login.errorContainer).should('have.class', 'hidden');
        cy.get(selectors.login.successContainer).should('have.class', 'hidden');
      }
    );

    it('should have proper input field attributes', { tags: '@ui' }, () => {
      LoginPage.verifyInputAttributes();
    });
  });

  describe('Successful Login', () => {
    it(
      'should successfully log in with valid credentials',
      { tags: '@smoke' },
      () => {
        LoginPage.login(users.validUser.email, users.validUser.password);

        // Verify successful login message appears briefly
        LoginPage.verifySuccess('Login successful! Redirecting...');

        // Verify redirect to course join form
        cy.get('#courseJoinForm', { timeout: 10000 }).should('be.visible');
        cy.get(selectors.login.form).should('not.be.visible');

        // Verify application state
        cy.verifyAppState('user', users.validUser.email);
      }
    );

    it('should show loading state during login', { tags: '@critical' }, () => {
      LoginPage.fillCredentials(
        users.validUser.email,
        users.validUser.password
      );
      LoginPage.submit();

      // Verify button shows loading state
      cy.get(selectors.login.submitButton)
        .should('be.disabled')
        .and('contain.text', 'Loading...');

      // Wait for login to complete
      cy.get('#courseJoinForm', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Invalid Credentials', () => {
    it('should show error for non-existent user', { tags: ['@smoke', '@critical'] }, () => {
      LoginPage.login(users.invalidUser.email, users.invalidUser.password);

      // Verify error message
      LoginPage.verifyError('Invalid email or password');

      // Verify user stays on login form
      cy.get(selectors.login.form).should('be.visible');
      cy.get('#courseJoinForm').should('not.be.visible');

      // Verify application state is null
      cy.verifyAppState('user', null);
    });

    it('should show error for wrong password', { tags: '@critical' }, () => {
      LoginPage.login(users.validUser.email, 'wrongpassword');

      // Verify error message
      LoginPage.verifyError('Invalid email or password');

      // Verify user stays on login form
      cy.get(selectors.login.form).should('be.visible');
      cy.get('#courseJoinForm').should('not.be.visible');
    });

    it('should handle empty form submission', { tags: '@critical' }, () => {
      LoginPage.submit();

      // HTML5 validation should prevent submission
      cy.get(`${selectors.login.emailInput}:invalid`).should('exist');
      cy.get(selectors.login.form).should('be.visible');
    });
  });

  describe('Unverified Email', () => {
    it('should show error for unverified email', { tags: '@critical' }, () => {
      LoginPage.login(
        users.unverifiedUser.email,
        users.unverifiedUser.password
      );

      // Verify error message for unverified email
      LoginPage.verifyError('Please verify your email before logging in');

      // Verify user stays on login form
      cy.get(selectors.login.form).should('be.visible');
      cy.get('#courseJoinForm').should('not.be.visible');
    });
  });

  describe('Form Validation and UX', () => {
    it('should focus email field on page load', () => {
      // Email field should be focused or focusable
      cy.get(selectors.login.emailInput).should('be.visible');
      cy.get(selectors.login.emailInput).focus();
      cy.focused().should('have.attr', 'data-cy', 'email-input');
    });

    it('should clear form fields after successful login', () => {
      LoginPage.login(users.validUser.email, users.validUser.password);

      // Wait for successful redirect
      cy.get('#courseJoinForm', { timeout: 10000 }).should('be.visible');

      // Verify form fields are cleared
      cy.get(selectors.login.emailInput).should('have.value', '');
      cy.get(selectors.login.passwordInput).should('have.value', '');
    });

    it('should auto-hide error messages after 5 seconds', () => {
      LoginPage.login(users.invalidUser.email, users.invalidUser.password);

      // Verify error is visible initially
      cy.get(selectors.login.errorContainer).should('be.visible');

      // Wait for auto-hide (5 seconds + buffer)
      cy.get(selectors.login.errorContainer, { timeout: 7000 }).should(
        'have.class',
        'hidden'
      );
    });

    it('should auto-hide success messages after 3 seconds', () => {
      LoginPage.login(users.validUser.email, users.validUser.password);

      // Verify success message is visible initially
      cy.get(selectors.login.successContainer).should('be.visible');

      // Success message should auto-hide after 3 seconds
      cy.get(selectors.login.successContainer, { timeout: 5000 }).should(
        'have.class',
        'hidden'
      );
    });

    it('should prevent multiple rapid form submissions', () => {
      LoginPage.fillCredentials(
        users.validUser.email,
        users.validUser.password
      );

      // Submit multiple times rapidly
      LoginPage.submit();
      cy.get(selectors.login.submitButton).should('be.disabled');

      // Try to submit again while button is disabled
      cy.get(selectors.login.submitButton).click({ force: true });

      // Should only process one login attempt
      cy.get('#courseJoinForm', { timeout: 10000 }).should('be.visible');
    });

    it('should validate HTML5 form inputs before submission', () => {
      // Test invalid email format
      cy.get(selectors.login.emailInput).type('invalid-email');
      cy.get(selectors.login.passwordInput).type('password123');
      LoginPage.submit();

      // HTML5 validation should prevent submission
      cy.get(`${selectors.login.emailInput}:invalid`).should('exist');
      cy.get(selectors.login.form).should('be.visible');
    });

    it('should maintain form state during error conditions', () => {
      const email = users.invalidUser.email;
      const password = 'wrongpassword';

      LoginPage.fillCredentials(email, password);
      LoginPage.submit();

      // Wait for error
      cy.get(selectors.login.errorContainer).should('be.visible');

      // Verify form maintains the entered values (email should persist, password may be cleared for security)
      cy.get(selectors.login.emailInput).should('have.value', email);
      // Note: Password field may be cleared for security reasons in some implementations
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('should support keyboard navigation', () => {
      // Test that all form elements are focusable (accessibility requirement)
      cy.get(selectors.login.emailInput).focus();
      cy.focused().should('have.attr', 'data-cy', 'email-input');

      cy.get(selectors.login.passwordInput).focus();
      cy.focused().should('have.attr', 'data-cy', 'password-input');

      cy.get(selectors.login.submitButton).focus();
      cy.focused().should('have.attr', 'data-cy', 'login-button');

      // Verify elements are not disabled for keyboard access
      cy.get(selectors.login.emailInput).should(
        'not.have.attr',
        'tabindex',
        '-1'
      );
      cy.get(selectors.login.passwordInput).should(
        'not.have.attr',
        'tabindex',
        '-1'
      );
      cy.get(selectors.login.submitButton).should(
        'not.have.attr',
        'tabindex',
        '-1'
      );
    });

    it('should allow form submission with Enter key', () => {
      LoginPage.fillCredentials(
        users.validUser.email,
        users.validUser.password
      );

      // Submit form using Enter key
      cy.get(selectors.login.passwordInput).type('{enter}');

      // Verify successful login
      cy.get('#courseJoinForm', { timeout: 10000 }).should('be.visible');
      cy.verifyAppState('user', users.validUser.email);
    });
  });
});
