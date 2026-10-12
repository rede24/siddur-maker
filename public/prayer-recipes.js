import {group,ref,when} from './block-engine.js';
// A recipe contains references to reusable groups, never page ranges or image cuts.
export const prayerRecipes={
  shacharit:group('shacharit','שחרית',[
    ref('morning-opening'),ref('after-amidah'),
    when({not:{field:'hallel',eq:'none'}},ref('hallel')),
    when('hoshanot',ref('hoshanot')),
    when('musaf',ref('musaf-morning-ending'),ref('weekday-morning-ending'))
  ]),
  mincha:group('mincha','מנחה',[
    ref('mincha-korbanot'),ref('mincha-ashrei-amidah'),ref('mincha-ending')
  ]),
  maariv:group('maariv','ערבית',[ref('maariv-weekday'),when('omer',ref('omer'))]),
  birkat:group('birkat','ברכת המזון',[ref('birkat-hamazon')])
};

