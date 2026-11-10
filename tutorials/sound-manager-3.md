# WL4 Sound Manager from Zero, Part 3: Import, Save, Recipes and Troubleshooting

---

This is the chapter you will come back to while actually editing.

It covers:

+ what Import All really does;
+ what Save really writes;
+ complete recipes for common changes;
+ the failure modes that look like "the editor is broken" but are usually a format mismatch;
+ the current limits of the Sound Manager.

The two rules from the earlier chapters still apply:

> `.s` is the source of truth; `.mid` is a preview.

> The UI stages changes; Save writes the ROM.

---

## 1. What Import All does

`Import All` does not blindly read every file. It walks the manifest and applies changes in a fixed order.

### 1.1 The manifest is the map

For each song, the manifest stores:

```json
{
  "id": 1,
  "name": "SoundWarioWalk",
  "bankId": 1,
  "sFile": "songs/0001_SoundWarioWalk.s",
  "sHash": "...",
  "mFile": "songs/0001_SoundWarioWalk.mid"
}
```

For each sample it stores the id, name, WAV path, WAV hash, PCM hash, and size. For the SoundFont it stores a hash. For PSG it stores a hash of `psg.json`.

The import uses those hashes to decide what changed. It does not use the `.mid` file as an input.

### 1.2 The import order

The Sound Manager stages:

1. changed `.s` songs;
2. changed WAV samples;
3. changed SF2 samples, Programs, and banks;
4. changed PSG records.

Then it reports counts:

```text
changed songs: N
changed samples: N
changed banks: N
changed programs: N
```

The exact counts can overlap. A changed sample can affect many banks; a changed Program can rebuild a bank; a changed SF2 preset can change a sample and a Program.

### 1.3 WAV vs SF2

If the same sample is changed by both a WAV and the SF2, **WAV wins**. The SF2 change is ignored with a warning.

This is intentional. WAV is the direct PCM edit. SF2 is allowed to carry the same sample for preview/editing, but the explicit WAV is treated as more authoritative.

### 1.4 ROM hash warnings

The manifest stores the SHA-1 of the ROM used for export. If the current ROM has a different hash, the importer warns but continues, assuming the fixed sound-table layout is unchanged.

That warning is common after:

+ a previous save;
+ a patch applied outside WL4Editor;
+ a different regional ROM;
+ a ROM header edit.

Do not ignore it blindly. If the ROM is a different game/region, the fixed offsets may not be valid.

### 1.5 No changes

`No changes` usually means one of these:

+ you edited `songs/*.mid`, not `songs/*.s`;
+ you edited a file but the importer is looking at a different project folder;
+ the `.s` file did not actually change;
+ the WAV/PSG/SF2 hash matches the manifest;
+ the PSG record is in a bank no non-empty song uses;
+ the SF2 preset targeted an already-used or out-of-range Program and was skipped.

See the troubleshooting table later.

---

## 2. What Save does

Save is a chunk-writing operation, not a simple file replacement.

### 2.1 The save graph

For a sample or Program change:

```text
sample chunk(s)
    -> affected bank chunk(s)
        -> Song headers that select those banks
            -> Song Table
```

For a song change:

```text
new SoundSongChunk
    -> Song Table pointer
    -> bank pointer inside the new song header
```

For a PSG change:

```text
PSG Program/sub-voice raw bytes
    -> containing bank chunk
        -> Song headers
```

### 2.2 The chunk types

| Chunk | Type | Trailer | Meaning |
|---|---|---|---|
| `SoundBankChunk` | `0x17` | `W4BK` + bank id | A rebuilt bank |
| `SoundSongChunk` | `0x18` | none | A rebuilt song header/tracks |
| `SoundSampleChunk` | `0x19` | `W4S2` + id + name | A sample header/PCM/name |

There is no `SoundListChunk`. The Song Table points directly at the song header, so WL4Editor updates that table entry.

### 2.3 Why banks are rebuilt

A bank is not a flat array. It contains pointers:

+ Program sample pointers;
+ key-split sub-voice base and key-table pointers;
+ drum sub-voice arrays;
+ PSG wave pointers.

If a sample or Program changes, the bank may need:

+ new sample pointers;
+ rebased internal pointers;
+ new key tables;
+ patched PSG raw bytes;
+ a new bank trailer.

The writer copies the old bank data, appends a `W4BK` trailer, and patches a fresh chunk. It does not assume the old bank is safe to edit in place.

### 2.4 Why songs move

A changed `.s` is assembled at the address where the new `SoundSongChunk` will live. The assembler needs the final address because the track bytes may contain absolute pointers.

After assembly, WL4Editor validates the track pointers and patches:

+ the Song Table entry;
+ the song header's bank pointer;
+ `ms`/`me`.

Songs that did not change but use a rebuilt bank get their **header bank pointer** patched in place. Their track data stays where it is.

### 2.5 Old chunks

Old chunks are invalidated. The chunk health scan runs after post-processing, so newly created bank chunks are not mistaken for orphans just because the Song Table has not been patched yet.

If a bank is not used by any non-empty song, the writer skips rebuilding it. A changed Program in an unused bank therefore does not produce a new bank chunk.

