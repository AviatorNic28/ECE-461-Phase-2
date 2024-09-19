### Example: Fetching and Analyzing GitHub Issues with GitHub API

#### 1. **Setup**

First, you'll need a GitHub Personal Access Token (PAT) to authenticate API requests. You can generate one from GitHub [here](https://github.com/settings/tokens).

#### 2. **Fetch Issues from GitHub API**

Here’s a TypeScript example that fetches issues from a GitHub repository using the GitHub API and counts the number of open issues:

```typescript
import axios from 'axios';

// Function to get the number of open issues for a GitHub repository
async function getOpenIssues(owner: string, repo: string): Promise<number> {
    const token = 'YOUR_GITHUB_PERSONAL_ACCESS_TOKEN'; // Replace with your GitHub token
    const url = `https://api.github.com/repos/${owner}/${repo}/issues`;

    try {
        const response = await axios.get(url, {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json',
            }
        });

        // Filter issues to only count open ones (excluding pull requests)
        const openIssues = response.data.filter((issue: any) => issue.state === 'open' && !issue.pull_request);

        console.log(`Number of open issues in ${owner}/${repo}: ${openIssues.length}`);
        return openIssues.length;
    } catch (error) {
        console.error('Error fetching issues:', error);
        return 0;
    }
}

// Example usage
getOpenIssues('octocat', 'Hello-World'); // Replace with the repository owner and name
```

#### 3. **Explanation**

- **API Endpoint**: `https://api.github.com/repos/{owner}/{repo}/issues` – This endpoint retrieves issues for the specified repository.
- **Authentication**: You need to pass a personal access token in the `Authorization` header.
- **Filtering**: The example filters out pull requests and counts only open issues.




## Example: Accessing Env Vars in TypeScript Program.

In your `src/index.ts` (or any other file), load the environment variables from the `.env` file:

```typescript
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables from the .env file located one directory up
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Access the environment variables
const githubToken = process.env.GITHUB_TOKEN;
const logLevel = process.env.LOG_LEVEL;

if (!githubToken) {
    console.error('GITHUB_TOKEN is not defined in the .env file');
} else {
    console.log(`GitHub Token: ${githubToken}`);
}

console.log(`Log Level: ${logLevel}`);
```