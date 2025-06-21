import React from 'react';
import { Github, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="w-full mt-auto py-6 border-t border-purple-500/20 text-sm text-gray-400 animate-fade-in">
      <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-center sm:text-left px-4 gap-4">
        <p className="transition-all duration-300 hover:text-white">
          © 2025 Aarav Kohli. All rights reserved.
        </p>
        <div className="flex items-center gap-4">
          <a
            href="https://github.com/aaravkohli"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-white hover:scale-110 transition-transform duration-300"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
          <a
            href="https://linkedin.com/in/aaravkohli"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-white hover:scale-110 transition-transform duration-300"
          >
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
