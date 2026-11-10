# WL4 Sound Manager from Zero, Part 1: The ROM, the Banks, and the Vocabulary

---

This is the first of three chapters about the **Sound Manager** in WL4Editor.

It is written for someone who wants to change Wario Land 4's music or sound effects, but does not already know the GBA sound format. You do **not** need to know ARM assembly to use the basic workflow. You do need to understand a few objects in the ROM, because almost every mistake in sound editing is really a mistake about one of these objects:

+ a song is not a MIDI file;
+ an instrument is not a sample;
+ a bank is not a folder of WAVs;
+ changing a byte in the ROM does not automatically change the project file;
+ saving a project does not automatically rewrite the exported files.

The Sound Manager is a **project exporter/importer and a chunk writer**, not a DAW. Once that is clear, the rest is much less mysterious.

---

## 1. The one-sentence model

For the common sampled-instrument case, read the WL4 sound system like this:

```text
Song Table
  -> Song header (bank pointer + track pointers)
      -> Track bytecode (MPlay/M4A commands)
          -> Bank
              -> Program (a "voice" slot)
                  -> Voice
                      -> Sample (PCM) or PSG settings
```

A song does not contain its instruments. It selects a bank. The bank contains programs. A program points at a voice. A voice points at a sample, or describes a PSG channel.

That is why replacing a WAV can change many songs at once, while editing one `.s` file normally changes only one song.

---

## 2. Addresses: file offsets, GBA pointers, and RATS

There are two address languages in WL4 hacking, and mixing them up is a classic source of corrupted saves.

### ROM file offset

This is the byte position in the `.gba` file:

```text
0x0000000  first byte of the file
0x0098028  the Song Table in the US ROM
0x0232E0   the first song header
0x078F970  roughly where WL4Editor's save area begins
```

The Sound Manager shows **file offsets**. When it says a sample header is at `0x000999C4`, that is a position in the file.

### GBA pointer

The game itself uses addresses that look like `0x08xxxxxx`:

```text
file offset 0x000999C4  ->  GBA pointer 0x080999C4
```

The conversion is:

```text
pointer = file_offset + 0x08000000
file_offset = pointer - 0x08000000
```

The Sound Manager performs this conversion at the boundary. In the exported files and in the UI, you will mostly see file offsets.

### Little-endian

A 32-bit pointer such as `0x080999C4` is stored in the ROM as:

```text
C4 99 09 08
```

Low byte first. This is why a hex editor view can look "backwards" compared with a value shown in a document.

### RATS

RATS is the ROM Allocation Tag System used by WL4Editor for save data. WL4Editor writes custom sound data into chunks in the free space after the main ROM, and stores a small RATS header in front of each chunk.

The sound chunks used by this feature are:

| Type byte | Chunk | What it holds |
|---|---|---|
| `0x17` | `SoundBankChunk` | A rebuilt bank's voice data, plus a `W4BK` trailer |
| `0x18` | `SoundSongChunk` | A rebuilt song header and its tracks |
| `0x19` | `SoundSampleChunk` | A 16-byte sample header, PCM, and a `W4S2` trailer |

WL4 does **not** use a `SoundListChunk` in this design. The original Song Table already contains direct pointers to song headers, so WL4Editor patches those pointers instead of introducing a second song list.

---

## 3. Terminology table

Read this once now, then come back when a later section uses a term you have forgotten.