### 2.6 New samples and stable ids

When a new sample is added, the first save rewrites **all** sample chunks with `W4S2` trailers:

+ sample id;
+ sample name.

This is what makes ids stable across parser reloads. It is also why the first save after adding a sample can take noticeably longer and produce many chunks.

The alternative would be to renumber samples by first-reference order, which would break SF2 `Sxxxx` mappings and any edited sample names.

### 2.7 After Save

The dialog closes and WL4Editor reloads the ROM model. The project folder is **not** automatically re-exported. If you need fresh `.mid`, WAV, SF2, or `psg.json`, run **Export All** again after saving.

---

## 3. Recipes

### Recipe A: change notes in an existing song

Use this for a melody, chord, or rhythm change.

1. Export the project.
2. Back up the ROM and the `_sound` folder.
3. Open the song's `.s`.
4. Change the note/key/duration bytes.
5. Keep all labels and the bank pointer placeholder.
6. Import All.
7. Verify `changed songs: 1`.
8. Save.
9. Listen in an emulator.
10. If it is wrong, restore the backup and repeat with a smaller change.

Do not edit the `.mid` and expect it to be imported.

### Recipe B: change an instrument's sample

1. Export.
2. Open the relevant `samples/NNNN_Name.wav`.
3. Edit the PCM in Audacity or another editor.
4. Export as 16-bit mono WAV.
5. Import All.
6. Check `changed samples` and `changed banks`.
7. Save.

If the sample is shared, more than one bank may rebuild. That is normal.

### Recipe C: add a new sample

