console.time('start');

require('dotenv').config();
const populateDB = require('./populate-db');
const populateJSON = require('./populate-json');

const args = process.argv.slice(2);
try {
  (async function(args) {
    switch (args[0]) {
      case 'db':
        if (args.length < 3) {
          console.error('db sub-command requires [LEVEL] and [BATCH_SIZE] args');
        }
        await populateDB(parseInt(args[1]), args[2]);
        break;
      case 'json':
        if (args < 3) {
          console.error('json sub-command requires [TILES_FILE] [OUTPUT] args');
        }
        await populateJSON(args[1], args[2]);
        break;
      default:
        console.error('Need to specify a sub-command "db" or "json"');
    }
  })(args);
} catch (e) {
  console.error(e);
  process.exit(1);
}


console.timeEnd('start');