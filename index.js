#!/usr/bin/env node

const fs = require("fs-extra");
const path = require("path");
const xmlWriter = require("./url-rules-writer");
var archiver = require('archiver');

const appPath = process.cwd();

console.log('----- Angular JavaEE Configurator ----- ');

console.log('Looking for all ts files');
const filePaths = [];

function fromDir(startPath, filter) {

  if (!fs.existsSync(startPath)) {
    console.log("no dir ", startPath);
    return;
  }

  var files = fs.readdirSync(startPath);
  for (var i = 0; i < files.length; i++) {
    var filename = path.join(startPath, files[i]);
    var stat = fs.lstatSync(filename);
    if (stat.isDirectory()) {
      fromDir(filename, filter); //recursive
    } else if (filename.indexOf(filter) >= 0) {
      filePaths.push(filename);
    }
  }
}

fromDir(`${appPath}/src`, ".ts");

const findNgPaths = (content) => {
  const result = [];
  const pathRx = /path\s*\:\s*\'([^\']+)\'/g;
  let pathMatch = null;
  while (pathMatch = pathRx.exec(content)) {
    if (pathMatch != null) {
      result.push(pathMatch[1]);
    }
  }
  return result;
}

const findVariable = (varName, fileContent) => {
  const variableRx = new RegExp(`${varName}\\s*(\\:{1}\\s*Routes\\s*)?\\=\\s*([^\\;]+)\\]`);
  const variableMatch = variableRx.exec(fileContent);
  if (variableMatch != null) {
    return variableMatch[2];
  }
  return null;
}

console.log('Looking for RouterModule.forRoot');
let rootPaths = [];
filePaths.forEach(filePath => {
  const content = fs.readFileSync(filePath).toString();
  const rx = /RouterModule\s*\.\s*forRoot\s*\(\s*([^\)]+)\s*\)/g;
  let match = null;
  while (match = rx.exec(content)) {
    if (match != null) {
      console.log(`found on ${filePath}`);

      const routes = match[1].replace(/\/\/.*/g, '').trim();
      
      let ngPaths = findNgPaths(routes);

      if (ngPaths.length === 0) {
        /**
         * Check if it is a variable name
         */
        const variableStr = findVariable(routes, content)
        if (variableStr != null) {
          console.log('Found local variable.')
          ngPaths = findNgPaths(variableStr);
        } else {
          /**
           * Get the variable import
           */
          const importRx = new RegExp(`import\\s+\\{[^\\}]*${routes}[^\\}]*\\}\\s+from\\s+[\\'\\"]{1}([^\\'\\"]+)[\\'\\"]{1}`);
          const importMatch = importRx.exec(content);
          if (importMatch != null) {
            console.log('Found import variable');
            const importPath = path.join(path.dirname(filePath), importMatch[1]) + '.ts';
            const importContent = fs.readFileSync(importPath).toString();
            const importVariable = findVariable(routes, importContent);
            if (importVariable != null) {
              console.log('Found local variable on imported path.')
              ngPaths = findNgPaths(importVariable);
            }
          }
        }
      } else {
        console.log('Found inline paths');
      }

      rootPaths = rootPaths.concat(ngPaths);

    }
  }
});

const ngCli = require(`${appPath}/angular.json`);
const projectKeys = Object.keys(ngCli.projects);
const outFolder = path.join(appPath, ngCli.projects[projectKeys[0]].architect.build.options.outputPath);
const webInfAppFolder = outFolder + '/WEB-INF';
const webInfTool = `${__dirname}/WEB-INF`;

if (rootPaths != null && rootPaths.length !== 0) {
  if (!fs.existsSync(webInfAppFolder)) {
    fs.mkdirSync(webInfAppFolder);
    fs.mkdirSync(`${webInfAppFolder}/classes`);
    fs.mkdirSync(`${webInfAppFolder}/lib`);
  }
  if (!fs.existsSync(`${webInfAppFolder}/web.xml`)) {
    fs.copySync(`${webInfTool}/web.xml`, `${webInfAppFolder}/web.xml`);
  }
  if (!fs.existsSync(`${webInfAppFolder}/lib/urlrewritefilter-4.0.4.jar`)) {
    fs.copySync(`${webInfTool}/lib/urlrewritefilter-4.0.4.jar`, `${webInfAppFolder}/lib/urlrewritefilter-4.0.4.jar`);
  }
  const rules = xmlWriter.urlRules(rootPaths);
  fs.writeFileSync(`${webInfAppFolder}/urlrewrite.xml`, rules);
  const output = fs.createWriteStream(path.basename(appPath) + '.war');
  const archive = archiver('zip');
  output.on('close', () => {
    console.log(archive.pointer() + ' total bytes');
    console.log('archiver has been finalized and the output file descriptor has closed.');
    process.exit();
  });
  archive.on('error', function (err) {
    throw err;
  });
  archive.pipe(output);
  archive.glob(`**/*`, {
    cwd: outFolder
  }, {});
  archive.finalize();
}
