import * as fs from 'fs';
import * as path from 'path';
import glob from 'glob';

interface ComponentProp {
  name: string;
  description?: string;
  type: string;
  isList?: boolean;
  defaultValue?: any;
}

interface ComponentConfig {
  name: string;
  version: string;
  displayName: string;
  baseDir: string;
  module: string;
  include: string[];
  props: ComponentProp[];
  packages: any[];
}

// Function to parse argTypes and generate props
const generatePropsFromArgTypes = (argTypes: any): ComponentProp[] => {
  return Object.entries(argTypes).map(([key, value]: [string, any]) => ({
    name: key,
    description: value.description || '',
    type: value.type?.name || 'string',
    isList: value.type?.name === 'array',
    defaultValue: value.defaultValue,
  }));
};

// Function to generate the JSON file
const generateJsonFile = () => {
  try {
    const storybookRoot = process.cwd(); // Root directory of the Storybook project

    console.log('storybookRoot:', storybookRoot);

    const storiesGlob = path.join(storybookRoot, 'components/**/*.stories.@(js|jsx|ts|tsx)');
    console.log('storiesGlob:', storiesGlob);

    const outputFilePath = path.join(storybookRoot, 'wmprefab-config.json');
    console.log('outputFilePath:', outputFilePath);

    const components: ComponentConfig[] = [];

    // Find all story files
    const storyFiles = glob.sync(storiesGlob);
    console.log(`Found ${storyFiles.length} story files.`);

    for (const file of storyFiles) {
      const storyContent = fs.readFileSync(file, 'utf-8');
      const argTypesMatch = storyContent.match(/argTypes\s*=\s*({[\s\S]*?});/);

      if (argTypesMatch) {
        const argTypesString = argTypesMatch[1];
        const argTypes = eval(`(${argTypesString})`);

        const componentName = path.basename(file, path.extname(file)).toLowerCase();
        const props = generatePropsFromArgTypes(argTypes);

        components.push({
          name: componentName,
          version: '1.0.0',
          displayName: componentName.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          baseDir: './components',
          module: `require('./${componentName}/${componentName}').default`,
          include: [`./${componentName}/${componentName}.js`],
          props,
          packages: [],
        });
      } else {
        console.warn(`No argTypes found in story file: ${file}`);
      }
    }

    // Write to JSON file
    const jsonData = { components };
    console.log('Generated JSON Data:', jsonData);

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
