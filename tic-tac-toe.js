let board=[],turn='X',scores={X:0,O:0},ended=false,cpuThinking=false,cpuTimer=null;
const boardElement=document.querySelector('#ttt-board'),modeElement=document.querySelector('#game-mode');
const lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
document.querySelector('#reset').onclick=resetGame;
modeElement.onchange=()=>{scores={X:0,O:0};resetGame()};

function resetGame(){
  clearTimeout(cpuTimer);board=Array(9).fill('');turn='X';ended=false;cpuThinking=false;boardElement.innerHTML='';
  for(let i=0;i<9;i++){const cell=document.createElement('button');cell.className='ttt-cell';cell.setAttribute('aria-label','Cell '+(i+1));cell.onclick=()=>move(i);boardElement.appendChild(cell)}
  updateScoreLabels();setStatus('X',modeElement.value==='cpu'?'You are X. Your move.':'Your move');renderBoard();
}

function updateScoreLabels(){
  document.querySelector('#x-label').textContent=modeElement.value==='cpu'?'PLAYER WINS':'X WINS';
  document.querySelector('#o-label').textContent=modeElement.value==='cpu'?'CPU WINS':'O WINS';
}

function setStatus(next,message){document.querySelector('#ttt-turn').textContent=next;document.querySelector('#ttt-message').textContent=message;document.querySelector('#x-score').textContent=scores.X;document.querySelector('#o-score').textContent=scores.O}

function renderBoard(){
  [...boardElement.children].forEach((cell,index)=>{cell.textContent=board[index];cell.classList.toggle('x',board[index]==='X');cell.classList.toggle('o',board[index]==='O');cell.disabled=ended||cpuThinking||Boolean(board[index])});
}

function move(index){
  if(board[index]||ended||cpuThinking||(modeElement.value==='cpu'&&turn==='O'))return;
  placeMove(index);
}

function placeMove(index){
  board[index]=turn;renderBoard();
  const win=lines.find(line=>line.every(i=>board[i]===turn));
  if(win){ended=true;scores[turn]++;if(modeElement.value==='player'||turn==='X')PixelRewards.earn(8,'TIC-TAC-TOE WIN');win.forEach(i=>boardElement.children[i].style.borderColor='#d7ff38');renderBoard();setStatus(turn,(modeElement.value==='cpu'?(turn==='X'?'Player':'CPU'):turn)+' takes the round!');return}
  if(board.every(Boolean)){ended=true;renderBoard();setStatus('—','Draw game');return}
  turn=turn==='X'?'O':'X';
  if(modeElement.value==='cpu'&&turn==='O')startCpuTurn();else setStatus(turn,'Your move');
}

function findTacticalMove(mark){
  for(const line of lines){const open=line.filter(i=>!board[i]),marked=line.filter(i=>board[i]===mark);if(marked.length===2&&open.length===1)return open[0]}
  return null;
}

function chooseCpuMove(){
  const winning=findTacticalMove('O');if(winning!==null)return winning;
  const blocking=findTacticalMove('X');if(blocking!==null)return blocking;
  if(!board[4])return 4;
  const corners=[0,2,6,8].filter(i=>!board[i]);if(corners.length)return corners[Math.floor(Math.random()*corners.length)];
  const open=board.map((value,index)=>value?'':index).filter(value=>value!=='');return open[Math.floor(Math.random()*open.length)];
}

function startCpuTurn(){
  cpuThinking=true;renderBoard();setStatus('O','CPU is choosing a move…');
  cpuTimer=setTimeout(()=>{if(ended||modeElement.value!=='cpu')return;cpuThinking=false;placeMove(chooseCpuMove())},450);
}

resetGame();
