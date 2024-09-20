import { Octokit } from '@octokit/rest';

interface metricResult {
    rampup: number
    rampup_latency: number
  }

export const calculateRampUpTime = async (owner: string, repo: string, threshold: number = 50, octokit: Octokit): Promise<metricResult> => {

    return {
        rampup: 0,
        rampup_latency: 0,
    }
};
