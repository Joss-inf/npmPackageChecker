// components/DependencyGraph.tsx
import React, { useRef, useEffect, useState } from 'react';
import { NpmPackageData } from '../types';

// Fix: Add more specific type declarations for vis.js to support generics.
// Define interfaces for vis.js types
interface VisNode {
  id: string;
  label: string;
  group?: string;
  shape?: string;
  size?: number;
  font?: {
    size?: number;
    color?: string;
    multi?: 'html';
    bold?: boolean;
  };
  borderWidth?: number;
  color?: {
    border?: string;
    background?: string;
    highlight?: {
      border?: string;
      background?: string;
    };
    hover?: {
      border?: string;
      background?: string;
    };
  };
  margin?: number;
  shadow?: {
    enabled?: boolean;
    color?: string;
    size?: number;
    x?: number;
    y?: number;
  };
}

interface VisEdge {
  from: string;
  to: string;
  arrows?: string;
  dashes?: boolean;
  width?: number;
  color?: {
    color?: string;
    highlight?: string;
    hover?: string;
    inherit?: 'from' | 'to' | 'both' | false;
    opacity?: number;
  };
  smooth?: {
    type?: 'dynamic' | 'continuous' | 'discrete' | 'diagonalCross' | 'straightCross' | 'horizontal' | 'vertical' | 'cubicBezier';
    forceDirection?: 'none' | 'horizontal' | 'vertical';
    roundness?: number;
  };
}

// Fix: Define VisGroupOptions to correctly type group styling which does not include `id` or `label`.
interface VisGroupOptions {
  shape?: string;
  size?: number;
  font?: {
    size?: number;
    color?: string;
    multi?: 'html';
    bold?: boolean;
  };
  borderWidth?: number;
  color?: {
    border?: string;
    background?: string;
    highlight?: {
      border?: string;
      background?: string;
    };
    hover?: {
      border?: string;
      background?: string;
    };
  };
  margin?: number;
  shadow?: {
    enabled?: boolean;
    color?: string;
    size?: number;
    x?: number;
    y?: number;
  };
  dashes?: boolean; // This is specifically for edges, but can be applied to devDep group nodes in some contexts for visual consistency, though typically it's an edge property.
}


interface VisDataSet<T> {
  add(item: T | T[]): void;
  get(id: string): T | null;
  // Add other DataSet methods as needed, like update, remove etc.
}

interface VisNetworkData {
  nodes: VisDataSet<VisNode>;
  edges: VisDataSet<VisEdge>;
}

interface VisNetworkOptions {
  layout?: {
    hierarchical?: {
      direction?: 'UD' | 'DU' | 'LR' | 'RL';
      sortMethod?: 'hubsize' | 'directed' | 'undirected';
      levelSeparation?: number;
      treeSpacing?: number;
      parentCentralization?: boolean;
      shakeTowards?: 'roots' | 'leaves';
      // ... other hierarchical options
    };
  };
  nodes?: {
    shape?: string;
    size?: number;
    font?: {
      size?: number;
      color?: string;
      multi?: 'html';
    };
    borderWidth?: number;
    color?: {
      border?: string;
      background?: string;
      highlight?: {
        border?: string;
        background?: string;
      };
      hover?: {
        border?: string;
        background?: string;
      };
    };
    margin?: number;
  };
  edges?: {
    width?: number;
    color?: {
      color?: string;
      highlight?: string;
      hover?: string;
      inherit?: 'from' | 'to' | 'both' | false;
      opacity?: number;
    };
    smooth?: {
      type?: 'dynamic' | 'continuous' | 'discrete' | 'diagonalCross' | 'straightCross' | 'horizontal' | 'vertical' | 'cubicBezier';
      forceDirection?: 'none' | 'horizontal' | 'vertical';
      roundness?: number;
    };
  };
  // Fix: Use VisGroupOptions for group styling, which doesn't require id/label.
  groups?: {
    [key: string]: VisGroupOptions; // Group styling is similar to node styling
  };
  interaction?: {
    hover?: boolean;
    tooltipDelay?: number;
    zoomView?: boolean;
    dragView?: boolean;
    // ... other interaction options
  };
  physics?: {
    enabled?: boolean;
    solver?: string;
    hierarchicalRepulsion?: {
      nodeDistance?: number;
      centralGravity?: number;
      springLength?: number;
      springConstant?: number;
      avoidOverlap?: number;
    };
    // ... other physics options
  };
}

interface VisNetworkInstance {
  destroy(): void;
  // Add other network instance methods as needed
}

// Global declaration for vis.js
declare const vis: {
  DataSet: {
    new<T>(): VisDataSet<T>;
    new<T>(data: T[]): VisDataSet<T>;
  };
  Network: {
    new(container: HTMLElement, data: VisNetworkData, options?: VisNetworkOptions): VisNetworkInstance;
  };
};


