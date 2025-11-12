// components/CommandPalette.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Command {
  id: string;
  name: string;
  icon: React.ReactNode;
  action: () => void;
  keywords?: string[]; // For better search matching
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose, commands }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const paletteRef = useRef<HTMLDivElement>(null);

  const filteredCommands = commands.filter(command =>
    command.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (command.keywords && command.keywords.some(keyword => keyword.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation(); // Prevent App from closing itself if it has a listener
      onClose();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : filteredCommands.length - 1));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < filteredCommands.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    }
  }, [onClose, filteredCommands, selectedIndex]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      inputRef.current?.focus();
      setSearchTerm(''); // Clear search term when opening
      setSelectedIndex(0); // Reset selected index
      document.body.style.overflow = 'hidden'; // Prevent scrolling body when palette is open
    } else {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = ''; // Restore body scrolling
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, handleKeyDown]);

  // Click outside to close
  const handleClickOutside = useCallback((event: MouseEvent) => {
    if (paletteRef.current && !paletteRef.current.contains(event.target as Node)) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, handleClickOutside]);


  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 z-50 flex justify-center items-start pt-16 sm:pt-24">
      <div
        ref={paletteRef}
        className="bg-white rounded-xl border border-gray-200 w-full max-w-xl mx-4 transform transition-all sm:my-8 sm:align-middle"
        role="dialog"
        aria-modal="true"
        aria-labelledby="command-palette-title"
      >
        <div className="relative p-4">
          <label htmlFor="command-search" className="sr-only">Search commands</label>
          <input
            id="command-search"
            ref={inputRef}
            type="text"
            placeholder="Type a command or search..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ul className="max-h-80 overflow-y-auto pb-2">
          {filteredCommands.length > 0 ? (
            filteredCommands.map((command, index) => (
              <li key={command.id}>
                <button
                  onClick={() => { command.action(); onClose(); }}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center w-full text-left px-6 py-3 cursor-pointer transition-colors duration-200
                    ${index === selectedIndex ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50 text-gray-700'}
                  `}
                  role="option"
                  aria-selected={index === selectedIndex}
                >
                  <span className="mr-3 text-gray-500">{command.icon}</span>
                  <span className="text-lg font-medium">{command.name}</span>
                </button>
              </li>
            ))
          ) : (
            <p className="p-6 text-center text-gray-500">No commands found for "{searchTerm}"</p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default CommandPalette;