import {resolveBlocks,flattenBlocks} from './block-engine.js';
import {blockCatalog} from './block-catalog.js';
import {prayerRecipes} from './prayer-recipes.js';

export function composePrayerTree(service,plan) {
  const recipe=prayerRecipes[service];
  if(!recipe)throw new Error(`Unknown prayer: ${service}`);
  if(plan.unavailable)return {...recipe,children:[]};
  return resolveBlocks(recipe,blockCatalog,{...plan,hoshanotDay:plan.h.day-14});
}
// Flatten only at the reader boundary; composition stays hierarchical.
export function composePrayer(service,plan) {
  return flattenBlocks(composePrayerTree(service,plan));
}
export {flattenBlocks,blockIndex} from './block-engine.js';

export function guidance(plan,service) {
  if(plan.unavailable)return ['היום שבת או יום טוב; סדר תפילת חול אינו מתאים.'];
  const items=[];
  if(plan.tenDays)items.push('עשרת ימי תשובה: תוספות העמידה, המלך הקדוש והמלך המשפט');
  if(plan.yaalehVeyavo)items.push('יעלה ויבוא בעמידה ובברכת המזון');
  if(plan.alHanissim)items.push('ועל הנסים בעמידה ובברכת המזון');
  if(plan.season==='geshem')items.push('משיב הרוח ומוריד הגשם');
  if(plan.rainRequest)items.push('ותן טל ומטר לברכה');
  if(plan.fast)items.push(`${plan.fast}: סדר תענית ציבור; עננו ליחיד המתענה במנחה בלבד`);
  if(plan.hallel!=='none'&&service==='shacharit')items.push(plan.hallel==='full'?'הלל שלם':'חצי הלל');
  if(plan.musaf&&service==='shacharit')items.push('מוסף');
  if(plan.hoshanot&&service==='shacharit')items.push('הושענות');
  if(service==='shacharit'||service==='mincha')items.push(plan.noTachanun?'אין אומרים תחנון':plan.longTachanun?'תחנון שני וחמישי':'אומרים תחנון');
  if(plan.ledavid&&service!=='maariv')items.push('לדוד ה׳ אורי');
  if(plan.omer&&service==='maariv')items.push(`ספירת העומר: יום ${plan.omer}, אחרי צאת הכוכבים`);
  if(service==='shacharit'&&plan.h.month==='Elul'&&plan.h.day!==29)items.push('תקיעת שופר אחרי שחרית');
  return items;
}
