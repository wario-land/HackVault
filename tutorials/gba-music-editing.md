# Insert custom midi in GBA Games

In this short tutorial I am going to show you how to insert custom music in gba games (Sappy Compatible)
More precisely I will insert a custom midi in Wario Land 4 with looping.
We will try to use cross-platform free software.

## Preparing the midi

### Why ?

Why the hell should we prepare midi ? Can't we just insert it without touching it ?
Well, not really...
Most untouched midi will sound bad in the game.
And it is always a plus to be able to choose instruments.

So let's choose a midi file !

Let's take the tune of [angry bird][angry-bird-midi] !

To here a more or less accurate ingame version of the midi, you might need the wario land 4 soundfont.

The audio file plays like this with the soundfont :

<audio controls>
  <source src="tutorials/sounds/AngryBirdsWithSoundFont.ogg" type="audio/ogg">
  Your browser does not support the audio tag.
</audio>

So it doesn't look so bad, right ?
And if we process the steps further without touching this midi we'll obtain this :

<audio controls>
  <source src="tutorials/sounds/AngryBirdsInGame.wav" type="audio/wav">
  Your browser does not support the audio tag.
</audio>

It is ugly as hell, right ? So as I say, it is more or less acurrate. In the present case the instrument isn't quite defined in the game.
So now you now why this step is esssential.

### How ?

We need to find an instrument that is defined and that it sound good with the current midi.
In our case it will be the main instrument in Hall of Hieroglyph level.

The original Hall of Hieroglyph level music :
 <audio controls>
  <source src="tutorials/sounds/HallofHieroglyph.wav" type="audio/wav">
  Your browser does not support the audio tag.
</audio>

So how to put that main instrument in our Angry Bird song ?

Then we need a software that enable us to quickly change between different instruments in order to test them quickly.
It must support soundfont switching so we can put the Wario Land 4 soundfont.

In our case I choose [MuseScore][musescore].
A FOSS cross-platform midi editor with a nice UI. (The UI is actually quite bad, I actually can't believe Kleyman likes it - IamRifki) (correction : with a nicer UI than anvil studio :P - Kleyman) 

![Image](tutorials/images/gba-hacking/MuseScore.png)

You have to put the Wario Land 4 Sounfont in the right folder (C:\Users\<Put Your User Name>\Documents\MuseScore3\SoundFonts)

![Image](tutorials/images/gba-hacking/MuseScoreSoundfont.png)

Then select View -> Synthesizer and select the soundfont.



Press F10 and select instruments.
Select an instrument that is likely to be used in game.
Don't forget to test it.
In our case, it will be "Hall of Hieroglyph".

![Image](tutorials/images/gba-hacking/MuseScore1.png)

![Image](tutorials/images/gba-hacking/MuseScore2.png)

One issue is that the midi export doesn't work well.

So we are going to see what really matter, the Bank and the Program used by the instrument.

![Image](tutorials/images/gba-hacking/MuseScore3.png)

The we are going to use another tool : [MidiQuickFix][midi-quick-fix]
You'll need java to use it.

Launch it (with cmd.exe java -jar MidiQuickFix.jar)

![Image](tutorials/images/gba-hacking/MidiQuickFix.png)

Open AngryBird.mid and choose Track Editor.
Unfortunately we can't see the hex value of the instrument so we are going to modify the PATCH value by hand.
In all case we need to add a bank select instruction and set it to 2 to match our instrument.

![Image](tutorials/images/gba-hacking/MidiQuickFix1.png)

![Image](tutorials/images/gba-hacking/MidiQuickFix2.png)

We are also going to add a loop that will work ingame.
You need to add 2 Markers "[" and "]" at some position in time to set the loop boundary.

Select Insert -> Meta Event -> Marker and use one of the two character.
Place them at different time position in the right order.

![Image](tutorials/images/gba-hacking/MidiQuickFix3.png)

Let's open the midi file in a hexadecimal editor (like [HxD][hxd] for example)

We can see the bank select instruction : "00 B0 00 02"

But what we want to do is to fit the instrument.
As we have seen in MuseScore the program instrument is 16 so 0x10 in hexadecimal.

We need to put it right after the C0 (or Cx with x the instrument number counting from 0)
Let's change the PATCH event :
"00 C0 00" -> "00 C0 10"

![Image](tutorials/images/gba-hacking/HxD.png)

Also the Bank select instruction must be placed before the PATCH instruction to work correctly
So cut/paste the instruction like in the following pictures

![Image](tutorials/images/gba-hacking/HxD1.png)

![Image](tutorials/images/gba-hacking/HxD2.png)

You should get [this midi][modified-midi].

We can listen the midi again in [VLC][vlc] to make sure it match the instrument.
Select the wario land 4 soundfont in VLC (CTRL-P to open preferences and go to advanced option)

![Image](tutorials/images/gba-hacking/VLC.png)

<audio controls>
  <source src="tutorials/sounds/AngryBirdsModifiedWithSoundFont.ogg" type="audio/ogg">
  Your browser does not support the audio tag.
</audio>

Sound good.
Now let's talk about the insertion.

## Insertion of the midi

The easiest way is use [Mid2Agb and Sappy][sappy-and-mid2agb].


I will use a virtual machine to launch sappy but I won't describe it here because it takes time and it's out of the scope of this tutorial.
If you lucky enough Sappy will work out of the box in your computer, but otherwise you'll need to do the same kind of setup (Or, run compatibility mode. :p -IamRifki). 

If you use a virtual machine, put the the rom, the midi and the sappy & mid2agb installer in a shared folder.
Extract the archive with a tool like [7-Zip][7-zip]

Make sure your midi filename doesn't contain special characters.
Then drag and drop (or use cmd.exe) your midi to mid2agb.exe.

![Image](tutorials/images/gba-hacking/VirtualMachine.png)

You should get a ".as" file.

Open Sappy.
Select the wario land 4 rom.

![Image](tutorials/images/gba-hacking/VirtualMachine1.png)

Select the right [track number][tracks-info] (listen to make sure it is a good fit)
In our case this is 672 (0x2A0 in hexadecimal).

Select assemble song.

![Image](tutorials/images/gba-hacking/VirtualMachine2.png)

Select the ".as" file with the same name as your midi and press Cook it.

![Image](tutorials/images/gba-hacking/VirtualMachine3.png)

You can listen the song again in Sappy to make sure it works.

Now you have successfully inserted a midi in the Wario Land 4 Rom !
Here is the final result :

<audio controls>
  <source src="tutorials/sounds/AngryBirdsModifiedInGame.wav" type="audio/wav">
  Your browser does not support the audio tag.
</audio>


[angry-bird-midi]: https://freemidi.org/download3-14505-angry-birds-video-games
[musescore]: https://musescore.org/en
[midi-quick-fix]: https://sourceforge.net/projects/midiquickfix/
[hxd]: https://mh-nexus.de/en/hxd/
[vlc]: https://www.videolan.org/
[modified-midi]: tutorials/sounds/AngryBirdsModified.mid
[sappy-and-mid2agb]: https://www.pokemonhacking.com/gba-hack-tools/sappy-mid2agb/
[7-zip]: https://www.7-zip.org/
[tracks-info]: https://github.com/wario-land/Toge-Docs/blob/master/Steaks/music_and_sound_effects.md
