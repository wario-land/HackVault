# Layer Effect: The things we can do by Layer Editing and using Room Config Dialog.

## Introduction
Things about how the layer being drawn and you can assign one `Event ID` and one `Terrain ID` have been included in the Overview section. but not everything we find in the event and terrain list can work as expect if you never did a survey on vanilla games. In this section, we will explain some features from `Room Config Dialog` and show you how to use `Event ID` and `Terrain ID` correctly with it.

  
## The RoomHeader struct in Wario Land 4
  
We know that, the game is developed using C programming language. And we developed the `WL4Editor` using Qt with C++. So if you're not familiar with reverse engineering, and you want to have a first look on how all kinds of data in WL4 ROM looks like. This source code of `WL4Editor` is a good place to start from. ( the leaked source of iQue version of WL4 is full of romaji and Japanese comments in the code, some other stuff are just o files, so we should always try to use `WL4Editor` first before some powerful AI can do everything for us perfectly. ) This time, let's start from the `RoomHeader` struct. We can find the struct from the `WL4Editor` source code ( i renamed some variables ).
```
struct __RoomHeader
{
    unsigned char TilesetID;
    unsigned char Layer0MappingType;
    unsigned char Layer1MappingType;
    unsigned char Layer2MappingType;
    unsigned char Layer3MappingType;
    unsigned char DATA_05[3];
    unsigned int Layer0Data;
    unsigned int Layer1Data;
    unsigned int Layer2Data;
    unsigned int Layer3Data;
    unsigned char CameraControlType;
    unsigned char Layer3Scrolling;
    unsigned char AlphaBlendingAndPriority;
    unsigned char DATA_1B;
    unsigned int EntityTableHard;
    unsigned int EntityTableNormal;
    unsigned int EntityTableSHard;
    unsigned char DistortionEffect;
    unsigned char WaterLevel;
    unsigned short BGMVolume;
};
```
im not going to explain what is a Tileset, it is self-evident in `WL4Editor`. Let's start from `mapping type` first. 

## Layer's mapping type

These are the mapping type relative value we can found from the leak. I renamed everything and rewrite the comment in English:
```
enum mapping_type
{
    nothing = 0,

    // map the layer using Tile16
    usingTile16 = 0x10,
    usingTile16_Layer0_TheBigBoard = 0x11,  // layer-0-only effect, move the resur bar in The Big Board level
    usingTile16_Layer0_half_H_speed = 0x12,  //layer-0-only effect, moving speed of layer 0 is a half of layer 1
    usingTile16_Layer2_BossRoom_chest = 0x13,  //layer-2-only effect, to work with the chest on the wall on layer 2

    // map the layer using Tile8x8
    usingTile8x8 = 0x20,
    usingTile8x8_Layer0 = 0x21, // layer-0-only effect, some temp stuff in perhaps running game, cannot find be used in vanilla RoomHeader
    usingTile8x8_Layer0_fog = 0x22, // layer-0-only effect, for layer 0 fog in Toxic Landfill
};
```
If you know how binary numeral works in computer science and assembly code. You can get, the game use the fifth bit ( count from the right side of a binary number ) to control if a Layer should be mapped using `Tile8x8` or `Tile16`. And the low 4 bits ( LSB side ) are used to do trivial Layer render controls. 

Also, if you have read the documentation on GBA's IO control registers, you can get, the mapping type cannot be send into the Layer's IO control registers directly. it is some representation which only work in WL4 layer render mechanism.

## Layer Effects

We consider these 5 things are all layer effect things in `RoomHeader` struct. they are **layer scrolling**, **camera moving**, **graphic distortion**, **alpha blending** and **layer priority**. these features are frequently used in every Levels.

Both **layer scrolling** and **camera moving** use the upper left corner of Layer 1 as the zero point of the coordinate, then scroll layers or move camera around with H and V offset value. **graphic distortion** is some effect using GBA's HBlank features to twist layer graphic runtime. In some Levels, you can find twisting layers behind water layer ( layer 0 ), or the fog or smoke layer itself will keep twisting. that's all those **graphic distortion** effect. **alpha blending** can blend together the color of pixels from a front layer A with the pixels below layer A from the other layers. **layer priority** control the order of layers. it is not always the layer 0 on the top, using the features from the vanilla game mechanism, we can change the order of layer 0, 1 and 2.

now time to complain the bad design on `RoomHeader` struct.
- Why they use some bits from mapping type bytes to scroll layer 0, but then use an extra byte `Layer3Scrolling` in `RoomHeader` to scroll the layer 3 ?
- Why use one byte `AlphaBlendingAndPriority` to control both **alpha blending** and **layer priority** in the Room? there are still some unused bytes in the `RoomHeader` struct.

The decoupling controls of **alpha blending** and **layer priority** in `Room Config Dialog` took me a lot of time to find and program, and it even got a rewrite on the data side since the it is so ugly in the `WL4Editor`'s source code. I'm not going to show its details, if some people want to look into it, just read the source code of `WL4Editor`.

Most of the other variables in `RoomHeader` struct are self-evident too. The only things worth a mention is the `WaterLevel`. But it is not hard to understand. since everything can be explained in one pic.

![Image](tutorials/1_LayerEditing/1_2_LayerEffect/images/WaterLevelVariableInRoomHeader.png)

## Effectiveness Condition of Terrain ID and Event ID

In general, all those Terrain ID and Event ID are controlled by game mechanism. So, you cannot expect every terrain ID or Event ID works as you expect anywhere, anytime. Sometimes, extra patches are needed.
