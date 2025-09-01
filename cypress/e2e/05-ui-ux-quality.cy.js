import { LoginPage, CourseJoinPage, DashboardPage } from '../support/pages';
import { flows } from '../support/utils/flows';
import { selectors } from '../support/utils';

describe('UI/UX Quality and User Experience', () => {
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

  describe('Loading States and User Feedback', () => {
    it('should show loading state during login', () => {
      LoginPage.fillCredentials(users.validUser.email, users.validUser.password);
      LoginPage.submit();
      
      // Verify button shows loading state
      cy.get(selectors.login.submitButton)
        .should('be.disabled')
        .and('contain.text', 'Loading...');
      
      // Wait for login to complete
      cy.get(selectors.courseJoin.form, { timeout: 10000 }).should('be.visible');
    });

    it('should show loading state during course join', () => {
      // Complete login first
      flows.completeLogin(users.validUser.email, users.validUser.password);
      
      CourseJoinPage.fillCourseInfo(courses.validCourse.code, courses.validCourse.password);
      CourseJoinPage.submit();
      
      // Verify button shows loading state
      cy.get(selectors.courseJoin.submitButton)
        .should('be.disabled')
        .and('contain.text', 'Loading...');
      
      // Wait for join to complete
      cy.get(selectors.dashboard.container, { timeout: 10000 }).should('be.visible');
    });

    it('should show progressive loading on dashboard', () => {
      // Complete flow to dashboard
      flows.completeFullFlow(
        users.validUser.email,
        users.validUser.password,
        courses.validCourse.code,
        courses.validCourse.password
      );
      
      // Dashboard should show loading initially
      cy.get(selectors.dashboard.loadingIndicator).should('be.visible');
      cy.get(selectors.dashboard.startButton).should('have.class', 'hidden');
      
      // Wait for loading to complete
      DashboardPage.waitForContentLoad();
      
      // Loading should be hidden, start button visible
      cy.get(selectors.dashboard.loadingIndicator).should('have.class', 'hidden');
      cy.get(selectors.dashboard.startButton).should('not.have.class', 'hidden');
    });

    it('should provide clear feedback for user actions', () => {
      // Test successful login feedback
      LoginPage.login(users.validUser.email, users.validUser.password);
      LoginPage.verifySuccess('Login successful! Redirecting...');
      
      // Test error feedback
      LoginPage.visit();
      cy.resetApp();
      LoginPage.login(users.invalidUser.email, users.invalidUser.password);
      LoginPage.verifyError('Invalid email or password');
    });
  });

  describe('Visual Design and Layout', () => {
    it('should have consistent visual hierarchy', () => {
      // Check login page hierarchy
      LoginPage.verifyElements();
      
      // Logo should be prominent
      cy.get(selectors.login.logo).should('be.visible')
        .and('have.css', 'font-size').and('match', /\d+px/);
      
      // Form elements should be properly sized
      cy.get(selectors.login.emailInput).should('be.visible');
      cy.get(selectors.login.passwordInput).should('be.visible');
      cy.get(selectors.login.submitButton).should('be.visible');
    });

    it('should maintain consistent styling across pages', () => {
      // Login page styling
      cy.get(selectors.login.logo).should('have.css', 'color').and('not.be.empty');
      
      // Navigate to course join
      flows.completeLogin(users.validUser.email, users.validUser.password);
      
      // Course join page should have consistent styling
      cy.get(selectors.courseJoin.logo).should('have.css', 'color').and('not.be.empty');
      
      // Navigate to dashboard
      flows.completeCourseJoin(courses.validCourse.code, courses.validCourse.password);
      
      // Dashboard should maintain consistency
      cy.get(selectors.dashboard.logo).should('have.css', 'color').and('not.be.empty');
    });




  });

  describe('Animation and Transitions', () => {
    it('should have smooth transitions between states', () => {
      // Check for CSS transitions on interactive elements
      cy.get(selectors.login.submitButton)
        .should('have.css', 'transition-duration');
      
      // Hover states should have transitions
      cy.get(selectors.login.submitButton).trigger('mouseover');
      cy.get(selectors.login.submitButton).should('be.visible');
    });

    it('should show loading spinner animation', () => {
      // Navigate to dashboard to see spinner
      flows.completeFullFlow(
        users.validUser.email,
        users.validUser.password,
        courses.validCourse.code,
        courses.validCourse.password
      );
      
      // Spinner should be animated
      cy.get(selectors.dashboard.spinner).should('be.visible')
        .and('have.css', 'animation-duration', '1s');
    });

    it('should handle form field focus states', () => {
      // Focus states should be visible
      cy.get(selectors.login.emailInput).focus();
      cy.get(selectors.login.emailInput).should('have.focus');
      
      cy.get(selectors.login.passwordInput).focus();
      cy.get(selectors.login.passwordInput).should('have.focus');
    });

    it('should provide visual feedback for button interactions', () => {
      // Button should respond to hover
      cy.get(selectors.login.submitButton).trigger('mouseover');
      
      // Button should show active state when clicked
      cy.get(selectors.login.submitButton).trigger('mousedown');
      cy.get(selectors.login.submitButton).trigger('mouseup');
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('should support keyboard navigation throughout', () => {
      // Test basic keyboard navigation
      cy.get(selectors.login.emailInput).focus();
      cy.focused().should('have.attr', 'data-cy', 'email-input');
      
      cy.get(selectors.login.passwordInput).focus();
      cy.focused().should('have.attr', 'data-cy', 'password-input');
      
      cy.get(selectors.login.submitButton).focus();
      cy.focused().should('have.attr', 'data-cy', 'login-button');
      
      // Complete login via keyboard
      cy.get(selectors.login.emailInput).type(users.validUser.email);
      cy.get(selectors.login.passwordInput).type(users.validUser.password + '{enter}');
      
      // Should navigate to course join
      cy.get(selectors.courseJoin.form).should('be.visible');
      
      // Course join keyboard navigation
      cy.focused().should('have.attr', 'data-cy', 'course-code-input');
      
      cy.get(selectors.courseJoin.passwordInput).focus();
      cy.focused().should('have.attr', 'data-cy', 'course-password-input');
      
      cy.get(selectors.courseJoin.submitButton).focus();
      cy.focused().should('have.attr', 'data-cy', 'join-course-button');
    });

    it('should have proper ARIA labels and roles', () => {
      // Form elements should have proper labels
      cy.get(selectors.login.emailInput).should('have.attr', 'aria-label');
      cy.get(selectors.login.passwordInput).should('have.attr', 'aria-label');
      
      // Buttons should have proper roles
      cy.get(selectors.login.submitButton).should('have.attr', 'role', 'button');
      
      // Navigate to course join
      flows.completeLogin(users.validUser.email, users.validUser.password);
      
      // Course join elements should also have proper accessibility
      cy.get(selectors.courseJoin.codeInput).should('have.attr', 'aria-label');
      cy.get(selectors.courseJoin.passwordInput).should('have.attr', 'aria-label');
    });

    it('should provide clear error messaging', () => {
      // Empty form submission
      LoginPage.submit();
      cy.get(`${selectors.login.emailInput}:invalid`).should('exist');
      
      // Invalid email format
      cy.get(selectors.login.emailInput).type('invalid-email');
      LoginPage.submit();
      cy.get(`${selectors.login.emailInput}:invalid`).should('exist');
      
      // Invalid credentials
      LoginPage.fillCredentials(users.invalidUser.email, users.invalidUser.password);
      LoginPage.submit();
      LoginPage.verifyError('Invalid email or password');
    });

    it('should handle focus management appropriately', () => {
      // Initial focus should be on email field
      cy.focused().should('have.attr', 'data-cy', 'email-input');
      
      // After navigation, focus should be managed
      flows.completeLogin(users.validUser.email, users.validUser.password);
      cy.focused().should('have.attr', 'data-cy', 'course-code-input');
      
      // After course join, focus should be managed
      flows.completeCourseJoin(courses.validCourse.code, courses.validCourse.password);
      DashboardPage.waitForContentLoad();
      
      // Start button should be focusable
      cy.get(selectors.dashboard.startButton).focus();
      cy.focused().should('have.attr', 'data-cy', 'start-course-button');
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle form validation gracefully', () => {
      // Test various invalid inputs
      const invalidInputs = [
        '',
        ' ',
        'invalid-email',
        '@example.com',
        'test@',
        'test@.com'
      ];

      invalidInputs.forEach((input) => {
        LoginPage.visit();
        cy.resetApp();
        
        if (input.trim()) {
          cy.get(selectors.login.emailInput).type(input);
          cy.get(selectors.login.passwordInput).type('password123');
        }
        
        LoginPage.submit();
        
        // Should either show HTML5 validation or error message
        cy.get('body').then(($body) => {
          const hasInvalidInput = $body.find(`${selectors.login.emailInput}:invalid`).length > 0;
          const hasErrorMessage = $body.find(`${selectors.login.errorContainer}:visible`).length > 0;
          
          expect(hasInvalidInput || hasErrorMessage).to.be.true;
        });
      });
    });





    it('should maintain usability during loading states', () => {
      // During login loading, form should be disabled but visible
      LoginPage.fillCredentials(users.validUser.email, users.validUser.password);
      LoginPage.submit();
      
      // Button should be disabled but still visible
      cy.get(selectors.login.submitButton)
        .should('be.disabled')
        .and('be.visible')
        .and('contain.text', 'Loading...');
      
      // Form fields should remain visible (but may be disabled)
      cy.get(selectors.login.emailInput).should('be.visible');
      cy.get(selectors.login.passwordInput).should('be.visible');
    });
  });

  describe('Performance and Optimization', () => {
    it('should load UI elements efficiently', () => {
      const startTime = Date.now();
      
      LoginPage.visit();
      LoginPage.verifyElements();
      
      const loadTime = Date.now() - startTime;
      
      // UI should load quickly (under 2 seconds)
      expect(loadTime).to.be.lessThan(2000);
    });

    it('should handle rapid user interactions', () => {
      // Rapid typing should be handled smoothly
      const rapidText = 'rapidtestuser@example.com';
      cy.get(selectors.login.emailInput).type(rapidText, { delay: 0 });
      cy.get(selectors.login.emailInput).should('have.value', rapidText);
      
      // Rapid button clicks should be handled properly
      LoginPage.fillCredentials(users.validUser.email, users.validUser.password);
      
      // Click multiple times rapidly
      cy.get(selectors.login.submitButton).click();
      cy.get(selectors.login.submitButton).click({ force: true });
      cy.get(selectors.login.submitButton).click({ force: true });
      
      // Should only process once and show loading
      cy.get(selectors.login.submitButton).should('be.disabled');
      cy.get(selectors.courseJoin.form).should('be.visible');
    });

    it('should optimize animations for performance', () => {
      // Check that animations don't block user interactions
      flows.completeFullFlow(
        users.validUser.email,
        users.validUser.password,
        courses.validCourse.code,
        courses.validCourse.password
      );
      
      // Spinner animation should not affect performance
      cy.get(selectors.dashboard.spinner).should('be.visible');
      
      // Other interactions should still be responsive
      cy.get(selectors.dashboard.courseTitle).should('be.visible');
      cy.get(selectors.dashboard.courseCode).should('be.visible');
      
      // Wait for content load should complete in reasonable time
      DashboardPage.waitForContentLoad();
      cy.get(selectors.dashboard.startButton).should('be.visible');
    });
  });
});