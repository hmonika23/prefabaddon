import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

const extractArgTypes = (fileContent: string) => {
  // Use regex to find the `argTypes` object in the file
  const argTypesMatch = fileContent.match(/argTypes:\s*({[\s\S]*?})/);

  console.log('argTypesMatch',argTypesMatch);
  if (argTypesMatch) {
    const argTypesString = argTypesMatch[1]
      .replace(/(\w+):/g, '"$1":') // Add quotes around keys
      .replace(/: (\w+)/g, ': "$1"'); // Add quotes around non-string values if needed
    try {
      return JSON.parse(argTypesString);
    } catch (error) {
      console.error('Error parsing argTypes:', error);
    }
  }
  return null; // Return null if no argTypes found
};

const generateJsonFile = () => {
  try {
    const storybookRoot = process.cwd(); // Root directory of the Storybook project
    const storiesGlob = path.join(storybookRoot, 'src/**/*.stories.@(js|jsx|ts|tsx)');
    const outputFilePath = path.join(storybookRoot, 'wmprefab-config.json');

    const components: Array<any> = [];

    // Find all story files
    const storyFiles = glob.sync(storiesGlob);
    console.log(`Found ${storyFiles.length} story files.`);

    for (const file of storyFiles) {
      const fileContent = fs.readFileSync(file, 'utf-8');
      const componentName = path.basename(file, path.extname(file)).toLowerCase();

      // Extract argTypes from the file content
      const argTypes = extractArgTypes(fileContent);

      // Convert argTypes to the `props` structure
      const props = argTypes
        ? Object.entries(argTypes).map(([key, value]: [string, any]) => ({
            name: key,
            type: value.type?.name || 'string', // Default type is `string`
            description: value.description || '',
            defaultValue: value.defaultValue || null,
          }))
        : [];

      components.push({
        name: componentName,
        version: '1.0.0',
        displayName: componentName,
        baseDir: './components',
        module: `require('./${componentName}/${componentName}').default`,
        include: [`./${componentName}/${componentName}.js`],
        props,
        packages: [],
      });
    }

    // Write to JSON file
    const jsonData = { components };
    fs.writeFileSync(outputFilePath, JSON.stringify(jsonData, null, 2));
    console.log(`Generated JSON file at: ${outputFilePath}`);
  } catch (error) {
    console.error('Error generating wmprefab-config.json:', error);
  }
};

export const viteFinal = async (config: any) => {
  console.log('This addon is augmenting the Vite config');
  generateJsonFile(); // Generate the JSON file before returning the Vite config
  return config;
};

export const webpackFinal = async (config: any) => {
  console.log('This addon is augmenting the Webpack config');
  generateJsonFile(); // Generate the JSON file before returning the Webpack config
  return config;
};