| Term | What it actually is in WL4 |
|---|---|
| **Song** | One playable piece of music or sound effect. A song is a header plus one or more track byte streams. |
| **Song Table** | An array of 819 eight-byte entries at `0x98028`. Each entry points at a song header and stores two small player-related values, commonly called `ms` and `me`. |
| **Song slot** | One index in the Song Table. Many slots are empty. The US ROM has 659 non-empty songs in the current export. |
| **Song header** | Four bytes of flags/priority/echo, a bank pointer, and a list of track pointers. |
| **Track** | One MPlay/M4A byte stream. A song can have several tracks, one per musical part. |
| **MPlay / M4A** | The GBA music driver family used by WL4 and by Sappy. It reads compact byte commands and drives voices. |
| **MPlay command** | A byte-level instruction such as `VOICE`, `TEMPO`, `PAN`, `GOTO`, or a note with a duration. |
| **Bank** | A table of up to 128 Programs, plus the voices those Programs use. Banks are selected by the song header. |
| **Program** | One 12-byte entry in a bank. A Program selects a voice type and parameters. In MIDI language it is roughly "the instrument slot", but not exactly. |
| **Voice** | The 12-byte record that tells the engine how to play a Program: sample pointer, key, pan, envelope, key-split table, or PSG settings. |
| **Sub-voice** | A voice record used by a key-split or drum-kit Program. A key-split Program has a table of many sub-voices. |
| **Sample** | A block of 8-bit signed PCM plus a 16-byte header. |
| **Sample header** | Flag byte, pitch, loop start, and PCM size. It is not a WAV header. |
| **PSG** | The GBA's programmable sound generator channels: square wave 1/2, wave, and noise. PSG voices have no PCM sample. |
| **ADSR** | Attack, Decay, Sustain, Release. In WL4 these are four 8-bit voice fields with M4A-specific semantics. |
| **Key split** | A Program whose output depends on the MIDI key. Different keys can use different sub-voices/samples. |
| **Drum kit** | A Program with 128 sub-voices indexed by key. Each key is usually a different percussion sample. |
| **Bank 0 / Bank 5** | Special sub-banks in WL4: key-split material and rhythm material. They are not ordinary "music folders". |
| **`.s` file** | The authoritative, editable MPlay assembly source exported by the Sound Manager. |
| **`.mid` file** | A lossy MIDI preview/notation export. It is not the source of truth and is not imported. |
| **`.wav` file** | An editable PCM view of one sample. Import converts it back to GBA 8-bit PCM. |
| **`.sf2` file** | A SoundFont 2 bank used with Polyphone, MuseScore, DAWs, and other samplers. It is a preview/editing representation, not a byte-exact copy of the GBA engine. |
| **`psg.json`** | A sidecar containing raw 12-byte PSG Program/sub-voice records, because SF2 cannot represent PSG. |
| **`soundmanifest.json`** | The project index: names, IDs, ROM offsets, hashes, file paths, and SF2/PSG hashes. |
| **RATS** | The chunk container used by WL4Editor for custom saved data. |
| **`W4BK`** | The eight-byte trailer that tells the parser which bank id a `SoundBankChunk` represents. |
| **`W4S2`** | The trailer that stores a sample's stable id and name in a `SoundSampleChunk`. |
| **MS / ME** | The two small player-related values in a Song Table entry. In the Sound Manager UI they appear as `ms / me`. |
| **Player** | One of the eight player definitions. Players group songs and carry playback context; `ms`/`me` relate songs to players. |

---

## 4. What is actually in the US ROM

The following values are the useful landmarks for the retail US `AWAE` ROM. They are the values the Sound Manager uses when it parses a vanilla ROM.

| Item | File offset / count |
|---|---|
| Song Table | `0x98028` |
| Song Table entry size | 8 bytes |
| Song slots | 819 |
| Non-empty songs in the retail export | 659 |
| Player Table | `0x97FC8` |
| Player count | 8 |
| Voice pool start | `0x956E4` |
| Sample region start | `0x999C4` |
| Song region start | `0x232E0` |
| Program count per bank | 128 |
| Program entry size | 12 bytes |
| Physical sound banks | 10 (ids 0,1,2,3,5,6,7,8,9,10; id 4 is absent) |
| Exported samples | 405 |
| PCM bytes | 1,665,498 |
| Program entries in use across banks | 1,022 |
| Approximate unique voice/sub-voice records | 824 |
| PSG records in the clean export | 702 |

The "bank 4 is absent" detail matters: never assume the bank id is a contiguous index into an array of ten pointers. The Sound Manager uses a bank-id table, and bank 4 simply has no base.

### 4.1 The Song Table

Each entry is:

```text
u32 header_pointer   (GBA pointer, 0x08xxxxxx)
u16 ms
u16 me
```

At file offset `0x98028 + song_id * 8`.

A song id is just the index. It does not imply a level, a world, or a file name. The names in the Sound Manager come from a separate name database and from the SoundFont export metadata.

