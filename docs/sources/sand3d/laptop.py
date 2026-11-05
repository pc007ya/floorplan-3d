import sand3d as s3d


def laptop():
    base_placed = s3d.at(base(), y=-62, z=-10)
    screen_placed = s3d.at(screen(), y=84.5, z=0)
    return s3d.assembly("laptop", base_placed, screen_placed)


def base(w=350, d=246, h=12, r=9, kw=332, kd=138, ky=14, pitch=20, key_w=17, key_d=19, recess=4, touch_w=86, touch_d=50, touch_y=-88, touch_x=-20, foot_d=18, foot_h=3, foot_px=299, foot_py=199):
    plate = s3d.extrude("case", s3d.rect(w=w, d=d, r=r), h=h)
    s3d.fillet(plate, r=2, edges="top")
    plate = s3d.pocket(plate, s3d.rect(w=kw, d=kd, r=r/2), depth=recess, on=plate.face("top").move(y=ky))
    plate = s3d.pocket(plate, s3d.rect(w=touch_w, d=touch_d, r=r/2), depth=1, on=plate.face("top").move(x=touch_x, y=touch_y))
    s3d.material(plate, "aluminium", color="#a2a2a2")
    well = s3d.extrude("keyboard_well", s3d.rect(w=kw-2, d=kd-2, r=r/2), h=1)
    well = s3d.at(well, y=ky, z=h-recess-0.5)
    s3d.material(well, "plastic", color="#474747")
    keys = []
    for row in range(5):
        key = keycap(w=key_w, d=key_d, h=recess/2)
        placed = s3d.at(key, on=s3d.grid(nx=16, px=pitch), y=ky+row*(key_d+2)-2*(key_d+2), z=h-recess)
        keys.extend(placed)
    function_keys = s3d.at(keycap(w=key_w, d=14, h=recess/2), on=s3d.grid(nx=17, px=key_d), y=ky+kd/2-key_d/2, z=h-recess)
    space = s3d.at(keycap(w=118, d=24, h=recess/2), x=touch_x, y=ky-kd/2+key_d/2, z=h-recess)
    feet = s3d.at(s3d.cylinder("foot", d=foot_d, h=foot_h+1), on=s3d.grid(nx=2, ny=2, px=foot_px, py=foot_py), z=-foot_h)
    s3d.material(feet, "rubber", color="#474747")
    return s3d.group("base", plate, well, keys, function_keys, space, feet)


def keycap(w, d, h):
    key = s3d.extrude("key", s3d.rect(w=w, d=d, r=1), h=h)
    s3d.material(key, "plastic", color="#2d2d2d")
    return key


def screen(w=350, h=240, t=5, r=8, tilt=80, rim=7):
    panel = s3d.extrude("lid", s3d.rect(w=w, d=h, r=r), h=t)
    panel = s3d.pocket(panel, s3d.rect(w=w-2*rim, d=h-2*rim, r=r/2), depth=1, on=panel.face("top"))
    s3d.material(panel, "aluminium", color="#a2a2a2")
    glass = s3d.extrude("display", s3d.rect(w=w-2*rim, d=h-2*rim, r=r/2), h=1)
    glass = s3d.at(glass, z=t-1.5)
    s3d.material(glass, "plastic", color="#747474", roughness=0.3)
    lid = s3d.group("screen", panel, glass)
    return s3d.group("screen_group", s3d.at(lid, rx=tilt, y=t/2, z=h/2-1.5))
