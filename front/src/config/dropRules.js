export const dropRules = {
  // pickup spot id: [drop spot id]
  "s-g-z1-mtf-rd": ["d-s-g-z3-home-feederin"], // No 1 "MTF-RD"

  "s-g-z1-mtf-bd": ["d-s-g-z3-home-feederin", "d-s-g-z3-b9-197-01-blocking-device"], // No 2  "MTF-BD"

  "s-g-z1-mtf-mk": [], // No 3  "MTF-MK"

  "s-g-z2-f1-f1lz": [
    "d-s-g-z2-g5to-g5to-feeder-in",
    "d-s-g-z2-g3ew-g3ew-in",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-b9-115-c",
  ], // No 4  "F1LZ"

  "s-g-z2-f1-f1lz-cartreturn": [], // No 5  "F1LZ-CartReturn"

  "s-g-z2-f1-f1lz-g5to": [
    "d-s-g-z2-g5to-g5to-feeder-in",
    "d-s-g-z2-g3ew-g3ew-in",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-b9-115-c",
  ], // No 6  "F1LZ-G5TO"

  "s-g-z2-f2-f2bd-cartreturn": [], // No 7  "F2BD-CartReturn"

  "s-g-z2-f2-f2pb12-cartreturn": [
    "d-s-g-z2-g5to-g5to-feeder-in",
    "d-s-g-z2-g3ew-g3ew-in",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-b9-115-c",
    "d-s-g-z3-a1-a1-cd-operator",
  ], // No 8  "F2PB12-CartReturn"

  "s-g-z2-f2-f2pb8": [], // No 9  "F2PB8"

  "s-g-z2-g5to-g5to-feeder-in": [
    "d-s-g-z2-f1-f1lz",
    "d-s-g-z2-f1-f1lz-cartreturn",
    "d-s-g-z2-f2-f2bd-cartreturn",
    "d-s-g-z2-f2-f2pb8",
  ], // No 10  "G5TO-Feeder-In"

  "s-g-z2-g5to-g5to-sta": [
    "d-s-g-z3-kt-g4-kitting-in",
    "d-s-g-z3-g4-125-gsb282-g5to",
    "d-s-g-z3-g4-124-sus-sheave-g5to",
    "d-s-g-z3-g4-121-upper-beam-g5to",
    "d-s-g-z3-g4-128-selection-table-g5to",
    "d-s-g-z3-g4-183-oil-buffer",
    "d-s-g-z3-g4-183-rial-footing",
    "d-s-g-z3-b9-115-sp",
    "d-s-g-z3-b9-122-weighting-device",
    "d-s-g-z3-b9-103-04-isolate-rubber-198-02-pit-leader",
    "d-s-g-z3-b9-115-c",
    "d-s-g-z3-a1-a1-hanger-case",
    "d-s-g-z3-a1-a1-cd-accessory",
    "d-s-g-z3-a1-a1-cd-operator",
  ], // No 11  "G5TO-STA"

  "s-g-z2-g5to-g5to-cartreturn": [], // No 12  "G5TO-CartReturn"

  "s-g-z2-g3ew-g3ew-in": [], // No 13  "G3EW_(IN)"

  "s-g-z2-g3ew-g3ew-out": [
    "d-s-g-z2-f1-f1lz",
    "d-s-g-z2-f1-f1lz-cartreturn",
    "d-s-g-z2-f2-f2bd-cartreturn",
    "d-s-g-z2-f2-f2pb8",
  ], // No 14  "G3EW_(OUT)"

  "s-g-z3-kt-g4-kitting-in": [], // No 15  "G4_Kitting_(IN)"

  "s-g-z3-kt-g4-kitting-out": [
    "d-s-g-z3-g4-125-gsb282",
    "d-s-g-z3-g4-125-gsb400",
    "d-s-g-z3-g4-124-sus-sheave",
    "d-s-g-z3-g4-121-upper-beam",
    "d-s-g-z3-g4-128-selection-table",
    "d-s-g-z3-g4-121-handrail",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 16  "G4_Kitting_(OUT)"

  "s-g-z3-g4-125-gsb282": [
    "d-s-g-z3-kt-g4-kitting-in",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 17  "125-GSB282"

  "s-g-z3-g4-125-gsb282-g5to": [
    "d-s-g-z2-g3ew-g3ew-in",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 18  "125-GSB282-G5TO"

  "s-g-z3-g4-125-gsb400": [
    "d-s-g-z3-kt-g4-kitting-in",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 19  "125-GSB400"

  "s-g-z3-g4-124-sus-sheave-g5to": [
    "d-s-g-z2-g3ew-g3ew-in",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 20  "124_Sus.Sheave-G5TO"

  "s-g-z3-g4-124-sus-sheave": [
    "d-s-g-z3-kt-g4-kitting-in",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 21  "124_Sus.Sheave"

  "s-g-z3-g4-121-upper-beam-g5to": [
    "d-s-g-z2-g3ew-g3ew-in",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 22  "121_Upper_Beam-G5TO"

  "s-g-z3-g4-121-upper-beam": [
    "d-s-g-z3-kt-g4-kitting-in",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 23  "121_Upper_Beam"

  "s-g-z3-g4-128-selection-table-g5to": [
    "s-g-z2-g3ew-g3ew-in",
    "s-g-z3-bwh-g2-d1c1-in",
    "s-g-z3-bwh-g1-a1b9-out",
  ], // No 24  "128_Selection_Table-G5TO"

  "s-g-z3-g4-128-selection-table": [
    "d-s-g-z3-kt-g4-kitting-in",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 25  "128_Selection_Table"

  "s-g-z3-g4-121-handrail": [
    "d-s-g-z3-kt-g4-kitting-in",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 26  "121_Handrail"

  "s-g-z3-g4-183-oil-buffer": [
    "d-s-g-z2-g3ew-g3ew-in",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 27  "183-Oil_buffer"

  "s-g-z3-g4-183-rial-footing": [
    "d-s-g-z2-g3ew-g3ew-in",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 28  "183-Rial_footing"

  "s-g-z3-home-cartreturn": [
    "d-s-g-z1-mtf-rd",
    "d-s-g-z1-mtf-mk",
    "d-s-g-z2-f1-f1lz",
    "d-s-g-z2-f1-f1lz-cartreturn",
    "d-s-g-z2-f2-f2bd-cartreturn",
    "d-s-g-z2-f2-f2pb8",
    "d-s-g-z3-bwh-g2-d1c1-out",
    "d-s-g-z3-bwh-g1-a1b9-out",
  ], // No 29  "CartReturn"

  "s-g-z3-home-feederin": [], // No 30  "FeederIn"

  "s-g-z3-home-home-ps-hp": [
    "d-s-g-z3-b9-197-01-blocking-device",
    "d-s-g-z3-b9-115-sp",
    "d-s-g-z3-b9-122-weighting-device",
    "d-s-g-z3-b9-103-04-isolate-rubber-198-02-pit-leader",
    "d-s-g-z3-b9-115-c",
    "d-s-g-z3-a1-a1-hanger-case",
    "d-s-g-z3-a1-a1-cd-accessory",
    "d-s-g-z3-a1-a1-cd-operator",
  ], // No 31  "Home_(PS&HP)"

  "s-g-z3-bwh-g2-d1c1-in": [], // No 32  "#G2-D1C1_(IN)"

  "s-g-z3-bwh-g2-d1c1-out": [
    "d-s-g-z3-kt-g4-kitting-in",
    "d-s-g-z3-g4-125-gsb282",
    "d-s-g-z3-g4-125-gsb400",
    "d-s-g-z3-g4-124-sus-sheave",
    "d-s-g-z3-g4-121-upper-beam",
    "d-s-g-z3-g4-128-selection-table",
    "d-s-g-z3-g4-121-handrail",
    "d-s-g-z3-g4-183-oil-buffer",
    "d-s-g-z3-g4-183-rial-footing",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-b9-115-sp",
    "d-s-g-z3-b9-122-weighting-device",
    "d-s-g-z3-b9-103-04-isolate-rubber-198-02-pit-leader",
    "d-s-g-z3-b9-115-c",
    "d-s-g-z3-a1-a1-hanger-case",
    "d-s-g-z3-a1-a1-cd-accessory",
    "d-s-g-z3-a1-a1-cd-operator",
  ], // No 33  "#G2-D1C1_(OUT)"

  "s-g-z3-bwh-g1-a1b9-in": [], // No 34  "#G1-A1B9_(IN)"

  "s-g-z3-bwh-g1-a1b9-out": [
    "d-s-g-z3-kt-g4-kitting-in",
    "d-s-g-z3-g4-125-gsb282",
    "d-s-g-z3-g4-125-gsb400",
    "d-s-g-z3-g4-124-sus-sheave",
    "d-s-g-z3-g4-121-upper-beam",
    "d-s-g-z3-g4-128-selection-table",
    "d-s-g-z3-g4-121-handrail",
    "d-s-g-z3-g4-183-oil-buffer",
    "d-s-g-z3-g4-183-rial-footing",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-b9-115-sp",
    "d-s-g-z3-b9-122-weighting-device",
    "d-s-g-z3-b9-103-04-isolate-rubber-198-02-pit-leader",
    "d-s-g-z3-b9-115-c",
    "d-s-g-z3-a1-a1-hanger-case",
    "d-s-g-z3-a1-a1-cd-accessory",
    "d-s-g-z3-a1-a1-cd-operator",
  ], // No 35  "#G1-A1B9_(OUT)"

  "s-g-z3-b9-197-01-blocking-device": ["d-s-g-z1-mtf-mk", "d-s-g-z3-home-feederin"], // No 36  "197-01_Blocking_Device"

  "s-g-z3-b9-115-sp": [
    "d-s-g-z2-g5to-g5to-cartreturn",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-in",
  ], // No 37  "B9-115_S/P"

  "s-g-z3-b9-122-weighting-device": [
    "d-s-g-z2-g5to-g5to-cartreturn",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-in",
  ], // No 38  "B9-122_Weighting_Device"

  "s-g-z3-b9-103-04-isolate-rubber-198-02-pit-leader": [
    "d-s-g-z2-g5to-g5to-cartreturn",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-in",
  ], // No 39  "103-04_Isolate_Rubber/198-02_Pit_Leader"

  "s-g-z3-b9-115-c": [
    "d-s-g-z2-f1-f1lz",
    "d-s-g-z2-f1-f1lz-cartreturn",
    "d-s-g-z2-f2-f2bd-cartreturn",
    "d-s-g-z2-f2-f2pb8",
    "d-s-g-z2-g5to-g5to-cartreturn",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-in",
  ], // No 40  "B9-115_C"

  "s-g-z3-a1-a1-hanger-case": [
    "d-s-g-z2-g5to-g5to-cartreturn",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-in",
  ], // No 41  "A1-Hanger_Case"

  "s-g-z3-a1-a1-cd-accessory-home-ps-hp": [
    "d-s-g-z2-g5to-g5to-cartreturn",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-in",
  ], // No 42  "A1-C/D_Accessory-Home_(PS&HP)"

  "s-g-z3-a1-a1-cd-accessory": [], // No 43  "A1-C/D_Accessory"

  "s-g-z3-a1-a1-cd-operator": [
    "d-s-g-z2-f2-f2pb12-cartreturn",
    "d-s-g-z2-f2-f2pb8",
    "d-s-g-z2-g5to-g5to-cartreturn",
    "d-s-g-z2-g3ew-g3ew-inn",
    "d-s-g-z3-home-feederin",
    "d-s-g-z3-bwh-g2-d1c1-in",
    "d-s-g-z3-bwh-g1-a1b9-in",
  ], // No 44  "A1-C/D Operator"
};
