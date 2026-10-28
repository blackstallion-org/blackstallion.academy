import json, struct, sys
with open(sys.argv[1],'rb') as f:
    f.read(12); n,_ = struct.unpack('<II', f.read(8)); j = json.loads(f.read(n))
for a in j['animations']:
    nodes = sorted({j['nodes'][c['target']['node']]['name'] for c in a['channels']})
    print(a['name'], len(a['channels']), 'ch', len(nodes), 'bones:', ','.join(nodes)[:200])
