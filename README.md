# ECE-461-Team-19-Repo
ECE 461 Semester Project - Phase 2

## Team Members
Alexander Beuerle abeuerle@purdue.edu <br>
Dhruv Chaudhary dchaudh@purdue.edu <br>
Sayim Shazlee sshazlee@purdue.edu <br>
Nicholas Viardo nviardo@purdue.edu

## Project Purpose
The purpose of Phase 2 is to extend the functionality of the CLI tool developed in Phase 1 into a Trustworthy Module Registry, ensuring core functionalities for managing npm-compatible packages. This project built a functional, secure, and efficient baseline for the Trustworthy Module Registry, laying the foundation for future enhancements while meeting the immediate needs of ACME Corporation. A simple, accessible web interface is introduced to facilitate user interactions with the registry. Users can upload modules to the registry and download them as needed, with their metadata logged and stored in DynamoDB. Packages can be rated on user input with the metrics from Phase 1, and those ratings will be stored and accessible from the front end.  A standards-compliant API is provided for interacting with the module registry, supporting operations such as querying, rating, uploading, and downloading packages. The system is deployed on AWS using S3 for storage, Lambda functions for backend logic, and DynamoDB for metadata storage, ensuring scalability and reliability. 

## Front-end website Use Guide
The front end website can be reached by going to the URL <br>
http://461frontend.s3-website-us-east-1.amazonaws.com/

In order to use the front-end the backend must be turned on. Becasue, AWS cost managment is unfamiliar to us we chose to not leave it on for extended periods. 

Once there, the user has many different actions available to them. 

### View packages
Packages are automatically displayed? 

### Upload
In the right side of the screen, separated by a black border are input fields. The user must select their package files with the "choose file" button, and then input the name of the module, and the score given by the rating function. (this is confusing to me guys, isnt this a recursive step?)

### Rate
Once Uploaded, a user can simply press the "rate package" button to rate their package.

### Download
placeholder

## API call setup/guide
https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod - Main API Gateway
https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod/package - GET List all packages
https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod/package - POST Upload packages
https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod/package/{id}  - PUT Update package 
https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod/package/{id}/cost - GET Cost of packages
https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod/package/{id}/download - GET Download packages
https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod/package/{id}/rate - GET Rate packages
https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod/package/ingest - POST Ingest packages
https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod/package/search - GET Search packages
https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod/reset - GET Reset packages 

Example call to check endpoint (this example is for getting list of packages): 
curl -X GET "https://qpzws2yebl.execute-api.us-east-1.amazonaws.com/prod/package"
