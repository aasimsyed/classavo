/**
 * COURSE JOIN PAGE OBJECT
 * Handles all course join page interactions and verifications
 */

const selectors = {
  form: '#courseJoinForm',
  codeInput: '[data-cy="course-code-input"]',
  passwordInput: '[data-cy="course-password-input"]',
  submitButton: '[data-cy="join-course-button"]',
  errorContainer: '#courseError',
  logo: '#courseJoinForm .logo h1'
};

export class CourseJoinPage {
  static fillCourseInfo(code, password) {
    cy.get(selectors.codeInput).type(code);
    // Ensure password field is enabled before typing
    cy.get(selectors.passwordInput).should('not.be.disabled').type(password);
    return this;
  }

  static submit() {
    cy.get(selectors.submitButton).click();
    return this;
  }

  static joinCourse(code, password) {
    this.fillCourseInfo(code, password);
    this.submit();
    return this;
  }

  static verifyElements() {
    cy.get(selectors.logo).should('contain.text', 'Join Course');
    cy.get(selectors.codeInput).should('be.visible');
    cy.get(selectors.passwordInput).should('be.visible');
    cy.get(selectors.submitButton).should('be.visible');
    return this;
  }

  static verifyInputAttributes() {
    cy.get(selectors.codeInput)
      .should('have.attr', 'type', 'text')
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

  // Getter methods for selectors (for external access)
  static get selectors() {
    return selectors;
  }
}

export default CourseJoinPage;
