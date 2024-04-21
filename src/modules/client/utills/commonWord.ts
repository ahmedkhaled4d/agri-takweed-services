interface Word {
  word: string;
  count: number;
}

export function mostCommonWord(str: string) {
  const wordsArr = str.split(/[.,:!?\s]+/);
  const wordsObj: Record<string, number> = {};
  wordsArr.map(word => {
    word = word.toLowerCase();
    wordsObj[word] = wordsObj[word] + 1 || 1;
  });
  // loop over them to make word count separate.
  const wordArr: Array<Word> = [];
  for (const word in wordsObj) {
    if (word.length > 5) {
      wordArr.push({
        word: word,
        count: wordsObj[word]
      });
    }
  }
  // sort by separate count. then add the max 3 words in array.
  wordArr.sort(function (a: Word, b: Word) {
    return b.count - a.count;
  });
  // console.log(wordArr)
  // sort by separate count. then add the max 3 words in array.
  return wordArr.map(n => n.word).slice(0, 5);
}

export default { mostCommonWord };
