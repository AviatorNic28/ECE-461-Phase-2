import { Octokit } from '@octokit/rest';

interface metricResult {
    license: number
    license_latency: number
  }

export const calculateLicenseCompatibility = async (owner: string, repo: string, threshold: number = 50, octokit: Octokit): Promise<metricResult> => {

    return {
        license: 0,
        license_latency: 0,
    }
};
