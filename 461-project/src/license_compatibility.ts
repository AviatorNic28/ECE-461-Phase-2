import { Octokit } from '@octokit/rest';
import { LogLevel } from './logger';
import logger from './logger';
import { performance } from 'perf_hooks';

interface metricResult {
    license: number;
    license_latency: number;
}

// List of compatible licenses (can extend this if needed)
const compatibleLicenses = [
    'lgpl',
    'mit',
    'bsd',
    'apache',
    'mpl',
    'eclipse',
    'artistic'
];

export const calculateLicenseCompatibility = async (owner: string, repo: string, threshold: number = 50, octokit: Octokit): Promise<metricResult> => {
    const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
    if (currentLogLevel == LogLevel.INFO) {
        logger.info('Running License Compatibility...');
    }

    const startTime = performance.now(); // Start measuring time
    let licenseScore = 0;

    try {
        // 1. Try fetching the README file
        const readmeResponse = await octokit.repos.getReadme({ // need to double check this logic. 
            owner,
            repo,
            mediaType: {
                format: 'html', // To extract license info easily
            },
        });

        const readmeContent = Buffer.from(readmeResponse.data.content, 'base64').toString('utf8');
        const licenseRegex = /#\s*license\s*([\s\S]*?)(#|$)/i; // Adjusted regex to capture license section more accurately
        const licenseMatch = licenseRegex.exec(readmeContent);

        if (licenseMatch) {
            // Check if any compatible license exists in README
            const lowerCaseLicenseText = licenseMatch[1].toLowerCase();
            if (compatibleLicenses.some(license => lowerCaseLicenseText.includes(license))) {
                licenseScore = 1;
                if(currentLogLevel == LogLevel.INFO) {
                logger.info(`Compatible license found in README: ${lowerCaseLicenseText}`);
                }
            }
        }

        // 2. If no license in README, check the LICENSE file
        try {
            const licenseFileResponse = await octokit.repos.getContent({
                owner,
                repo,
                path: 'LICENSE',
            });

            // Check if 'content' exists and handle it safely
            if ('content' in licenseFileResponse.data && typeof licenseFileResponse.data.content === 'string') {
                const licenseFileContent = Buffer.from(licenseFileResponse.data.content, 'base64').toString('utf8');
                const lowerCaseLicenseFileText = licenseFileContent.toLowerCase();
                if (compatibleLicenses.some(license => lowerCaseLicenseFileText.includes(license))) {
                    licenseScore = 1;
                    logger.info(`Compatible license found in LICENSE file: ${lowerCaseLicenseFileText}`);
                } else {
                    logger.info('LICENSE file found but does not contain a compatible license.');
                }
            } else {
                logger.warn(`LICENSE file for ${repo} has no content or is not a string.`);
            }
        } catch (err) {
            logger.warn(`No LICENSE file found for ${repo}`);
        }
    } catch (err) {
        logger.warn(`No README file found for ${repo}, but will check for LICENSE file.`); 
        // Attempt to check for LICENSE file directly if README is not found
        try {
            const licenseFileResponse = await octokit.repos.getContent({
                owner,
                repo,
                path: 'LICENSE',
            });

            // Check if 'content' exists and handle it safely
            if ('content' in licenseFileResponse.data && typeof licenseFileResponse.data.content === 'string') {
                const licenseFileContent = Buffer.from(licenseFileResponse.data.content, 'base64').toString('utf8');
                const lowerCaseLicenseFileText = licenseFileContent.toLowerCase();
                if (compatibleLicenses.some(license => lowerCaseLicenseFileText.includes(license))) {
                    licenseScore = 1;
                    if(currentLogLevel == LogLevel.INFO) {
                    logger.info(`Compatible license found in LICENSE file: ${lowerCaseLicenseFileText}`);
                    }
                } else {
                    logger.info('LICENSE file found but does not contain a compatible license.');
                }
            } else {
                logger.warn(`LICENSE file for ${repo} has no content or is not a string.`);
            }
        } catch (err) {
            logger.warn(`No LICENSE file found for ${repo}`);
        }
    }

    const endTime = performance.now(); // End measuring time
    const latency = (endTime - startTime) / 1000; // Calculate latency (seconds)

    return {
        license: licenseScore,
        license_latency: latency,
    };
};
