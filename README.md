# ECE-461-Team-20-Repo
ECE 461 Semester Project.

## Team Members
Akash Amalarasan<br>
Charlie Kim<br>
Alison Liang<br>
Nicholas Tanzillo

## TODO / Double Check (remove later):
* Implement license checker.  
* create `run` executable (with required commands).
* add 20 test cases (each metric has at least 1 test case), line coverage is printed (80% min).
* env vars setup (LOG_FILE, LOG_LEVEL, GITHUB_TOKEN)
* using invalid GitHub Token yields rc 1 & stdout "INVALIDTOKEN"
* metrics calculated in parallel
* desc for purpose of project, configuration details, how to invoke.

## Notes (remove later)
* "Ramp-up time measures" documentation complexity and the number of contributions/contributors.
  - "Correctness" is based on "Ramp-up time" goals. We will do testing as needed to measure our project's "Correctness."
* [Phase 1 Rubric](https://piazza.com/class/lzvpabcdwx83b0/post/94)
* [syntax checker](https://piazza.com/class/lzvpabcdwx83b0/post/52)
* [Project Plan](https://docs.google.com/document/d/1XzcjSY4iD0JeGCp3_8yb3W4f8O1s0HRK7Ix6pg2Zano/edit#heading=h.dv1pr3855kek)
* [Phase 1 SPEC](https://purdue.brightspace.com/d2l/le/content/1096370/viewContent/17430281/View)
* [GitHub REST API Docs](https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api?apiVersion=2022-11-28)
* [TypeScript Basics](https://www.w3schools.com/typescript/typescript_intro.php)

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

### **5. Run the Tool**

- To run the tool, use:
   ```bash
   npm start
   ```

### **6. (Optional) Package as Executable**

- If you want to repackage the code into an executable file after making changes, follow these steps:
   
   1. Ensure you've built the project (`npm run build`).
   
   2. Then, package it into an executable for multiple platforms:
      ```bash
      pkg . --targets node16-win-x64,node16-macos-x64,node16-linux-x64 --output 461-project
      ```
   
### **7. Make Sure the `run` File is Executable**

1. Ensure you have compiled the TypeScript file into JavaScript (from `/src` to `/dist`):
   ```bash
   npm run build
   ```

2. Rename the compiled JavaScript file `run.js` (from `/dist`) to simply `run`:
   ```bash
   mv dist/run.js dist/run
   ```

3. Make the `run` file executable:
   ```bash
   chmod +x dist/run
   ```

4. Run the `run` executable:
   ```bash
   ./dist/run install
   ./dist/run test
   ./dist/run /absolute_path/to/url_file.txt
   ```

### **Environment Setup for Logging** (check over)

- Make sure to set up environment variables for logging:
   ```bash
   export LOG_FILE=/path/to/logfile.log
   export LOG_LEVEL=1  # 0: silent, 1: info, 2: debug
   ```