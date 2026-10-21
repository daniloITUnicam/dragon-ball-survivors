#!/usr/bin/env python3
"""Balance report from the game's telemetry export (Settings > Gameplay > Game data > "Everything (JSON)").
   python3 tools/analyze_telemetry.py dbs-all.json [more.json ...] [--stage N] [--diff normal] [--char goku]
   Prints, per stage and difficulty: results, duration, pacing of level-ups, enemy density and damage per minute, boss kill times, what kills the player,
   which weapons deal the damage, which cards get picked, which enemies hurt most. Several exports (several devices) are merged."""
import json, sys, statistics as st, collections, argparse

ap = argparse.ArgumentParser()
ap.add_argument('files', nargs='+'); ap.add_argument('--stage', type=int); ap.add_argument('--diff'); ap.add_argument('--char')
a = ap.parse_args()
runs = []
for f in a.files:
    d = json.load(open(f, encoding='utf-8'))
    runs += d if isinstance(d, list) else [d]
seen = set(); uniq = []
for r in runs:
    if r.get('id') in seen: continue
    seen.add(r.get('id')); uniq.append(r)
runs = [r for r in uniq if (a.stage is None or r['stage'] == a.stage) and (not a.diff or r['diff'] == a.diff) and (not a.char or r['char'] == a.char)]
if not runs: sys.exit('no runs')

