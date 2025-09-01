/**
 * CENTRALIZED SELECTORS
 * Optional: Consolidated view of all selectors for quick reference
 * Note: Individual page objects contain their own selectors for encapsulation
 */

import { LoginPage } from '../pages/LoginPage';
import { CourseJoinPage } from '../pages/CourseJoinPage';
import { DashboardPage } from '../pages/DashboardPage';

// Re-export all selectors for backward compatibility or centralized access
export const selectors = {
  login: LoginPage.selectors,
  courseJoin: CourseJoinPage.selectors,
  dashboard: DashboardPage.selectors
};

export default selectors;
