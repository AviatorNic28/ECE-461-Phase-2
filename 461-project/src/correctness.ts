import { Octokit } from '@octokit/rest';

export const calculateCorrectness = async (owner: string, repo: string, octokit: Octokit) => {
  console.log('Running Correctness metric...');
  
  try {
    const repoResponse = await octokit.repos.getContent({
      owner,
      repo,
      path: 'package.json',
    });

    if (!Array.isArray(repoResponse.data) && 'content' in repoResponse.data) {
      const packageJson = Buffer.from(repoResponse.data.content, 'base64').toString('utf-8');
      const packageData = JSON.parse(packageJson);

      const hasTests = packageData.scripts?.test ||
                       packageData.devDependencies?.['mocha'] ||
                       packageData.devDependencies?.['jest'] ||
                       packageData.devDependencies?.['chai'];

      if (hasTests) {
        console.log(`The repository "${owner}/${repo}" has testing setup.`);
      } else {
        console.log(`The repository "${owner}/${repo}" does not appear to have any testing setup.`);
      }
    } else {
      console.log(`Could not find package.json in repository "${owner}/${repo}".`);
    }
  } catch (error) {
    console.error('Error calculating Correctness:', error);
    console.log('Error retrieving Correctness');
  }
};