Empty slots are normal. The Sound Manager marks them `Empty`; do not try to "repair" them by pointing them at arbitrary data.

### 4.2 The Song header

The header begins with:

```text
+0  u8   track_count
+1  u8   unknown / flags
+2  u8   priority
+3  u8   echo
+4  u32  bank_pointer
+8  u32  track_pointer[0]
+12 u32  track_pointer[1]
...
```

`track_count` is the number of track pointers that follow. The first four bytes are also visible in an exported `.s` file as four `.byte` values:

```asm
.byte 1, 0, 10, 0
.byte 0, 0, 0, 0   @ Bank pointer placeholder
.word Song0001_Track00
```

The bank pointer is a real GBA pointer in the ROM. In the exported `.s` it is a **place-holder**, because the bank may move when WL4Editor rebuilds it. The importer fills the actual bank address at save time.

`priority` and `echo` are song-level playback properties. They are not per-instrument settings.

### 4.3 Tracks and MPlay commands

A track is a byte stream. It is not a standard MIDI track, and it is not a list of fixed-size events. The engine reads one command byte, decides how many argument bytes belong to it, and continues.

Some important commands:

| Byte | Name | Meaning in practice |
|---|---|---|
| `0xB1` | `FINE` | End of track. |
| `0xB2` | `GOTO` | Jump to a label; commonly used for an infinite loop. |
| `0xB3` | `PATT` | Pattern marker. |
| `0xB5` | `REPT` | Repeat/pattern control. |
| `0xB9` | `MEMACC` | Memory accumulation command. |
| `0xBA` | `PRIO` | Priority. |
| `0xBB` | `TEMPO` | Tempo. |
| `0xBC` | `KEYSH` | Key shift. |
| `0xBD` | `VOICE` | Select a Program in the current bank. |
| `0xBE` | `VOL` | Volume. |
| `0xBF` | `PAN` | Pan. |
| `0xC0` | `BEND` | Pitch bend. |
| `0xC1` | `BENDR` | Bend range. |
| `0xC2` | `LFOS` | LFO speed. |
| `0xC3` | `LFODL` | LFO delay. |
| `0xC4` | `MOD` | Modulation. |
| `0xC5` | `MODT` | Modulation type. |
| `0xC8` | `TUNE` | Fine tuning. |
| `0xCD` | `XCMD` | Game-specific extended command. |
| `0xCE` | `EOT` | End of tie/note context. |
| `0xCF` | `TIE` | Tie. |
| `0xD0` and above | notes | Note with a timeout/duration encoded in the following bytes. |

There are also waits and running-status argument bytes. A single "line" in the `.s` file may therefore contain several commands, and a note may be followed by a compact duration byte instead of a full MIDI-style event.

This is why the `.s` file is authoritative: it preserves the byte stream. MIDI has to throw information away to fit this into note events.

### 4.4 Banks

The retail bank layout is:

| Id | Name | Role | Base |
|---|---|---|---|
| 0 | KeySplitBank | sub-bank | `0x956E4` |
| 1 | SoundEffects | music | `0x957EC` |
| 2 | SunnySideUp | music | `0x95DEC` |
| 3 | GeneralMusic | music | `0x963E0` |
| 5 | RhythmSet | sub-bank | `0x969E0` |
| 6 | SfxSet | sub-bank | `0x96CBC` |
| 7 | VoiceSet | sub-bank | `0x96F98` |
| 8 | SfxCdSet | sub-bank | `0x97274` |
| 9 | WarioVoiceSet | sub-bank | `0x97520` |
| 10 | ReverseWind | music | `0x977F0` |

The names are descriptive, not a strict rule about what every song does. A music song can select a sub-bank; a sound effect can share a bank with music. The bank id in the song header is what matters.

A bank is up to 128 Programs. Each Program is 12 bytes. A bank also contains the voice records those Programs point at, and often key-split tables. The bank is therefore a **graph of pointers inside one region**, not a flat list of instruments.

### 4.5 The 12-byte Program entry

The common layout is:

| Offset | Size | Meaning |
|---|---|---|
| `+0` | 1 | Voice type |
| `+1` | 1 | Key / root key |
| `+2` | 1 | Usually unused or type-specific |
| `+3` | 1 | Pan (often with `0x80` set) |
| `+4` | 4 | Sample pointer, wave pointer, or sub-voice base pointer |
| `+8` | 4 | Key-split table pointer, or ADSR bytes for a simple sample voice |

