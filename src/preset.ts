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

const generatePropsFromArgTypes = (argTypes: any): ComponentProp[] => {
  return Object.entries(argTypes).map(([key, value]: [string, any]) => ({
    name: key,
    description: value.description || '',
    type: value.type?.name || 'string',
    isList: value.type?.name === 'array',
    defaultValue: value.defaultValue,
  }));
};

const extractFieldsFromStoryFile = (fileContent: string): { title?: string; argTypes?: any } => {
  const titleMatch = fileContent.match(/title:\s*['"]([^'"]+)['"]/);
  const argTypesMatch = fileContent.match(/argTypes:\s*({[\s\S]*?})/);

  if (argTypesMatch) {
    try {
      // Safely evaluate `argTypes` using the `Function` constructor
      const argTypes = new Function(`return ${argTypesMatch[1]}`)();
      return {
        title: titleMatch ? titleMatch[1] : undefined,
        argTypes,
      };
    } catch (error) {
      console.error('Error evaluating argTypes:', error);
    }
  }

  return {
    title: titleMatch ? titleMatch[1] : undefined,
    argTypes: undefined,
  };
};

const generateJsonFile = () => {
  try {
    const storybookRoot = process.cwd(); // Root directory of the Storybook project
    const storiesGlob = path.join(storybookRoot, 'components/**/*.stories.@(js|jsx|ts|tsx)');
    const outputFilePath = path.join(storybookRoot, 'wmprefab-config.json');

    const components: ComponentConfig[] = [];

    const storyFiles = glob.sync(storiesGlob);
    console.log(`Found ${storyFiles.length} story files.`);

    for (const file of storyFiles) {
      try {
        const fileContent = fs.readFileSync(file, 'utf-8'); // Read the file as plain text
        const { title, argTypes } = extractFieldsFromStoryFile(fileContent);

        if (argTypes) {
          const componentName = path.basename(file, path.extname(file)).toLowerCase();
          const props = generatePropsFromArgTypes(argTypes);

          components.push({
            name: componentName,
            version: '1.0.0',
            displayName: title || componentName,
            baseDir: './components',
            module: `require('./${componentName}/${componentName}').default`,
            include: [`./${componentName}/${componentName}.js`],
            props,
            packages: [],
          });
        } else {
          console.warn(`No argTypes found in story file: ${file}`);
        }
      } catch (error) {
        console.error(`Error processing story file: ${file}`);
        console.error(`File content:\n${fs.readFileSync(file, 'utf-8')}`);
      }
    }

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
