import { LoginPage, CourseJoinPage, DashboardPage } from '../support/pages';
import { flows } from '../support/utils/flows';
import { selectors } from '../support/utils';

describe('Course Dashboard', () => {
  let users, courses;

  before(() => {
    // Load test fixtures
    cy.fixture('users').then((userData) => {
      users = userData;
    });
    cy.fixture('courses').then((courseData) => {
      courses = courseData;
    });
  });

  beforeEach(() => {
    LoginPage.visit();
    cy.resetApp();
    // Complete login and course join to reach dashboard
    flows.completeFullFlow(
      users.validUser.email,
      users.validUser.password,
      courses.validCourse.code,
      courses.validCourse.password
    );
  });

  describe('Dashboard Layout and Content', () => {
    it('should display course dashboard with correct elements', () => {
      DashboardPage.verifyElements(courses.validCourse);
      DashboardPage.verifyLoadingState();
    });

    it('should show spinner animation in loading indicator', () => {
      // Verify spinner element exists and has animation
      cy.get(selectors.dashboard.spinner)
        .should('be.visible')
        .and('have.css', 'animation-duration', '1s');
    });

    it('should display course information correctly', () => {
      // Verify course title
      cy.get(selectors.dashboard.courseTitle)
        .should('contain.text', courses.validCourse.title)
        .and('be.visible');

      // Verify course code display
      cy.get(selectors.dashboard.courseCode)
        .should('contain.text', `Course Code: ${courses.validCourse.code}`)
        .and('be.visible');
    });

    it('should show user information in dashboard', () => {
      // Verify user state
      cy.verifyAppState('user', users.validUser.email);
      cy.verifyAppState('currentCourse', courses.validCourse.code);
    });
  });

  describe('Course Loading Process', () => {
    it('should complete loading process and show start button', () => {
      DashboardPage.waitForContentLoad();

      // Verify start course button becomes visible
      cy.get(selectors.dashboard.startButton)
        .should('not.have.class', 'hidden')
        .and('be.visible')
        .and('contain.text', 'Start Course');
    });

    it('should hide loading indicator after content loads', () => {
      DashboardPage.waitForContentLoad();

      // Loading indicator should be hidden
      cy.get(selectors.dashboard.loadingIndicator).should(
        'have.class',
        'hidden'
      );
    });

    it('should maintain course information during loading', () => {
      // Course info should be visible even during loading
      DashboardPage.verifyElements(courses.validCourse);

      // Wait for loading to complete
      DashboardPage.waitForContentLoad();

      // Course info should still be correct
      DashboardPage.verifyElements(courses.validCourse);
    });

    it('should show loading indicator for appropriate duration', () => {
      // Loading should be visible initially
      cy.get(selectors.dashboard.loadingIndicator).should('be.visible');

      // Wait a reasonable time (2-3 seconds)
      cy.wait(2000);

      // Loading might still be visible (depending on implementation)
      cy.get(selectors.dashboard.loadingIndicator).should('exist');

      // Eventually it should complete
      DashboardPage.waitForContentLoad();
    });
  });

  describe('Start Course Functionality', () => {
    beforeEach(() => {
      // Wait for loading to complete before each test
      DashboardPage.waitForContentLoad();
    });

    it('should successfully start course', () => {
      // Mock confirm and alert for course start
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true).as('confirmDialog');
        cy.stub(win, 'alert').as('courseAlert');
      });

      DashboardPage.startCourse();

      // Verify confirm dialog was shown first
      cy.get('@confirmDialog').should(
        'have.been.calledWith',
        'Are you ready to start the course?'
      );

      // Verify alert is shown with the correct course title after confirmation
      cy.get('@courseAlert').should(
        'have.been.calledWith',
        'Starting Introduction to Computer Science! This would redirect to the course content.'
      );
    });

    it('should show confirmation dialog before starting', () => {
      // Mock confirm dialog and alert
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true).as('confirmDialog');
        cy.stub(win, 'alert').as('alertDialog');
      });

      DashboardPage.startCourse();

      // Verify confirm dialog was shown
      cy.get('@confirmDialog').should(
        'have.been.calledWith',
        'Are you ready to start the course?'
      );

      // Verify alert was shown after confirmation
      cy.get('@alertDialog').should(
        'have.been.calledWith',
        'Starting Introduction to Computer Science! This would redirect to the course content.'
      );
    });

    it('should handle course start cancellation', () => {
      // Mock confirm dialog to return false (cancel)
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(false).as('confirmDialog');
        cy.stub(win, 'alert').as('alertDialog');
      });

      DashboardPage.startCourse();

      // Verify confirm dialog was shown
      cy.get('@confirmDialog').should('have.been.called');

      // Alert should not be called (course not started)
      cy.get('@alertDialog').should('not.have.been.called');
    });

    it('should disable start button after course is started', () => {
      // Mock dialogs
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
        cy.stub(win, 'alert');
      });

      DashboardPage.startCourse();

      // Button should be disabled after starting
      cy.get(selectors.dashboard.startButton).should('be.disabled');
    });
  });

  describe('User Interface Interactions', () => {
    it('should show appropriate cursor styles', () => {
      DashboardPage.waitForContentLoad();

      // Start button should have pointer cursor
      cy.get(selectors.dashboard.startButton).should(
        'have.css',
        'cursor',
        'pointer'
      );
    });

    it('should maintain proper focus management', () => {
      DashboardPage.waitForContentLoad();

      // Start button should be focusable
      cy.get(selectors.dashboard.startButton).focus();
      cy.focused().should('have.attr', 'data-cy', 'start-course-button');
    });

    it('should handle keyboard navigation', () => {
      DashboardPage.waitForContentLoad();

      // Tab navigation should work
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'start-course-button');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle loading timeout gracefully', () => {
      // Wait longer than expected loading time
      cy.wait(6000);

      // System should either complete loading or show error
      cy.get('body').then(($body) => {
        const hasStartButton =
          $body.find(selectors.dashboard.startButton + ':not(.hidden)').length >
          0;
        const hasLoadingError = $body.find('.loading-error').length > 0;

        // One of these should be true
        expect(hasStartButton || hasLoadingError).to.be.true;
      });
    });

    it('should maintain session during long dashboard usage', () => {
      DashboardPage.waitForContentLoad();

      // Wait extended time to simulate long usage
      cy.wait(3000);

      // Session should still be valid
      cy.verifyAppState('user', users.validUser.email);
      cy.verifyAppState('currentCourse', courses.validCourse.code);
    });

    it('should handle course data validation', () => {
      // Verify all required course data is present
      cy.verifyAppState('currentCourse', courses.validCourse.code);

      // Course title should not be empty
      cy.get(selectors.dashboard.courseTitle).should('not.be.empty');

      // Course code should be formatted correctly
      cy.get(selectors.dashboard.courseCode)
        .should('contain.text', 'Course Code:')
        .and('contain.text', courses.validCourse.code);
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('should have proper ARIA labels and roles', () => {
      DashboardPage.waitForContentLoad();

      // Main dashboard should have proper role
      cy.get(selectors.dashboard.container).should('have.attr', 'role', 'main');

      // Loading indicator should have proper ARIA attributes
      cy.get(selectors.dashboard.loadingIndicator).should(
        'have.attr',
        'aria-live',
        'polite'
      );

      // Start button should have proper button role
      cy.get(selectors.dashboard.startButton).should(
        'have.attr',
        'role',
        'button'
      );
    });

    it('should support screen readers', () => {
      DashboardPage.waitForContentLoad();

      // Course information should have proper labeling
      cy.get(selectors.dashboard.courseTitle).should('have.attr', 'aria-label');
      cy.get(selectors.dashboard.courseCode).should('have.attr', 'aria-label');

      // Start button should have descriptive text
      cy.get(selectors.dashboard.startButton)
        .should('have.attr', 'aria-label')
        .and('contain', 'Start');
    });

    it('should handle keyboard navigation', () => {
      DashboardPage.waitForContentLoad();

      // Tab navigation should work
      cy.get('body').tab();
      cy.focused().should('have.attr', 'data-cy', 'start-course-button');
    });
  });

  describe('Performance and Loading Optimization', () => {
    it('should load dashboard content efficiently', () => {
      const startTime = Date.now();

      DashboardPage.waitForContentLoad();

      const loadTime = Date.now() - startTime;

      // Loading should complete within reasonable time (10 seconds)
      expect(loadTime).to.be.lessThan(10000);
    });

    it('should handle multiple dashboard visits efficiently', () => {
      DashboardPage.waitForContentLoad();

      // Navigate away and back
      LoginPage.visit();
      cy.resetApp();

      // Complete flow again
      flows.completeFullFlow(
        users.validUser.email,
        users.validUser.password,
        courses.validCourse.code,
        courses.validCourse.password
      );

      // Should load efficiently the second time
      DashboardPage.waitForContentLoad();
      cy.get(selectors.dashboard.startButton).should('be.visible');
    });
  });
});
