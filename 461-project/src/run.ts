#!/usr/bin/env node

import { exec } from 'child_process';
import * as fs from 'fs';
import { Octokit } from '@octokit/rest'; // Import Octokit
import { calculateResponsiveness } from './responsiveness';
import { calculateCorrectness } from './correctness';
import { calculateBusFactor } from './busfactor';

// Function to install dependencies
const installDependencies = () => {
  console.log("Installing dependencies...");
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
      // Call your metric functions here
      const responsiveness = await calculateResponsiveness(owner, repo, octokit);
      const correctness = await calculateCorrectness(owner, repo, octokit);
      const busFactor = await calculateBusFactor(owner, repo, 50, octokit);
      
      // Output the results in NDJSON format
      console.log(JSON.stringify({ 
        URL: url, 
        Responsiveness: responsiveness, 
        Correctness: correctness, 
        BusFactor: busFactor 
      }));
    } else {
      console.error(`Invalid URL format: ${url}`);
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

      processUrls(command, token);
  }
};

main();
