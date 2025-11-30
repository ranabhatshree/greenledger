import { getCompanySettings } from '@/lib/api/companySettings';

/**
 * Checks if the user has completed onboarding by verifying if they have a company
 * @returns Promise<boolean> - true if onboarding is complete, false otherwise
 */
export const checkOnboardingComplete = async (): Promise<boolean> => {
  try {
    const response = await getCompanySettings();
    // If we can successfully fetch company settings, onboarding is complete
    return !!response?.company;
  } catch (error: any) {
    // If the API returns 404 or any error, the company doesn't exist
    // This means onboarding is not complete
    return false;
  }
};

