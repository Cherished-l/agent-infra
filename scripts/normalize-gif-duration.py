#!/usr/bin/env python3
"""Normalize GIF frame delays to hit a target duration."""
import struct
import sys


def locate_gce_offsets(data):
    """Return the start offsets of all Graphic Control Extension blocks."""
    offsets = []
    if len(data) < 13 or data[:3] != b"GIF":
        return offsets

    index = 13
    packed = data[10]
    if packed & 0x80:
        index += 3 * (2 ** ((packed & 0x07) + 1))

    while index < len(data):
        block_type = data[index]

        if block_type == 0x3B:
            break

        if block_type == 0x21:
            if index + 2 >= len(data):
                break

            label = data[index + 1]
            if label == 0xF9:
                if index + 8 > len(data) or data[index + 2] != 0x04:
                    break
                offsets.append(index)
                index += 8
                continue

            index += 2
            while index < len(data):
                block_size = data[index]
                index += 1
                if block_size == 0:
                    break
                index += block_size
            continue

        if block_type == 0x2C:
            if index + 10 > len(data):
                break

            packed = data[index + 9]
            index += 10
            if packed & 0x80:
                index += 3 * (2 ** ((packed & 0x07) + 1))

            if index >= len(data):
                break

            index += 1
            while index < len(data):
                block_size = data[index]
                index += 1
                if block_size == 0:
                    break
                index += block_size
            continue

        break

    return offsets


def calculate_delays(frame_count, target_seconds):
    """Distribute centisecond delays so the total matches the target exactly."""
    target_cs = max(frame_count * 2, round(target_seconds * 100))
    base_delay = target_cs // frame_count
    extra_frames = target_cs % frame_count

    return [
        base_delay + 1 if index < extra_frames else base_delay
        for index in range(frame_count)
    ]


def normalize(path, target_seconds):
    with open(path, "rb") as f:
        data = bytearray(f.read())

    gce_offsets = locate_gce_offsets(data)

    if not gce_offsets:
        return

    delays_cs = calculate_delays(len(gce_offsets), target_seconds)

    for offset, delay_cs in zip(gce_offsets, delays_cs):
        struct.pack_into("<H", data, offset + 4, delay_cs)

    with open(path, "wb") as f:
        f.write(data)

    total_cs = sum(delays_cs)
    actual_s = total_cs / 100
    min_delay = min(delays_cs)
    max_delay = max(delays_cs)
    if min_delay == max_delay:
        delay_summary = f"{min_delay * 10}ms"
    else:
        delay_summary = f"{min_delay * 10}-{max_delay * 10}ms"

    print(f"Normalized: {len(gce_offsets)} frames, {delay_summary}, total {actual_s:.1f}s")


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(f"Usage: {sys.argv[0]} <gif-path> <target-seconds>")
        sys.exit(1)
    normalize(sys.argv[1], float(sys.argv[2]))
