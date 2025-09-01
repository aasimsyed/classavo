/**
 * PAGE OBJECTS BARREL EXPORTS
 * Central export point for all page objects
 */

export { LoginPage } from './LoginPage';
export { CourseJoinPage } from './CourseJoinPage';
export { DashboardPage } from './DashboardPage';

// Default export for convenience
export default {
  LoginPage: require('./LoginPage').LoginPage,
  CourseJoinPage: require('./CourseJoinPage').CourseJoinPage,
  DashboardPage: require('./DashboardPage').DashboardPage
};
