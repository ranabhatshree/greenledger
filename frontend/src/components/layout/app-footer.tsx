import React from 'react';

export function AppFooter() {
  return (
    <footer className="mt-auto py-4 text-center text-sm text-gray-500 print:hidden">
      <p>&copy; {new Date().getFullYear()} GreenLedger. All rights reserved.</p>
    </footer>
  );
} 