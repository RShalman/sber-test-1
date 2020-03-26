const fs = require("fs");
const path = require("path");
const globToRegexp = require("../utils/globToRegexp");

function filesChecker(p, search, ignoreFile = []) {
  // find all files from 'path' + if 'ingore' => NOT from 'ignore'
  // add a string at first line of each file
  // if string exists - don't add

  let ignorePaths = ignoreFile;

  if (ignoreFile.length > 0) {
    ignorePaths = fs
      .readFileSync(ignoreFile, "utf-8")
      .split("\r\n")
      .filter(x => x != "")
      .map(x => globToRegexp(x, { flags: "g" }));
  }

  const searchPattern = globToRegexp(search);

  const directoryPath = path.join(__dirname, p);

  function getFilesFromDir(dir) {
    fs.readdir(dir, "utf-8", function(err, res) {
      // console.log("res", res, dir);
      for (let ending of res) {
        const p = (dir + "/" + ending).replace(/\\/g, "/");

        if (isInIgnore(p, ignorePaths)) return;
        if (isFile(ending)) {
          if (searchPattern.test(p)) {
            // check if firstline string exists ELSE write string
            const checkerString = "/ script was here /\n\n";
            // console.log("e", hasAlreadyCheckedFile(p));
            if (!hasAlreadyCheckedFile(p, checkerString)) {
              writeFile(p, checkerString);
            }

            // console.log("i", p);
          }
          // console.log(p);
          // return p;
        } else {
          getFilesFromDir(p);
        }
      }
    });
  }

  function isInIgnore(str, ignoreList) {
    if (ignoreList.length > 0) {
      for (let el of ignoreList) {
        const t = el.test(str);

        if (t) return t;
      }
    }
  }

  function isFile(str) {
    const fileExtenstionReg = /\.[0-9a-z]+$/;
    return fileExtenstionReg.test(str);
  }

  function hasAlreadyCheckedFile(path, strToCheck) {
    const [firstLine] = fs.readFileSync(path, "utf-8").split("\r\n");
    console.log("l", firstLine, strToCheck.toString());
    return firstLine == strToCheck.toString();
  }

  function writeFile(path, lineToAdd) {
    const data = fs.readFileSync(path);
    const fd = fs.openSync(path, "w+");
    const insert = new Buffer(lineToAdd);
    fs.writeSync(fd, insert, 0, insert.length, 0);
    fs.writeSync(fd, data, 0, data.length, insert.length);
    fs.close(fd, err => {
      if (err) throw err;
    });
  }

  getFilesFromDir(directoryPath);
}

filesChecker("../", "testfiles/**/*.js", ".scriptignore");