1. Open `WL4.sf2` in Polyphone.
2. Add the sample with a name matching `S####` (the writer's naming convention).
3. Assign it to an instrument/preset zone.
4. Save the SF2.
5. Import All.
6. Check `changed samples` and `changed programs`.
7. Save.

The first save writes all sample chunks with id/name trailers. This is expected. If the sample is not referenced by any Program, it may still become a chunk but no bank will use it.

### Recipe D: change pan or ADSR

Choose the correct level:

+ one track: edit `PAN`/`VOL` in `.s`;
+ one instrument: edit the Program/voice pan or SF2 zone pan;
+ one sample: edit the sample/SF2 sample pan;
+ one PSG Program: edit `psg.json`.

For SF2 ADSR:

1. open the preset in Polyphone;
2. change one of attack/decay/sustain/release;
3. save the SF2;
4. Import All;
5. Save;
6. listen.

ADSR is approximate. If the importer reports no change, the value may round back to the same 8-bit GBA value.

### Recipe E: change a PSG sound

1. Export.
2. Open `psg.json`.
3. Find the `bank`/`program` (and `sub` for a key-split/drum sub-voice).
4. Edit byte 3 for pan, or bytes 8..11 for ADSR.
5. Do not edit bytes 4..7 unless you know the wave pointer.
6. Save the JSON.
7. Import All.
8. Save.

PSG is not in the SF2. If you edit the SF2 and expect a PSG Program to change, it will not.

### Recipe F: add a new preset

1. Export.
2. Find a bank with an unused Program slot (use **Show Empty**).
3. In Polyphone, create a preset whose bank/program match that slot.
4. Keep the `VG...` name.
5. Save the SF2.
6. Import All.
7. Check that the Program is now marked as changed/used.
8. Save.

The new preset becomes a simple sample Program. It does not create a new bank and does not create key-split/drum sub-voices.

### Recipe G: fix a loop

1. Determine whether the loop is a **song loop** (`GOTO`/`PATT`/`REPT` in `.s`) or a **sample loop** (flag `0x40`/loop start).
2. For a song loop, edit the `.s` control flow and labels.
3. For a sample loop, edit the sample/SF2 loop points.
4. Import All, Save, listen.

Do not "fix" a sample loop by adding silence to the WAV. That changes the PCM and may move the loop relative to the audio.

### Recipe H: replace a sound effect

Sound effects are songs too. They may use:

+ a short sample Program;
+ a PSG Program;
+ a different bank from the music.

Find the song by name/id, check its bank, and edit the corresponding Program/sample. Do not assume the sound effect is in the same bank as the level music.

### Recipe I: restore the original

+ Before a save: **Cancel** discards staged edits.
+ After a save: restore the ROM and project backup.
+ If you only need original data: export from a clean ROM.
+ If the ROM is already modified: keep a clean copy and compare.

RATS chunks are invalidated and new ones are written. There is no general undo after Save.

---

## 4. Troubleshooting

| Symptom | Likely cause | What to do |
|---|---|---|
| Export All refuses | Staged sound changes | Save or cancel them first. |
| Import says `No changes` | Edited `.mid` | `.mid` is export-only; edit `.s`. |
| Import says `No changes` | Wrong project folder | Use the default `<rom>_sound` folder or pass the right one. |
| Import says `No changes` | WAV/PSG/SF2 hash matches | Make sure the file actually differs; check the manifest path. |
| `.s` save fails | ARM EABI missing/wrong | Configure the `bin` folder in the Patch Manager. |
| `.s` save fails | Bad label/track count | Keep the exported header/labels; change bytes incrementally. |
| Save fails with "bank outside ROM" | Corrupt/oversized project data | Restore a backup; check the bank/model. |
| Save fails on a key split | Too many sub-voices/unsupported layout | Reduce zones or use an existing compatible layout. |
| New SF2 preset skipped | Target Program used or out of bank data | Choose an unused in-range slot. |
| PSG change seems ignored | Bank not used by any non-empty song | Check the song's bank; edit a used bank. |
| Sample sounds wrong | WAV sample rate/pitch mismatch | GBA pitch is preserved; adjust voice pitch deliberately. |
| Sample clicks | Loop point/PCM mismatch | Fix the loop; do not just add silence. |
| Instrument is wrong | Wrong bank/Program | Check song header bank and track `VOICE`. |
| Whole song is silent | Bank/Program/sample pointer issue | Revert and test one change at a time. |
| SF2 preset missing | PSG Program | PSG is not exported to SF2; use `psg.json`. |
| MIDI sounds different | Lossy export/PSG/SF2 preview | MIDI is not the game; use it for notes only. |
| Changed count is large after a tiny edit | Shared sample/Program or new sample | Expected if the data is shared; check details. |
| Bank chunk not created | Bank unused by songs | Expected; the writer skips unused banks. |

### 4.1 "The importer says changed, but the game sounds the same"

Check in this order:

1. Did you press **Save**, not just Import All?
2. Did the ROM reload after Save?
3. Is the song id the one the game actually plays?
4. Does the song use the bank/Program you edited?
5. Is the sample/PSG change overridden by another layer (WAV vs SF2, track volume, etc.)?
6. Are you testing a different ROM copy?

### 4.2 "The song is silent after a save"

Do not keep saving over it. Restore the backup, then:

+ confirm the `.s` still has its track labels and header;
+ confirm the bank pointer in the Song header was patched;
+ confirm the track pointers are inside the new chunk;
+ check whether the bank was rebuilt and whether the Song header points at it.

A silent song is usually a pointer problem, not a volume problem.

### 4.3 "I ran out of space"

WL4Editor writes custom data into free RATS space. Large sample/bank changes can consume a lot. The retail ROM is finite.

Options:

+ remove unused samples/Programs if safe;
+ use smaller samples;
+ restore a clean ROM and re-apply only the needed changes;
+ avoid rewriting all samples unless a new sample requires it.

Always keep a clean ROM.

---

## 5. Sappy, MIDI, and the boundary of this tool

Sappy is a general GBA music editor. WL4Editor's Sound Manager is a WL4-specific project tool.

The division of labour is:

| Task | Better tool |
|---|---|
| Understand the whole WL4 sound project | Sound Manager |
| Edit song bytecode | `.s` in a text editor |
| Read/transcribe music | MuseScore + exported MIDI |
| Edit sampled instruments | Polyphone + SF2 |
| Edit raw PCM | Audacity + WAV |
| Edit PSG raw records | `psg.json` |
| Create a MIDI and compile it to M4A | Sappy/`mid2agb` |
| Save everything into WL4 chunks | Sound Manager |

Sappy-family features such as pattern/repeat commands, memory accumulation, PSG voices, key splits, drum kits, priority, echo, and ADSR all have counterparts in the WL4 data. The Sound Manager exposes the WL4 side; it does not try to be a full Sappy replacement.

A useful hybrid workflow:

1. Use Sappy/`mid2agb` to experiment with a MIDI-to-M4A conversion.
2. Export the resulting song from WL4Editor to `.s`.
3. Use that `.s` as a template.
4. Continue editing in the Sound Manager project.

Do not assume a `.s` produced by another tool is directly importable. Adapt the header, labels, and metadata first.

---

## 6. Current limits

These are real limits of the current implementation, not things you can fix by retrying:

+ complex key-split layouts that need more sub-voice slots than the bank holds are skipped with a warning;
+ a new SF2 preset can only occupy an unused, in-range Program slot and becomes a simple sample Program;
+ new banks are not created;
+ PSG is edited as raw bytes, not synthesized from scratch;
+ ADSR conversion is approximate;
+ changing an SF2 sample rate does not automatically change the GBA pitch;
+ `.mid` is export-only;
+ SF2 cannot represent PSG;
+ SFZ is not implemented;
+ banks unused by non-empty songs are not rewritten;
+ the first save after adding a sample rewrites all sample chunks to establish stable ids.

Knowing these limits is part of using the tool well. Most "bugs" reported by new users are one of these boundaries, not corruption.

---

## 7. A final safe workflow

For every serious edit:

1. Copy the ROM.
2. Export a clean project.
3. Copy the project folder.
4. Change one layer at a time: song, then sample, then instrument, then PSG.
5. Import All.
6. Read the counts and warnings.
7. Save.
8. Listen.
9. Export again if you need fresh files.
10. Keep the backup until the hack is finished.

That is slower than editing everything at once, but it makes every failure explainable.

---

Back to [Part 1: The ROM, the Banks, and the Vocabulary](tutorials.html#sound-manager-1.md), or [Part 2: Editing Songs, Samples, SF2 and PSG](tutorials.html#sound-manager-2.md).