interface DependencyGraphProps {
  packageData: NpmPackageData | null;
}

const DependencyGraph: React.FC<DependencyGraphProps> = ({ packageData }) => {
  const networkRef = useRef<HTMLDivElement>(null);
  // Fix: Use the more specific VisNetworkInstance type instead of any
  const [networkInstance, setNetworkInstance] = useState<VisNetworkInstance | null>(null);

  useEffect(() => {
    // Check if vis is defined and the container exists
    if (!networkRef.current || !packageData || typeof vis === 'undefined' || !vis.DataSet || !vis.Network) {
      return;
    }

    // Fix: Use the new typed vis.DataSet constructor
    const nodes = new vis.DataSet<VisNode>();
    const edges = new vis.DataSet<VisEdge>();

    // Add main package as a node
    nodes.add({ id: packageData.name, label: `${packageData.name}\nv${packageData.version}`, group: 'main' });

    // Add dependencies and create edges
    const addDependencies = (deps: { [key: string]: string } | undefined, type: 'dep' | 'devDep') => {
      if (deps) {
        Object.entries(deps).forEach(([depName, depVersion]) => {
          // Check if node already exists before adding to prevent duplicates if a package is both dep and devDep
          if (!nodes.get(depName)) {
            nodes.add({ id: depName, label: `${depName}\n${depVersion}`, group: type });
          }
          edges.add({ from: packageData.name, to: depName, arrows: 'to', dashes: type === 'devDep' });
        });
      }
    };

    addDependencies(packageData.dependencies, 'dep');
    addDependencies(packageData.devDependencies, 'devDep');

    const data = { nodes, edges };
    const options: VisNetworkOptions = { // Explicitly type options
      layout: {
        hierarchical: {
          direction: 'UD', // Up-Down
          sortMethod: 'hubsize',
          levelSeparation: 150,
          treeSpacing: 200,
        },
      },
      nodes: {
        shape: 'box', // Using box shape for all nodes for consistent premium look
        size: 20,
        font: {
          size: 12,
          color: '#333',
          multi: 'html', // Allow HTML in labels for line breaks
        },
        borderWidth: 1,
        color: {
          border: '#ccc',
          background: '#fff',
          highlight: {
            border: '#2B7CE9',
            background: '#D2E5FF',
          },
          hover: {
            border: '#2B7CE9',
            background: '#D2E5FF',
          },
        },
        margin: 10, // Added margin for text inside boxes
      },
      edges: {
        width: 1,
        color: {
          color: '#848484',
          highlight: '#848484',
          hover: '#848484',
          inherit: 'from',
          opacity: 0.8,
        },
        smooth: {
          type: 'cubicBezier',
          forceDirection: 'vertical',
          roundness: 0.4,
        },
      },
      groups: {
        main: {
          color: { background: '#E0F2F7', border: '#4FC3F7' }, // Lighter blue for main package
          font: { color: '#2C3E50', bold: true, size: 14 },
          shadow: { enabled: true, color: 'rgba(0,0,0,0.1)', size: 8, x: 2, y: 2 } // Subtle shadow for main node
        },
        dep: {
          color: { background: '#E6F4EA', border: '#66BB6A' }, // Lighter green for production dependencies
          font: { color: '#2C3E50' },
        },
        devDep: {
          color: { background: '#FFFDE7', border: '#FFD54F' }, // Lighter yellow for dev dependencies
          font: { color: '#2C3E50' },
          // Fix: Removed 'dashes' from group definition as it's an edge property, not a node property.
          // The edges.add already handles dashes for 'devDep' type.
        },
      },
      interaction: {
        hover: true,
        tooltipDelay: 100,
        zoomView: true,
        dragView: true,
      },
      physics: {
        enabled: true,
        solver: 'hierarchicalRepulsion',
        hierarchicalRepulsion: {
          nodeDistance: 120,
          centralGravity: 0.5,
          springLength: 200,
          springConstant: 0.05,
          avoidOverlap: 1,
        },
      },
    };

    const newNetworkInstance = new vis.Network(networkRef.current, data, options);
    setNetworkInstance(newNetworkInstance);

    return () => {
      if (newNetworkInstance) { // Use the instance created in this specific effect run
        newNetworkInstance.destroy();
      }
    };
  }, [packageData]); // Only re-run if packageData changes

  return (
    <div className="bg-white p-6 rounded-lg border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
        <svg className="w-6 h-6 mr-2 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"></path></svg>
        Dependency Graph
      </h3>
      <div ref={networkRef} className="w-full" style={{ height: '400px', border: '1px solid #eee', borderRadius: '4px' }}></div>
      <p className="text-sm text-gray-500 mt-4">
        Main package is light blue, production dependencies are light green, development dependencies are light yellow with dashed connections. Hover to see details.
      </p>
    </div>
  );
};

export default DependencyGraph;