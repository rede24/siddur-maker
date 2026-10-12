import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {page,group,ref,when,choose,resolveBlocks,flattenBlocks,blockIndex} from '../public/block-engine.js';
import {blockCatalog} from '../public/block-catalog.js';
import {prayerRecipes} from '../public/prayer-recipes.js';
import {composePrayerTree,composePrayer} from '../public/prayer-blocks.js';
import {planForPrayer} from '../public/calendar.js';
const at=(date,service='shacharit')=>planForPrayer(new Date(date),service);
test('resolved Shacharit retains primitive, group, and nested group levels',()=>{
  const tree=composePrayerTree('shacharit',at('2026-10-02T09:00:00Z'));
  const opening=tree.children.find(node=>node.id==='morning-opening');
  assert.equal(opening.type,'group');
  assert.equal(opening.children[0].id,'morning-blessings');
  assert.equal(opening.children[0].children[0].type,'image');
  const amidah=opening.children.find(node=>node.id==='morning-amidah');
  assert.equal(amidah.children.at(-1).id,'61');
  const ending=tree.children.find(node=>node.id==='musaf-morning-ending');
  assert.ok(ending.children.some(node=>node.id==='musaf'));
  assert.ok(ending.children.find(node=>node.id==='musaf').children.some(node=>node.id==='musaf-festival'));
});
test('serialized catalogs and recipes resolve without executable catalog functions',()=>{
  const plan=at('2026-10-02T09:00:00Z');
  const catalog=JSON.parse(JSON.stringify(blockCatalog)),recipe=JSON.parse(JSON.stringify(prayerRecipes.shacharit));
  assert.deepEqual(resolveBlocks(recipe,catalog,{...plan,hoshanotDay:7}),composePrayerTree('shacharit',plan));
});
test('a shared group can be nested and reused without mutation',()=>{
  const catalog={shared:group('shared','shared',[page('6')])};
  const recipe=group('prayer','prayer',[ref('shared'),group('nested','nested',[ref('shared')])]);
  const tree=resolveBlocks(recipe,catalog,{});
  assert.deepEqual(flattenBlocks(tree).map(node=>node.id),['6','6']);
  tree.children[0].children[0].id='changed';
  assert.equal(tree.children[1].children[0].children[0].id,'6');
  assert.equal(catalog.shared.children[0].id,'6');
});
test('missing references and recursive groups fail explicitly',()=>{
  assert.throws(()=>resolveBlocks(group('root','',[ref('missing')]),{},{}),/Unknown block/);
  assert.throws(()=>resolveBlocks(ref('a'),{a:group('a','',[ref('b')]),b:group('b','',[ref('a')])},{}),/Cyclic block/);
});
test('all catalog branches reference existing blocks and contain no cycles',()=>{
  function scan(node,stack=[]) {
    if(Array.isArray(node)){node.forEach(item=>scan(item,stack));return;}
    if(node.type==='ref'){
      assert.ok(Object.hasOwn(blockCatalog,node.ref),node.ref);
      assert.ok(!stack.includes(node.ref),stack.join(' -> '));
      scan(blockCatalog[node.ref],[...stack,node.ref]);return;
    }
    if(node.type==='group')scan(node.children,stack);
    if(node.type==='when'){scan(node.then,stack);scan(node.otherwise,stack);}
    if(node.type==='choose'){Object.values(node.cases).forEach(item=>scan(item,stack));scan(node.fallback,stack);}
  }
  Object.values(prayerRecipes).forEach(recipe=>scan(recipe));
  Object.values(blockCatalog).forEach(block=>scan(block));
});
test('conditions resolve at any nesting level and empty groups disappear',()=>{
  const recipe=group('root','',[
    group('optional','',[when('enabled',page('6'))]),
    choose('variant',{first:group('chosen','',[page('7')])},page('8'))
  ]);
  assert.deepEqual(flattenBlocks(resolveBlocks(recipe,{},{})).map(node=>node.id),['8']);
  assert.deepEqual(flattenBlocks(resolveBlocks(recipe,{},{enabled:true,variant:'first'})).map(node=>node.id),['6','7']);
});
test('section anchors resolve to correct reader positions after conditional insertions',()=>{
  const tree=composePrayerTree('shacharit',at('2026-10-02T09:00:00Z'));
  const pages=flattenBlocks(tree);
  assert.equal(pages[blockIndex(tree,'song-of-day')].id,'79');
  assert.equal(pages[blockIndex(tree,'ashrei-uva')].id,'71');
  assert.equal(pages[blockIndex(tree,'ledavid')].id,'81');
  assert.equal(blockIndex(tree,'absent'),-1);
});
test('daily trees resolve for every service across a full year with independent results',()=>{
  for(let day=0;day<400;day++)for(const service of Object.keys(prayerRecipes)){
    const date=new Date(Date.UTC(2026,8,1+day,9));
    const plan=planForPrayer(date,service==='birkat'?'shacharit':service);
    const tree=composePrayerTree(service,plan);
    assert.deepEqual(flattenBlocks(tree),composePrayer(service,plan));
    function check(node){
      assert.ok(['group','image'].includes(node.type),node.type);
      if(node.type==='group')node.children.forEach(check);
    }
    check(tree);
    assert.equal(plan.unavailable,tree.children.length===0);
  }
});
test('new engine modules are included in the offline shell',()=>{
  const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
  for(const module of ['block-engine','block-catalog','prayer-recipes'])assert.ok(sw.includes(`'/${module}.js'`));
  assert.ok(sw.includes('siddur-animations-v39'));
  for(const asset of ["'/app.js?v=39'","'/styles.css?v=39'","'/vendor/page-flip.module.js?v=39'"])assert.ok(sw.includes(asset));
  const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  assert.ok(app.includes("caches.has('siddur-animations-v39')"));
  assert.ok(!app.includes("querySelector('#city')"));
  assert.ok(!app.includes("block.type==='fragment'"));
});
test('weekday Song of the Day has no instruction banner and selects only today source pages',()=>{
  const expected={
    '2026-10-04T07:00:00Z':['76','77'],
    '2026-10-05T07:00:00Z':['77'],
    '2026-10-06T07:00:00Z':['77'],
    '2026-10-07T07:00:00Z':['78'],
    '2026-10-08T07:00:00Z':['78','79'],
    '2026-10-09T07:00:00Z':['79']
  };
  for(const [date,pages] of Object.entries(expected)){
    const tree=composePrayerTree('shacharit',at(date));
    const group=tree.children.find(node=>node.id==='weekday-morning-ending')
      .children.find(node=>node.id==='weekday-psalms');
    const ids=flattenBlocks(group).map(block=>block.id);
    assert.deepEqual(ids.slice(0,pages.length),pages);
    assert.ok(!ids.includes('shir-shel-yom'));
  }
});
test('Song of the Day menu anchor starts at the first page for each day',()=>{
  const expected={Sun:'76',Mon:'77',Tue:'77',Wed:'78',Thu:'78',Fri:'79'};
  for(let day=0;day<6;day++){
    const date=new Date(Date.UTC(2026,9,4+day,7));
    const plan=planForPrayer(date,'shacharit');
    const tree=composePrayerTree('shacharit',plan);
    const first=flattenBlocks(tree)[blockIndex(tree,'daily-song')];
    assert.equal(first.id,expected[plan.h.weekday]);
  }
});
test('every prayer uses only full image pages, never fragments',()=>{
  for(let day=0;day<400;day++)for(const service of Object.keys(prayerRecipes)){
    const date=new Date(Date.UTC(2026,8,1+day,9));
    const plan=planForPrayer(date,service==='birkat'?'shacharit':service);
    for(const block of composePrayer(service,plan))assert.notEqual(block.type,'fragment');
  }
});
test('page 61 always completes Shacharit Amidah, with or without Tachanun',()=>{
  for(const date of ['2026-10-04T07:00:00Z','2026-11-19T09:00:00Z']){
    const ids=composePrayer('shacharit',at(date)).map(block=>block.id);
    assert.equal(ids[ids.indexOf('60')+1],'61');
  }
});
test('every prayer keeps complete boundary pages even when they also contain optional text',()=>{
  const dates=['2026-10-04T07:00:00Z','2026-11-19T09:00:00Z'];
  for(const date of dates){
    const shacharit=composePrayer('shacharit',at(date)).map(block=>block.id);
    for(let page=50;page<=61;page++)assert.ok(shacharit.includes(String(page)),`Shacharit page ${page}`);

    const mincha=composePrayer('mincha',at(date,'mincha')).map(block=>block.id);
    for(let page=96;page<=103;page++)assert.ok(mincha.includes(String(page)),`Mincha page ${page}`);

    const maariv=composePrayer('maariv',at(date,'maariv')).map(block=>block.id);
    if(maariv.length)for(let page=106;page<=118;page++)assert.ok(maariv.includes(String(page)),`Maariv page ${page}`);

    const birkat=composePrayer('birkat',at(date)).map(block=>block.id);
    for(let page=88;page<=94;page++)assert.ok(birkat.includes(String(page)),`Birkat Hamazon page ${page}`);
  }
});


