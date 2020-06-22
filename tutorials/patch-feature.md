# Patch Feature Tutorial

---

The patch feature in WL4Editor is an advanced feature that allows you to apply hex edits or custom C code to your ROM.

### Why?

The patch feature is helpful for several reasons:

+ Add or remove patches through UI. Removing a patch will restore the original data at the hook location in the ROM.
+ Makes use of WL4Editor's save data structure (RATS) to automatically manage the location of the custom code in the patch.
+ Failsafe checks to ensure that your patches do not overlap with one another.
+ Easy and quick to recompile + inject your patch code while developing the patch itself.

---

# Using Patches

If you only plan to use patches that other people have made, then it is a straightforward process that doesn't require any knowledge of ASM or low level reverse engineering.

---

## Terminology

+ **ARM EABI**: The ARM Embedded Application Binary Interface. This is a collection of programs used in various stages of compiling code into binary.
+ **gcc**: The GNU compiler collection. This is the compiler bundled with the ARM EABI for compilation of C into ASM.
+ **Hook**: A string of bytes that will overwrite some code or data in the main area of the ROM, so that it can be hijacked to use your patch code.
+ **Debugger**: A program that allows you analyze the runtime details of a binary. In the case of WL4, some examples of useful GBA debuggers are Bizhawk or no$gba.
+ **Static analysis tool**: A program that allows you to decompile and analyze the structure of a binary. In the case of WL4, some useful examples of static analysis tools capable of analyzing ARM7TDMI are IDA Pro or Ghidra.
+ **RATS**: ROM Allocation Tag System. WL4Editor uses a modified version of conventional RATS (which is popular in other ROM hacking programs) for dynamically managing the save data after the main ROM in WL4.
+ **short**: 2 bytes which are interpreted as a single, 16-bit value.
+ **03000000**: RAM address mapping. All work RAM (WRAM) is of the form 03xxxxxx.
+ **08000000**: ROM address mapping. All ROM locations, when referred to by the game's own code, look as if they are of the form 08xxxxxx. The location 0x1BBFC in the actual ROM file is referred to in the game's code by the pointer 0801BBFC.
+ **Little-endian**: All multi-byte values are stored in reverse from what is considered human-readable; this is called "little-endian". So, if Wario's Y velocity is a short with value 0x1234 at 030018B0, then 030018B0 will contain 0x34, and 030018B1 will contain 0x12. Additionally, the pointer 0801BBFC would be ordered as bytes in the ROM as FC BB 01 08.

---

## How does it work?

WL4Editor will use gcc from the ARM EABI to compile your C patch into ASM, then assemble that ASM file into an object file, then extract the binary from the object file for use in your patch. Then, WL4Editor uses the same method it typically uses for any other saving feature to find a place for your compiled patch code. Finally, it applies hooks to the ROM, and makes a master record of all patches in an RATS chunk so that patch entries can be read from your ROM or removed.

The hook string may contain a pointer to your patch code, denoted by the identifier "P". WL4Editor first determines the location of the patch code in RATS, and then uses those save chunk addresses to replace P with the address in RATS space. The code is compiled in Thumb mode, and these address are incremented by 1 so that execution of the patch will be initiated in Thumb mode.

Removal of a patch will take the original bytes which were overwritten by your hook string (stored in the patch master record chunk) and reapply them to the ROM, then reclaim the RATS space used by your patch code and update the patch master record accordingly.

---

## Getting Started

To use the patch feature, you must first install the ARM EABI.

For all systems (Windows, Mac, Linux), download the ARM EABI [here](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-rm/downloads) and select the appropriate download for your system. Either the EXE installer or binary ZIP is fine.

The first time you attempt to save patch changes in the Patch Manager Dialog, you will be prompted to select the folder in your system containing the ARM EABI binaries; this is going to be a folder in your ARM EABI installation called "bin". After selecting the bin folder, you should be able to use WL4Editor's patch feature.

_To change the EABI binary folder in the future, edit the path in WL4Editor's INI file._

---

## Patch Manager Dialog

![PatchManager](tutorials/images/patch-tutorial/PatchManager.png)

