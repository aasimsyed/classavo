/**
 * COMMON USER FLOWS
 * Reusable functions for complete user journeys
 */

import { LoginPage } from '../pages/LoginPage';
import { CourseJoinPage } from '../pages/CourseJoinPage';
import { DashboardPage } from '../pages/DashboardPage';

export const flows = {
  /**
   * Complete login flow
   * @param {string} email - User email
   * @param {string} password - User password
   */
  completeLogin(email, password) {
    LoginPage.visit().login(email, password);
    cy.get(CourseJoinPage.selectors.form).should('be.visible');
  },

  /**
   * Complete course join flow
   * @param {string} code - Course code
   * @param {string} password - Course password
   */
  completeCourseJoin(code, password) {
    CourseJoinPage.joinCourse(code, password);
    cy.get(DashboardPage.selectors.container).should('be.visible');
  },

  /**
   * Complete full user flow from login to dashboard
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {string} courseCode - Course code
   * @param {string} coursePassword - Course password
   */
  completeFullFlow(email, password, courseCode, coursePassword) {
    this.completeLogin(email, password);
    // Small wait to ensure form is fully ready after login
    cy.wait(300);
    this.completeCourseJoin(courseCode, coursePassword);
  }
};

export default flows;
