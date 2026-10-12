import {page,group,ref,when,choose} from './block-engine.js';

const range=(a,b)=>Array.from({length:b-a+1},(_,i)=>String(a+i));
const pages=ids=>ids.map(id=>ref(`page:${id}`));
const numeric=[...range(6,86),...range(88,94),...range(96,118)];
const fullSourcePages=[...range(246,249),...range(257,265),...range(327,335),...range(341,343)].map(id=>`extra-${id}`);
const assets=[...numeric,...fullSourcePages,...range(1,5).map(id=>`hallel-${id}`)];

export const blockCatalog=Object.fromEntries(assets.map(id=>[`page:${id}`,page(id)]));
const define=(id,title,children)=>{blockCatalog[id]=group(id,title,children);};

define('morning-blessings','ברכות השחר',pages(range(6,11)));
define('morning-introduction','תפילת השחר',pages(range(12,17)));
define('morning-korbanot','קרבנות',pages(range(18,26)));
define('pesukei-dezimra','פסוקי דזמרה',pages(range(27,40)));
define('shema-blessings','ברכות קריאת שמע',pages(range(41,49)));
// Page 61 completes the Amidah (including עושה שלום). It must never be conditional.
define('morning-amidah','שמונה עשרה',pages(range(50,61)));
define('morning-opening','פתיחת שחרית עד העמידה',[
  ...['morning-blessings','morning-introduction','morning-korbanot','pesukei-dezimra','shema-blessings','morning-amidah'].map(ref)
]);

define('after-amidah','סיום העמידה ותחנון',[
  when({not:'noTachanun'},[
    ref('page:62'),when('longTachanun',pages(range(63,70)))
  ])
]);

define('hallel','הלל',[
  ...pages(range(1,5).map(id=>`hallel-${id}`))
]);
define('hoshanot-rabbah','הושענות להושענא רבה',pages(range(327,335).map(id=>`extra-${id}`)));
define('hoshanot-daily','הושענות היום',[
  ...pages(range(327,328).map(id=>`extra-${id}`))
]);
define('hoshanot','הושענות',[
  when({field:'h.day',eq:21},ref('hoshanot-rabbah'),ref('hoshanot-daily'))
]);
define('musaf-rosh-chodesh','מוסף ראש חודש',pages(range(246,249).map(id=>`extra-${id}`)));
define('musaf-festival','מוסף חול המועד',pages(range(257,265).map(id=>`extra-${id}`)));
define('musaf','מוסף',[
  choose('musaf',{roshChodesh:ref('musaf-rosh-chodesh'),festival:ref('musaf-festival')})
]);
define('omer','ספירת העומר',[
  ...pages(range(341,343).map(id=>`extra-${id}`))
]);

// The scanned Siddur prints several daily psalms on the same source pages.
// Keep complete pages and use the minimum span containing today's psalm.
define('song-sun','שיר של יום ראשון',pages(['76','77']));
define('song-mon','שיר של יום שני',pages(['77']));
define('song-tue','שיר של יום שלישי',pages(['77']));
define('song-wed','שיר של יום רביעי',pages(['78']));
define('song-thu','שיר של יום חמישי',pages(['78','79']));
define('song-fri','שיר של יום שישי',pages(['79']));
define('rosh-chodesh-psalm','מזמור ראש חודש',pages(['79','80','81']));
define('ledavid','לדוד ה׳ אורי',pages(['81']));
define('daily-song','שיר של יום',[
  choose('h.weekday',Object.fromEntries(['Sun','Mon','Tue','Wed','Thu','Fri'].map(day=>[day,ref(`song-${day.toLowerCase()}`)])))
]);
define('song-of-day','מזמורי היום',[
  ref('daily-song'),
  when('roshChodesh',ref('rosh-chodesh-psalm')),
  when('ledavid',ref('ledavid'))
]);

define('ashrei-uva','אשרי ובא לציון',[
  ...pages(range(71,76))
]);
define('weekday-ashrei-uva','אשרי ובא לציון',[ref('ashrei-uva')]);
define('weekday-psalms','שיר של יום ומזמורים',[
  ref('daily-song'),
  when('roshChodesh',ref('rosh-chodesh-psalm'),ref('page:81'))
]);
define('closing','סיום התפילה',pages(range(82,86)));

// In a Musaf service the daily psalm and Psalm 27 precede Torah reading;
// Ashrei/Uva Letzion then precede Musaf. Page 81 is repeated after Musaf because
// its lower part begins Ein Kelokeinu, and full-page display is mandatory.
define('musaf-morning-ending','סדר יום שיש בו מוסף',[
  ref('song-of-day'),ref('ashrei-uva'),ref('musaf'),ref('page:81'),ref('closing')
]);
define('weekday-morning-ending','סיום שחרית של חול',[
  ref('weekday-ashrei-uva'),ref('weekday-psalms'),ref('closing')
]);

define('mincha-korbanot','קרבנות מנחה',[
  ...pages(range(19,22))
]);
define('mincha-ashrei-amidah','אשרי ושמונה עשרה',pages(range(96,102)));
define('mincha-ending','סיום מנחה',[
  when('noTachanun',[
    ...pages(['103','105','106'])
  ],pages(range(103,106)))
]);
define('maariv-weekday','ערבית של חול',pages(range(106,118)));
define('birkat-hamazon','ברכת המזון',pages(range(88,94)));

