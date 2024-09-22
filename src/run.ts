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
import { runCLI } from 'jest';

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

// function for rounding latency scores.
function roundToThreeDecimalPoints(value: number): number {
  return Math.round(value * 1000) / 1000;
}

  
// Function to extract package name from npm URL
const extractPackageName = (url: string): string | null => {
  const npmUrlPattern = /^https:\/\/www\.npmjs\.com\/package\/([^/]+)$/;
  const match = url.match(npmUrlPattern);

  return match ? match[1] : null;
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
    let [owner, repo] = extractOwnerAndRepo(url);
    const packageName = extractPackageName(url)

    // if the url passed is an npmjs link.
    if (packageName != null) {
      // find github url from package.
      const npmUrl = `https://registry.npmjs.org/${packageName}`;
      const response = await fetch(npmUrl);
      const data = await response.json();
    
      // Extract the repository URL from the package metadata
      const repoUrl = data.repository ? data.repository.url : null;
      
      if(repoUrl) {
        [owner, repo] = extractOwnerAndRepo(repoUrl);
      } else {
        // no github url found - cannot perform metric calculations.
        if(currentLogLevel == LogLevel.DEBUG){
          logger.debug("no github url found for npm package", npmUrl);
        }
        
        console.log({"URL":"https://www.npmjs.com/package/even","NetScore":-1,"NetScore_Latency":-1,
          "RampUp":-1,"RampUp_Latency":-1,"Correctness":-1,"Correctness_Latency":-1,"BusFactor":-1,
          "BusFactor_Latency":-1,"ResponsiveMaintainer":-1,"ResponsiveMaintainer_Latency":-1,"License":-1,"License_Latency":-1})
      }
    }

    if (owner && repo) {
      try {

        // Run all metric calculations in parallel
        let [
          { responsiveness, responsiveness_latency },
          { correctness, correctness_latency },
          { busfactor, busfactor_latency },
          { license, license_latency },
          { rampup, rampup_latency }
        ] = await Promise.all([
          calculateResponsiveness(owner, repo, octokit),
          calculateCorrectness(owner, repo, octokit),
          calculateBusFactor(owner, repo, 50, octokit),
          calculateLicenseCompatibility(owner, repo, octokit),
          calculateRampUpTime(owner, repo, octokit)
        ]);

        // To assert NetScore won't be negative.
        const responsivenessNet = Math.max(responsiveness, 0);
        const correctnessNet = Math.max(correctness, 0);
        const busfactorNet = Math.max(busfactor, 0);
        const licenseNet = Math.max(license, 0);
        const rampupNet = Math.max(rampup, 0);

        // roundoff all latency scores.
        responsiveness_latency = roundToThreeDecimalPoints(responsiveness_latency);
        correctness_latency = roundToThreeDecimalPoints(correctness_latency);
        busfactor_latency = roundToThreeDecimalPoints(busfactor_latency);
        license_latency = roundToThreeDecimalPoints(license_latency);
        rampup_latency = roundToThreeDecimalPoints(rampup_latency); 
        

        const netscore = (0.40) * responsivenessNet + (0.30) * correctnessNet + (0.15) * busfactorNet + (0.10) * rampupNet + (0.05) * licenseNet;
        const netscore_latency = Math.max(responsiveness_latency, 0) + Math.max(correctness_latency, 0) + Math.max(busfactor_latency, 0) + Math.max(rampup_latency, 0) + Math.max(license_latency);

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
          BusFactor_Latency: busfactor_latency,
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


const runTests = async () => {
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if (currentLogLevel === LogLevel.INFO) {
    logger.info("Running tests...");
  }

  try {
    // Provide Jest options in the first argument with additional fields
    const jestOptions = {
      coverage: true,
      silent: true,
      _: [], // Required by Argv type
      $0: 'jest' // Required by Argv type
    };

    // Run Jest programmatically
    const { results } = await runCLI(jestOptions, [process.cwd()]);

    const testCasesPassed = results.numPassedTests;
    const totalTestCases = results.numTotalTests;
    const lineCoverage = results.coverageMap ? results.coverageMap.getCoverageSummary().lines.pct : 0;

    const roundedLineCoverage = Math.round(lineCoverage);
    console.log(`${testCasesPassed}/${totalTestCases} test cases passed. ${roundedLineCoverage}% line coverage achieved.`);
  } catch (error) {
    if(currentLogLevel == LogLevel.DEBUG) {
    console.error('Error running tests:', error);
    }
    process.exit(1);
  }

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
          logger.debug(`URL file does not exist: ${command}`);
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