def mm(x): return '%d:%02d' % (x // 60, x % 60)
def med(v): return st.median(v) if v else 0
def p90(v):
    v = sorted(v); return v[min(len(v) - 1, int(len(v) * .9))] if v else 0
def pct(n, d): return '%3d%%' % (100 * n / d) if d else '  - '
def head(t): print('\n' + t + '\n' + '-' * len(t))

print('%d runs · %s' % (len(runs), ', '.join('%s %d' % (k, v) for k, v in collections.Counter(r['res'] for r in runs).items())))
groups = collections.defaultdict(list)
for r in runs: groups[(r['stage'], r['diff'], 'x2' if r.get('x2') else '')].append(r)

for (stg, diff, x2), rs in sorted(groups.items()):
    head('STAGE %s · %s %s · %d runs' % (stg, diff, x2, len(rs)))
    wins = [r for r in rs if r['res'] == 'win']; deaths = [r for r in rs if r['res'] == 'death']
    print('win rate %s · avg duration %s · median level %d · median kills %d' % (pct(len(wins), len(rs)), mm(st.mean(r['dur'] for r in rs)), med([r['lvl'] for r in rs]), med([r['kills'] for r in rs])))
    if deaths: print('deaths at (median) %s, p90 %s' % (mm(med([r['dur'] for r in deaths])), mm(p90([r['dur'] for r in deaths]))))
    # pacing: seconds between level-ups by level bucket
    pace = collections.defaultdict(list)
    for r in rs:
        for l in r.get('lv', []): pace[(l['lvl'] - 1) // 5 * 5 + 1].append(l['dt'])
    if pace: print('seconds per level-up:  ' + '  '.join('Lv%d-%d: %.0f s' % (k, k + 4, med(v)) for k, v in sorted(pace.items())))
    # per minute
    cols = collections.defaultdict(lambda: collections.defaultdict(list))
    for r in rs:
        for m in r.get('min', []):
            if m['T'] >= 50:
                for k in ('lvl', 'enAvg', 'enMax', 'dps', 'tps', 'hpAvg', 'hpMin', 'kills', 'boss'): cols[m['m']][k].append(m[k])
    if cols:
        print('\nmin  level  enemies(avg/max)   DPS   dmg-taken/s  hp avg/min   kills  boss%')
        for m in sorted(cols):
            c = cols[m]
            print('%3d  %5.0f  %8.0f /%4.0f  %6.1f  %9.2f    %.2f/%.2f  %6.0f  %4.0f%%' % (m, med(c['lvl']), med(c['enAvg']), med(c['enMax']), med(c['dps']), med(c['tps']), med(c['hpAvg']), med(c['hpMin']), med(c['kills']), 100 * med(c['boss'])))
    # bosses
    bs = collections.defaultdict(list)
    for r in rs:
        for b in r.get('boss', []): bs[b['id']].append(b)
    if bs:
        print('\nboss           seen  killed  kill time med/p90  fight time  your DPS  dmg taken  player lvl  hp left (if lost)')
        for k, v in bs.items():
            kk = [b for b in v if b.get('killed')]; lost = [b for b in v if not b.get('killed')]
            print('%-14s %4d  %6s  %8s /%-8s %9.0fs %8.0f %10.0f %10.0f  %s' % (k, len(v), pct(len(kk), len(v)), mm(med([b['kt'] for b in kk])), mm(p90([b['kt'] for b in kk])), med([b['ft'] for b in kk]),
                  med([b.get('dps', 0) for b in kk]), med([b.get('taken', 0) for b in kk]), med([b['lvl'] for b in v]), ('%d%%' % (100 * med([b.get('hpLeft', 0) for b in lost]))) if lost else '-'))
    # what kills / hurts
    kill = collections.Counter(d['by'] for r in rs for d in r.get('deaths', []))
    if kill: print('\nlast hit before dying: ' + ', '.join('%s %d' % kv for kv in kill.most_common(6)))
    hb = collections.Counter()
    for r in rs:
        for k, v in r.get('hb', {}).items(): hb[k] += v
    tot = sum(hb.values()) or 1
    if hb: print('damage taken by source: ' + ', '.join('%s %d%%' % (k, 100 * v / tot) for k, v in hb.most_common(7)))
    # weapons
    wd = collections.Counter(); wn = collections.Counter(); wk = collections.Counter()
    for r in rs:
        for w in r.get('weapons', []):
            wd[w['id']] += w.get('dmg', 0); wn[w['id']] += 1; wk[w['id']] += w.get('kills', 0)
    td = sum(wd.values()) or 1
    if wd: print('\nweapon damage share (runs owning it): ' + ', '.join('%s %d%% (%d)' % (k, 100 * v / td, wn[k]) for k, v in wd.most_common(10)))
    # card pick rates
    off = collections.Counter(); pick = collections.Counter(); rec = [0, 0]
    for r in rs:
        for l in r.get('lv', []):
            for o in l.get('opts') or []: off[o] += 1
            if l.get('pick'): pick[l['pick']] += 1
            if 'fr' in l: rec[0] += l['fr']; rec[1] += 1
    if off:
        print('card pick rate (picked/offered), manual+auto: ' + ', '.join('%s %d/%d' % (k, pick[k], off[k]) for k, _ in off.most_common(12)))
        if rec[1]: print('advised card followed: %s of %d manual choices' % (pct(rec[0], rec[1]), rec[1]))
    cts = [l['ct'] for r in rs for l in r.get('lv', []) if 'ct' in l]
    if cts: print('time spent choosing a card: median %.1f s, p90 %.1f s' % (med(cts), p90(cts)))
    # enemies
    et = collections.defaultdict(lambda: [0, 0, 0.0, 0.0, 0.0])
    for r in rs:
        for k, e in r.get('et', {}).items():
            x = et[k]; x[0] += e['sp']; x[1] += e['k']; x[2] += e['hp']; x[3] += e['life']; x[4] += e['dmgOut']
    if et:
        print('\nenemy            spawned  killed  avg hp  avg life(s)  damage dealt to you')
        for k, x in sorted(et.items(), key=lambda kv: -kv[1][4])[:10]:
            print('%-16s %7d  %6s  %6.0f  %10.1f  %10.0f' % (k, x[0], pct(x[1], x[0]), x[2] / max(1, x[0]), x[3] / max(1, x[1]), x[4]))
    # usage
    us = collections.Counter()
    for r in rs:
        for k, v in r.get('use', {}).items(): us[k] += v
    if us: print('\nuses per run: ' + ', '.join('%s %.1f' % (k, v / len(rs)) for k, v in us.most_common()))
    lt = collections.Counter()
    for r in rs:
        for k, v in r.get('lt', {}).items(): lt[k] += v
    if lt: print('pick-ups per run: ' + ', '.join('%s %.1f' % (k, v / len(rs)) for k, v in lt.most_common(8)))
