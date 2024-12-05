import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

const extractArgTypes = (fileContent: string) => {
  // Extract the argTypes block with regex
console.log("fileContent",fileContent);

  const argTypesMatch = fileContent.match(/argTypes:\s*{([\s\S]*?)}/);

  console.log("argTypesMatch", argTypesMatch);

  if (argTypesMatch) {
    try {
      // Manually process the argTypes block
      const argTypesString = `{${argTypesMatch[1]}}`;

      // Safely interpret the argTypes as an object
      const argTypes = eval(`(${argTypesString})`);
      return argTypes;
    } catch (error) {
      console.error('Error evaluating argTypes:', error);
    }
  }
  return null; // Return null if argTypes not found
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
      console.log(`Processing file: ${file}`);
      const componentName = path.basename(file, path.extname(file)).toLowerCase();
          console.log(`Component name: ${componentName}`);
      // Extract argTypes from the file content
      const argTypes = extractArgTypes(fileContent);
        console.log(`argTypes: ${argTypes}`);
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
