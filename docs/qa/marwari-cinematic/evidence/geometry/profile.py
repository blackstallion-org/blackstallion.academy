import bpy, math, sys, json
import numpy as np
from mathutils import Vector
rig = bpy.data.objects['MarwariRig']; low = bpy.data.objects['Marwari_Low']; B = rig.data.bones
me = low.data
co = np.empty(len(me.vertices)*3); me.vertices.foreach_get('co', co); co = co.reshape(-1,3)
fwd = np.array([0.013,-1.0,0.0]); fwd/=np.linalg.norm(fwd)
f = co@fwd; z = co[:,2]; x = co[:,0]
mid = np.abs(x-0.014) < 0.10
print("TOPLINE (max z within |x|<10cm of mid-plane) by forward coordinate (m, +forward):")
rows=[]
for a in np.arange(-0.70, 1.40, 0.10):
    m = mid & (f>=a) & (f<a+0.10)
    if m.any(): rows.append((round(a+0.05,2), round(float(z[m].max()),3)))
print(rows)
# underline (sternum / belly): min z for the trunk region (z>0.6) per forward bin
rows2=[]
for a in np.arange(-0.60, 0.90, 0.10):
    m = mid & (f>=a) & (f<a+0.10) & (z>0.6)
    if m.any(): rows2.append((round(a+0.05,2), round(float(z[m].min()),3)))
print("UNDERLINE (min z above 0.6 m):", rows2)
# neck angle from the bone chain
n1, n3 = B['Neck_1'].head_local, B['Neck_3'].tail_local
d = (n3-n1); hor = math.hypot(d.x,d.y); print("NECK angle from horizontal (deg):", round(math.degrees(math.atan2(d.z,hor)),1), "length (bones) m:", round(d.length,3))
h, ht = B['Head'].head_local, B['Head'].tail_local
dh = ht-h; print("HEAD bone angle from horizontal (deg):", round(math.degrees(math.atan2(dh.z, math.hypot(dh.x,dh.y))),1), "(negative = nose down)", "length m:", round(dh.length,3))
# leg angles and lengths: front/hind cannon vs forearm ratio
for s in 'L':
    print("fore cannon/forearm", round(B['Cannon_F_'+s].length/B['Forearm_'+s].length,3), "hind cannon/gaskin", round(B['Cannon_B_'+s].length/B['Gaskin_'+s].length,3))
# hoof heights, stance: fetlock and hoof head heights
for n in ['Hoof_F_L','Hoof_F_R','Hoof_B_L','Hoof_B_R']:
    print(n, 'head', [round(c,3) for c in B[n].head_local], 'tail', [round(c,3) for c in B[n].tail_local])
# cannon bone circumference proxy: width of vertices near the cannon mid-point (lower_legs), |x - leg x|
for n in ['Cannon_F_L','Cannon_B_L']:
    a, b = B[n].head_local, B[n].tail_local; mp = (a+b)/2
    m = (np.abs(co[:,2]-mp.z)<0.02) & (np.abs(co[:,1]-mp.y)<0.12) & (np.abs(co[:,0]-mp.x)<0.12)
    if m.any(): print(n,'cannon mid-height cross-section extent X/Y cm:', round(float((co[m,0].max()-co[m,0].min())*100),1), round(float((co[m,1].max()-co[m,1].min())*100),1))
# muzzle/nostril: head width at eye level and at muzzle
hm = (z>1.80)&(z<1.95)&(f>1.0)&(f<1.30)
print("HEAD width at eye level cm:", round(float((x[hm].max()-x[hm].min())*100),1))
mm = (z>1.50)&(z<1.62)&(f>1.25)
print("MUZZLE width cm:", round(float((x[mm].max()-x[mm].min())*100),1), "muzzle tip z", round(float(z[f>1.34].mean()),3))
# ears: length, base separation, orientation of the tips
for s in 'LR':
    e = B['Ear_'+s]; t = B['Ear_Tip_'+s]
    print('ear', s, 'base', [round(c,3) for c in e.head_local], 'tip tail', [round(c,3) for c in t.tail_local], 'length m', round((t.tail_local-e.head_local).length,3))
