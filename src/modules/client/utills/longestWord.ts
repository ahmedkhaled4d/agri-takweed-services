export function longestWord(string: string) {
  const str = string.split(/[.'!?",;\s]+/);
  const word: Array<string> = [];
  for (let i = 0; i < str.length - 1; i++) {
    if (4 < str[i].length) {
      word.push(str[i]);
    }
  }
  word.sort(function (a, b) {
    return b.length - a.length;
  });
  return [word[0], word[1], word[2], word[3], word[4]];
}

export default { longestWord };
