const fs = require("fs");
const path = require("path");

// Define source and destination directories
const sourceDir = path.join(__dirname, "../../build/prefab"); // Source directory
const destinationDir = path.join(__dirname, "../../public/prefabs"); // Destination directory for static files
const fileListPath = path.join(__dirname, "../../public/prefab-file-list.json");
// Ensure destination directory exists
if (!fs.existsSync(destinationDir)) { 
  fs.mkdirSync(destinationDir, { recursive: true });
}

const copyZipFilesAndGenerateList = (source, destination) => {
  const zipFiles = []; // Collect .zip file paths

  // Read all files in the source directory
  fs.readdirSync(source).forEach((file) => {
    const fullPath = path.join(source, file);

    if (fs.lstatSync(fullPath).isDirectory()) {
      // Recursively handle subdirectories
      zipFiles.push(...copyZipFilesAndGenerateList(fullPath, destination)); // Collect zip file paths from subdirectories
    } else if (file.endsWith(".zip")) {
      // Copy only .zip files to the destination
      const relativePath = path.relative(sourceDir, fullPath); // Preserve relative structure
      const destinationPath = path.join(destination, relativePath);

      fs.mkdirSync(path.dirname(destinationPath), { recursive: true }); // Ensure destination subdirectory exists
      fs.copyFileSync(fullPath, destinationPath); // Copy the file
      console.log(`Copied: ${relativePath}`);
      zipFiles.push(relativePath); // Add the relative path to the list
    }
  });

  return zipFiles;
};

try {
  // Generate the file list and copy .zip files
  const zipFiles = copyZipFilesAndGenerateList(sourceDir, destinationDir);

  // Write the list of .zip files to prefab-file-list.json
  fs.writeFileSync(fileListPath, JSON.stringify(zipFiles, null, 2));
  console.log(`File list generated at: ${fileListPath}`);
  console.log("All .zip files copied to:", destinationDir);
} catch (err) {
  console.error("Error processing .zip files:", err);
}
