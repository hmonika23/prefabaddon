const fs = require("fs");
const path = require("path");

const prefabDir = path.join(__dirname, ".storybook/prefab");
const outputPath = path.join(__dirname, ".storybook/prefab-file-list.json");

const getAllFiles = (dir, prefix = "") => {
  const files = [];
  fs.readdirSync(dir).forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      files.push(...getAllFiles(fullPath, `${prefix}${file}/`));
    } else {
      files.push(`${prefix}${file}`);
    }
  });
  return files;
};

try {
  const fileList = getAllFiles(prefabDir);
  fs.writeFileSync(outputPath, JSON.stringify(fileList, null, 2));
  console.log("File list generated:", outputPath);
} catch (err) {
  console.error("Error generating file list:", err);
}
