import * as fs from "fs";
import * as path from "path";
import glob from "glob";

interface ArgType {
  type?: { name: string };
  description?: string;
  defaultValue?: any;
}

interface ComponentProp {
  name: string;
  type: string;
  description: string;
  defaultValue: any;
}

interface Component {
  name: string;
  version: string;
  displayName: string;
  baseDir: string;
  module: string;
  include: string[];
  props: ComponentProp[];
  packages: any[];
}

const generateJsonFile = async (): Promise<void> => {
  try {
    const storybookRoot = process.cwd(); // Root directory of the Storybook project
    const storiesGlob = path.join(
      storybookRoot,
      "components/**/*.stories.@(js|jsx|ts|tsx)"
    );
    const outputFilePath = path.join(storybookRoot, "wmprefab-config.json");

    const components: Component[] = [];

    // Find all story files
    const storyFiles = glob.sync(storiesGlob);
    console.log(`Found ${storyFiles.length} story files.`);

    for (const file of storyFiles) {
      console.log(`Processing file: ${file}`);
      const componentName = path
        .basename(file, path.extname(file))
        .toLowerCase();
      console.log(`Component name: ${componentName}`);

      try {
        // Convert the file path to a valid file:// URL
        const fileUrl = `file://${path.resolve(file)}`;
        console.log(`File URL: ${fileUrl}`);

        // Dynamically import the story file
        const storyModule = await import(fileUrl);
        console.log(`Imported module:`, storyModule);

        // Access the metadata (default export) and extract argTypes
        const meta = storyModule.default || {};
        const argTypes: Record<string, ArgType> = meta.argTypes || {};

        console.log(`Extracted argTypes for ${componentName}:`, argTypes);

        // Convert argTypes to the `props` structure
        const props: ComponentProp[] = Object.entries(argTypes).map(
          ([key, value]) => ({
            name: key,
            type: value.type?.name || "string", // Default type is `string`
            description: value.description || "",
            defaultValue: value.defaultValue || null,
          })
        );

        components.push({
          name: componentName,
          version: "1.0.0",
          displayName: componentName,
          baseDir: "./components",
          module: `require('./${componentName}/${componentName}').default`,
          include: [`./${componentName}/${componentName}.js`],
          props,
          packages: [],
        });
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }

    // Write to JSON file
    const jsonData = { components };
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2));
    console.log(`Generated JSON file at: ${outputFilePath}`);
  } catch (error) {
    console.error("Error generating wmprefab-config.json:", error);
  }
};

// Execute the script if run directly
if (require.main === module) {
  generateJsonFile();
}