The last four bytes are context-dependent. This is the single most important trap in the whole format:

+ for a simple sample voice, `+8..+11` are attack/decay/sustain/release;
+ for a key-split Program, `+8..+11` are a pointer to a 128-byte key table;
+ for some other types, they may be unused or type-specific.

That is why WL4Editor's bank writer does not blindly copy the same four bytes for every voice type. It patches sample voices, key-split tables, drum sub-voices, and PSG records differently.

### 4.6 Voice types

| Value | Type | Meaning |
|---|---|---|
| `0x00` | Sample | Direct sample voice. |
| `0x08` | SampleFixed | Sample voice with fixed/alternate behavior. |
| `0x01` | PSG Square 1 | GBA square channel 1. |
| `0x02` | PSG Square 2 | GBA square channel 2. |
| `0x03` | PSG Wave | GBA wave channel. |
| `0x04` | PSG Noise | GBA noise channel. |
| `0x09` | PSG Square 1 Alias | Alias/alternate form. |
| `0x0A` | PSG Square 2 Alias | Alias/alternate form. |
| `0x0B` | PSG Wave Alias | Alias/alternate form. |
| `0x0C` | PSG Noise Alias | Alias/alternate form. |
| `0x40` | Key Split | Program contains a 128-key table of sub-voices. |
| `0x80` | Drum Kit | Program contains 128 key-indexed sub-voices. |

`0x40` and `0x80` are the two "multi-voice" types. They are why the SoundFont export needs more than one SF2 zone for a single GBA Program.

### 4.7 The 16-byte sample header

Samples are not WAV files in the ROM. A sample is:

```text
+0  ..  +2   three header bytes (type/flags; usually left as-is)
+3           flag; bit 0x40 means looped
+4  u32      pitch, in sample-rate units of 1/1024 Hz
+8  u32      loop start, in sample bytes
+12 u32      PCM size, in bytes
+16 ...      signed 8-bit PCM
```

The pitch value is why a WAV's sample rate is not automatically the GBA pitch. The Sound Manager preserves the GBA pitch when importing a WAV or SF2 sample; it does not silently rewrite pitch from the file's sample rate. If you pitch a sample in a WAV editor, the GBA playback may still use the old pitch unless you deliberately change the voice/sample parameters.

The PCM is **signed 8-bit mono** in the ROM. The WAV exporter writes 16-bit mono for editing convenience, and the importer converts back down. That conversion is lossy in the sense that the GBA data only has 8-bit resolution to begin with.

### 4.8 PSG, key split, and drum kit

PSG voices do not use samples. They program the GBA's square/wave/noise hardware. Their 12-byte records still have a type, key, pan, pointer/parameter words, and ADSR-ish fields, but the meaning of `+4..+7` differs by PSG type. For wave voices it is a pointer to wave data; for square/noise it is not a PCM sample pointer.

Key-split Programs use:

```text
Program +4 -> sub-voice base
Program +8 -> 128-byte key table
key_table[key] -> index into the sub-voice array
```

Drum-kit Programs use 128 sub-voices directly indexed by key. Each sub-voice is another 12-byte voice record with its own sample/pan/ADSR.

This is exactly the structure SF2 expresses with instruments and key ranges. SF2 calls the whole thing a "preset/instrument/zone" graph; WL4 calls it a bank/program/voice. They are similar ideas, not identical files.

---

## 5. What the `.s` file really is

An exported song looks like this (abridged):

```asm
@ WL4Editor MPlay source
@ wl4-song: 1
@ wl4-name: SoundWarioWalk
@ wl4-bank: 1
@ wl4-player: 6
@ wl4-ms: 6
@ wl4-me: 6
@ wl4-priority: 10
@ wl4-echo: 0

.text
.align 2

.global Song0001
Song0001:
.byte 1, 0, 10, 0
.byte 0, 0, 0, 0   @ Bank pointer placeholder
.word Song0001_Track00

Song0001_Track00:
.byte 0XBC, 0X00, 0XBB, 0X4B, 0XBD, 0X00, 0XBE, 0X2F
.byte 0XBF, 0X40, 0XD0, 0X3C, 0X64, 0X83, 0X37, 0X34
```

