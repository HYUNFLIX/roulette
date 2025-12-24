class Options {
  useSkills: boolean = true;
  winningRank: number = 0;
  autoRecording: boolean = true;
  showCanvasRankList: boolean = false;  // Use HTML overlay instead
  showCanvasWinner: boolean = true;     // Show winner on canvas during game
}

const options = new Options();
export default options;
