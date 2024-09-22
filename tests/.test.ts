import { calculateResponsiveness } from '../src/responsiveness';
import { calculateCorrectness } from '../src/correctness';
import { calculateBusFactor } from '../src/busfactor';
import { calculateLicenseCompatibility } from '../src/license_compatibility';
import { calculateRampUpTime } from '../src/rampup_time';
import { Octokit } from '@octokit/rest';

describe('Test Suite', () => {

    // testing on a single github repo. 
    const owner = "nodejs"
    const repo = "node"
    const token = process.env.GITHUB_TOKEN || ''; // Use environment variable or empty string
    const octokit = new Octokit(token ? { auth: token } : {}); 

    // Metric tests. 
    it('should calculate BusFactor', async () => {
        const { busfactor, busfactor_latency } = await calculateBusFactor(owner, repo, 50, octokit);
        expect(busfactor).toBeGreaterThanOrEqual(0);
        expect(busfactor_latency).toBeGreaterThanOrEqual(0);
    });
  
    it('should calculate correctness', async () => {
        const { correctness, correctness_latency } = await calculateCorrectness(owner, repo, octokit);
        expect(correctness).toBeGreaterThanOrEqual(0);
        expect(correctness_latency).toBeGreaterThanOrEqual(0);
    });

    it('should calculate license compatiability', async () => {
        const {license, license_latency } = await calculateLicenseCompatibility(owner, repo, octokit);
        expect(license).toBeGreaterThanOrEqual(0);
        expect(license_latency).toBeGreaterThanOrEqual(0);
    });

    it('should calculate rampup time', async () => {
        const { rampup, rampup_latency } = await calculateRampUpTime(owner, repo, octokit);
        expect(rampup).toBeGreaterThanOrEqual(0);
        expect(rampup_latency).toBeGreaterThanOrEqual(0);
    });

    it('should calculate responsiveness', async () => {
        const { responsiveness, responsiveness_latency } = await calculateResponsiveness(owner, repo, octokit);
        expect(responsiveness).toBeGreaterThanOrEqual(0);
        expect(responsiveness_latency).toBeGreaterThanOrEqual(0);
    });

    // testing helper function logic in run. 
    it('should return the package name for a valid npm URL', () => {
        const url = 'https://www.npmjs.com/package/even';

        // logic for finding package name. 
        const npmUrlPattern = /^https:\/\/www\.npmjs\.com\/package\/([^/]+)$/;
        const match = url.match(npmUrlPattern);

        expect(match).toBeDefined();
    });

    // testing helper function logic in run. 
    it('should return none for an invalid npm URL', () => {
        const url = ' ';

        // logic for finding package name. 
        const npmUrlPattern = /^https:\/\/www\.npmjs\.com\/package\/([^/]+)$/;
        const match = url.match(npmUrlPattern);

        expect(match).toBeNull();
    });

    it('should round to three decimal points (case 1)', () => {
        const numberOne = 3.14159
        expect(Math.round(numberOne * 1000) / 1000).toBe(3.142);
    });

    it('should round to three decimal points (case 2)', () => {
        const numberOne = 0.12345
        expect(Math.round(numberOne * 1000) / 1000).toBe(.123);
    });    

    it('should round to three decimal points (case 3)', () => {
        const numberOne = -12.64
        expect(Math.round(numberOne * 1000) / 1000).toBe(-12.64);
    });        

    it('should return a valid repo and owner from a GitHub link.', () => {
        const url = "https://github.com/nodejs/node";
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    
        // Convert match to a string
        const matchString = match ? match.join(',') : '';
    
        expect(matchString).toEqual("github.com/nodejs/node,nodejs,node");
    });
    
    it('should return none for an invalid github link.', () => {
        const url = "";
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    
        // Convert match to a string
        const matchString = match ? match.join(',') : '';
    
        expect(matchString).toEqual("");
    });    

    // this is for testing an npm package where the github link wasn't provided.
    const npmOwner = "jonschlinkert";
    const npmRepo = "even.git";
    it('should calculate BusFactor (case 2)', async () => {
        const { busfactor, busfactor_latency } = await calculateBusFactor(npmOwner, npmRepo, 50, octokit);
        expect(busfactor).toBeDefined();
        expect(busfactor_latency).toBeDefined();
    });
  
    it('should calculate correctness (case 2)', async () => {
        const { correctness, correctness_latency } = await calculateCorrectness(npmOwner, npmRepo, octokit);
        expect(correctness).toBeDefined();
        expect(correctness_latency).toBeDefined();
    });

    it('should calculate license compatiability (case 2)', async () => {
        const {license, license_latency } = await calculateLicenseCompatibility(npmOwner, npmRepo, octokit);
        expect(license).toBeDefined();
        expect(license_latency).toBeDefined();
    });

    it('should calculate rampup time (case 2)', async () => {
        const { rampup, rampup_latency } = await calculateRampUpTime(npmOwner, npmRepo, octokit);
        expect(rampup).toBeDefined();
        expect(rampup_latency).toBeDefined();
    });

    it('should calculate responsiveness (case 2)', async () => {
        const { responsiveness, responsiveness_latency } = await calculateResponsiveness(npmOwner, npmRepo, octokit);
        expect(responsiveness).toBeDefined();
        expect(responsiveness_latency).toBeDefined();
    });

    it('should calculate BusFactor', async () => {
        const { busfactor, busfactor_latency } = await calculateBusFactor(owner, repo, 50, octokit);
        expect(busfactor).toBeGreaterThanOrEqual(0);
        expect(busfactor_latency).toBeGreaterThanOrEqual(0);
    });

    it('should return -1 for responsiveness when repo and owner is invalid', async () => {
        const { responsiveness, responsiveness_latency } = await calculateResponsiveness("", "", octokit);
        expect(responsiveness).toBe(-1);
        expect(responsiveness_latency).toBe(-1);
    });


    it('should return -1 for busfactor when repo and owner is invalid', async () => {
        const { busfactor, busfactor_latency } = await calculateBusFactor("", "", 50, octokit);
        expect(busfactor).toBe(-1);
        expect(busfactor_latency).toBe(-1);
    });


    it('should return -1 for correctness when repo and owner is invalid', async () => {
        const { correctness, correctness_latency } = await calculateCorrectness("", "", octokit);
        expect(correctness).toBe(-1);
        expect(correctness_latency).toBe(-1);
    });
});