The `.s` file contains:

+ metadata comments (`@ wl4-*`) for names, player, priority, echo, and source ids;
+ the song header;
+ one label per track;
+ the track bytes, usually with a source-offset comment at the end of each line.

The labels are not decoration. `GOTO`, `PATT`, and `REPT` refer to addresses inside the stream. The exporter turns those addresses into labels, and the assembler resolves them again. If you hand-edit a label or delete a line, you can change the meaning of a jump.

The bank pointer is deliberately a placeholder. WL4Editor fills it from the model, because the bank may be rebuilt as a `SoundBankChunk` and therefore move.

The `.s` importer expects this **WL4Editor MPlay source layout**. It is not a general-purpose `mid2agb` file importer. A `.s` produced by another tool can be useful as a reference or as a source of track bytes, but it must be adapted to this header/label/metadata convention before the Sound Manager can assemble it.

---

## 6. MIDI, M4A, and Sappy: three different things

This is the part that causes the most confusion, so it is worth slowing down.

### 6.1 What MIDI is good at

A MIDI file is a stream of events:

+ note on/off, with a key number 0..127 and a velocity;
+ channel 0..15;
+ program change 0..127;
+ controllers such as volume, pan, bend, modulation, and bank select (CC0/CC32);
+ tempo and time signature;
+ markers.

Time is expressed in ticks and a PPQ (pulses per quarter note) resolution, not in GBA sample frames. It does not contain audio. It does not contain GBA samples. It does not know what a WL4 bank is. When you play a MIDI file, the sound depends entirely on the synthesizer and the soundfont you load.

MIDI is excellent for:

+ notation;
+ composing;
+ transcribing;
+ checking rhythm and harmony;
+ moving ideas between DAWs and notation software.

### 6.2 What M4A adds

The GBA M4A/MPlay engine adds concepts that MIDI does not have in the same form:

+ a bank/program selection tied to a specific ROM bank;
+ byte-level tracks with compact waits and running status;
+ `PATT`/`REPT`/`MEMACC` pattern and memory operations;
+ song priority and echo;
+ PSG channels with hardware-specific parameters;
+ key-split and drum-kit voice graphs;
+ GBA ADSR fields with engine-specific semantics.

`mid2agb` is the classic Sappy-family tool that compiles a MIDI file into an M4A assembly source. It is useful, but it is a **compiler with opinions**: it chooses encodings, handles loops through markers, and emits a particular source layout. The result is not automatically a byte-identical WL4 song.

### 6.3 What the Sound Manager exports

The Sound Manager exports MIDI as a **lossy convenience file**, not as the authoritative source.

Current behavior:

+ format 0 MIDI;
+ waits, notes, tempo, program, and some controllers;
+ ignores `GOTO` entirely and keeps scanning the remaining byte stream;
+ skips `PATT`, `REPT`, `MEMACC`, and running-status-only details;
+ does not represent PSG, key-split/drum graphs, or GBA ADSR;
+ is not imported by the Sound Manager.

So the correct mental model is:

```text
.s   = source of truth, editable, imported
.mid = preview/notation/reference, not imported
```

### 6.4 Why export MIDI at all?

Because it is very useful to **look** at the music and to **hear** it with a soundfont.

A practical workflow is:

1. Export the project.
2. Open the exported `.mid` in MuseScore.
3. Load `soundfont/WL4.sf2` in MuseScore's synthesizer.
4. Use the MIDI as a visual/notation reference.
5. Make musical decisions.
6. Edit the `.s` file for the actual game data.
7. Import the `.s` back through the Sound Manager.

If you are composing a completely new song, MuseScore is still useful, but the final conversion to WL4 track bytes is a separate step. You can use Sappy/`mid2agb` to learn how MIDI becomes M4A, or use the exported `.s` as a template and replace its track bytes. The Sound Manager does not have a "MIDI import" button, and adding one would not be a trivial lossless operation.

### 6.5 What Sappy adds beyond a basic MIDI workflow

Sappy is an editor around the same M4A family. Depending on the game and engine, Sappy-related tools expose:

