import glob from 'glob';
import fs from 'fs';
import checkHeadTagFormat from './checkHeadTagFormat.js'

let getSpecialLineAndLineNumbers = (text, regex) => {
  let lines = text.split(/\r?\n/);
  let specialLinesAndLN = [];

  lines.map((line, index) => {
    if (line.match(regex)) {
      let lineNumber = 'line' + (index + 1);
      specialLinesAndLN.push([line, lineNumber]);
    }
  });

  return specialLinesAndLN;
};

let getVHeadClassAndLNs = (text, correctTagRegex) => {
  let vHeadLineAndLNs = getSpecialLineAndLineNumbers(text, correctTagRegex);
  let vHeadClassAndLNs = [];

  vHeadLineAndLNs.map((vHeadLineAndLN) => {
    let line = vHeadLineAndLN[0], LN = vHeadLineAndLN[1];
    let headClass = line.replace(correctTagRegex, function(matchStr, matchStr2) {
      vHeadClassAndLNs.push([matchStr2, LN]);
    });
  });

  return vHeadClassAndLNs;
};

let countHeadsByClass = (vHeadClassAndLNs) => {
  let result = '', classifiedTags = {};

  vHeadClassAndLNs.map((vHeadClassAndLN) => {
    let tagClass = 'correct head' + vHeadClassAndLN[0];
    if (classifiedTags[tagClass]) {
      classifiedTags[tagClass] ++;
    }
    else {
      classifiedTags[tagClass] = 1;
    }
  });

  for (let key in classifiedTags) {
    result += '\n' + key + ': ' + classifiedTags[key];
  }

  return result;
};

let checkHeadsOrder = (vHeadClassAndLNs) => {
  let wrongOrder = 0, result = '';

  for (let i = 1; i < vHeadClassAndLNs.length; i++) {
    let thisInfo = vHeadClassAndLNs[i], lastInfo = vHeadClassAndLNs[i - 1];
    let thisClass = Number(thisInfo[0]), lastClass = Number(lastInfo[0]);

    if ((thisClass - lastClass) > 1) {
      let thisLN = thisInfo[1], lastLN = lastInfo[1];
      result += '\nhead' + lastClass + ' at ' + lastLN
                + ' skip to head' + thisClass + ' at ' + thisLN;
      wrongOrder ++;
    }
  }

  if (0 === wrongOrder) {
    result += '\nhead order is correct!';
  }

  return '\n' + result;
};

let checkHeads = (route) => {
  let result = route;
  let text = fs.readFileSync(route, 'utf8');
  let simpleTag = new RegExp(/head\s/g);
  let correctTag = new RegExp(/<head n=\"(\d+?)\"( \w+=\"[^"]+?\")*\/>/g);
  let noSpaceInHeadAndClassN = (text.match(/headn=/g) || []).length;

  let headsN = (text.match(simpleTag) || []).length + noSpaceInHeadAndClassN;

  if (noSpaceInHeadAndClassN) {
    result += '\n\nThere is no space between "head" and "n=" in some tags, '
              + '\neg. <headn="1"/>'
              + '\nPlease search "headn=" in the file and fix it!!!!!\n'
  }

  if (0 === headsN && 0 === noSpaceInHeadAndClassN) {
    result += '\nNo head tag in this file.'
  }
  else {
    let vHeadsN = (text.match(correctTag) || []).length;

    if (0 === vHeadsN) {
      let headLineAndLNs = getSpecialLineAndLineNumbers(text, simpleTag);
      let badHeadTagInfo = checkHeadTagFormat(headLineAndLNs);
      result += '\nTotal heads: ' + headsN + '\nWarning: no correct head tags!'
                + badHeadTagInfo;
    }
    else {
      let vHeadClassAndLNs = getVHeadClassAndLNs(text, correctTag);
      let headsNByClass = countHeadsByClass(vHeadClassAndLNs);
      let headsOrderInfo = checkHeadsOrder(vHeadClassAndLNs);
      result += '\nTotal heads: ' + headsN + '\nCorrect head tags: ' + vHeadsN
                + headsNByClass + headsOrderInfo;

      if (headsN !== vHeadsN) {
      let headLineAndLNs = getSpecialLineAndLineNumbers(text, simpleTag);
      let badHeadTagInfo = checkHeadTagFormat(headLineAndLNs);
      result += badHeadTagInfo;
      }
      else {
        result += '\nAll tag formats are correct!'
      }
    }
  }

  console.log('Check ' + route + ' done')
  return result + '\n\n\n';
}

let routes = glob.sync('./checkingFiles/**/*.*(txt|xml)', {nosort: true});

let checkResults = routes.map(checkHeads);

fs.writeFileSync('./headTagCheckResult.xml', checkResults.join('\n'), 'utf8');