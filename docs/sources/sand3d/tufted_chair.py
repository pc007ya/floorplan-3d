"""A tufted chair: a buttoned back rolling over at the top, a domed seat on a nailed
apron, four tapered legs.

Millimetres, Z up, the chair's front towards -Y; built as its left half's legs, the
right ones mirrored. The architecture is the seat on its legs; the back and every
row of trim are details added to it: deleting `add_back` leaves a stool, and the
back's tufts follow the width they are given.
"""
import json
import math
import sys

import sand3d as s3d


def tufted_chair(width=520):
    chair = chair_frame(width)
    add_back(chair)
    add_seat_nails(chair)
    return chair.root


def chair_frame(width=520, depth=480, seat_z=430, inset=50, floor=0):
    seat = upholstered_seat(width, depth)
    legs = []
    for leg, y in ((front_leg, -(depth / 2 - inset)), (rear_leg, depth / 2 - inset)):
        left = s3d.at(leg(), x=-(width / 2 - inset), y=y, z=floor)
        legs += [left, s3d.transform(s3d.copy(left), mirror="x")]   # the right one: its image across x = 0
    return s3d.assembly("chair", s3d.at(seat.root, z=seat_z), *legs,
                        seat=seat, width=width, seat_z=seat_z, rear_y=depth / 2)


def add_back(chair, behind=-30, above=200):
    back = tufted_back(chair.width)
    s3d.attach(chair, "back", s3d.at(back.root, y=chair.rear_y + behind, z=chair.seat_z + above))
    add_buttons(back)
    add_back_nails(back)


def add_seat_nails(chair, pitch=22, d=10, h=5):
    """One nail every `pitch` along the seat's seam, round its front and sides."""
    seat = chair.seat
    spots = s3d.snap(seat.parts, s3d.along(seat.seam, pitch))
    s3d.attach(seat, "seat_nails", *[s3d.at(s3d.dome("nail", d, h), on=f) for f in spots])


def add_buttons(back, d=16, h=3):
    s3d.attach(back, "buttons", *[s3d.at(s3d.dome("button", d, h), on=f) for f in back.tufts])


def add_back_nails(back, pitch=22, d=10, h=5, face=((220, -230), (226, 150)), reach=400):
    """A row up each side of the back's face, where its cover is nailed to the frame,
    from (x, z) to (x, z), found from in front, `reach` away."""
    spots = []
    for side in (-1, 1):
        (x0, z0), (x1, z1) = face
        spots += s3d.snap(back.parts, s3d.along([(side * x0, -reach, z0), (side * x1, -reach, z1)], pitch),
                          direction=(0, 1, 0))
    s3d.attach(back, "back_nails", *[s3d.at(s3d.dome("nail", d, h), on=f) for f in spots])


# ---------------------------------------------------------------- parts, in the order they are called

def section(z, w, d, x=0, y=0, n=2, taper=0):
    """One cross-section of a loft: a superellipse `w` wide and `d` deep, squareness
    `n` (2 an ellipse, 4 a box with round corners), its +Y side narrowed by `taper`,
    centred at (x, y, z)."""
    return s3d.at(s3d.superellipse(w, d, n, taper), x=x, y=y, z=z)