The Patch Manager Dialog allows you to add, remove, modify or re-compile patches in your ROM file. The buttons are as follows:

+ **Add**: Open the Patch Edit Dialog to create a patch for the ROM.
+ **Edit**: Select a patch in the Patch Manager, then press this button to modify the attributes of the patch.
+ **Remove**: Select a patch in the Patch Manager, then press this button to remove it.
+ **Save**: Save all the patches to the ROM. None of the changes from the other buttons will apply until you press Save. Pressing Save will also re-compile any C or assembly patches.

After adding a patch to the ROM, the Patch Manager will have a row for the patch. The row contains several columns with information about the patch:

+ **File**: The patch file which is relative to the ROM's location.
+ **Type**: The type of patch (binary, ASM, C)
+ **Hook address**: The hexadecimal address in the ROM file where the hook will be placed.
+ **Hook string**: The string for the hook. _This string shown in the UI does not display the patch address identifier._
+ **Hook length**: The length of the hook string in bytes, including the patch address.
+ **Address offset**: The offset in the hook string to place the address of the patch.

You can also hover over the patch entry row to see its description.

---

## Patch Edit Dialog

The Patch Edit Dialog allows you to configure an individual patch for your ROM. 

![PatchEdit](tutorials/images/patch-tutorial/PatchEdit.png)

The Patch Edit Dialog has several fields for configuring your patch:

+ **Path**: The path for the file used in the patch. Leave this blank to create a hex edit patch.
+ **Patch type**: The type of the patch file (binary, ASM, C)
+ **Hook Address**: The address to place the hook in the main ROM. Accepts hexadecimal integers less than 0x78F970. (the 0x prefix is optional)
+ **Hook**: This is the string which will be placed at the hook address. Must be an even number of hexadecimal digits, and may optionally include the patch address identifier "P". After WL4Editor has determined where it will place the patch content in the save data structure, the P will be replaced with the address of the beginning of the save data content.
+ **Description**: A description of what the patch does.

In the case of ASM or C patches, you may also include the following identifiers anywhere in the file inside a comment to auto-populate the fields of the Patch Edit Dialog: **@HookAddress, @HookString, @Description**

---

# Writing Patches

Writing patches for WL4 does not require deep knowledge of any of the following concepts, but it will be easier with examples to look at, and familiarity with the basic ideas of:

+ Assembly
+ C programming
+ GBA debugging
+ Static analysis

Read the following patch examples in order; the various details surrounding how a patch is created will be covered at various points.

---

## Example 1: Hex Edit (easy)

For this one, we're going to find and make a hex edit that increases Wario's jump height.

A good starting point to find the value used for Wario's jump height is to find the point at which this value is used. Since Wario's initial jump velocity would be set from this value, we should first find the location in RAM that holds this value.

The first step in this practice should always be to consult a knowledge base about known information in the ROM: https://docs.google.com/document/d/1W0MZblzPF1X1_oA2ThzZh99fctgbbBM-jctCjNu5gIk/edit

![RAMDocument](tutorials/images/patch-tutorial/RAMDocument.png)

The above document shows that the Y velocity is a 16-bit value at 0x30018B0. But what if it wasn't a known RAM location? We'll go through the process to find this RAM location.

We're going to find Wario's Y velocity using VisualBoyAdvance. First, let's put Wario in a state where the Y velocity is known; it should be 0 if he is standing (in theory). Then let's use the "search for cheats" dialog:

![CheatSearch1](tutorials/images/patch-tutorial/CheatSearch1.png)

We will click "start", then select "specific value" and "equal", then enter the value "0" and click search. This will search for all RAM values which are equal to the specific value "0".

![CheatSearch2](tutorials/images/patch-tutorial/CheatSearch2.png)

The results have been narrowed down a little, but not enough to start considering any RAM locations:

![CheatSearch3](tutorials/images/patch-tutorial/CheatSearch3.png)

You may close the dialog with OK. The state of the search we're conducting will persist when we re-open the dialog. Now, let's jump, and _while holding the jump button_, select the menu to pause emulation:

![CheatSearch4](tutorials/images/patch-tutorial/CheatSearch4.png)

