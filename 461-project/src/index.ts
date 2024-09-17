import readline from 'readline';
import { Octokit } from '@octokit/rest';
import { calculateResponsiveness } from './responsiveness';
import { calculateCorrectness } from './correctness';
import { calculateBusFactor } from './busfactor';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Ask for a GitHub authentication token
rl.question('Enter your GitHub authentication token (or press ENTER to skip): ', (token: string) => {
  // Initialize the Octokit client with or without the token
  const octokit = new Octokit(token ? { auth: token } : {});

  // Ask for the repository owner and name
  rl.question('Enter the GitHub repository owner (e.g., nodejs): ', (owner: string) => {
    rl.question('Enter the GitHub repository name (e.g., node): ', async (repo: string) => {
      
      // Pass the octokit instance to each metric function
      await calculateResponsiveness(owner, repo, octokit);
      await calculateCorrectness(owner, repo, octokit);
      await calculateBusFactor(owner, repo, 50, octokit);

    });
  });
});