def upholstered_seat(width=520, depth=480, taper=0.04, squareness=6, board=-8,
                     crown=((15, 3, 3, 0), (35, 12, 10, 4), (55, 30, 24, 8), (68, 90, 72, 12), (76, 190, 160, 18)),
                     apron=60, dip=15, wall=8, seam_up=6, seam_out=10):
    """A cushion domed over a board, an apron hanging round it. `crown` is the dome,
    level by level: (height, inset at the sides, inset front and back, shift back)."""
    w = width / (1 + taper)  # the loft's mean width; the front edge is `width`
    cushion = s3d.loft("cushion", section(board, w, depth, n=squareness, taper=taper),
                       *[section(z, w - 2 * side, depth - 2 * end, y=back, n=squareness, taper=taper)
                         for z, side, end, back in crown])

    def drop(x):  # how far the apron hangs below the board: deepest mid-front
        return apron + dip * math.cos(math.pi * x / width) ** 2

    hem = s3d.superellipse(w - wall, depth - wall, squareness, taper).loops[0].pts
    skirt = s3d.loft("apron", *[s3d.at(s3d.superellipse(drop(x), wall, squareness), x=x, y=y, z=board - drop(x) / 2,
                                       ry=-90) for x, y in hem], follow=True, loop=True)
    # the seam the nails follow: just outside the apron, round the front and sides
    # but not the back, which the back of the chair covers — from the middle of the back round
    rim = s3d.superellipse(w + 2 * seam_out, depth + 2 * seam_out, squareness, taper).loops[0].pts
    start = min(range(len(rim)), key=lambda i: abs(math.atan2(rim[i][1], rim[i][0]) - math.pi / 2))
    seam = [(x, y, board - drop(x) + seam_up) for x, y in rim[start:] + rim[:start] if y < depth / 2 - seam_out]
    return s3d.assembly("seat", cushion, skirt, parts=[cushion, skirt], seam=seam)


def front_leg(height=420, profile=((0, -10, 30, 30), (210, -4, 36, 36), (420, 0, 44, 44))):
    """A square leg with round corners, tapering to its foot, which steps forward.
    `profile` is (z, y, width, depth) from the floor up; its origin is under its foot."""
    body = s3d.loft("front_leg", *[section(z * height / profile[-1][0], w, d, y=y, n=4) for z, y, w, d in profile])
    return s3d.group("front_leg", s3d.at(body, y=-profile[0][1]))


def rear_leg(height=420, profile=((0, 16, 30, 30), (210, 6, 36, 36), (420, 0, 44, 44))):
    """The back leg, raking back to its foot. Its origin is under its foot."""
    body = s3d.loft("rear_leg", *[section(z * height / profile[-1][0], w, d, y=y, n=4) for z, y, w, d in profile])
    return s3d.group("rear_leg", s3d.at(body, y=-profile[0][1]))


def tufted_back(width=520, drawn_for=520, squareness=4, profile=(
        (-260, 0, 440, 50),    # foot, behind the seat: z, y, width, depth
        (-140, 6, 460, 60),
        (-20, 14, 470, 64),    # the cushioned middle
        (90, 24, 480, 66),
        (170, 36, 490, 72),    # leaning back
        (205, 58, 490, 70),    # over the top
        (180, 82, 490, 60),    # down the back
        (130, 88, 490, 46)),   # tucked under
        tuft_rows=((-60, -120), (-52, -40), (-44, 40), (-34, 120)), tuft_pitch=80, tuft_margin=100, tuft_r=55,
        tuft_depth=20):
    """A cushioned panel rising from the seat and rolling over backwards, one loft
    along its own centre line; buttoned on a diamond lattice, each tuft row (y, z),
    the rows' columns staggered. The profile's widths are those of a `drawn_for` chair."""
    widen = width - drawn_for
    body = s3d.loft("back", *[section(z, w + widen, d, y=y, n=squareness) for z, y, w, d in profile], follow=True)
    reach = int((width / 2 - tuft_margin) / tuft_pitch)  # columns each side of the middle
    lattice = [(j * tuft_pitch, y, z) for i, (y, z) in enumerate(tuft_rows)
               for j in range(-reach, reach + 1) if (i + j) % 2 == 0]
    tufts = s3d.snap(body, lattice)
    s3d.dent(body, tufts, tuft_r, tuft_depth)
    return s3d.assembly("tufted_back", body, parts=[body], tufts=s3d.snap(body, tufts))


if __name__ == "__main__":
    s3d.empty_scene()
    s3d.export(s3d.group("tufted_chair", tufted_chair(**json.loads(sys.argv[2] if len(sys.argv) > 2 else "{}"))),
               sys.argv[1])

