const fs = require("fs");
const path = require("path");
const globToRegexp = require("../utils/globToRegexp");

function filesChecker(p, search, ignoreFile = []) {
  let ignorePaths = ignoreFile;

  if (ignoreFile.length > 0) {
    ignorePaths = fs
      .readFileSync(ignoreFile, "utf-8")
      .split("\r\n")
      .filter(x => x != "")
      .map(x => globToRegexp(x, { flags: "g" }));
  }

  const searchPattern = globToRegexp(search, { flags: "g" });

  const directoryPath = path.join(__dirname, p);

  function getFilesFromDir(dir) {
    fs.readdir(dir, "utf-8", function(err, res) {
      if (res) {
        for (let ending of res) {
          const p = (dir + "/" + ending).replace(/\\/g, "/");

          if (!isInIgnore(p, ignorePaths)) {
            if (isFile(ending) && p.match(searchPattern)) {
              const checkerString = "/ script was here /\n\n";

              if (!hasAlreadyCheckedFile(p, checkerString)) {
                writeFile(p, checkerString);
              }
            } else {
              getFilesFromDir(p);
            }
          }
        }
      }
    });
  }

  function isInIgnore(str, ignoreList) {
    if (ignoreList.length > 0) {
      for (let el of ignoreList) {
        const t = str.match(el);

        if (t) return t;
      }
    }
  }

  function isFile(str) {
    const fileExtenstionReg = /\.[0-9a-z]+$/;
    return str.match(fileExtenstionReg);
  }

  function hasAlreadyCheckedFile(path, strToCheck) {
    const [firstLine] = fs.readFileSync(path, "utf-8").split("\r\n");
    const re = globToRegexp(strToCheck.toString(), {
      specialOption: "start"
    });

    return firstLine.match(re) != null;
  }

  function writeFile(path, lineToAdd) {
    const data = fs
      .readFileSync(path)
      .toString()
      .split("\n");
    data.splice(0, 0, lineToAdd);
    const text = data.join("\n");

    fs.writeFileSync(path, text);
  }

  getFilesFromDir(directoryPath);
}

filesChecker("../", "testfiles/**/*.js", ".scriptignore");
