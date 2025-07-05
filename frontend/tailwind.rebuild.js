// This is a temporary file to help rebuild your Tailwind setup
console.log("Starting Tailwind CSS rebuild...");
const fs = require('fs');
const { execSync } = require('child_process');

// Clean up existing config files
const filesToDelete = [
  'tailwind.config.js', 
  'tailwind.config.mjs',
  'postcss.config.js',
  'postcss.config.mjs'
];

filesToDelete.forEach(file => {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
      console.log(`Deleted ${file}`);
    }
  } catch (err) {
    console.error(`Error deleting ${file}:`, err);
  }
});

// Create new tailwind config
const tailwindConfig = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

// Create new postcss config
const postcssConfig = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

// Write new config files
fs.writeFileSync('tailwind.config.js', tailwindConfig);
console.log('Created tailwind.config.js');

fs.writeFileSync('postcss.config.js', postcssConfig);
console.log('Created postcss.config.js');

// Check if globals.css exists and update if needed
const globalsCssPath = './app/globals.css';
if (fs.existsSync(globalsCssPath)) {
  let globalsCss = fs.readFileSync(globalsCssPath, 'utf8');
  const tailwindDirectives = '@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n';
  
  // Check if Tailwind directives are already in the file
  if (!globalsCss.includes('@tailwind base') || 
      !globalsCss.includes('@tailwind components') || 
      !globalsCss.includes('@tailwind utilities')) {
    // Add Tailwind directives at the top of the file
    globalsCss = tailwindDirectives + globalsCss;
    fs.writeFileSync(globalsCssPath, globalsCss);
    console.log('Updated globals.css with Tailwind directives');
  } else {
    console.log('globals.css already has Tailwind directives');
  }
} else {
  console.log('Warning: globals.css not found in expected location');
}

console.log("\nRebuild complete. Now please run:");
console.log("npm uninstall tailwindcss postcss autoprefixer @tailwindcss/postcss");
console.log("npm install tailwindcss@3.3.3 postcss@8.4.31 autoprefixer@10.4.16 --save-dev");
console.log("npm run dev");