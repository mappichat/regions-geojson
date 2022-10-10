const { URL } = require('url');
const fs = require('fs');
const h3 = require('h3-js');

const INDEX_LENGTH = 15;

function readFile(path) {
  try {
    if (fs.existsSync(path)) {
      return fs.createReadStream(path, { encoding: 'utf8'});
    } else {
      // TODO: get request file
      return null;
    }
  } catch (e) {
    throw e;
  }
}

function nextIndex(stream) { // retrieve next h3 index from stream
  let i = 0;
  let j = 0;
  const findString = `"index":"`;
  do {
    const char = stream.read(1);
    if (i !== findString.length) {
      i = char === findString[i] ? i + 1 : 0;
    }
  } while (i !== findString.length && !stream.readableEnded)
  if (i === findString.length) {
    return stream.read(INDEX_LENGTH);
  }
  return null;
}

function nextTilesArray(stream) { // retrieve next tiles array from stream
  let arrayString = '[';
  let char = '';
  while (!stream.readableEnded) {
    if (stream.read(1) === '[') {
      console.log("]");
      break;
    }
  }
  while (!stream.readableEnded) {
    char = stream.read(1);
    arrayString += char;
    if (char === ']') {
      break;
    }
  }
  return JSON.parse(arrayString);
}

async function populateJSON(path, output) {
  try {
    const geojsonObj = {};
    const stream = readFile(path);
    let index = '';
    let i = 0;
    stream.on('readable', () => {
      while (!stream.readableEnded) {
        index = nextIndex(stream);
        geojsonObj[index] = h3.cellsToMultiPolygon(nextTilesArray(stream), true);
        console.log(index, geojsonObj[index]);
      }
    });
    fs.writeFileSync(output, JSON.stringify(geojsonObj));
  } catch (e) {
    console.error(e);
  }
}

module.exports = populateJSON;
