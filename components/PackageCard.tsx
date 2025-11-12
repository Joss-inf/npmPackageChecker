import React, { useState } from 'react';
import { NpmPackageData, Dependency } from '../types';
import DependencyGraph from './DependencyGraph'; // Import the new component

interface PackageCardProps {
  packageData: NpmPackageData;
  securityAdvisories: string[];
}

const DependencyList: React.FC<{ title: string; dependencies?: { [key: string]: string } }> = ({ title, dependencies }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!dependencies || Object.keys(dependencies).length === 0) {
    return (
      <div className="flex justify-between items-center w-full text-left font-semibold text-gray-700">
        <span>{title} (0)</span>
      </div>
    );
  }

  // Explicitly cast version to string to resolve TypeScript error related to Object.entries type inference
  const depsArray: Dependency[] = Object.entries(dependencies).map(([name, version]) => ({ name, version: version as string }));

  return (
    <div className="mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex justify-between items-center w-full text-left font-semibold text-blue-700 hover:text-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <span>{title} ({depsArray.length})</span>
        <svg
          className={`w-4 h-4 transform ${isOpen ? 'rotate-180' : 'rotate-0'} transition-transform duration-200`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
        </svg>
      </button>
      {isOpen && (
        <div className="mt-3 flex flex-wrap gap-2 max-h-48 overflow-y-auto text-sm"> {/* Changed to flex wrap with gap */}
          {depsArray.map((dep, index) => (
            <span key={index} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">
              <span className="font-semibold">{dep.name}</span>@{dep.version}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

const PackageCard: React.FC<PackageCardProps> = ({ packageData, securityAdvisories }) => {
  return (
    <div className="space-y-6"> {/* Parent wrapper for sub-cards, handles vertical spacing */}

      {/* Package Info Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <div className="flex justify-between items-start mb-4">
            <h2 className="text-3xl font-bold text-gray-900 flex items-center">
              <svg className="w-8 h-8 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path></svg>
              {packageData.name}
            </h2>
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap">
              v{packageData.version}
            </span>
        </div>
        {packageData.description && (
          <p className="text-gray-700 mb-4">{packageData.description}</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-sm text-gray-700"> {/* Use grid for better layout */}
            <div><span className="font-semibold text-gray-800">License:</span> {packageData.license || 'N/A'}</div>
            {/* Display author from packageData */}
            <div><span className="font-semibold text-gray-800">Author:</span> {packageData.author || 'N/A'}</div> 
            <div><span className="font-semibold text-gray-800">Downloads (Last Week):</span> N/A</div>
            <div><span className="font-semibold text-gray-800">Published:</span> {packageData.publishedDate || 'N/A'}</div>
        </div>
      </div>

      {/* Security Status Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
          <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.002 12.002 0 002 12c0 2.831.972 5.447 2.685 7.556L12 22l7.315-2.444A12.002 12.002 0 0022 12c0-2.831-.972-5.447-2.685-7.556z"></path></svg>
          Security Status
        </h3>
        {securityAdvisories.length > 0 ? (
          <ul className="list-disc list-inside text-red-700">
            {securityAdvisories.map((advisory, index) => (
              <li key={index}>{advisory}</li>
            ))}
          </ul>
        ) : (
          <p className="text-green-700 font-medium flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            No known vulnerabilities found
          </p>
        )}
        <p className="text-sm text-gray-500 mt-2">
          For a complete security audit, consider running `npm audit` or using dedicated security scanning tools server-side.
        </p>
      </div>

      {/* Dependencies Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          Dependencies
        </h3>
        <div className="flex flex-col gap-2"> {/* Use flex-col for vertical stacking of dependency lists */}
          <DependencyList title="Dependencies" dependencies={packageData.dependencies} />
          <DependencyList title="Dev Dependencies" dependencies={packageData.devDependencies} />
        </div>
        {(!packageData.dependencies || Object.keys(packageData.dependencies).length === 0) &&
         (!packageData.devDependencies || Object.keys(packageData.devDependencies).length === 0) && (
            <p className="text-gray-600 mt-2 text-sm">No dependencies listed.</p>
        )}
      </div>

      {/* Dependency Graph Card */}
      {/* Ensure packageData is not null before rendering DependencyGraph */}
      {packageData && <DependencyGraph packageData={packageData} />}

      {/* Additional Information Card */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
          <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
          Additional Information
        </h3>
        
        {packageData.maintainers && packageData.maintainers.length > 0 && (
          <div className="mb-4">
              <span className="font-semibold text-gray-800 block mb-1">Maintainers:</span>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                {packageData.maintainers.map((maintainer, index) => (
                  <p key={index} className="text-gray-700">
                    <span className="font-medium">{maintainer.name}</span>{' '}
                    {maintainer.email && <span className="text-gray-500">({maintainer.email})</span>}
                  </p>
                ))}
              </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 mt-4 text-sm">
            {packageData.homepage && (
              <div>
                <span className="font-semibold text-gray-800">Homepage:</span>{' '}
                <a
                  href={packageData.homepage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {packageData.homepage.replace(/(^\w+:|^)\/\//, '').split('/')[0]} {/* Display cleaner URL */}
                </a>
              </div>
            )}
            {packageData.repository && (
              <div>
                <span className="font-semibold text-gray-800">Repository:</span>{' '}
                <a
                  href={packageData.repository.replace(/^git\+/, '').replace(/\.git$/, '')}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {packageData.repository.replace(/^git\+/, '').replace(/\.git$/, '').split('/').pop()} {/* Display repo name */}
                </a>
              </div>
            )}
            <div>
              <span className="font-semibold text-gray-800">NPM Page:</span>{' '}
              <a
                href={packageData.npmUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                {packageData.name}
              </a>
            </div>
        </div>
      </div>

    </div>
  );
};

export default PackageCard;
