import json, struct, sys
for path in sys.argv[1:]:
    with open(path,'rb') as f:
        magic, ver, length = struct.unpack('<4sII', f.read(12))
        clen, ctype = struct.unpack('<II', f.read(8))
        j = json.loads(f.read(clen))
    imgs = j.get('images',[])
    print('==', path.split('/')[-1], length//1024,'KB')
    print(' asset:', j.get('asset'))
    print(' meshes', len(j.get('meshes',[])), 'nodes', len(j.get('nodes',[])), 'skins', len(j.get('skins',[])), 'anims', [a.get('name') for a in j.get('animations',[])][:20])
    print(' materials', [m.get('name') for m in j.get('materials',[])])
    print(' images', [(i.get('name'), i.get('mimeType')) for i in imgs])
    print(' extUsed', j.get('extensionsUsed'))
    tris=0
    for m in j.get('meshes',[]):
        for p in m['primitives']:
            if 'indices' in p: tris += j['accessors'][p['indices']]['count']//3
    print(' tris', tris)
    if j.get('skins'): print(' joints', len(j['skins'][0]['joints']), [j['nodes'][k].get('name') for k in j['skins'][0]['joints']][:80])
