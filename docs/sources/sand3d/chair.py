"""A chair, written as an assembly: the plan first, then the details, then the parts.

`chair` reads as a table of contents. `chair_frame` is the plan: the seat on its legs,
and the anchors the details need. Each `add_` function hangs one detail on those
anchors: delete its line and nothing else moves — without `add_back` it is a stool.
The parts come last, each built at its own origin, standing on z = 0.
"""
import sand3d as s3d


def chair(width=440, depth=420, seat_h=450):
    chair = chair_frame(width, depth, seat_h)   # the plan
    add_back(chair)                             # the details, on the plan's anchors
    add_rails(chair)
    return chair.root


# ---------------------------------------------------------------- the plan

def chair_frame(width, depth, seat_h, t=30, inset=35):
    """The seat on four legs. Publishes the width, the seat's height and the line
    the back stands on."""
    legs = s3d.at(leg(seat_h - t), on=s3d.grid(2, 2, width - 2 * inset, depth - 2 * inset))
    seat = s3d.at(seat_board(width, depth, t), z=seat_h - t)
    return s3d.assembly("chair", seat, legs, width=width, depth=depth, seat_h=seat_h, inset=inset,
                        back_y=depth / 2 - 20)


# ---------------------------------------------------------------- the details

def add_back(chair, h=420, t=24, button_d=16):
    """A panel standing on the seat's back edge, buttoned on its face."""
    back = s3d.at(back_panel(chair.width - 40, h, t), y=chair.back_y, z=chair.seat_h)
    # a side face's frame starts at z = 0, below the parent's origin, and its Y is up
    face = back.face("-Y").move(y=chair.seat_h + h * 0.6)
    buttons = s3d.at(s3d.dome("button", button_d, 5), on=s3d.grid(3, 2, 100, 110, on=face))
    s3d.attach(chair, "back", back, buttons)


def add_rails(chair, d=18, z=160):
    """A rail between the front and back legs, on each side."""
    # both=True: centred on its middle, so turned about X it spans the depth evenly
    rail = s3d.extrude("rail", s3d.circle(d), chair.depth - 2 * chair.inset, both=True)
    sides = s3d.grid(2, 1, chair.width - 2 * chair.inset, on=s3d.Frame((0, 0, z)))
    s3d.attach(chair, "rails", s3d.at(rail, rx=90, on=sides))


# ---------------------------------------------------------------- the parts

def seat_board(width, depth, t):
    return s3d.fillet(s3d.box("seat", width, depth, t), 8, edges="top")


def leg(h, foot=26, top=36):
    """Tapered, its foot on z = 0."""
    return s3d.cone("leg", foot, h, d2=top)


def back_panel(width, h, t):
    return s3d.fillet(s3d.box("back", width, t, h), 6, edges="top")

