
import * as commandLineArgs from 'command-line-args';
import * as glob from 'glob';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from "./utils";
import { CodeGenerator } from "./code-generator";

const COMMAND_OPTS = [
  { name: 'help', alias: 'h', type: Boolean },
  { name: 'force', alias: 'f', type: Boolean },
  { name: 'out', alias: 'o', type: String },
  { name: 'input', alias: 'i', type: String, defaultOption: true }
];

const HELP_MESSAGE =
` USAGE: typetology [ --force | -f ] [ --out | -o (directory) ] [ input file ]

 --force, -f     overwrite file if exists.
 --out, -o       output directory.
`;

async function main() {
  const options = commandLineArgs(COMMAND_OPTS);

  // if no options or input --help, -h option,
  // only print help message and exit
  if (Object.keys(options).length === 0 || options.help === true) {
    return console.log(HELP_MESSAGE);
  }

  // currently not support no output option.
  if (options.out === undefined) {
    throw new Error('Input output directories for generating.');
  }

  const matchFiles = glob.sync(options.input, { ignore: '**/node_modules/**', absolute: true });

  if (matchFiles.length === 0) {
    throw Error('No input files or no match files for bindings.')
  }

  // if output directory does not exist, create it
  if (!fs.existsSync(options.out)) {
    fs.mkdirSync(options.out);
  }

  Promise.all([
    // copy an utility file for the code
    fs.createReadStream(path.join(__dirname, '..', 'src', 'typetology.runtime.ts'))
      .pipe(fs.createWriteStream(path.join(options.out, 'typetology.runtime.ts'))),
    ...matchFiles.map((abiFile => generateCode(abiFile, options.out)))
  ])
    .then(() => console.log('success to generate code!'));
}

function generateCode(abiPath: string, outputDir?: string): Promise<any> {
  const parsedPath = path.parse(abiPath);

  if (!outputDir) {
    outputDir = parsedPath.dir;
  }

  const outputPath = path.join(outputDir, parsedPath.name + '.ts');

  return promisify(fs.readFile, abiPath).then((abi) => {
    const codeGen = new CodeGenerator(parsedPath.name, abi.toString());
    return promisify(fs.writeFile, outputPath, codeGen.generate());
  });
}

main()
  .catch((err) => {
    console.log(err.message);
    process.exit(1);
  });
