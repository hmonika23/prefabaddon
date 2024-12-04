import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

// Function to generate the JSON file
const generateJsonFile = () => {
  try {
    const storybookRoot = process.cwd(); // Root directory of the Storybook project

    console.log("storybookRoot",storybookRoot);
    const storiesGlob = path.join(storybookRoot, 'components/**/*.stories.@(js|jsx|ts|tsx)');

    console.log("storiesGlob", storiesGlob);
    const outputFilePath = path.join(storybookRoot, 'wmprefab-config.json');
      console.log("outputFilePath", outputFilePath);

    const components: Array<any> = [];

    // Find all story files
    const storyFiles = glob.sync(storiesGlob);
    console.log(`Found ${storyFiles.length} story files.`);

    for (const file of storyFiles) {
      const componentName = path.basename(file, path.extname(file)).toLowerCase();
      components.push({
        name: componentName,
        version: '1.0.0',
        displayName: componentName,
        baseDir: './components',
        module: `require('./${componentName}/${componentName}').default`,
        include: [`./${componentName}/${componentName}.js`],
        props: [
          {
            name: 'exampleProp',
            type: 'string',
            defaultValue: 'exampleValue',
          },
        ],
        packages: [],
      });
    }

    // Write to JSON file
    const jsonData = { components };
    console.log("jsonData", jsonData);
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
