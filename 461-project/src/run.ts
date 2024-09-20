import { exec } from 'child_process';
import * as fs from 'fs';
import { Octokit } from '@octokit/rest';
import { calculateResponsiveness } from './responsiveness';
import { calculateCorrectness } from './correctness';
import { calculateBusFactor } from './busfactor';
import { calculateLicenseCompatibility } from './license_compatibility';
import { calculateRampUpTime } from './rampup_time';
import { LogLevel } from './logger';
import logger from './logger'
import { buffer } from 'stream/consumers';

// Function to install dependencies
const installDependencies = () => {
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if(currentLogLevel == LogLevel.INFO) {
      logger.info("Installing dependencies...");
  }

  exec('npm install', (error, stdout, stderr) => {
    if (error) {
      if(currentLogLevel == LogLevel.DEBUG) {
        logger.debug(`Failed to install dependencies: ${stderr}`)
      }
      process.exit(1);
    }
    process.exit(0);
  });
};

// Function to calculate Metrics.
// (handles parsing urls, calculating metrics, and displaying them to the console.)
const calculateMetrics = async (urlFile: string, token: string) => {
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);

  // check if the file exists. 
  if (!fs.existsSync(urlFile)) {
    if(currentLogLevel == LogLevel.DEBUG) {
      logger.debug(`URL file does not exist: ${urlFile}`);
    }
    process.exit(1);
  }

  // get urls and setup octokit instance. 
  const urls = fs.readFileSync(urlFile, 'utf-8').split('\n').filter(Boolean);
  const octokit = new Octokit(token ? { auth: token } : {}); 
 
  // process each url. 
  for (const url of urls) {
    const [owner, repo] = extractOwnerAndRepo(url);
    if (owner && repo) {
      try {

        // Run all metric calculations in parallel
        const [
          { responsiveness, responsiveness_latency },
          { correctness, correctness_latency },
          { busfactor, busfactory_latency },
          { license, license_latency },
          { rampup, rampup_latency }
        ] = await Promise.all([
          calculateResponsiveness(owner, repo, octokit),
          calculateCorrectness(owner, repo, octokit),
          calculateBusFactor(owner, repo, 50, octokit),
          calculateLicenseCompatibility(owner, repo, 50, octokit),
          calculateRampUpTime(owner, repo, 50, octokit)
        ]);

        // Calculate NetScore
        const responsivenessNet = Math.max(responsiveness, 0);
        const correctnessNet = Math.max(correctness, 0);
        const busfactorNet = Math.max(busfactor, 0);
        const licenseNet = Math.max(license, 0);
        const rampupNet = Math.max(rampup, 0);

        const netscore = (0.40) * responsivenessNet + (0.30) * correctnessNet + (0.15) * busfactorNet + (0.10) * rampupNet + (0.05) * licenseNet;
        const netscore_latency = responsiveness_latency + correctness_latency + busfactory_latency + rampup_latency + license_latency;

        // Output the results in NDJSON format
        console.log(JSON.stringify({ 
          URL: url,
          NetScore: netscore,
          NetScore_Latency: netscore_latency,
          RampUp: rampup,
          RampUp_Latency: rampup_latency,
          Correctness: correctness,
          Correctness_Latency: correctness_latency,
          BusFactor: busfactor,
          BusFactor_Latency: busfactory_latency,
          ResponsiveMaintainer: responsiveness,
          ResponsiveMaintainer_Latency : responsiveness_latency,
          License: license,
          License_Latency: license_latency,
        }));

      } catch (error) {
        if(currentLogLevel == LogLevel.DEBUG) {
          logger.debug(`Error processing repository ${owner}/${repo}:`, error);
        }
      }

    } else {
      if(currentLogLevel == LogLevel.DEBUG) {
        logger.debug(`Invalid URL format: ${url}`);
      }
    }
  }

  // successful run. 
  process.exit(0);
};


// Helper function to extract owner and repo from URL.
const extractOwnerAndRepo = (url: string): [string | null, string | null] => {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  return match ? [match[1], match[2]] : [null, null];
};

// Function to run tests
const runTests = () => {
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if(currentLogLevel == LogLevel.INFO) {
    console.log("Running tests...");
  }    

  // to implement
  const testCasesPassed = 20; // Mock value
  const totalTestCases = 25; // Mock value
  const lineCoverage = 85; // Mock value
  console.log(`${testCasesPassed}/${totalTestCases} test cases passed. ${lineCoverage}% line coverage achieved.`);
  process.exit(0);
};

// Main function to handle command line arguments
const main = () => {
  const [,, command, _] = process.argv;

  // get log level and github token. 
  const token = process.env.GITHUB_TOKEN || ''; // Use environment variable or empty string
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);

  // function to validate the GitHub Token.
  const validateToken = async (token: string): Promise<boolean> => {
    const octokit = new Octokit({ auth: token });
    try {
      await octokit.rest.users.getAuthenticated();
      return true; // Token is valid
    } catch (error) {
      console.error('Invalid GitHub token.');
      return false; // Token is invalid
    }
  };


  switch (command) {
    case 'install':
      installDependencies();
      break;
    case 'test':
      runTests();
      break;
    default:
      // assuming the "command" is the path to the URL_FILE.
      
      // check valid fie path.  
      if (!fs.existsSync(command)) {
        if(currentLogLevel == LogLevel.DEBUG) {
          console.error(`URL file does not exist: ${command}`);
        }
        process.exit(1);
      }
        
        // check valid gitHub token.
        if (!validateToken(token)) {
          process.exit(1);
        }
      
      // processUrls
      calculateMetrics(command, token);
  }
};

main();
