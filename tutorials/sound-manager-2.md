# WL4 Sound Manager from Zero, Part 2: Editing Songs, Samples, SF2 and PSG

---

This chapter assumes you have already exported a project and had a look at the folder. If not, read [Part 1](tutorials.html#sound-manager-1.md) first.

Here we will go through the actual editing surfaces:

+ the Sound Manager window;
+ the `.s` song source;
+ MuseScore and MIDI;
+ WAV samples;
+ Polyphone and SF2;
+ raw PSG records.

The important rule for the whole chapter is:

> The Sound Manager UI is a browser and a staging area. The editing happens in files. The ROM is changed only when you press **Save**.

That is not a limitation to work around; it is what makes the workflow recoverable.

---

## 1. The Sound Manager window

Open the ROM, then open **Sound Manager**.

The window has three useful areas:

1. a search/filter bar at the top;
2. a tree of entries on the left;
3. a read-only detail panel on the right.

The tree contains:

+ **Songs**
+ **Banks**
+ **Programs** under a bank
+ **Samples**
+ **Players**

The detail panel changes with the selected row. Song details show the bank, player, priority, echo, track count, `ms/me`, addresses, and state. Bank details show the bank id, base, role, and used programs. Program details show the 12 raw bytes, voice type, sample, key, pan, ADSR, and key-table/sub-voice information. Sample details show the header, flag, pitch, loop start, size, hash, and PCM information. Player details show the songs associated with that player.

### 1.1 Search and filters

The **Search** box filters by name and id. **Show Empty** reveals empty song slots and unused programs. **Show Changed** restricts the tree to entries marked as changed.

The filters are mutually exclusive in the current UI. If you turn on **Show Changed**, you will not see unchanged entries, which is useful before a save but confusing if you forget it is on.

### 1.2 Status words

The rows use these statuses:

| Status | Meaning |
|---|---|
| `Vanilla` | Still pointing at the original ROM data. |
| `Custom` | Already pointing at a WL4Editor chunk. |
| `Empty` | An empty song slot or unused program. |
| `Changed` | Staged for the next Save. |

`Changed: N` at the bottom is the important number. It counts staged songs, samples, programs, and other edits. If it is zero, **Save** has nothing to write.

### 1.3 Export All

**Export All** calls the exporter with the default project folder:

```text
<rom directory>/<rom name>_sound/
```

It refuses to export while anything is staged, because exporting would overwrite the project files you are editing. The dialog message specifically mentions `.s` imports, but the check also covers staged samples and Programs. Save or cancel first.

The export is a full snapshot. It writes:

+ all non-empty songs as `.s` and `.mid`;
+ all samples as `.wav`;
+ `soundfont/WL4.sf2`;
+ `psg.json`;
+ `soundmanifest.json`;
+ `README.txt`.

### 1.4 Import All

**Import All** reads the project folder and stages changes. It does not write the ROM. It compares hashes and file contents, then updates the in-memory model.

The order of precedence matters:

1. `.s` changes are staged for song chunks;
2. WAV changes are staged for sample chunks;
3. SF2 changes are staged for sample/program/bank changes;
4. `psg.json` changes are staged for PSG programs/sub-voices.

If a sample was changed by both WAV and SF2, WAV wins. That is deliberate: WAV is the direct PCM edit; SF2 is the instrument-level edit.

### 1.5 Save and Cancel

**Save**:

+ validates the staged model;
+ assembles changed `.s` files with the ARM EABI;
+ allocates RATS chunks;
+ writes sample chunks, bank chunks, and song chunks;
+ patches the Song Table and bank pointers;
+ invalidates old chunks;
+ updates the manifest hashes;
+ reloads the ROM model after the dialog closes.

**Cancel** discards staged edits after confirmation and reloads the model from the ROM. It does not undo a previous Save.

### 1.6 ARM EABI

Only `.s` saves need the assembler. Sample/WAV/SF2/PSG-only saves do not need it.

The Sound Manager uses the same EABI path as the Patch Manager. It does **not** pop its own folder picker: if the path is not configured, the song save fails with a message telling you to set the EABI `bin` directory in the Patch Manager first. Configure it there (the patch tutorial covers the download and folder selection), then return to the Sound Manager.

A useful habit is to test one trivial `.s` change first, before spending an hour on a large song edit.

---

## 2. Editing a song in `.s`

### 2.1 Start from the exported file, not from a blank file

The exporter writes the header, labels, metadata, and track bytes in the exact layout the importer expects. Use it as a template.

A typical structure:

```asm
@ WL4Editor MPlay source
@ wl4-song: 1
@ wl4-name: SoundWarioWalk
@ wl4-bank: 1

.text
.align 2

.global Song0001
Song0001:
.byte 1, 0, 10, 0
.byte 0, 0, 0, 0   @ Bank pointer placeholder
.word Song0001_Track00

Song0001_Track00:
.byte 0XBC, 0X00, 0XBB, 0X4B, 0XBD, 0X00, ...
```

The first four `.byte` values are:

```text
track_count, unknown, priority, echo
```

The next four bytes are the bank pointer placeholder. Do not replace it with a GBA pointer; WL4Editor fills it at save time.

The `.word` lines are track pointers. They must point at the track labels. If you add or remove a track, you must update the header and the pointer list consistently; for a first edit, keep the same number of tracks.

### 2.2 Labels and control flow

The exporter turns pointer operands into labels. For example, a `GOTO` may look like:

```asm
.byte 0XB2
.word Song0001_Loop
```

If you delete `Song0001_Loop`, the assembler will fail or the track will jump somewhere invalid. Keep labels, even if you move the code they point at.

`PATT`, `REPT`, and `GOTO` are control flow, not comments. A loop that sounds correct in a MIDI player can sound wrong in the game if its pattern/repeat boundaries are different.

### 2.3 Editing bytes safely

The safest edits are:

+ changing a note key/duration byte;
+ changing a `VOICE` program number;
+ changing `VOL`, `PAN`, `TEMPO`, `PRIO`, or `ECHO`;
+ changing a sample reference in a bank, not in the track;
+ changing ADSR in SF2 or PSG, not in the track.

For a first pass:

1. Copy the original `.s` to a backup.
2. Change one obvious value.
3. Import All.
4. Check `Changed`.
5. Save.
6. Listen in an emulator.
7. If something is wrong, restore the ROM/project backup.

Do not use a word processor. Use a plain text editor that preserves line endings and does not smart-quote characters. The `.s` is assembled by GNU `as`; Unicode punctuation is not valid assembly.

### 2.4 What the metadata comments do

The `@ wl4-*` comments describe the song:

```text
@ wl4-song: 1
@ wl4-name: SoundWarioWalk
@ wl4-bank: 1
@ wl4-player: 6
@ wl4-ms: 6
@ wl4-me: 6
@ wl4-priority: 10
@ wl4-echo: 0
```

They are useful for humans and for tools. The actual save is driven by the model and the assembly output. If you change `@ wl4-bank` but the song header still references another bank, do not expect the metadata comment alone to move the song. For bank changes, understand the song header and the `VOICE` command first.

### 2.5 Voice selection inside a song

A track selects a Program with a `VOICE` command (`0xBD`). The operand is a Program index in the current bank. The Program then decides whether it is a sample, PSG, key split, or drum kit.

If a song sounds like the wrong instrument, there are three different possible causes:

1. the track uses a different `VOICE` program than you thought;
2. the bank is different from the one you are editing;
3. the Program's voice/sample mapping changed.

The Sound Manager's song detail tells you the bank id. The bank/program detail tells you which Program is which. Check those before editing random bytes.

### 2.6 Volume, pan, and expression

`VOL`, `PAN`, and related commands are per-track performance controls. They are not the same as the Program's default pan or the sample's pan.

A useful rule:

+ if the whole instrument is in the wrong place, look at the Program/voice pan;
+ if one track is in the wrong place, look at the track `PAN`;
+ if the whole song is too quiet, look at `VOL` and the song/player settings before editing samples.

---

## 3. MuseScore, MIDI, and musical editing

### 3.1 What MuseScore is good for here

MuseScore is a notation program. It is excellent for:

+ reading the exported MIDI;
+ checking harmonies and rhythms;
+ transcribing a melody;
+ trying alternative voicings;
+ hearing a rough version with `WL4.sf2`.

It is not a WL4 track editor. It does not know about MPlay commands, WL4 banks, key-split Programs, PSG, or the difference between a song header and a track.

### 3.2 Loading the SoundFont

In MuseScore:

1. open the synthesizer/soundfont settings;
2. add `soundfont/WL4.sf2`;
3. select it as the playback soundfont;
4. open the exported `.mid`.

The result is a preview, not a recording of the GBA hardware. PSG parts will be missing or approximated. ADSR and loops may not match the game.

The exported `.mid` is format 0 and is deliberately simplified. It stops at `GOTO`, skips some pattern/repeat commands, and cannot represent key-split/drum voice graphs exactly.

### 3.3 Why you cannot just import the MIDI back

The Sound Manager imports `.s`, not `.mid`. A MIDI file has note events, but WL4 needs:

+ a song header with a bank pointer and track pointers;
+ compact MPlay bytecode;
+ correct loop/pattern semantics;
+ a bank/program context;
+ a sample/PSG voice graph.

Converting MIDI to M4A is a compiler problem. `mid2agb` does it for the Sappy family, but its output is not automatically the same layout as the Sound Manager's `.s`. Trying to treat MIDI as a lossless round-trip will produce confusing results.

### 3.4 A practical musical workflow

For an existing WL4 song:

1. Export the project.
2. Open the `.mid` in MuseScore for reference.
3. Make the musical decision in MuseScore or in your head.
4. Translate the decision into the `.s` bytes (or into SF2/WAV changes if it is a timbre change).
5. Import All, Save, listen.

For a brand-new song:

1. Compose in MuseScore.
2. Export a MIDI.
3. Use Sappy/`mid2agb` to produce M4A track bytes.
4. Use the exported WL4 `.s` as the header/label/metadata template.
5. Put the generated track bytes into that template, preserving the header, labels, and bank placeholder.
6. Import All and test in an emulator.

That last route is advanced. The Sound Manager gives you the safe save path and the byte-level source; it does not pretend that arbitrary MIDI is a drop-in song.

### 3.5 MIDI bank/program caveat

General MIDI program numbers are not WL4 program numbers. MuseScore's "instrument" is a GM concept. The exported `WL4.sf2` has presets named like:

```text
VG001P000
VG001P001
```

where the first group is the WL4 bank and the second is the Program index. MuseScore may not preserve that mapping when it exports MIDI, and it may reset bank-select/program-change events. Do not use MuseScore's exported MIDI as a guarantee that the game will select the same WL4 program.

For timbre work, use the SF2 in Polyphone, not GM program numbers in MuseScore.

---

## 4. Editing samples with WAV

### 4.1 The WAV format you should use

Export writes 16-bit mono WAV. Import accepts PCM 8/16/24/32-bit, mono or stereo, and converts to mono 8-bit signed GBA PCM.

For editing:

+ use 16-bit mono for the least surprising result;
+ keep the original length unless you intend to change the sample size;
+ do not add a long silent tail;
+ avoid clipping;
+ avoid sample-rate conversions unless you understand that the GBA pitch is separate.

### 4.2 What import changes

A WAV import changes the PCM and the size/hash. It does not automatically rewrite the GBA pitch from the WAV's sample rate. The original loop flag/loop start are also part of the sample/voice model, so do not assume a WAV editor's loop metadata will be imported.

If the WAV sample rate differs from the original, the Sound Manager warns. The safer approach is to keep the original rate and use the GBA pitch/voice tuning for pitch changes.

### 4.3 Replacing a sample with Audacity

1. Open the exported `samples/NNNN_Name.wav`.
2. Make a backup copy.
3. Edit the PCM.
4. Export as 16-bit mono PCM WAV.
5. Keep the original filename, or update the manifest path if you rename it.
6. In the Sound Manager, **Import All**.
7. Check the sample's `Changed` status.
8. Save.

If the sample is used by many Programs, the bank rebuild touches all banks that reference it. That is expected.

### 4.4 Looping

The GBA loop bit is `0x40` in the sample flag. The loop start is in sample bytes. A loop that sounds smooth in a WAV editor can click in the game if the loop point is not on a suitable boundary or if the PCM is changed without adjusting the loop.

The WAV exporter does not turn a WAV `smpl` chunk into a GBA loop. Use the Sound Manager's sample/program details and SF2 to understand the current loop, and test in an emulator.

### 4.5 WAV versus SF2 precedence

If both a WAV and the SF2 changed the same sample, WAV wins. This is useful when you want exact PCM control and still want to edit the instrument in SF2. It also means that an SF2 sample edit can appear to be ignored if the corresponding WAV is also staged.

---

## 5. Editing instruments in Polyphone (SF2)

### 5.1 What the SF2 is

`WL4.sf2` is a SoundFont 2 representation of the sampled parts of the WL4 banks:

+ one preset per sampled/key-split/drum Program;
+ one instrument per Program;
+ sample references;
+ key ranges;
+ loop mode;
+ root key;
+ pan;
+ approximate ADSR.

PSG Programs are not in the SF2. They live in `psg.json`.

### 5.2 Naming conventions you must not break

The writer uses:

```text
preset:  VG%03dP%03d
sample:  S%04d
```

Examples:

```text
VG001P000
VG003P042
S0000
S0405
```

The importer maps by these names. If you rename `VG001P000` to `My Piano`, the importer may no longer know which bank/program it belongs to. If you rename `S0000` to `Ukulele`, the sample mapping can fail.

You can edit the sound, but do not change the structured prefix unless you also understand the importer's mapping rules.

### 5.3 Editing a sample and its loop

In Polyphone:

1. open `WL4.sf2`;
2. find the sample `Sxxxx`;
3. inspect the loop start/end and sample mode;
4. edit the sample or its loop;
5. keep the sample rate in mind;
6. save the SF2.

The importer uses the sample PCM and loop information. A changed sample rate is not automatically applied to the GBA pitch; the GBA pitch is preserved. If you need a different playback rate, change the voice/sample pitch deliberately and test.

### 5.4 Editing pan and ADSR

ADSR conversion between M4A and SF2 is approximate. The M4A fields have engine-specific semantics:

+ attack is "larger = faster";
+ decay and release are "smaller = faster";
+ sustain is a 0..255 level.

The SF2 side uses timecents and centibels. The writer/importer compares the expected SF2 values against the current GBA values to avoid round-trip churn. If you nudge an ADSR value and the importer says "no change", the difference may be below the tolerance or may map back to the same 8-bit value.

A good workflow is:

1. change one envelope parameter;
2. import;
3. check `Changed`;
4. save;
5. listen;
6. compare with the original.

Do not expect a sample-accurate ADSR match between SF2 and GBA. The goal is musical behavior, not bit-identical envelopes.

### 5.5 Key splits and drum kits

A WL4 key-split Program has:

```text
Program +4 -> sub-voice base
Program +8 -> 128-byte key table
```

A drum kit has 128 key-indexed sub-voices.

The SF2 exporter represents these as multiple zones. The importer can update sample/pan/ADSR and remap keys when the layout fits the existing sub-voice slots. If the SF2 needs more sub-voices than the GBA bank physically has, the layout is skipped with a warning.

For a drum kit, each key is typically a different sample. For a key split, a range of keys selects a different instrument or articulation.

When editing in Polyphone, keep the key ranges sensible. Overlapping zones and zones outside 0..127 are common causes of warnings or skipped layouts.

### 5.6 Adding a new sample

The SF2 can contain a sample that does not exist in the GBA ROM. The importer creates a new sample slot:

+ assigns a new stable sample id;
+ copies the PCM;
+ sets pitch/loop/size/flag;
+ writes a `SoundSampleChunk` with a `W4S2` id/name trailer.

The first save after adding a new sample rewrites all sample chunks with id/name trailers so that existing sample ids stay stable. This is a large but one-time save.

### 5.7 Adding a new preset

A new SF2 preset can be written into an **unused, in-range GBA Program slot**. The importer creates a simple sample Program there:

+ bank id from the SF2 preset bank;
+ program index from the SF2 preset program;
+ sample from the first zone;
+ pan/ADSR applied from the zone.

It does not create a new bank. It does not invent sub-voice tables. It does not create a key-split/drum Program from scratch. If the target Program is already used, or the index is outside the bank data, the preset is skipped with a warning.

This is the practical way to add a new instrument if the bank has a free Program slot. Use Polyphone to create the preset, keep the `VG...` name, import, and check the Program detail.

### 5.8 PSG is not in SF2

SF2 is a sample-based format. The GBA PSG channels are synthesized by the hardware. There is no honest sample-free way to represent them in SF2. The Sound Manager therefore:

+ omits PSG Programs from the SF2;
+ records them as not exported to SF2 in the manifest;
+ exports their raw records to `psg.json`.

If a preset appears to be missing from the SF2, check whether its voice type is PSG before assuming an export bug.

---

## 6. Editing PSG records in `psg.json`

### 6.1 Why a separate JSON file

PSG voices are 12-byte hardware records. SF2 cannot hold them without faking them as samples. The sidecar keeps the actual bytes editable:

```json
{
  "format": "WL4Editor.psg",
  "version": 1,
  "programs": [
    {
      "kind": "program",
      "bank": 1,
      "program": 0,
      "name": "PsgSquare50",
      "raw": "013c007f0200000000000f00"
    }
  ]
}
```

There are also `kind: "sub"` entries for PSG sub-voices inside key-split/drum Programs.

### 6.2 Reading the 12 bytes

For the common PSG types:

| Byte | Meaning |
|---|---|
| `0` | Voice type (`0x01`, `0x02`, `0x03`, `0x04`, aliases `0x09..0x0C`) |
| `1` | Key |
| `2` | Type-specific/unused |
| `3` | Pan |
| `4..7` | Pointer/parameter word. For wave voices this is the wave pointer. |
| `8..11` | Attack, decay, sustain, release |

For a square/noise voice, do not assume `4..7` is a sample pointer. For a wave voice, `4..7` is a wave pointer and is rebased by the bank writer. Do not edit it unless you know the target address.

### 6.3 A safe PSG edit

To change pan:

1. open `psg.json`;
2. find the entry by bank/program;
3. change byte 3 in the hex string;
4. save the JSON;
5. Import All;
6. check `Changed`;
7. Save.

To change ADSR, change bytes 8..11. To change the PSG type, change byte 0, but then the rest of the record may no longer make sense. Treat type changes as advanced.

### 6.4 Program and sub-voice entries

`kind: "program"` edits the Program's own 12-byte voice.

`kind: "sub"` edits one sub-voice inside a key-split/drum Program:

```json
{
  "kind": "sub",
  "bank": 1,
  "program": 120,
  "sub": 3,
  "raw": "013c00000200000000000f00"
}
```

The `sub` index is the local index in the sub-voice list, not a ROM address.

### 6.5 What happens on save

The importer marks the containing Program as changed. The bank writer copies the bank, rebases internal pointers, writes the raw PSG bytes, and rebuilds the bank chunk. PSG wave pointers are preserved/rebased, not blindly overwritten with the JSON's old pointer.

Banks that no non-empty song uses are not rewritten. If you edit a PSG Program in an unused bank and nothing changes in the exported ROM, check whether any song actually selects that bank.

---

## 7. Banks, Programs, and "which instrument is this?"

The most common navigation problem is selecting the wrong level.

Use this order:

1. **Song** — which bank does its header select?
2. **Track `VOICE`** — which Program index does the track select?
3. **Program** — is it sample, PSG, key split, or drum?
4. **Voice/sample** — which sample or wave does it use?

A bank can contain 128 Programs, but not all are used. The Sound Manager marks unused entries. A Program can be used by several songs.

If you change a Program, you may affect every song that selects it. If you only want to change one song, copy the Program to a free slot and change the `VOICE` operand in that song's track, or use a separate bank. Plan this before editing.

---

## 8. Editing checklist

Before Import All:

+ [ ] I exported a clean project.
+ [ ] I backed up the ROM and the project folder.
+ [ ] I know whether I am changing a song, sample, Program, bank, or PSG record.
+ [ ] I kept `.s` labels and the bank pointer placeholder.
+ [ ] I did not rename `Sxxxx`/`VG...` SF2 entries.
+ [ ] I know WAV wins over SF2 for the same sample.
+ [ ] I kept the track count/order if I did not intend to change it.

Before Save:

+ [ ] The Changed count is what I expect.
+ [ ] The detail panel shows the values I intended.
+ [ ] The ARM EABI path is configured if I changed a song.
+ [ ] I am saving the project I think I am saving.

After Save:

+ [ ] The ROM reloads without errors.
+ [ ] I listened in an emulator.
+ [ ] I re-exported if I need fresh `.mid`/WAV/SF2/PSG files.
+ [ ] I kept the pre-edit backup.

---

Continue with [Part 3: Import, Save, Recipes and Troubleshooting](tutorials.html#sound-manager-3.md).
