const { Client } = require('pg');
const Cursor = require('pg-cursor');
const h3 = require('h3-js');

function simplifyPoints(points, eps) {
  let dmax = 0;
  let indexMax = 0;
  for (let i = 1; i < points.length -2; i++) {
    const dFromLine = points[i]
  }
}

async function generateLevel(client, level, batchSize) {
  let levelMap = {};

  const cursor = await client.query(new Cursor(`SELECT region, h3 FROM tiles WHERE level='${level}';`));
  let total = 0;
  for (let rows = await cursor.read(batchSize); rows.length > 0; rows = await cursor.read(batchSize)) {
    total += rows.length;
    console.log('rows:', total);
    rows.forEach(row => {
      if (row.region in levelMap) {
        levelMap[row.region].push(row.h3);
      } else {
        levelMap[row.region] = [row.h3];
      }
    });
  }

  cursor.close();
  return levelMap;
}

module.exports = async function populateDB(level, batchSize) {
  console.log('level:', level, 'batch size:', batchSize)
  console.time('start');
  const client = new Client();
  await client.connect();

  client.query(`
    CREATE TABLE IF NOT EXISTS geojson (
      level int,
      region text,
      geojson json,
      PRIMARY KEY (level, region)
    );
  `);

  try {
    let count = 0;
    let values = '';
    const levelMap = await generateLevel(client, level, batchSize);
    const mapSize = Object.keys(levelMap).length;
    for (const region in levelMap) {
      const geojson = h3.cellsToMultiPolygon(levelMap[region], true);
      values += `(${level}, '${region}', '${JSON.stringify(geojson)}'),`;
      count++;
      if (count % batchSize == 0 || count == mapSize) {
        console.log('count:', count);
        values = values.slice(0, -1);
        await client.query(`INSERT INTO geojson (level, region, geojson) VALUES ${values};`);
        values = '';
      }
    }
  } catch (e) {
    console.error(e);
  }
  
  await client.end();
  console.timeEnd('start');
}
