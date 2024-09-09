# ECE-461-Team-20-Repo
ECE 461 Semester Project.

## Team Members
Akash Amalarasan<br>
Charlie Kim<br>
Alison Liang<br>
Nicholas Tanzillo


## Setup Environment
### 1. Connect to eceprog for Development
1. Set up the [Purdue VPN](https://it.purdue.edu/services/vpn.php).
2. Connect via SSH from VSCode (implement steps if needed).

### 2. Install TypeScript and Dependencies on eceprog
Run the following commands in the terminal:

1. Install project dependencies:
   ```bash
   npm install
   ```

2. Install the latest version of TypeScript:
   ```bash
   npm install --save-dev typescript@latest
   ```

### 3. Setup Environment Variables
1. Create a `.env` file and add the following variables:

   ```bash
   GITHUB_TOKEN=<your_github_token>
   LOG_LEVEL=<log_level>
   LOG_FILE=</Users/myUser/IdeaProjects/logs/mylog.txt>
   ```

### 4. Compile and Run the TypeScript File
Run the following commands in the terminal:

1. Navigate to the source folder:
   ```bash
   cd src
   ```
2. Compile the TypeScript file:
   ```bash
   npx tsc index.ts
   ```
3. Run the compiled JavaScript file:
   ```bash
   node index.js
   ```


## Available Commands
### We should eventually have an executable called `run` that supports the following.
```bash
# install all dependencies for the project.
./run install
```

```bash
# test a single file (this file may contain multiple URLs).
./run <absolute_path_to_file>
```

```bash
# testing (personal tests and code coverage).
./run test

```

## Notes
* "Ramp-up time measures" documentation complexity and the number of contributions/contributors.
  - "Correctness" is based on "Ramp-up time" goals. We will do testing as needed to measure our project's "Correctness."
* since this application is quite basic, we can just have a function for each metric calculation all within `src/index.ts`. (e.g. calculate_rampup_score(...), calculate_correctness_score(...), etc.)

* [syntax checker](https://piazza.com/class/lzvpabcdwx83b0/post/52)
* [Project Plan](https://docs.google.com/document/d/1XzcjSY4iD0JeGCp3_8yb3W4f8O1s0HRK7Ix6pg2Zano/edit#heading=h.dv1pr3855kek)
* [Phase 1 SPEC](https://purdue.brightspace.com/d2l/le/content/1096370/viewContent/17430281/View)
* [GitHub REST API Docs](https://docs.github.com/en/rest/using-the-rest-api/getting-started-with-the-rest-api?apiVersion=2022-11-28)
* [Coding Examples](Examples.md)
* [TypeScript Basics](https://www.w3schools.com/typescript/typescript_intro.php)
* [Dev Pack](https://education.github.com/pack)