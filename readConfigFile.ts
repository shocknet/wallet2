const { spawn } = require('child_process');
const fs = require('fs');
const ejs = require('ejs');
const yaml = require('js-yaml');

require('dotenv').config({
  path: '.env.development'
});

const configTemplate = fs.readFileSync('config.yaml', 'utf8');
const configString = ejs.render(configTemplate);

try {
  const config = yaml.load(configString, 'utf-8');
  fs.writeFileSync('tmp-config.yaml', JSON.stringify(config, null, 2));
  console.log(config);
} catch (e) {
  console.log(e);
}

// // Replace 'ls' with the command you want to run
const childProcess = spawn('sh', ['-c', 'echo "y" | npm run cap-config']);

childProcess.stdout.on('data', (data) => {
  console.log(`stdout: ${data}`);
});

childProcess.stderr.on('data', (data) => {
  console.error(`stderr: ${data}`);
});

childProcess.on('close', (code) => {
  console.log(`child process exited with code ${code}`);
  
  // Delete the tmp-config.yaml file
  fs.unlink('tmp-config.yaml', (err) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log('tmp-config.yaml has been deleted');
  });
});