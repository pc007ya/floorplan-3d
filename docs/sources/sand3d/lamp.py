import sand3d as s3d


def lamp(stem_h=300):
    base = s3d.revolve("base", [(0, 0), (70, 0), (60, 20), (0, 20)])
    stem = s3d.at(s3d.cylinder("stem", 12, stem_h), on=base.face("top"))
    lamp = s3d.assembly("lamp", base, stem, head=s3d.Frame((0, 0, 20 + stem_h)))
    add_shade(lamp)
    return lamp


def add_shade(lamp, d=180):
    shade = s3d.shell(s3d.cone("shade", d, 120, d2=d / 2), 1.5, open="top bottom")
    s3d.attach(lamp, "shade", s3d.at(shade, on=lamp.head))