This time, we will select "old value" and "not equal", then click search. This will further narrow down our selection to RAM values which have changed. Since Wario is in the middle of a jump, the Y velocity should be something _other than_ 0:

![CheatSearch5](tutorials/images/patch-tutorial/CheatSearch5.png)

Now we're getting somewhere. Continue stopping the game at different jump heights or searching for the specific value "0" while standing until the list is narrowed down a bit more. Once you're tired of it, we're going to try tweaking RAM until we find the Y velocity. Select one of the RAM values, then "add cheat".

![CheatSearch6](tutorials/images/patch-tutorial/CheatSearch6.png)

Set it to some number like 10.

![CheatSearch7](tutorials/images/patch-tutorial/CheatSearch7.png)

Now, try jumping in the game and see if the behavior has changed. If not, remove the cheat and try changing a different value. Once you get to changing 030018B0, you should see a behavioral change when Wario jumps:

![CheatSearch8](tutorials/images/patch-tutorial/CheatSearch8.png)

We've found our candidate RAM location. We only searched for a single changing byte, but we don't know the size of the value yet; it could be a short. We'll find out soon enough. We will show what to do next, using no$gba.

Go to the same location with Wario, then from the menu do Debug > Define Break/Condition. Using no$gba's breakpoint syntax, we use `[030018b0]!` to tell the game to pause execution when 030018B0 changes.

![NoCash1](tutorials/images/patch-tutorial/NoCash1.png)

Now, resume execution and jump. The debugger should pause:

![NoCash2](tutorials/images/patch-tutorial/NoCash2.png)

All the info we need is right here. The line marked in red is the one whose execution modified the memory address 030018B0. It is storing a 16-bit value ("strh" stores 16 bits, as opposed to "strb" for 8 bits or "str" for 32 bits) which is contained in r0 (which we can see the lower 16 bits are 00B0) in to the address pointed to by r3 (03001898) indexed by 0x18 (030018B0).

The source of this 00B0 value is from the instruction above, "mov r0, #0xB0". This instruction places (or "moves", hence "mov") the 8-bit value 0xB0 into r0 for the strh which comes next. So, if we modify the 0xB0 to instead be 0xFF, then Wario's initial jump velocity should be greater.

The instruction's encoding shown on the left is 20B0; since the representation in the ROM is little-endian, the B0 will be the first of those 2 bytes. So, we wish to change 0x12E28: B0 -> FF with a patch.

![MoonJumpPatch](tutorials/images/patch-tutorial/MoonJumpPatch.png)

Now we can see that Wario jumps higher:

![MoonJumpWario](tutorials/images/patch-tutorial/MoonJumpWario.png)

---

## Pointer Replacement (medium)

For this one, we're going to make a troll patch that kills Wario when he grabs a diamond.

The basic premise behind this patching method is that if the game at some point uses a vector table to jump to a subroutine, then it's very easy to hijack because you only need to point the address in the vector table to a new location: your patch code. Coincidentally, the game uses a vector table to jump to the function which sets up entity graphics. So, that's a pretty convenient place to hijack things on a per-entity basis.

It's a good idea to start off with knowledge that's already been built up. The wario-land group has an IDA Pro idb file with many useful annotations for static analysis of the WL4 ROM. After digging through things in IDA Pro a bit, we can find this function:

![IDA1](tutorials/images/patch-tutorial/IDA1.png)

If we follow the EntitiesAIVectorTable symbol, we can find the pointers for the entity graphics and behavior functions:

![IDA2](tutorials/images/patch-tutorial/IDA2.png)

