const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babelParser = require('@babel/parser');

const getStoriesFiles = (baseDir) => {

  console.log('baseDir', baseDir);
  return new Promise((resolve, reject) => {
    glob(`${baseDir}/**/*.stories.js`, (err, files) => {

      console.log('files', files);
      if (err) reject(err);
      else resolve(files);
    });
  });
};

const extractMetadata = (code, filePath) => {
  const ast = babelParser.parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'flow', 'typescript'],
  });

  const metadata = {
    name: path.basename(filePath, '.stories.js').toLowerCase(),
    props: [],
  };

  ast.program.body.forEach((node) => {
    if (
      node.type === 'ExportDefaultDeclaration' &&
      node.declaration.type === 'ObjectExpression'
    ) {
      node.declaration.properties.forEach((prop) => {
        if (prop.key.name === 'argTypes') {
          const props = [];
          prop.value.properties.forEach((argProp) => {
            const name = argProp.key.name;
            const details = {};

            argProp.value.properties.forEach((detail) => {
              if (detail.key.name === 'description') {
                details.description = detail.value.value;
              }
              if (detail.key.name === 'defaultValue') {
                details.defaultValue = detail.value.value;
              }
              if (detail.key.name === 'type') {
                details.type = detail.value.properties
                  ? detail.value.properties[0].value.value
                  : 'string';
              }
            });

            props.push({
              name,
              ...details,
            });
          });
          metadata.props = props;
        }
      });
    }
  });

  return metadata;
};

const generatePrefabConfig = async () => {
  const baseDir = path.resolve(process.cwd(), './src'); // Resolve from the project's root
  console.log('baseDir', baseDir);
  const outputPath = path.resolve(process.cwd(), './wmprefabconfig.json'); // Output location
   console.log('outputPath', outputPath);
  try {
    const storiesFiles = await getStoriesFiles(baseDir);
    const components = [];

    for (const file of storiesFiles) {
      const code = fs.readFileSync(file, 'utf-8');
      const metadata = extractMetadata(code, file);
      components.push({
        name: metadata.name,
        version: '1.0.0',
        displayName: metadata.name.replace(/-/g, ' ').toUpperCase(),
        baseDir: './components',
        module: `require('./${metadata.name}/${metadata.name}').default`,
        include: [`./${metadata.name}/${metadata.name}.js`],
        props: metadata.props,
        packages: [],
      });
    }

    const prefabConfig = { components };
    fs.writeFileSync(outputPath, JSON.stringify(prefabConfig, null, 2));
    console.log(`wmprefabconfig.json generated at ${outputPath}`);
  } catch (error) {
    console.error('Error generating wmprefabconfig.json:', error);
  }
};

generatePrefabConfig();
