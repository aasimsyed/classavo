/**
 * LOGIN PAGE OBJECT
 * Handles all login page interactions and verifications
 */

const selectors = {
  form: '#loginForm',
  emailInput: '[data-cy="email-input"]',
  passwordInput: '[data-cy="password-input"]',
  submitButton: '[data-cy="login-button"]',
  errorContainer: '#loginError',
  successContainer: '#loginSuccess',
  logo: '.logo h1'
};

export class LoginPage {
  static visit() {
    cy.visit('/');
    return this;
  }

  static fillCredentials(email, password) {
    cy.get(selectors.emailInput).type(email);
    cy.get(selectors.passwordInput).type(password);
    return this;
  }

  static submit() {
    cy.get(selectors.submitButton).click();
    return this;
  }

  static login(email, password) {
    this.fillCredentials(email, password);
    this.submit();
    return this;
  }

  static verifyElements() {
    cy.title().should('eq', 'Classavo - Student Platform');
    cy.get(selectors.logo).should('contain.text', 'Classavo');
    cy.get(selectors.emailInput).should('be.visible');
    cy.get(selectors.passwordInput).should('be.visible');
    cy.get(selectors.submitButton).should('be.visible');
    return this;
  }

  static verifyInputAttributes() {
    cy.get(selectors.emailInput)
      .should('have.attr', 'type', 'email')
      .and('have.attr', 'required');
    cy.get(selectors.passwordInput)
      .should('have.attr', 'type', 'password')
      .and('have.attr', 'required');
    return this;
  }

  static verifyError(message) {
    cy.shouldShowError(selectors.errorContainer, message);
    return this;
  }

  static verifySuccess(message) {
    cy.shouldShowSuccess(selectors.successContainer, message);
    return this;
  }

  // Getter methods for selectors (for external access)
  static get selectors() {
    return selectors;
  }
}

export default LoginPage;
