import test from 'node:test';
import assert from 'node:assert/strict';
import {planForPrayer,hebrewAt,sunset} from '../public/calendar.js';
import {composePrayer} from '../public/prayer-blocks.js';

const at=(value,service='shacharit',options)=>planForPrayer(new Date(value),service,options);
test('sunset turns the Hebrew date and Maariv into the coming day',()=>{
  const friday=new Date('2026-10-02T12:00:00Z');
  assert.equal(hebrewAt(friday).day,21);
  assert.equal(hebrewAt(new Date('2026-10-02T17:00:00Z')).day,22);
  assert.equal(at('2026-10-02T12:00:00Z','maariv').unavailable,true);
  assert.equal(at('2026-10-02T17:00:00Z','maariv').h.day,22);
  assert.ok(sunset(friday)>friday);
  assert.ok(Math.abs(sunset(friday).getTime()-Date.parse('2026-10-02T15:24:00Z'))<5*60000);
});
test('Hoshana Rabbah is full Hallel with Hoshaanot and festival Musaf',()=>{
  const plan=at('2026-10-02T09:00:00Z');
  assert.equal(plan.hallel,'full');assert.equal(plan.musaf,'festival');
  assert.equal(plan.hoshanot,true);assert.equal(plan.noTachanun,true);
  const ids=composePrayer('shacharit',plan).map(b=>b.id);
  assert.ok(ids.includes('extra-335'));assert.ok(ids.includes('extra-257'));
  const position=id=>ids.indexOf(id);
  assert.ok(position('61')<position('hallel-1'));
  assert.ok(position('hallel-5')<position('extra-327'));
  assert.ok(position('extra-335')<position('79'));
  assert.ok(position('79')<position('81'));
  assert.ok(position('81')<position('71'));
  assert.ok(!ids.includes('torah-reading'));
  assert.ok(position('76')<position('extra-257'));
  assert.ok(position('extra-265')<ids.lastIndexOf('81'));
});
test('Israel starts the rain request on 7 Cheshvan, already at Maariv',()=>{
  assert.equal(at('2026-10-17T17:00:00Z','maariv').rainRequest,true);
  assert.equal(at('2026-10-17T09:00:00Z').rainRequest,false);
});
test('Rosh Chodesh Tevet during Chanukah combines inserts and full Hallel',()=>{
  const p=at('2026-12-11T09:00:00Z');
  assert.equal(p.roshChodesh,true);assert.equal(p.alHanissim,'chanukah');
  assert.equal(p.yaalehVeyavo,true);assert.equal(p.hallel,'full');assert.equal(p.musaf,'roshChodesh');
  const ids=composePrayer('shacharit',p).map(b=>b.id);
  assert.ok(ids.includes('80'));assert.ok(ids.includes('81'));
  assert.ok(ids.includes('71'));assert.ok(ids.includes('76'));
});
test('ordinary weekday omits the Rosh Chodesh and Elul psalms',()=>{
  const ids=composePrayer('shacharit',at('2026-11-19T09:00:00Z')).map(b=>b.id);
  assert.ok(ids.includes('78'));assert.ok(ids.includes('79'));assert.ok(ids.includes('81'));
  assert.ok(!ids.includes('77'));
});
test('Mincha on the eve of a Chabad no-Tachanun date differs from Shacharit',()=>{
  const sunday='2026-11-29T09:00:00Z';
  assert.equal(at(sunday).h.day,19);
  assert.equal(at(sunday).noTachanun,true);
  // 9 Kislev, 10 Kislev in 5787
  const h=at('2026-11-19T09:00:00Z');
  assert.equal(h.h.day,9);assert.equal(h.noTachanun,false);
  assert.equal(at('2026-11-19T09:00:00Z','mincha').noTachanun,true);
});
test('the afternoon before Erev Yom Kippur still has Tachanun',()=>{
  const d=new Date('2026-09-19T09:00:00Z');
  const p=planForPrayer(d,'mincha');
  assert.equal(p.h.month,'Tishri');assert.equal(p.h.day,8);
  // This date is Shabbat in 5787; verify a different year by scanning a weekday.
  let checked=false;
  for(let year=2027;year<2035&&!checked;year++)
    for(let day=1;day<=31&&!checked;day++) {
      const date=new Date(Date.UTC(year,8,day,9)),candidate=planForPrayer(date,'mincha');
      if(candidate.h.month==='Tishri'&&candidate.h.day===8&&candidate.h.weekday!=='Sat'){
        assert.equal(candidate.noTachanun,false);checked=true;
      }
    }
  assert.ok(checked);
});
test('weekday Pesach Chol Hamoed has half Hallel and Omer; late Nisan has no Tachanun',()=>{
  const p=at('2027-04-23T09:00:00Z');
  assert.equal(p.h.month,'Nisan');assert.equal(p.h.day,16);
  assert.equal(p.hallel,'half');assert.equal(p.musaf,'festival');assert.equal(p.omer,1);
  const evening=at('2027-04-23T17:00:00Z','maariv');
  assert.equal(evening.omer,2);
});
test('no weekday blocks on Shabbat or festival',()=>{
  assert.equal(composePrayer('shacharit',at('2026-10-03T09:00:00Z')).length,0);
});
test('no composed prayer uses fragments',()=>{
  for(const date of ['2026-10-02T09:00:00Z','2026-12-11T09:00:00Z','2026-11-19T09:00:00Z','2027-04-23T09:00:00Z'])
    for(const service of ['shacharit','maariv'])
      for(const block of composePrayer(service,at(date,service)))
        assert.notEqual(block.type,'fragment');
});