+ bank/program editing;
+ voicegroups;
+ sample import and looping;
+ PSG voices;
+ key splits and drum kits;
+ ADSR;
+ song priority and echo;
+ pattern/repeat and memory commands;
+ MIDI-to-M4A compilation.

`mid2agb`-style workflows typically use special loop markers (commonly `[` and `]`) and bank-select/program-change events to decide where the song loops and which voice it uses. Those are compiler conventions. WL4's own loops live in the MPlay bytecode (`GOTO`, `PATT`, `REPT`), not in a MIDI marker list. That is another reason a MIDI file is a preview rather than a drop-in WL4 song.

WL4 uses a lot of this:

+ 819 Song Table slots, with 659 non-empty songs;
+ direct song headers and track pointers, not a generic song list;
+ ten physical banks with special sub-banks (key-split, rhythm, SFX, voices);
+ PSG Programs in the banks;
+ key-split and drum-kit Programs;
+ real sample data in 405 samples.

WL4 also has its own fixed tables and pointers. That is why WL4Editor writes native chunks and patches the Song Table, rather than treating the ROM as a generic Sappy project.

---

## 7. The sound project folder

`Export All` writes a folder next to the ROM:

```text
<rom directory>/<rom name>_sound/
    soundmanifest.json
    README.txt
    psg.json
    songs/
        0001_SoundWarioWalk.s
        0001_SoundWarioWalk.mid
        ...
    samples/
        0000_InstrumentUkuleleG2.wav
        ...
    soundfont/
        WL4.sf2
```

What each part is for:

| Path | Role |
|---|---|
| `songs/*.s` | Authoritative song source. Edit this for actual game changes. |
| `songs/*.mid` | Lossy preview/notation. Never treated as the source. |
| `samples/*.wav` | Editable PCM view. Import replaces the PCM; the loop/sample parameters need care. |
| `soundfont/WL4.sf2` | Editable instrument/sample representation for Polyphone and MuseScore. |
| `psg.json` | Raw PSG records, because SF2 omits PSG. |
| `soundmanifest.json` | IDs, names, addresses, hashes, file mappings. Do not hand-edit casually. |
| `README.txt` | A short reminder of the folder layout. |

The manifest is not a decorative index. The importer uses its hashes to decide which files changed. If you edit a file but the manifest still has an old hash, the import may still detect the file change, but it will not know the intended mapping if you renamed files or IDs. Treat the manifest as generated metadata.

---

## 8. First export walkthrough

You do not need to edit anything yet. The goal of this first pass is to see the shape of the data.

1. Open the US WL4 ROM in WL4Editor.
2. Open the **Sound Manager**.
3. Look at the tree. You should see songs grouped by category (BGM, SFX, voice, fanfare, etc.), plus banks, programs under each bank, samples, and players.
4. Press **Export All**.
5. Open the generated `<rom>_sound` folder.
6. Open one `.s` file in a text editor. Find its `Song...:` label and its `Track...:` labels.
7. Open the same song's `.mid` in MuseScore. Compare the note layout with the `.s` bytes; notice that the `.s` has byte commands, not notes with a time signature.
8. Open `soundfont/WL4.sf2` in Polyphone. Look at a few presets and note their names.
9. Open `psg.json` and find a PSG program. Notice that it has a raw 12-byte hex string, not a WAV.
10. Close everything without saving.

At this point you have a complete, reversible snapshot. Keep it. Before any serious edit, make a second copy of the ROM and of the project folder.

---

## 9. What comes next

Part 2 is the editing chapter:

+ the Sound Manager UI and what each status means;
+ how to edit a song in `.s` without breaking its labels;
+ how to use MuseScore and the SF2 for musical work;
+ how to replace samples in Audacity;
+ how to edit presets, key splits, drums, and ADSR in Polyphone;
+ how to edit PSG records in `psg.json`.

Part 3 is the import/save and recipe chapter:

+ exactly what Import All does;
+ how the chunk writer rebuilds banks and songs;
+ step-by-step recipes for common changes;
+ troubleshooting and the current limitations.

---

Continue with [Part 2: Editing Songs, Samples, SF2 and PSG](tutorials.html#sound-manager-2.md).
