import React, { useState, useEffect, useCallback } from 'react';
import { NpmPackageData } from './types';
import { fetchPackageData, fetchSecurityAdvisories } from './services/npmService';
import LoadingSpinner from './components/LoadingSpinner';
import PackageCard from './components/PackageCard';
import CommandPalette from './components/CommandPalette'; // Import CommandPalette

const App: React.FC = () => {
  const [packageName, setPackageName] = useState<string>('');
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [availableVersions, setAvailableVersions] = useState<string[]>([]);
  const [packageData, setPackageData] = useState<NpmPackageData | null>(null);
  const [securityAdvisories, setSecurityAdvisories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false); // State for command palette

  const clearResults = useCallback(() => {
    setPackageName('');
    setSelectedVersion('');
    setAvailableVersions([]);
    setPackageData(null);
    setSecurityAdvisories([]);
    setError(null);
  }, []);

  const handleSearch = useCallback(async (e?: React.FormEvent, versionToFetch?: string, pkgNameOverride?: string) => {
    e?.preventDefault(); // Prevent default form submission if triggered by form
    
    const currentPackageName = pkgNameOverride || packageName.trim(); // Use override if provided, else state
    if (!currentPackageName) {
      setError('Please enter a package name.');
      setPackageData(null);
      setSecurityAdvisories([]);
      setAvailableVersions([]);
      setSelectedVersion('');
      return;
    }

    setLoading(true);
    setError(null);
    setPackageData(null); // Clear previous data when starting a new search
    setSecurityAdvisories([]); // Clear previous advisories

    try {
      const { packageData: fetchedPackageData, allVersions } = await fetchPackageData(currentPackageName, versionToFetch);
      
      setPackageData(fetchedPackageData);
      setAvailableVersions(allVersions);
      setSelectedVersion(fetchedPackageData.version); // Set selected version to the one just fetched
      if (!pkgNameOverride) { // Only update packageName state if not from an override (e.g., from command palette)
        setPackageName(currentPackageName);
      }

      // Fetch security advisories as a separate step
      const advisories = await fetchSecurityAdvisories(fetchedPackageData.name, fetchedPackageData.version);
      setSecurityAdvisories(advisories);
    } catch (err: any) {
      console.error('Search error:', err);
      setError(err.message || 'An unexpected error occurred.');
      setAvailableVersions([]); // Clear versions on error
      setSelectedVersion('');
      setPackageData(null); // Clear package data on error
      setSecurityAdvisories([]); // Clear advisories on error
    } finally {
      setLoading(false);
    }
  }, [packageName]);

  const handleVersionChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVersion = e.target.value;
    setSelectedVersion(newVersion);
    // Re-trigger search with the newly selected version
    handleSearch(undefined, newVersion);
  }, [handleSearch]);

  // Command Palette actions
  const searchPackageCommand = useCallback(async () => {
    // Prompt user for package name, then call handleSearch
    const pkg = prompt('Enter NPM package name:');
    if (pkg) {
      await handleSearch(undefined, undefined, pkg.trim());
    }
  }, [handleSearch]);

  const commands = [
    {
      id: 'search-package',
      name: 'Search Package',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>,
      action: searchPackageCommand,
      keywords: ['find', 'lookup', 'npm', 'package']
    },
    {
      id: 'clear-results',
      name: 'Clear Results',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>,
      action: clearResults,
      keywords: ['reset', 'empty']
    },
    {
      id: 'help',
      name: 'Help',
      icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.228 9.252a1.25 1.25 0 011.524 0c.257.265.41.602.41 1.006v.283c0 .404-.153.74-.41 1.006a1.25 1.25 0 01-1.524 0l-1.524-1.524a1.25 1.25 0 010-1.524l1.524-1.524zM12 8v4"></path></svg>,
      action: () => alert('Use the search bar to find NPM packages. Press Ctrl+K (or Cmd+K) to open the command palette.'),
      keywords: ['info', 'guide']
    },
  ];

  // Global keyboard shortcut to open command palette
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);


  return (
    <div className="w-full max-w-5xl mx-auto py-8 px-4 space-y-6"> {/* Main content wrapper, increased max-width */}
      <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-4 sm:mb-8">
        NPM Package Security Checker
      </h1>

      {/* Package Search Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200"> {/* Removed shadow, added border */}
        <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          Package Search
        </h2>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 items-center">
          <input
            type="text"
            value={packageName}
            onChange={(e) => {
              setPackageName(e.target.value);
              if (e.target.value === '') {
                // Clear state when input is cleared
                clearResults();
              }
            }}
            placeholder="Enter NPM package name (e.g., react, lodash)"
            className="flex-grow p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base"
            aria-label="NPM Package Name"
          />
          
          <select
            value={selectedVersion}
            onChange={handleVersionChange}
            disabled={loading || availableVersions.length === 0}
            className="p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-base w-full sm:w-auto min-w-[120px]"
            aria-label="Select Package Version"
          >
            {availableVersions.length === 0 ? (
              <option value="" disabled>No versions</option>
            ) : (
              <>
                {!selectedVersion && <option value="" disabled>Select Version</option>}
                {availableVersions.map((version) => (
                  <option key={version} value={version}>
                    {version}
                  </option>
                ))}
              </>
            )}
          </select>

          <button
            type="submit"
            disabled={loading || !packageName.trim()}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-base w-full sm:w-auto"
          >
            {loading ? 'Searching...' : 'Check Package'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Press <kbd className="bg-gray-200 px-2 py-1 rounded-md font-mono text-xs">Ctrl+K</kbd> or <kbd className="bg-gray-200 px-2 py-1 rounded-md font-mono text-xs">Cmd+K</kbd> for quick actions.
        </p>
      </div>

      {loading && <LoadingSpinner />}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg relative" role="alert"> {/* Adjusted styling */}
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline ml-2">{error}</span>
        </div>
      )}

      {packageData && <PackageCard packageData={packageData} securityAdvisories={securityAdvisories} />}

      {!loading && !error && !packageData && (
        <div className="bg-white p-6 rounded-lg border border-gray-200 text-center text-gray-500"> {/* Removed shadow, added border */}
          <p className="text-xl font-semibold">Enter a package name above to get started!</p>
          <p className="text-md mt-2">Discover its dependencies, license, and potential security advisories.</p>
        </div>
      )}

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        commands={commands}
      />
    </div>
  );
};

export default App;