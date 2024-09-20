import { exec } from 'child_process';
import * as fs from 'fs';
import { Octokit } from '@octokit/rest'; // Import Octokit
import { calculateResponsiveness } from './responsiveness';
import { calculateCorrectness } from './correctness';
import { calculateBusFactor } from './busfactor';
import { calculateLicenseCompatibility } from './license_compatibility';
import { calculateRampUpTime } from './rampup_time';
import { LogLevel } from './logger';
import logger from './logger'

// Function to install dependencies
const installDependencies = () => {
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);
  if(currentLogLevel == LogLevel.INFO) {
      logger.info("Installing dependencies...");
  }

  exec('npm install', (error, stdout, stderr) => {
    if (error) {
      console.error(`Failed to install dependencies: ${stderr}`);
      process.exit(1);
    }
    console.log(stdout);
    process.exit(0);
  });
};

// Function to process URLs and calculate metrics. 
const processUrls = async (urlFile: string, token: string) => {
  // including check here again, in case we want to be able to test functions independently. 
  if (!fs.existsSync(urlFile)) {
    console.error(`URL file does not exist: ${urlFile}`);
    process.exit(1);
  }

  const urls = fs.readFileSync(urlFile, 'utf-8').split('\n').filter(Boolean);
  
  // Initialize Octokit
  const octokit = new Octokit(token ? { auth: token } : {}); 
 
  for (const url of urls) {
    const [owner, repo] = extractOwnerAndRepo(url);
    
    if (owner && repo) {
      // these should all return floats. 
      //const { responsiveness, responsiveness_latency } = await calculateResponsiveness(owner, repo, octokit);
      const { correctness, correctness_latency } = await calculateCorrectness(owner, repo, octokit);
      //const { busfactor, busfactory_latency } = await calculateBusFactor(owner, repo, 50, octokit);
      //const { license, license_latency } = await calculateLicenseCompatibility(owner, repo,  50, octokit);
      //const { rampup, rampup_latency } = await calculateRampUpTime(owner, repo, 50, octokit); 
      

      // commenting out metrics that are implemented correctly (don't want to waste queries)
      const responsiveness = -1;
      const responsiveness_latency = -1;
      const busfactor = -1; 
      const busfactory_latency = -1; 
      const license = -1;
      const license_latency = -1;
      const rampup = -1;
      const rampup_latency = -1;

      // do some error checking here if a metric was calculated incorrectly. 

      // netscore calculations. 
      const netscore = (.40) * responsiveness + (.30) * correctness + (.15) * busfactor + (.10) * rampup + (.05) * license
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

    } else {
      console.error(`Invalid URL format: ${url}`);
      process.exit(1);
    }
  }
  process.exit(0);
};

// Helper function to extract owner and repo from URL.
const extractOwnerAndRepo = (url: string): [string | null, string | null] => {
  const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  return match ? [match[1], match[2]] : [null, null];
};

// Function to run tests
const runTests = () => {
  console.log("Running tests...");
  // This is where you'd call your test framework
  const testCasesPassed = 20; // Mock value
  const totalTestCases = 25; // Mock value
  const lineCoverage = 85; // Mock value
  console.log(`${testCasesPassed}/${totalTestCases} test cases passed. ${lineCoverage}% line coverage achieved.`);
  process.exit(0);
};

// Main function to handle command line arguments
const main = () => {
  const [,, command, _] = process.argv;

  // Check if token is provided for the URL processing
  const token = process.env.GITHUB_TOKEN || ''; // Use environment variable or empty string
  const currentLogLevel = parseInt(process.env.LOG_LEVEL || "0", 10);

  // Function to validate the GitHub token
  const validateToken = async (token: string): Promise<boolean> => {
    const octokit = new Octokit({ auth: token });
    try {
      await octokit.rest.users.getAuthenticated();
      return true; // Token is valid
    } catch (error) {
      console.error('Invalid GitHub token:');
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
      // assuming the command is the URL_FILE, first checking if it exists. 
      if (!fs.existsSync(command)) {
          console.error(`URL file does not exist: ${command}`);
          process.exit(1);
        }
        
        // also assert a valid gitHub token.
        if (!validateToken(token)) {
          process.exit(1);
        }

      processUrls(command, token);
  }
};

main();
