export interface NpmPackageData {
  name: string;
  version: string;
  description?: string;
  license?: string;
  author?: string; // Added author field
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
  homepage?: string;
  repository?: string;
  npmUrl: string;
  publishedDate?: string; // Added published date field
  maintainers?: Array<{ name: string; email: string }>; // Added maintainers field
  downloadsLastWeek?: number; // Added downloadsLastWeek field
}

export interface NpmRegistryResponse {
  name: string;
  'dist-tags': {
    latest: string;
  };
  versions: {
    [version: string]: {
      name: string;
      version: string;
      description?: string;
      license?: string;
      author?: string | { name: string; email?: string; url?: string }; // Author can be string or object
      dependencies?: { [key: string]: string };
      devDependencies?: { [key: string]: string };
      homepage?: string;
      repository?: {
        type: string;
        url: string;
      };
    };
  };
  time: { // Added time object for published date
    [version: string]: string;
    created: string;
    modified: string;
  };
  maintainers: Array<{ name: string; email: string }>; // Added maintainers field at root
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
}

export interface NpmDownloadsResponse {
  downloads: number;
  start: string;
  end: string;
  package: string;
}

export interface Dependency {
  name: string;
  version: string;
}

export interface PackageDetailsResponse {
  packageData: NpmPackageData;
  allVersions: string[];
}