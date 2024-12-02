const fs = require("fs");
const path = require("path");
const JSZip = require("jszip");

const publicDir = path.join(__dirname, "../../public");
const buildDir = path.join(__dirname, "../../build/prefab");
const zipFilePath = path.join(publicDir, "prefab.zip");

// Function to generate a ZIP file
const generatePrefabZip = async () => {
  console.log("Generating prefab.zip...");
  const zip = new JSZip();

  const addFilesToZip = (dir, folder = zip) => {
    fs.readdirSync(dir).forEach((file) => {
      const fullPath = path.join(dir, file);
      if (fs.lstatSync(fullPath).isDirectory()) {
        const subFolder = folder.folder(file);
        addFilesToZip(fullPath, subFolder);
      } else {
        folder.file(file, fs.readFileSync(fullPath));
      }
    });
  };

  if (!fs.existsSync(buildDir)) {
    console.error("Prefab build directory not found.");
    return;
  }

  addFilesToZip(buildDir);

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const content = await zip.generateAsync({ type: "nodebuffer" });
  fs.writeFileSync(zipFilePath, content);
  console.log(`Prefab.zip created at ${zipFilePath}`);
};

// Generate ZIP file before Storybook starts
generatePrefabZip().catch((err) => {
  console.error("Failed to generate prefab.zip:", err);
});
