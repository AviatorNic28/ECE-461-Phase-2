# ECE-461-Team-20-Repo
ECE 461 Semester Project.

## Team Members
Akash Amalarasan aamalara@purdue.edu <br>
Charlie Kim kim3500@purdue.edu <br>
Alison Liang arliang@purdue.edu <br>
Nicholas Tanzillo ntanzill@purdue.edu

## Project Purpose
The project aims to develop a command-line interface (CLI) tool for ACME Corporation to facilitate the trustworthy reuse of open-source Node.js modules. Addressing concerns from their software architects, the CLI will evaluate modules based on criteria such as ramp-up time, correctness, bus factor, responsiveness, and license compatibility with the GNU Lesser General Public License v2.1. The output will provide users with an overall score and detailed sub-scores for each module, ensuring informed decision-making for future Node.js service developments. This tool will set the groundwork for potential web service integration in future phases.


## TODO (remove later):
* cleanup metrics (var names, comments, print statements, etc.)
* add 20 test cases (min 1 for each metric), line coverage printed (min 80%).
* move final run executable into project root.
* make sure all latency scores are scaled between [0, 1], right now the latency is just measured in seconds and is returned for each metric.
* add support for npmjs urls (e.g `https://www.npmjs.com/package/even`).
* remove harded-coded `test_urls.txt` path in `package.json` setup script.

## Notes (remove later)
* "Ramp-up time measures" documentation complexity and the number of contributions/contributors.
  - "Correctness" is based on "Ramp-up time" goals. We will do testing as needed to measure our project's "Correctness."
* [Phase 1 Rubric](https://piazza.com/class/lzvpabcdwx83b0/post/94)
* [syntax checker](https://piazza.com/class/lzvpabcdwx83b0/post/52)
* [Project Plan](https://docs.google.com/document/d/1XzcjSY4iD0JeGCp3_8yb3W4f8O1s0HRK7Ix6pg2Zano/edit#heading=h.dv1pr3855kek)
* [Phase 1 SPEC](https://purdue.brightspace.com/d2l/le/content/1096370/viewContent/17430281/View)
* [GitHub REST API Docs](https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api?apiVersion=2022-11-28)
* [TypeScript Basics](https://www.w3schools.com/typescript/typescript_intro.php)
* You can expect the autograder to set up the env variables for you. So your program should only load it from the process.env and not try to load the .env file

* current code works with syntax checker.

---
Week 3 Changes (Charlie Kim)

1.) Bus Factor:
  * how many people are working on the project (sort of) and the higher the bus factor is the better. apparently its called that because of the possibility of the devs getting hit by a bus? anyway its related to the count of the contributions of the contributors and their distribution (what a mouthful lol)

  * this calculates the bus factor by analysing the distribution of commits from the contributors and it finds out the minimum number of devs who are responsible for the most commits.
i set the threshold manually to be 50% for the majority, you can change that by looking at busfactor.ts is the /src folder.

---

2.) Responsiveness:
* average response time for issues/pull requests. obviously, a shorter response time is better. we all hate waiting on people right?

* this calculates responsiveness by looking at the time difference between when an issue/pr was opened and the first response was made.

---

3.) Correctness 
* checks the validity of the repo by seeing how many open issues it has and whether it has tests in it. if it has low open issues and tests exist, it's probably working decently.

* this calculates correctness by seeing how many open issues it has and whether it's got test files/scripts (by checking references to testing frameworks like mocha/jest/chai in the package.json). this could be improved upon.
~as of right now it runs checks in package.json for testing frameworks. i dont think it checks for the amount of open issues but i may add to that later! we would need to finalise a way to properly calculate the correctness of a package though.~

* added a check for open issue count and it should display the oldest open issues and what they are!

---

## Setup Instructions

### **1. Connect to ECEPROG**

- SSH into the **ECEPROG** server. Use the following command to connect:
   ```bash
   # password is the 4 digit code followed by ",push".
   # or you can generate ssh key to bypass. 
   ssh your_username@eceprog.ecn.purdue.edu
   ```

> **Note**: You can develop and test the project locally on your machine, 
but the auto-grader will run on eceprog.

### **2. Clone the Repository**
   ```bash
   git clone https://github.com/akashamalNA/ECE-461-Team-20-Repo
   # once in the cloned repo, run the following command. 
   cd 461-project
   ```

### **3. Install Dependencies**

- Run the following command in the terminal to install the necessary packages:
   ```bash
   npm install
   ```
   This installs the following packages:
   - `@octokit/rest` (GitHub API)
   - `moment` (for time and date calculations)
   - `typescript`

### **4. Make Changes and Build**

- If you make any changes to the TypeScript code, you need to compile it into JavaScript. Run:
   ```bash
   npm run build
   ```
   This compiles all the TypeScript files into JavaScript and places them in the `/dist` directory.

### **5. Add Shebang to the Compiled JavaScript File**

- To ensure the script can be executed directly from the command line, add the shebang line to the top of the compiled `run` file. Edit the file `dist/run.js` and add the following line at the very beginning:
   ```bash
   #!/usr/bin/env node
   ```
   This tells the system to run the file using Node.js.

### **6. Make Sure the `run` File is Executable**

1. Rename the compiled JavaScript file `run.js` (from `/dist`) to simply `run`:
   ```bash
   mv dist/run.js dist/run
   ```

2. Make the `run` file executable:
   ```bash
   chmod +x dist/run
   ```

3. Run the `run` executable:
   ```bash
   ./dist/run install
   # we are rate limited - make sure to also set the GITHUB_TOKEN env var.
   ./dist/run test
   ./dist/run /home/shay/a/purdue_username/path_to_cloned_repo/461-project/src/test_urls.txt
   ```

### **Environment Setup for Logging**

- Make sure to set up environment variables for logging:
   ```bash
   export LOG_FILE=/path/to/logfile.log
   export LOG_LEVEL=1  # 0: silent, 1: info, 2: debug
   ```
