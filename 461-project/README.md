# ECE-461-Team-20-Repo
Software Engineer Purdue ECE 461 Semester Project.

Akash test
Nicholas test
Alison test
charlie test

-

Bus Factor = how many people are working on the project (sort of) and the higher the bus factor is the better. apparently its called that because of the possibility of the devs getting hit by a bus? anyway its related to the count of the contributions of the contributors and their distribution (what a mouthful lol)

this calculates the bus factor by analysing the distribution of commits from the contributors and it finds out the minimum number of devs who are responsible for the most commits.
i set the threshold manually to be 50% for the majority, you can change that by looking at busfactor.ts is the /src folder.

--

Responsiveness = average response time for issues/pull requests. obviously, a shorter response time is better. we all hate waiting on people right?

this calculates responsiveness by looking at the time difference between when an issue/pr was opened and the first response was made.

--

Correctness = checks the validity of the repo by seeing how many open issues it has and whether it has tests in it. if it has low open issues and tests exist, it's probably working decently.

this calculates correctness by seeing how many open issues it has and whether it's got test files/scripts (by checking references to testing frameworks like mocha/jest/chai in the package.json). this could be improved upon.

clone the repo and install dependencies by running in git bash

```npm install```

which should install octokit/rest (github api), moment (for time/date calcs), and typescript (typescript).

then run (if you make any changes to the code)

```npm build```

which should compile the typescript files into javascript in /dist

run the tool using

```npm start```

or you can just use the .exe file i packaged! note that the file was packaged with the default shipped version of the files, so if you want to repackage all that stuff into an updated .exe, run these commands after building:

```pkg . --targets node16-win-x64,node16-macos-x64,node16-linux-x64 --output 461-project```

