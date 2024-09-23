# ECE-461-Team-20-Repo
ECE 461 Semester Project.

## Team Members
Akash Amalarasan aamalara@purdue.edu <br>
Charlie Kim kim3500@purdue.edu <br>
Alison Liang arliang@purdue.edu <br>
Nicholas Tanzillo ntanzill@purdue.edu

## Project Purpose
The project aims to develop a command-line interface (CLI) tool for ACME Corporation to facilitate the trustworthy reuse of open-source Node.js modules. Addressing concerns from their software architects, the CLI will evaluate modules based on criteria such as ramp-up time, correctness, bus factor, responsiveness, and license compatibility with the GNU Lesser General Public License v2.1. The output will provide users with an overall score and detailed sub-scores for each module, ensuring informed decision-making for future Node.js service developments. This tool will set the groundwork for potential web service integration in future phases.

## Setup Instructions
### **1. Connect to ECEPROG**

- SSH into the **ECEPROG** server using the following command:
   ```bash
   # The password is the 4-digit code followed by ",push".
   # Alternatively, you can generate an SSH key.
   ssh your_username@eceprog.ecn.purdue.edu
   ```

> **Note**: You can develop and test the project locally on your machine, but the auto-grader will run on ECEPROG.

### **2. Clone the Repository**
   ```bash
   git clone https://github.com/akashamalNA/ECE-461-Team-20-Repo
   # Navigate into the cloned repository.
   cd ECE-461-Team-20-Repo
   ```

### **3. Set Environment Variables**
1. **`GITHUB_TOKEN`**:  
   Generate a [GitHub Personal Access Token](https://github.com/settings/tokens) and set it using:
   ```bash
   export GITHUB_TOKEN=your_personal_access_token_here
   ```
   
2. **`LOG_FILE`**:  
   This specifies the path where log messages will be written. Set a file path (e.g., `/home/your_username/logs/project.log`):
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

### **5. Make Changes and Build**

- If you make any changes to the TypeScript code, compile it into JavaScript by running:
   ```bash
   npm run build
   ```
   This compiles all TypeScript files into JavaScript and places them in the `/dist` directory.

### **6. Add Shebang to the Compiled JavaScript File**

- To ensure the script can be executed directly from the command line, add the shebang line to the top of the compiled `run` file. Edit `dist/run.js` and add the following line at the very beginning:
   ```bash
   #!/usr/bin/env node
   ```

### **7. Rename and Make the `run` File Executable**

1. Rename the compiled JavaScript file `run.js` (from `/dist`) to simply `run`:
   ```bash
   mv dist/run.js dist/run
   ```

2. Make the `run` file executable:
   ```bash
   chmod +x dist/run
   ```

### **8. Package the Project**

- To create a packaged executable in the root directory, run the following command:
   ```bash
   pkg dist/run.js --targets node16-linux-x64 --output run
   ```
   **Note**: You may need to run this command locally on your machine.

- After packaging, make sure the `run` file is executable:
   ```bash
   chmod +x run
   ```

# **Commands**

- To check how many queries you have left with the GitHub API, use the following command:
   ```bash
   curl -H "Authorization: token <GITHUB_TOKEN>" https://api.github.com/rate_limit
   ```

- After packaging, you can install dependencies and run tests using the following commands:
```bash
./run install  # To install all dependencies
./run test     # To run all tests
./run <FILE_PATH>  # To process the file located at FILE_PATH, which contains valid URL(s) to process.
```
