import { NpmPackageData, NpmRegistryResponse, PackageDetailsResponse, NpmDownloadsResponse } from '../types';

/**
 * Fetches download statistics for a package for the last week.
 * @param packageName The name of the NPM package.
 * @returns A promise that resolves to the number of downloads, or undefined if unavailable.
 */
export const fetchPackageDownloads = async (packageName: string): Promise<number | undefined> => {
  try {
    const response = await fetch(`https://api.npmjs.org/downloads/point/last-week/${packageName}`);
    if (!response.ok) {
      // It's common for download stats to return 404 for very new or obscure packages.
      // We'll just return undefined in such cases, not throw an error.
      if (response.status === 404) {
        console.warn(`Download stats not found for package "${packageName}".`);
        return undefined;
      }
      throw new Error(`Failed to fetch download data: ${response.statusText}`);
    }
    const data: NpmDownloadsResponse = await response.json();
    return data.downloads;
  } catch (error) {
    console.error('Error in fetchPackageDownloads:', error);
    return undefined; // Return undefined on any error
  }
};

/**
 * Fetches package metadata from the NPM registry for a specific version or the latest.
 * @param packageName The name of the NPM package to fetch.
 * @param version An optional specific version to fetch. If not provided, the latest version will be fetched.
 * @returns A promise that resolves to PackageDetailsResponse or rejects with an error.
 */
export const fetchPackageData = async (packageName: string, version?: string): Promise<PackageDetailsResponse> => {
  try {
    const response = await fetch(`https://registry.npmjs.org/${packageName}`);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`Package "${packageName}" not found.`);
      }
      throw new Error(`Failed to fetch package data: ${response.statusText}`);
    }

    const data: NpmRegistryResponse = await response.json();

    const latestVersion = data['dist-tags']?.latest;
    if (!latestVersion) {
      throw new Error(`Could not determine latest version for package "${packageName}".`);
    }

    const versionToFetch = version || latestVersion;

    const versionData = data.versions[versionToFetch];
    if (!versionData) {
      throw new Error(`Could not find data for version "${versionToFetch}" of package "${packageName}".`);
    }

    const repoUrl = versionData.repository?.url || data.repository?.url;
    const homepageUrl = versionData.homepage || data.homepage;

    // --- Author Extraction Logic ---
    let author: string | undefined;

    // 1. Try to get author from versionData.author
    if (versionData.author) {
      if (typeof versionData.author === 'object' && versionData.author.name) {
        author = versionData.author.name;
      } else if (typeof versionData.author === 'string') {
        // Extract name part from string like "John Doe <john@example.com>"
        const nameMatch = versionData.author.match(/^([^<]+)/);
        author = nameMatch ? nameMatch[1].trim() : versionData.author;
      }
    }

    // 2. If no author found, try to infer from GitHub repository URL
    if (!author && repoUrl) {
      // Clean up repoUrl to remove 'git+' prefix and '.git' suffix for better matching
      const cleanedRepoUrl = repoUrl.replace(/^git\+/, '').replace(/\.git$/, '');
      const githubMatch = cleanedRepoUrl.match(/github\.com\/([^/]+)\/[^/]+/);
      if (githubMatch && githubMatch[1]) {
        author = githubMatch[1]; // This is the GitHub owner/organization
      }
    }
    // --- End Author Extraction Logic ---

    // --- Published Date Extraction ---
    let publishedDate: string | undefined;
    const rawPublishedDate = data.time[versionToFetch];
    if (rawPublishedDate) {
        publishedDate = new Date(rawPublishedDate).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    }
    // --- End Published Date Extraction ---

    // Get all available versions and sort them in reverse order (newest first)
    const allVersions = Object.keys(data.versions).sort((a, b) => {
      // Custom sort for semver:
      // Split versions into parts and compare numerically where possible, otherwise alphabetically.
      const aParts = a.split('.').map(Number);
      const bParts = b.split('.').map(Number);

      for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aNum = aParts[i] || 0;
        const bNum = bParts[i] || 0;
        if (aNum !== bNum) {
          return bNum - aNum; // Descending numeric sort
        }
      }
      return 0; // Versions are identical
    });

    // Fetch download stats
    const downloadsLastWeek = await fetchPackageDownloads(packageName);

    const packageData: NpmPackageData = {
      name: versionData.name,
      version: versionData.version,
      description: versionData.description,
      license: versionData.license,
      author: author || 'N/A', // Assign the found author or default to 'N/A'
      dependencies: versionData.dependencies,
      devDependencies: versionData.devDependencies,
      homepage: homepageUrl,
      repository: repoUrl,
      npmUrl: `https://www.npmjs.com/package/${packageName}`,
      publishedDate: publishedDate, // Assign the found published date
      maintainers: data.maintainers, // Assign maintainers
      downloadsLastWeek: downloadsLastWeek, // Assign download stats
    };

    return { packageData, allVersions };
  } catch (error) {
    console.error('Error in fetchPackageData:', error);
    throw error;
  }
};

// Placeholder for security advisories fetching.
// Direct client-side access to npm audit equivalent is complex due to CORS/authentication.
// In a real-world scenario, this would typically involve a backend proxy.
export const fetchSecurityAdvisories = async (packageName: string, version: string): Promise<string[]> => {
  // Simulate an empty result for simplicity in a client-side only app.
  // In a real application, you might integrate with a vulnerability database API (e.g., Snyk, Mend, or a custom backend service).
  await new Promise(resolve => setTimeout(resolve, 500)); // Simulate API call delay
  
  // Example of what would be returned if there were an API
  // if (packageName === 'left-pad' && version === '1.0.0') {
  //   return ['Critical vulnerability: Prototype Pollution (CVE-2020-XXXX)'];
  // }
  
  return [];
};