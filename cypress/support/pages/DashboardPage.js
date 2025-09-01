/**
 * DASHBOARD PAGE OBJECT
 * Handles all dashboard page interactions and verifications
 */

const selectors = {
  container: '#courseDashboard',
  logo: '#courseDashboard .logo h1',
  courseTitle: '[data-cy="course-title"]',
  courseCode: '[data-cy="course-code-display"]',
  startButton: '[data-cy="start-course-button"]',
  loadingIndicator: '#loadingIndicator',
  spinner: '#loadingIndicator .spinner'
};

export class DashboardPage {
  static verifyElements(course) {
    cy.get(selectors.logo).should('contain.text', 'Course Dashboard');
    cy.get(selectors.courseTitle).should('contain.text', course.title);
    cy.get(selectors.courseCode).should('contain.text', `Course Code: ${course.code}`);
    return this;
  }

  static verifyLoadingState() {
    cy.get(selectors.loadingIndicator).should('be.visible');
    cy.get(selectors.startButton).should('have.class', 'hidden');
    return this;
  }

  static waitForContentLoad() {
    cy.waitForLoading();
    cy.get(selectors.startButton).should('not.have.class', 'hidden');
    return this;
  }

  static startCourse() {
    cy.get(selectors.startButton).click();
    return this;
  }

  // Getter methods for selectors (for external access)
  static get selectors() {
    return selectors;
  }
}

export default DashboardPage;
