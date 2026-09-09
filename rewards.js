const PixelRewards=(()=>{
  const STORAGE_KEY='pixel-party-rewards-v1';
  const starterItems=['ttt-classic','chess-classic','pieces-classic','bike-classic'];
  const defaults={points:0,owned:starterItems,equipped:{chessTheme:'classic',chessPieces:'classic',tttTheme:'classic',bikeDesign:'classic'}};
  const catalog=[
    {id:'ttt-classic',name:'Classic Grid',game:'Tic-Tac-Toe',type:'tttTheme',value:'classic',cost:0,description:'The original Pixel Party layout.'},
    {id:'ttt-neon',name:'Neon Grid',game:'Tic-Tac-Toe',type:'tttTheme',value:'neon',cost:30,description:'Electric cyan and violet board.'},
    {id:'ttt-sunset',name:'Sunset Grid',game:'Tic-Tac-Toe',type:'tttTheme',value:'sunset',cost:45,description:'Warm orange and pink layout.'},
    {id:'chess-classic',name:'Classic Board',game:'Chess',type:'chessTheme',value:'classic',cost:0,description:'The original green chessboard.'},
    {id:'pieces-classic',name:'Classic Pieces',game:'Chess',type:'chessPieces',value:'classic',cost:0,description:'Traditional black and white pieces.'},
    {id:'chess-royal',name:'Royal Board',game:'Chess',type:'chessTheme',value:'royal',cost:40,description:'Purple and gold chess squares.'},
    {id:'chess-ice',name:'Ice Board',game:'Chess',type:'chessTheme',value:'ice',cost:55,description:'Crisp arctic blue chessboard.'},
    {id:'pieces-gold',name:'Golden Army',game:'Chess',type:'chessPieces',value:'gold',cost:55,description:'Gold and bronze chess pieces.'},
    {id:'pieces-candy',name:'Candy Pieces',game:'Chess',type:'chessPieces',value:'candy',cost:70,description:'Pink and cyan opposing pieces.'},
    {id:'bike-classic',name:'Classic Bike',game:'Vex X3M 3',type:'bikeDesign',value:'classic',cost:0,description:'The original acid-green motorcycle.'},
    {id:'bike-ghost',name:'Ghost Rider',game:'Vex X3M 3',type:'bikeDesign',value:'ghost',cost:50,description:'Icy white and cyan motorcycle.'},
    {id:'bike-inferno',name:'Inferno Bike',game:'Vex X3M 3',type:'bikeDesign',value:'inferno',cost:65,description:'Hot red and gold motorcycle.'}
  ];

  function load(){
    try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));const owned=Array.isArray(saved?.owned)?saved.owned:[];return{...defaults,...saved,owned:[...new Set([...starterItems,...owned])],equipped:{...defaults.equipped,...saved?.equipped}}}catch{return{...defaults,owned:[...starterItems],equipped:{...defaults.equipped}}}
  }
  let state=load();
  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));renderBalance();applyCosmetics();window.dispatchEvent(new CustomEvent('pixel-rewards-change',{detail:getState()}))}
  function getState(){return JSON.parse(JSON.stringify(state))}
  function renderBalance(){document.querySelectorAll('[data-points]').forEach(node=>node.textContent=state.points)}
  function notify(text){const toast=document.createElement('div');toast.className='reward-toast';toast.textContent=text;document.body.appendChild(toast);requestAnimationFrame(()=>toast.classList.add('show'));setTimeout(()=>{toast.classList.remove('show');setTimeout(()=>toast.remove(),250)},1800)}
  function earn(amount,reason){if(!Number.isFinite(amount)||amount<=0)return;state.points+=Math.floor(amount);save();notify('+'+Math.floor(amount)+' POINTS · '+reason)}
  function purchase(id){const item=catalog.find(entry=>entry.id===id);if(!item||state.owned.includes(id))return false;if(state.points<item.cost)return false;state.points-=item.cost;state.owned.push(id);state.equipped[item.type]=item.value;save();notify(item.name+' UNLOCKED');return true}
  function equip(id){const item=catalog.find(entry=>entry.id===id);if(!item||!state.owned.includes(id))return false;state.equipped[item.type]=item.value;save();notify(item.name+' EQUIPPED');return true}
  function equipped(type){return state.equipped[type]||defaults.equipped[type]}
  function applyCosmetics(){const root=document.documentElement;Object.entries(state.equipped).forEach(([type,value])=>root.dataset[type]=value)}
  applyCosmetics();
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',renderBalance);else renderBalance();
  return{catalog,getState,earn,purchase,equip,equipped,renderBalance,applyCosmetics};
})();
