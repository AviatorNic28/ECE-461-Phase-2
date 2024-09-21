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
* tests are written - need to be integrated into run.ts.
* move final run executable into project root.

## Notes (remove later)
* [Phase 1 Rubric](https://piazza.com/class/lzvpabcdwx83b0/post/94)
* [syntax checker](https://piazza.com/class/lzvpabcdwx83b0/post/52)
* [Project Plan](https://docs.google.com/document/d/1XzcjSY4iD0JeGCp3_8yb3W4f8O1s0HRK7Ix6pg2Zano/edit#heading=h.dv1pr3855kek)
* [Phase 1 SPEC](https://purdue.brightspace.com/d2l/le/content/1096370/viewContent/17430281/View)
* You can expect the autograder to set up the env variables for you. So your program should only load it from the process.env and not try to load the .env file

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

#### **3. Set Environment Variables**
1. **`GITHUB_TOKEN`**:  
   This token allows access to the GitHub API (e.g., for fetching repository data).  
   You need to generate a [GitHub Personal Access Token](https://github.com/settings/tokens) and then set it using:
   ```bash
   export GITHUB_TOKEN=your_personal_access_token_here
   ```
2. **`LOG_FILE`**:  
   This specifies the path where log messages will be written. You should set a file path (e.g., `/home/your_username/logs/project.log`).  
   Example:
   ```bash
   export LOG_FILE=/home/your_username/logs/project.log
   ```
3. **`LOG_LEVEL`**:  
   This controls the verbosity of log output. Set it according to your preferred level of logging:
   - `0`: Silent (no logging)
   - `1`: Info level logging
   - `2`: Debug level logging
   ```bash
   export LOG_LEVEL=1
   ```

### **4. Install Dependencies**

- Run the following command in the terminal to install the necessary packages:
   ```bash
   npm install
   ```
   This installs the following packages:
   - `@octokit/rest` (GitHub API)
   - `moment` (for time and date calculations)
   - `typescript`

### **5. Make Changes and Build**

- If you make any changes to the TypeScript code, you need to compile it into JavaScript. Run:
   ```bash
   npm run build
   ```
   This compiles all the TypeScript files into JavaScript and places them in the `/dist` directory.

### **6. Add Shebang to the Compiled JavaScript File**

- To ensure the script can be executed directly from the command line, add the shebang line to the top of the compiled `run` file. Edit the file `dist/run.js` and add the following line at the very beginning:
   ```bash
   #!/usr/bin/env node
   ```
   This tells the system to run the file using Node.js.

### **7. Make Sure the `run` File is Executable**

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
   ./dist/run test
   ./dist/run /home/shay/a/purdue_username/path_to_cloned_repo/461-project/src/test_urls.txt
   ```