Since the entity ID for the diamond is 6, the pointer to the diamond behavior is located at 0878E818 (0878E800 + 6 * 4), and it points to the location 0802C848. Why isn't the function at 0802C84**9**? That's because the lowest bit in a branch address in ARM7TDMI denotes whether execution should resume in ARM or Thumb mode. 0 = ARM and 1 = Thumb, so this is a pointer to 0802C848, and the game executes the code there in Thumb mode. (you can't have an odd-numbered address anyway, because instructions are always 2 or 4 bytes in length)

So we already know our hook address (0x78E818) and our hook string ("P"); this will replace the 4 bytes at address 0x78E818 with the address of our patch after WL4Editor compiles our patch code and determines its location within the RATS structure.

Let's write some simple wrapper code that simply calls the original diamond behavior. There should be no change in behavior so far with this:


```
// @Description Diamonds instantly kill you
// @HookAddress 0x78E818
// @HookString P

#define sub_802C848 ((void (*)()) 0x802C849)

__attribute__((no_caller_saved_registers))
void LethalDiamonds()
{
    // Vanilla code for diamond GFX
    sub_802C848();

    // Custom code
    // TODO
}
```

Here is a breakdown of the above lines:

**#define sub_802C848 ((void (\*)()) 0x802C849)**: Defines a function pointer to the parameterless void function located at 0802C848, called "sub_802C848" which is callable just like any other function. Note that the value is set as 0x802C84**9**, since it's pointing to a Thumb function.

**\_\_attribute\_\_((no_caller_saved_registers))**: This tells gcc to save and restore any registers clobbered by the assembly which is compiled from your code, so that register contents are only affected minimally by your patch code.

**void LethalDiamonds()**: Your patch file should contain exactly one function, and it should match the signature of the function you're hijacking. Since sub_802C848 is a parameterless void function, so is LethalDiamonds().

**sub_802C848();**: The only thing we're doing so far in our patch is calling the diamond's original behavior so that it functions properly.

Because of the annotations at the top of the file, the Patch Edit Dialog should automatically be populated:

![LethalDiamondsPatchEdit](tutorials/images/patch-tutorial/LethalDiamondsPatchEdit.png)

Observe that diamonds are still functioning normally:

![LethalDiamondsNormal](tutorials/images/patch-tutorial/LethalDiamondsNormal.png)

Now, we would like to add some code that kills Wario if he touches the diamond. For this, we will need 2 things: a way to determine if Wario has touched the object, and a way to kill Wario.

Searching through things a bit with IDA Pro, we come across this function:

![IDA3](tutorials/images/patch-tutorial/IDA3.png)

It's an int function which takes in 2 parameters; Y_tolerance is how close Wario must be to the entity vertically, and X_tolerance is how close Wario must be to the entity horizontally. If Wario does not collide, 0 is returned. If he collides from the left, 4 is returned. If he collides from the right, 8 is returned.

We can also find this function:

![IDA4](tutorials/images/patch-tutorial/IDA4.png)

This function unconditionally kills Wario. It is a parameterless void function.

Now that we've found the functions we're looking for, we're going to add the missing logic to our patch funtion:

```
// @Description Diamonds instantly kill you
// @HookAddress 0x78E818
// @HookString P

#define sub_802C848 ((void (*)()) 0x802C849)

#define EntityCollision ((int (*)(int, int)) 0x8026211)
#define KillWario ((void (*)()) 0x8075889)

__attribute__((no_caller_saved_registers))
void LethalDiamonds()
{
    // Vanilla code for diamond GFX
    sub_802C848();

    // Custom code
    int collision = EntityCollision(80, 80);
    if(collision)
    {
        KillWario();
    }
}
```

**#define EntityCollision ((int (\*)(int, int)) 0x8026211)**: Function pointer for the entity collision function. It is an int function with 2 int parameters. As usual, it is incremented by 1 since it is a Thumb function.

**#define KillWario ((void (\*)()) 0x8075889)**: Function for killing Wario. It is a parameterless void function much like the diamond behavior function. Thumb function.

**int collision = EntityCollision(80, 80);**: Obtain the result of the EntityCollision function and store it in a variable. 80 and 80 were the most appropriate tolerance values I came up with through my own trial and error to make this work smoothly.

We can see that the diamond now kills Wario:

![LethalDiamond](tutorials/images/patch-tutorial/LethalDiamond.png)

---

## Thumb Hook (hard)

For this one, we're going to make it so that rocks and Shitain-Hakase are always considered to be in the "thrown" state. This will allow for some neat physics tricks like bouncing off the rock multiple times.

The difference with this type of hook is that the code we are hijacking is not called by a vector table, so we need to be really careful how we write and place our hook to ensure that the execution of the original code is unaffected.

TODO