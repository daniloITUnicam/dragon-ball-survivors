#!/usr/bin/env python3
"""Run every tests/*.js against the built page (dist/dragon-ball-survivors.html) and print one line each: PASS / FAIL / SKIP (+ the last output line).
Usage: python3 tools/run_tests.py [-j N] [pattern...]     (build first: DBS_AUDIO=link python3 build.py)
A test passes when it exits with code 0 and prints no line starting with FAIL. Screenshot helpers (shot*.js, mock_supabase.js) are skipped."""
import subprocess, sys, pathlib, re, os, concurrent.futures as cf
ROOT = pathlib.Path(__file__).resolve().parent.parent
args = sys.argv[1:]; jobs = 3
if '-j' in args: i = args.index('-j'); jobs = int(args[i+1]); del args[i:i+2]
SKIP = re.compile(r'^(shot|mock_supabase|balance_sim|sim\.js)')   # sim.js is a command-line balance simulator (needs arguments), not a test
tests = sorted(p for p in (ROOT/'tests').glob('*.js') if not SKIP.match(p.name) and (not args or any(a in p.name for a in args)))
def run(p):
    try:
        r = subprocess.run(['node', str(p)], cwd=ROOT, capture_output=True, text=True, timeout=420, env=env_for(p))
        out = (r.stdout + r.stderr).strip().splitlines()
        bad = [l for l in out if re.match(r'\s*(FAIL|FAILED)', l)]
        ok = r.returncode == 0 and not bad
        return p.name, 'PASS' if ok else 'FAIL', (bad[0] if bad else (out[-1] if out else ''))[:150]
    except subprocess.TimeoutExpired:
        return p.name, 'FAIL', 'timeout'
if any(p.name == 'cloud_e2e.js' for p in tests):   # that test needs its own build, pointed at the local mock server
    env = dict(os.environ, DBS_OUT='/tmp/o/cloud.html', DBS_AUDIO='link', SUPABASE_URL='http://127.0.0.1:54321', SUPABASE_ANON_KEY='testkey', SUPABASE_RESET='1')
    pathlib.Path('/tmp/o').mkdir(exist_ok=True)
    subprocess.run([sys.executable, 'build.py'], cwd=ROOT, env=env, capture_output=True)
# the tests of the imported character sheets (archived in assets/sprites/_inutilizzati/personaggi: the game draws its characters itself now) run on a build that puts them back
PACK = {'sprites_goku.js', 'sprites_pack.js', 'goku_grid.js', 'charge_walk.js', 'sprites_boss.js', 'rocks_walk.js'}
if any(p.name in PACK for p in tests):
    import shutil, json
    sd = pathlib.Path('/tmp/o/sprites_pack'); shutil.rmtree(sd, ignore_errors=True)
    shutil.copytree(ROOT/'assets/sprites', sd, ignore=shutil.ignore_patterns('_sorgenti'))
    shutil.copytree(sd/'_inutilizzati'/'personaggi', sd/'personaggi')
    ov = json.loads((sd/'sprites.json').read_text(encoding='utf8')); ov.update(json.loads((sd/'personaggi'/'sprites.json').read_text(encoding='utf8')))
    (sd/'sprites.json').write_text(json.dumps(ov), encoding='utf8'); (sd/'personaggi'/'sprites.json').unlink()
    env = dict(os.environ, DBS_SPRITES=str(sd), DBS_OUT='/tmp/o/pack.html')
    subprocess.run([sys.executable, 'build.py'], cwd=ROOT, env=env, capture_output=True)
if any(p.name == 'music.js' for p in tests) and any((ROOT/'assets').glob('*.mp3')):   # the music test: a build with a small audio budget
    env = dict(os.environ, DBS_OUT='/tmp/o/music_small.html', DBS_AUDIO_BUDGET_MB='8.6')
    subprocess.run([sys.executable, 'build.py'], cwd=ROOT, env=env, capture_output=True)
def env_for(p):
    return dict(os.environ, HTML='/tmp/o/pack.html') if p.name in PACK else None
res = []
with cf.ThreadPoolExecutor(jobs) as ex:
    for name, st, last in ex.map(run, tests):
        print('%-5s %-22s %s' % (st, name, last), flush=True); res.append(st)
print('\n%d passed, %d failed of %d' % (res.count('PASS'), res.count('FAIL'), len(res)))
sys.exit(1 if 'FAIL' in res else 0)
