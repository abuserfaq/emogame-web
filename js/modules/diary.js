// Mood diary
(function(){
const Diary={
  init(){},
  prompts(){ const p=window.EGContent&&EGContent.get('diary'); return p||{prompts:[],moods:[]}; },
  write(S,mood,text){
    const day=new Date().toISOString().slice(0,10);
    S.diary=S.diary||[];
    S.diary.push({day,mood,text:(text||'').slice(0,140),t:Date.now()});
    if(S.diary.length>60) S.diary=S.diary.slice(-60);
    const days=new Set(S.diary.map(e=>e.day)); S.diaryDays=days.size;
    S.mood=Math.min(100,(S.mood|0)+6);
    return true;
  },
};
window.EGDiary=Diary;
EGModules&&EGModules.register('diary',Diary);
})();
