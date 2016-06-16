let checkStartTag = (line, LN) => {
  let result = '';
  let noStartTagStrs = line.match(/(^|[^<])head\s+?[^\s]*?(\s|$)/g);

  if (noStartTagStrs) {
    noStartTagStrs.map((str) => {
      result += '\nno < before ' + str + ' at ' + LN;
    });
  }
  return result;
};

let checkEndTag = (line, LN) => {
  let result = '';
  let noEndTagStrs = line.match(/head\s+?[^>]*?(<|$)/g);

  if (noEndTagStrs) {
    noEndTagStrs.map((str) => {
      result += '\nno > after ' + str + ' at ' + LN;
    });
  }
  return result;
};

let checkSlash = (line, LN) => {
  let result = '';
  let noSlashStrs = line.match(/<head\s+?[^/]*?>/g);

  if (noSlashStrs) {
    noSlashStrs.map((str) => {
      result += '\nno / at the end of ' + str + ' at ' + LN;
    });
  }
  return result;
};

let checkTagContent = (headTags, LN) => {
  let result = '';
  headTags.map((headTag) => {
    let correctTagStr = headTag.match(/<head n=\"\d+?\"( \w+=\"[^"]+?\")*\/>/);
    if (! correctTagStr) {
      result += '\nwrong content in ' + headTag + ' at ' + LN;
    }
  });
  return result;
};

let checkHeadTagFormat = (headLineAndLN) => {
  let result = '';
  let line = headLineAndLN[0], LN = headLineAndLN[1];
  let heads = line.match(/head\s/g);
  let headTags = line.match(/<head\s[^<>]*?\/>/g) || [];
  let headsN = heads.length, headTagsN = headTags.length;

  if (headsN !== headTagsN) {
    result += checkStartTag(line, LN);
    result += checkEndTag(line, LN);
    result += checkSlash(line, LN);
  }
  if (0 !== headTagsN) {
    result += checkTagContent(headTags, LN);
  }
  return result;
};

export default function (headLineAndLineNumbers) {
  let badTagInfos = headLineAndLineNumbers.map(checkHeadTagFormat);
  return '\n' + badTagInfos.join('');
}