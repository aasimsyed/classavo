import { LoginPage, CourseJoinPage } from '../support/pages';
import { selectors, flows } from '../support/utils';

describe('Course Join Flow', { tags: ['@course-join'] }, () => {
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
    // Login first to reach course join form
    flows.completeLogin(users.validUser.email, users.validUser.password);
  });

  describe('Page Load and UI Elements', () => {
    it('should display the course join form with all required elements', { tags: '@smoke' }, () => {
      CourseJoinPage.verifyElements();

      // Verify form labels
      cy.get('label[for="courseCode"]').should('contain.text', 'Course Code');
      cy.get('label[for="coursePassword"]').should(
        'contain.text',
        'Course Password'
      );

      // Verify button text
      cy.get(selectors.courseJoin.submitButton).should(
        'contain.text',
        'Join Course'
      );

      // Verify error container is hidden initially
      cy.get(selectors.courseJoin.errorContainer).should(
        'have.class',
        'hidden'
      );
    });

    it('should have proper input field attributes', () => {
      CourseJoinPage.verifyInputAttributes();
    });
  });

  describe('Successful Course Join', () => {
    it(
      'should successfully join a course with valid credentials',
      { tags: ['@smoke', '@critical'] },
      () => {
        CourseJoinPage.joinCourse(
          courses.validCourse.code,
          courses.validCourse.password
        );

        // Verify redirect to course dashboard
        cy.get('#courseDashboard', { timeout: 10000 }).should('be.visible');
        cy.get(selectors.courseJoin.form).should('not.be.visible');

        // Verify application state (wait a bit to ensure state is set)
        cy.wait(100); // Small wait to ensure currentCourse is set
        cy.verifyAppState('course', courses.validCourse.code);
      }
    );

    it('should handle course codes in different cases', () => {
      // Test lowercase course code
      CourseJoinPage.joinCourse(
        courses.validCourse.code.toLowerCase(),
        courses.validCourse.password
      );

      // Should still successfully join
      cy.get('#courseDashboard', { timeout: 10000 }).should('be.visible');
      cy.wait(100); // Small wait to ensure currentCourse is set
      cy.verifyAppState('course', courses.validCourse.code);
    });

    it('should show loading state during course join', () => {
      CourseJoinPage.fillCourseInfo(
        courses.validCourse.code,
        courses.validCourse.password
      );
      CourseJoinPage.submit();

      // Verify button shows loading state
      cy.get(selectors.courseJoin.submitButton)
        .should('be.disabled')
        .and('contain.text', 'Loading...');

      // Wait for join to complete
      cy.get('#courseDashboard', { timeout: 10000 }).should('be.visible');
    });

    it('should preserve user session across course join', () => {
      CourseJoinPage.joinCourse(
        courses.validCourse.code,
        courses.validCourse.password
      );

      // Wait for successful course join
      cy.get('#courseDashboard', { timeout: 10000 }).should('be.visible');

      // Verify user session is maintained
      cy.wait(100); // Small wait to ensure state is set
      cy.verifyAppState('user', users.validUser.email);
      cy.verifyAppState('course', courses.validCourse.code);
    });
  });

  describe('Invalid Course Credentials', () => {
    it(
      'should show error for non-existent course',
      { tags: ['@smoke', '@critical'] },
      () => {
        CourseJoinPage.joinCourse(
          courses.invalidCourse.code,
          courses.invalidCourse.password
        );

        // Verify error message
        CourseJoinPage.verifyError(
          'Invalid course code. Please check with your instructor.'
        );

        // Verify user stays on course join form
        cy.get(selectors.courseJoin.form).should('be.visible');
        cy.get('#courseDashboard').should('not.be.visible');

        // Verify no course is set in application state
        cy.verifyAppState('course', null);
      }
    );

    it(
      'should show error for wrong course password',
      { tags: ['@critical'] },
      () => {
        CourseJoinPage.joinCourse(courses.validCourse.code, 'wrongpassword');

        // Verify error message
        CourseJoinPage.verifyError(
          'Incorrect course password. Please try again.'
        );

        // Verify user stays on course join form
        cy.get(selectors.courseJoin.form).should('be.visible');
        cy.get('#courseDashboard').should('not.be.visible');
      }
    );

    it('should handle empty form submission', () => {
      CourseJoinPage.submit();

      // HTML5 validation should prevent submission
      cy.get(`${selectors.courseJoin.codeInput}:invalid`).should('exist');
      cy.get(selectors.courseJoin.form).should('be.visible');
    });

    it('should show error for course code only without password', () => {
      cy.get(selectors.courseJoin.codeInput).type(courses.validCourse.code);
      CourseJoinPage.submit();

      // Password field should be invalid
      cy.get(`${selectors.courseJoin.passwordInput}:invalid`).should('exist');
      cy.get(selectors.courseJoin.form).should('be.visible');
    });
  });

  describe('Course Code Validation', () => {
    it('should handle special characters in course codes', () => {
      CourseJoinPage.joinCourse('CS-101!@#', courses.validCourse.password);
      CourseJoinPage.verifyError(
        'Invalid course code. Please check with your instructor.'
      );
    });

    it('should handle very long course codes', () => {
      const longCode = 'A'.repeat(100);
      CourseJoinPage.joinCourse(longCode, courses.validCourse.password);
      CourseJoinPage.verifyError(
        'Invalid course code. Please check with your instructor.'
      );
    });

    it('should handle numeric course codes', () => {
      CourseJoinPage.joinCourse('12345', courses.validCourse.password);
      // Wait for the async course join operation to complete before checking error
      cy.wait(1500); // Wait longer than the 1200ms delay in the application
      CourseJoinPage.verifyError(
        'Invalid course code. Please check with your instructor.'
      );
    });

    it('should trim whitespace from course codes', () => {
      const codeWithSpaces = '  ' + courses.validCourse.code + '  ';
      CourseJoinPage.joinCourse(codeWithSpaces, courses.validCourse.password);

      // Should successfully join (trimmed)
      cy.get('#courseDashboard', { timeout: 10000 }).should('be.visible');
      cy.wait(100); // Small wait to ensure currentCourse is set
      cy.verifyAppState('course', courses.validCourse.code);
    });
  });

  describe('Form Validation and UX', () => {
    it('should focus course code field on page load', () => {
      // Wait a moment for auto-focus to be applied after form becomes visible
      cy.wait(200);
      cy.focused().should('have.attr', 'data-cy', 'course-code-input');
    });

    it('should clear form fields after successful join', () => {
      CourseJoinPage.joinCourse(
        courses.validCourse.code,
        courses.validCourse.password
      );

      // Wait for successful redirect
      cy.get('#courseDashboard', { timeout: 10000 }).should('be.visible');

      // Verify form fields are cleared (though form is now hidden)
      cy.get(selectors.courseJoin.codeInput).should('have.value', '');
      cy.get(selectors.courseJoin.passwordInput).should('have.value', '');
    });

    it('should auto-hide error messages after 5 seconds', () => {
      CourseJoinPage.joinCourse(
        courses.invalidCourse.code,
        courses.invalidCourse.password
      );

      // Verify error is visible initially
      cy.get(selectors.courseJoin.errorContainer).should('be.visible');

      // Wait for auto-hide (5 seconds + buffer)
      cy.get(selectors.courseJoin.errorContainer, { timeout: 7000 }).should(
        'have.class',
        'hidden'
      );
    });

    it('should prevent multiple rapid form submissions', () => {
      CourseJoinPage.fillCourseInfo(
        courses.validCourse.code,
        courses.validCourse.password
      );

      // Submit multiple times rapidly
      CourseJoinPage.submit();
      cy.get(selectors.courseJoin.submitButton).should('be.disabled');

      // Try to submit again while button is disabled
      cy.get(selectors.courseJoin.submitButton).click({ force: true });

      // Should only process one join attempt
      cy.get('#courseDashboard', { timeout: 10000 }).should('be.visible');
    });

    it('should maintain form state during error conditions', () => {
      const code = courses.invalidCourse.code;
      const password = 'wrongpassword';

      CourseJoinPage.fillCourseInfo(code, password);
      CourseJoinPage.submit();

      // Wait for error (with longer timeout due to async delay)
      cy.get(selectors.courseJoin.errorContainer, { timeout: 15000 }).should(
        'be.visible'
      );

      // Verify form maintains the entered values (check immediately while password is still preserved)
      cy.get(selectors.courseJoin.codeInput).should('have.value', code);
      cy.get(selectors.courseJoin.passwordInput).should('have.value', password);
    });

    it('should validate HTML5 form inputs before submission', () => {
      // Leave course code empty but add password
      cy.get(selectors.courseJoin.passwordInput).type('password123');
      CourseJoinPage.submit();

      // HTML5 validation should prevent submission
      cy.get(`${selectors.courseJoin.codeInput}:invalid`).should('exist');
      cy.get(selectors.courseJoin.form).should('be.visible');
    });
  });

  describe('Accessibility and Keyboard Navigation', () => {
    it('should support keyboard navigation', { tags: ['@debug'] }, () => {
      // Start with course code field focused
      cy.focused().should('have.attr', 'data-cy', 'course-code-input');

      // Type in course code and tab to password field
      cy.focused().type('CS101').tab();
      cy.wait(200); // Wait for focus change

      // Verify we can type in the password field (which means it's focused)
      cy.focused().type('intro2023');

      // Verify the password was entered in the correct field
      cy.get('[data-cy="course-password-input"]').should(
        'have.value',
        'intro2023'
      );

      // Tab to join button
      cy.focused().tab();
      cy.wait(200); // Wait for focus change

      // Verify the join button is focused by checking we can press Enter
      cy.focused().should('have.attr', 'data-cy', 'join-course-button');
    });

    it('should allow form submission with Enter key', () => {
      CourseJoinPage.fillCourseInfo(
        courses.validCourse.code,
        courses.validCourse.password
      );

      // Submit form using Enter key
      cy.get(selectors.courseJoin.passwordInput).type('{enter}');

      // Verify successful course join
      cy.get('#courseDashboard', { timeout: 10000 }).should('be.visible');
      cy.wait(100); // Small wait to ensure currentCourse is set
      cy.verifyAppState('course', courses.validCourse.code);
    });

    it('should have proper ARIA labels and accessibility attributes', () => {
      // Check ARIA labels
      cy.get(selectors.courseJoin.codeInput).should('have.attr', 'aria-label');
      cy.get(selectors.courseJoin.passwordInput).should(
        'have.attr',
        'aria-label'
      );

      // Check button role
      cy.get(selectors.courseJoin.submitButton).should(
        'have.attr',
        'role',
        'button'
      );
    });
  });

  describe('Course Capacity and Enrollment', () => {
    it('should handle full course enrollment', () => {
      CourseJoinPage.joinCourse(
        courses.fullCourse.code,
        courses.fullCourse.password
      );
      CourseJoinPage.verifyError(
        'Course is at maximum capacity. Please contact your instructor.'
      );
    });

    it('should handle closed course enrollment', () => {
      CourseJoinPage.joinCourse(
        courses.closedCourse.code,
        courses.closedCourse.password
      );
      CourseJoinPage.verifyError(
        'Course enrollment is closed. Please contact your instructor.'
      );
    });

    it('should show appropriate message for archived courses', () => {
      CourseJoinPage.joinCourse(
        courses.archivedCourse.code,
        courses.archivedCourse.password
      );
      CourseJoinPage.verifyError(
        'This course has been archived and is no longer available.'
      );
    });
  });

  describe('Network and Error Handling', () => {
    it('should show loading state during course join processing', () => {
      CourseJoinPage.fillCourseInfo(
        courses.validCourse.code,
        courses.validCourse.password
      );
      CourseJoinPage.submit();

      // Should show loading state immediately after submission
      cy.get(selectors.courseJoin.submitButton).should('be.disabled');
      cy.get(selectors.courseJoin.submitButton).should(
        'contain.text',
        'Loading...'
      );

      // Should remain in loading state for the processing duration
      cy.wait(500); // Check halfway through the 1200ms delay
      cy.get(selectors.courseJoin.submitButton).should('still.be.disabled');
      cy.get(selectors.courseJoin.submitButton).should(
        'still.contain.text',
        'Loading...'
      );

      // Eventually should complete and show dashboard
      cy.get('#courseDashboard', { timeout: 15000 }).should('be.visible');
      cy.get(selectors.courseJoin.form).should('not.be.visible');
    });

    it('should handle processing delays gracefully', () => {
      CourseJoinPage.fillCourseInfo(
        courses.validCourse.code,
        courses.validCourse.password
      );
      CourseJoinPage.submit();

      // Verify the application handles the built-in 1200ms delay properly
      cy.get(selectors.courseJoin.submitButton).should('be.disabled');

      // Wait for longer than the processing delay to ensure completion
      cy.wait(2000);

      // Should eventually complete successfully
      cy.get('#courseDashboard').should('be.visible');
    });
  });
});
