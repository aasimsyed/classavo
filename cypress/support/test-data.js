/**
 * CENTRALIZED TEST DATA MANAGEMENT
 * Single source of truth for test data with lazy loading
 */

class TestDataManager {
  constructor() {
    this.data = {};
    this.loaded = {};
  }

  // Lazy load fixtures only when needed
  async loadFixture(name) {
    if (!this.loaded[name]) {
      this.data[name] = await cy.fixture(name).then(data => data);
      this.loaded[name] = true;
    }
    return this.data[name];
  }

  // Get users data
  async getUsers() {
    return await this.loadFixture('users');
  }

  // Get courses data  
  async getCourses() {
    return await this.loadFixture('courses');
  }

  // Get security payloads (only when needed)
  async getSecurityPayloads() {
    return await this.loadFixture('security-payloads');
  }

  // Helper methods for common data access
  async getValidUser() {
    const users = await this.getUsers();
    return users.validUser;
  }

  async getInvalidUser() {
    const users = await this.getUsers();
    return users.invalidUser;
  }

  async getValidCourse() {
    const courses = await this.getCourses();
    return courses.validCourse;
  }

  async getInvalidCourse() {
    const courses = await this.getCourses();
    return courses.invalidCourse;
  }

  // Reset data cache if needed
  reset() {
    this.data = {};
    this.loaded = {};
  }
}

// Export singleton instance
export const testData = new TestDataManager();

// Convenience functions for backward compatibility
export const loadTestData = () => {
  // Pre-load commonly used data
  return Promise.all([
    testData.getUsers(),
    testData.getCourses()
  ]);
};

// Cypress commands for easy access
Cypress.Commands.add('getTestData', (type) => {
  switch(type) {
    case 'users': return cy.wrap(testData.getUsers());
    case 'courses': return cy.wrap(testData.getCourses());
    case 'validUser': return cy.wrap(testData.getValidUser());
    case 'validCourse': return cy.wrap(testData.getValidCourse());
    default: throw new Error(`Unknown test data type: ${type}`);
  }
});
