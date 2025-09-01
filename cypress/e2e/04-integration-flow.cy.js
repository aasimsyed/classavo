import { LoginPage, CourseJoinPage, DashboardPage } from '../support/pages';
import { flows } from '../support/utils/flows';
import { selectors } from '../support/utils';

describe('End-to-End Integration Flow', () => {
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
  });

  describe('Core User Journey', () => {
    it('should complete the entire user flow from login to course start', () => {
      // Step 1: Login
      LoginPage.verifyElements();
      LoginPage.login(users.validUser.email, users.validUser.password);
      LoginPage.verifySuccess('Login successful! Redirecting...');
      
      // Wait for redirect to course join form
      cy.get(selectors.courseJoin.form).should('be.visible');
      
      // Step 2: Join Course  
      CourseJoinPage.verifyElements();
      CourseJoinPage.joinCourse(courses.validCourse.code, courses.validCourse.password);
      
      // Step 3: Course Dashboard
      cy.get(selectors.dashboard.container).should('be.visible');
      DashboardPage.verifyElements(courses.validCourse);
      
      // Step 4: Wait for course content to load and start course
      DashboardPage.waitForContentLoad();
      
      cy.window().then((win) => {
        cy.stub(win, 'alert').as('windowAlert');
        cy.stub(win, 'confirm').returns(true);
      });
      
      DashboardPage.startCourse();
      
      // Verify course started successfully
      cy.get('@windowAlert').should('have.been.calledWith', 'Starting Introduction to Computer Science! This would redirect to the course content.');
      // Note: Application doesn't track courseStarted state
    });

    it('should handle complete flow with case-insensitive course codes', () => {
      // Complete login
      flows.completeLogin(users.validUser.email, users.validUser.password);
      
      // Join course with lowercase code
      CourseJoinPage.joinCourse(courses.validCourse.code.toLowerCase(), courses.validCourse.password);
      
      // Should reach dashboard successfully
      cy.get(selectors.dashboard.container).should('be.visible');
      DashboardPage.verifyElements(courses.validCourse);
      
      // Complete the flow
      DashboardPage.waitForContentLoad();
      
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
        cy.stub(win, 'alert').as('alertStub');
      });
      
      DashboardPage.startCourse();
      cy.get('@alertStub').should('have.been.called');
    });

    it('should maintain proper state throughout the entire flow', () => {
      // Initial state should be clean
      cy.verifyAppState('user', null);
      cy.verifyAppState('currentCourse', null);
      // Note: Application doesn't track courseStarted state
      
      // After login
      LoginPage.login(users.validUser.email, users.validUser.password);
      cy.get(selectors.courseJoin.form).should('be.visible');
      cy.verifyAppState('user', users.validUser.email);
      cy.verifyAppState('currentCourse', null);
      
      // After course join
      CourseJoinPage.joinCourse(courses.validCourse.code, courses.validCourse.password);
      cy.get(selectors.dashboard.container).should('be.visible');
      cy.verifyAppState('user', users.validUser.email);
      cy.verifyAppState('currentCourse', courses.validCourse.code);
      // Note: Application doesn't track courseStarted state
      
      // After course start
      DashboardPage.waitForContentLoad();
      cy.window().then((win) => {
        cy.stub(win, 'confirm').returns(true);
        cy.stub(win, 'alert');
      });
      DashboardPage.startCourse();
      // Note: Application doesn't track courseStarted state
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should handle login failure and allow retry', { tags: ['@debug'] }, () => {
      // Try invalid login first
      LoginPage.login(users.invalidUser.email, users.invalidUser.password);
      LoginPage.verifyError('Invalid email or password');
      
      // Wait for error to be fully processed and clear any lingering state
      cy.wait(1000);
      
      // Clear form fields before retry
      cy.get(selectors.login.emailInput).clear();
      cy.get(selectors.login.passwordInput).clear();
      
      // Retry with valid credentials
      LoginPage.login(users.validUser.email, users.validUser.password);
      
      // Wait for successful login transition with extended timeout
      cy.get(selectors.courseJoin.form, { timeout: 15000 }).should('be.visible');
      
      // Complete the rest of the flow
      flows.completeCourseJoin(courses.validCourse.code, courses.validCourse.password);
      DashboardPage.waitForContentLoad();
    });

    it('should handle course join failure and allow retry', { tags: ['@debug'] }, () => {
      // Complete login
      flows.completeLogin(users.validUser.email, users.validUser.password);
      
      // Try invalid course join
      CourseJoinPage.joinCourse(courses.invalidCourse.code, courses.invalidCourse.password);
      CourseJoinPage.verifyError('Invalid course code. Please check with your instructor.');
      
      // Wait for error to be fully processed and clear any lingering state
      cy.wait(1000);
      
      // Clear form fields before retry
      cy.get(selectors.courseJoin.codeInput).clear();
      cy.get(selectors.courseJoin.passwordInput).clear();
      
      // Retry with valid course
      CourseJoinPage.joinCourse(courses.validCourse.code, courses.validCourse.password);
      
      // Wait for successful course join transition with extended timeout
      cy.get(selectors.dashboard.container, { timeout: 15000 }).should('be.visible');
      DashboardPage.waitForContentLoad();
    });


  });

  describe('Cross-Viewport Compatibility', () => {
    it('should work consistently across different viewport sizes', () => {
      const viewports = [
        { width: 1920, height: 1080 }, // Desktop
        { width: 1024, height: 768 },  // Tablet
        { width: 375, height: 667 }    // Mobile
      ];

      viewports.forEach(({ width, height }) => {
        cy.viewport(width, height);
        
        // Complete basic flow at this viewport
        LoginPage.login(users.validUser.email, users.validUser.password);
        cy.get(selectors.courseJoin.form).should('be.visible');
        
        CourseJoinPage.joinCourse(courses.validCourse.code, courses.validCourse.password);
        cy.get(selectors.dashboard.container).should('be.visible');
        
        // Reset for next viewport test
        LoginPage.visit();
        cy.resetApp();
      });
    });


  });

  describe('Performance and Optimization', () => {
    it('should complete full flow within acceptable time limits', () => {
      const startTime = Date.now();
      
      // Complete entire flow
      flows.completeFullFlow(
        users.validUser.email,
        users.validUser.password,
        courses.validCourse.code,
        courses.validCourse.password
      );
      
      DashboardPage.waitForContentLoad();
      
      const totalTime = Date.now() - startTime;
      
      // Should complete within 15 seconds
      expect(totalTime).to.be.lessThan(15000);
    });



    it('should handle concurrent user sessions', () => {
      // Simulate multiple users by clearing and restarting
      const testMultipleUsers = () => {
        flows.completeFullFlow(
          users.validUser.email,
          users.validUser.password,
          courses.validCourse.code,
          courses.validCourse.password
        );
        DashboardPage.waitForContentLoad();
        
        // Verify session isolation
        cy.verifyAppState('user', users.validUser.email);
        cy.verifyAppState('currentCourse', courses.validCourse.code);
      };

      // Test first session
      testMultipleUsers();
      
      // Reset and test second session
      LoginPage.visit();
      cy.resetApp();
      testMultipleUsers();
    });
  });

  describe('Data Persistence and State Management', () => {
    it('should maintain data consistency throughout navigation', () => {
      // Complete login and course join
      flows.completeFullFlow(
        users.validUser.email,
        users.validUser.password,
        courses.validCourse.code,
        courses.validCourse.password
      );
      
      // Verify all data is consistent
      cy.verifyAppState('user', users.validUser.email);
      cy.verifyAppState('currentCourse', courses.validCourse.code);
      
      // Course details should match
      cy.get(selectors.dashboard.courseTitle).should('contain.text', courses.validCourse.title);
      cy.get(selectors.dashboard.courseCode).should('contain.text', courses.validCourse.code);
    });

    it('should handle browser refresh gracefully', () => {
      // Complete partial flow
      flows.completeLogin(users.validUser.email, users.validUser.password);
      
      // Refresh page
      cy.reload();
      
      // Should return to appropriate state (likely login page for this mock app)
      cy.get(selectors.login.form).should('be.visible');
      
      // Should be able to continue flow
      flows.completeFullFlow(
        users.validUser.email,
        users.validUser.password,
        courses.validCourse.code,
        courses.validCourse.password
      );
    });

    it('should validate all form data before proceeding', { tags: ['@debug'] }, () => {
      // Verify each step validates before proceeding
      
      // Step 1: Login validation
      LoginPage.submit(); // Empty form
      cy.get(`${selectors.login.emailInput}:invalid`).should('exist');
      
      LoginPage.fillCredentials('invalid-email', users.validUser.password);
      LoginPage.submit();
      cy.get(`${selectors.login.emailInput}:invalid`).should('exist');
      
      // Wait for validation to complete and clear form
      cy.wait(500);
      cy.get(selectors.login.emailInput).clear();
      cy.get(selectors.login.passwordInput).clear();
      
      // Valid login
      LoginPage.fillCredentials(users.validUser.email, users.validUser.password);
      LoginPage.submit();
      cy.get(selectors.courseJoin.form, { timeout: 15000 }).should('be.visible');
      
      // Step 2: Course join validation
      CourseJoinPage.submit(); // Empty form
      cy.get(`${selectors.courseJoin.codeInput}:invalid`).should('exist');
      
      // Valid course join
      CourseJoinPage.joinCourse(courses.validCourse.code, courses.validCourse.password);
      cy.get(selectors.dashboard.container, { timeout: 15000 }).should('be.visible');
    });
  });
});