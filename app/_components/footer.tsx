import React from 'react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#1e1e1e] text-white py-4">
      <div className="container mx-auto text-center">
        <p>&copy; {currentYear} MysticalWizard</p>
      </div>
    </footer>
  );
}