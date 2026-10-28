/* Adapted from the user-supplied BSAH Canvas horse: skinned SDF body,
   independent articulated limbs and periodic keyframes. No WebGL or media. */
(function (global) {
  'use strict';

  var DEG_TO_RAD = Math.PI / 180;
  var TWO_PI = Math.PI * 2;

  var SDF_W = 51;
  var SDF_H = 40;
  var SDF_PAD = 6;
  var SDF_UPPER = new Int16Array([1975,1942,1915,1892,1874,1829,1788,1753,1722,1670,1614,1562,1515,1473,1437,1406,1382,1364,1354,1350,1350,1350,1350,1350,1295,1231,1154,1081,1013,940,872,810,756,712,671,621,582,558,550,558,582,621,671,731,799,844,893,950,1013,1081,1154,1881,1847,1818,1794,1775,1739,1696,1659,1626,1590,1531,1476,1426,1382,1343,1310,1284,1265,1254,1250,1250,1250,1250,1250,1223,1154,1090,1013,940,872,799,731,671,621,582,533,489,460,450,460,489,533,590,657,712,756,810,872,940,1013,1081,1788,1753,1722,1696,1676,1650,1605,1566,1531,1502,1450,1392,1339,1292,1250,1215,1187,1167,1154,1150,1150,1150,1150,1150,1154,1081,1013,950,872,799,731,657,590,533,489,450,397,362,350,362,397,450,516,582,621,671,731,799,872,940,1013,1696,1659,1626,1599,1578,1562,1515,1473,1437,1406,1371,1310,1254,1203,1158,1120,1090,1068,1055,1050,1050,1050,1050,1050,1055,1013,940,872,810,731,657,590,516,450,397,362,311,266,250,266,311,374,450,489,533,590,657,731,799,872,940,1605,1566,1531,1502,1480,1463,1426,1382,1343,1310,1284,1231,1171,1116,1068,1027,994,970,955,950,950,950,950,950,955,940,872,799,731,671,590,516,450,374,311,266,233,174,150,174,233,311,362,397,450,516,590,657,731,799,872,1515,1473,1437,1406,1382,1364,1339,1292,1250,1215,1187,1154,1090,1032,980,935,899,872,856,850,850,850,850,850,856,872,799,731,657,590,533,450,374,311,233,174,150,91,50,91,174,233,266,311,374,450,516,590,657,731,799,1426,1382,1343,1310,1284,1265,1254,1203,1158,1120,1090,1068,1013,950,893,844,804,775,756,750,750,750,750,750,756,775,731,657,590,516,450,397,311,233,174,91,50,50,-185,50,91,150,174,233,311,374,450,516,590,657,731,1339,1292,1250,1215,1187,1167,1154,1116,1068,1027,994,970,940,872,810,756,712,678,657,650,650,650,650,650,657,678,657,590,516,450,374,311,266,174,91,50,-172,-172,-213,-172,50,50,91,174,233,311,374,450,516,590,671,1254,1203,1158,1120,1090,1068,1055,1032,980,935,899,872,856,799,731,671,621,582,558,550,550,550,550,550,558,582,590,516,450,374,311,233,174,150,50,-150,-191,-250,-274,-191,-150,-150,50,91,174,233,311,374,450,533,621,1171,1116,1068,1027,994,970,955,950,893,844,804,775,756,731,657,590,533,489,460,450,450,450,450,450,460,489,533,450,374,311,233,174,91,50,50,-150,-250,-333,-333,-274,-250,-191,-150,50,91,174,233,311,397,489,582,1090,1032,980,935,899,872,856,850,810,756,712,678,657,650,590,516,450,397,362,350,350,350,350,350,362,397,450,397,311,233,174,91,50,-150,-150,-191,-274,-366,-411,-366,-333,-274,-191,-150,50,91,174,266,362,460,558,1013,950,893,844,804,775,756,750,731,671,621,582,558,550,516,450,374,311,266,250,250,250,250,250,266,311,350,350,266,174,91,50,-150,-191,-250,-274,-333,-411,-333,-274,-250,-250,-274,-191,-150,50,150,250,350,450,550,940,872,810,756,712,678,657,650,657,590,533,489,460,450,450,374,311,233,174,150,150,150,150,150,174,233,250,250,233,150,50,-150,-191,-274,-333,-366,-411,-333,-274,-191,-150,-150,-191,-250,-150,50,150,250,350,450,550,872,799,731,671,621,582,558,550,558,516,450,397,362,350,350,311,233,174,91,50,50,50,50,50,91,150,150,150,150,91,50,50,-150,-250,-350,-450,-366,-274,-191,-150,50,50,-175,-175,-175,50,150,250,350,450,550,799,731,657,590,533,489,460,450,460,450,374,311,266,250,250,233,174,91,50,-150,-150,-150,-150,-150,50,50,50,50,50,50,-150,-150,-191,-274,-366,-450,-350,-250,-150,50,91,91,50,50,50,91,174,266,362,460,558,731,657,590,516,450,397,362,350,362,374,311,233,174,150,150,150,91,50,-150,-191,-250,-250,-250,-191,-150,-150,-150,-150,-150,-150,-191,-250,-274,-333,-411,-450,-350,-250,-150,50,150,174,150,150,150,174,233,311,397,489,582,671,590,516,450,374,311,266,250,266,311,233,174,91,50,50,50,50,-150,-191,-274,-333,-350,-333,-274,-250,-250,-250,-250,-250,-250,-274,-333,-366,-411,-474,-411,-333,-250,-150,50,150,250,250,250,250,266,311,374,450,533,621,621,533,450,374,311,233,174,150,174,233,174,91,50,-150,-150,-150,-150,-191,-274,-333,-411,-450,-411,-366,-350,-350,-350,-350,-350,-350,-366,-411,-462,-497,-462,-366,-274,-191,-150,50,150,250,350,350,350,362,397,450,516,590,671,582,489,397,311,233,174,91,50,91,150,91,50,-150,-191,-191,-150,-191,-274,-333,-411,-474,-550,-497,-462,-450,-450,-450,-450,-450,-450,-462,-497,-550,-497,-411,-333,-250,-150,50,91,174,266,362,450,450,460,489,533,590,657,731,558,460,362,266,174,91,50,-182,50,50,50,-150,-191,-191,-150,50,-150,-250,-350,-450,-550,-616,-589,-560,-550,-550,-550,-550,-550,-550,-560,-589,-560,-462,-366,-274,-191,-150,50,150,233,311,397,489,550,558,582,621,671,731,799,550,450,350,250,150,50,-150,-191,-150,-150,-150,-191,-150,-150,50,50,-150,-250,-333,-411,-474,-550,-497,-462,-450,-462,-497,-550,-589,-633,-650,-650,-550,-450,-350,-250,-150,50,91,174,266,362,450,533,621,657,678,712,756,810,872,550,450,350,250,150,50,-150,-250,-250,-250,-250,-150,50,50,91,50,-150,-191,-274,-333,-411,-474,-411,-366,-350,-366,-411,-462,-497,-550,-550,-550,-550,-450,-350,-250,-150,50,150,233,311,397,489,582,671,756,775,804,844,893,950,550,450,350,250,150,50,-150,-191,-250,-191,-150,-150,50,150,174,91,50,-150,-191,-274,-366,-411,-333,-274,-250,-274,-333,-366,-411,-450,-450,-450,-450,-411,-333,-250,-150,50,150,250,350,450,533,621,712,804,872,899,935,980,1032,558,460,362,266,174,91,50,-150,-150,-150,50,50,91,174,233,174,91,50,-150,-250,-350,-333,-274,-191,-150,-191,-250,-274,-333,-350,-350,-350,-350,-333,-274,-191,-150,50,150,250,350,450,550,650,750,844,935,994,1027,1068,1116,582,489,397,311,233,174,91,50,50,50,91,150,174,233,250,150,50,-150,-191,-250,-250,-250,-191,-150,50,-150,-150,-191,-250,-250,-250,-250,-250,-250,-191,-150,50,91,174,266,362,460,558,657,756,856,955,1055,1120,1158,1203,621,533,450,374,311,233,174,150,150,150,174,233,266,311,250,150,50,-150,-150,-150,-150,-150,-150,50,91,50,50,-150,-150,-150,-150,-150,-150,-150,-150,50,91,174,233,311,397,489,582,678,775,872,970,1068,1167,1250,1292,671,590,516,450,374,311,266,250,250,250,266,311,362,362,266,174,91,50,50,50,50,50,50,91,174,150,91,50,50,50,50,50,50,50,50,91,174,233,311,374,450,533,621,712,804,899,994,1090,1187,1284,1382,731,657,590,516,450,397,362,350,350,350,362,397,450,397,311,233,174,150,150,150,150,150,150,174,233,233,174,150,150,150,150,150,150,150,150,174,233,311,374,450,516,590,671,756,844,935,1027,1120,1215,1310,1406,799,731,657,590,533,489,460,450,450,450,460,489,533,450,374,311,266,250,250,250,250,250,250,266,311,311,266,250,250,250,250,250,250,250,250,266,311,374,450,516,590,657,731,810,893,980,1068,1158,1250,1343,1437,872,799,731,671,621,582,558,550,550,550,558,582,590,516,450,397,362,350,350,350,350,350,350,362,397,397,362,350,350,350,350,350,350,350,350,362,397,450,516,590,657,731,799,872,950,1032,1116,1203,1292,1382,1473,940,872,810,756,712,678,657,650,650,650,657,678,657,590,533,489,460,450,450,450,450,450,450,460,489,489,460,450,450,450,450,450,450,450,450,460,489,533,590,657,731,799,872,940,1013,1090,1171,1254,1339,1426,1515,1013,950,893,844,804,775,756,750,750,750,756,775,731,671,621,582,558,550,550,550,550,550,550,558,582,582,558,550,550,550,550,550,550,550,550,558,582,621,671,731,799,872,940,1013,1081,1154,1231,1310,1392,1476,1562,1090,1032,980,935,899,872,856,850,850,850,856,872,810,756,712,678,657,650,650,650,650,650,650,657,678,678,657,650,650,650,650,650,650,650,650,657,678,712,756,810,872,940,1013,1081,1154,1223,1295,1371,1450,1531,1614,1171,1116,1068,1027,994,970,955,950,950,950,955,950,893,844,804,775,756,750,750,750,750,750,750,756,775,775,756,750,750,750,750,750,750,750,750,756,775,804,844,893,950,1013,1081,1154,1223,1295,1364,1437,1512,1590,1670,1254,1203,1158,1120,1090,1068,1055,1050,1050,1050,1055,1032,980,935,899,872,856,850,850,850,850,850,850,856,872,872,856,850,850,850,850,850,850,850,850,856,872,899,935,980,1032,1090,1154,1223,1295,1364,1437,1506,1578,1653,1730,1339,1292,1250,1215,1187,1167,1154,1150,1150,1150,1154,1116,1068,1027,994,970,955,950,950,950,950,950,950,955,970,970,955,950,950,950,950,950,950,950,950,955,970,994,1027,1068,1116,1171,1231,1295,1364,1437,1506,1578,1647,1719,1794,1426,1382,1343,1310,1284,1265,1254,1250,1250,1250,1254,1203,1158,1120,1090,1068,1055,1050,1050,1050,1050,1050,1050,1055,1068,1068,1055,1050,1050,1050,1050,1050,1050,1050,1050,1055,1068,1090,1120,1158,1203,1254,1310,1371,1437,1506,1578,1647,1719,1788,1860,1515,1473,1437,1406,1382,1364,1354,1350,1350,1350,1339,1292,1250,1215,1187,1167,1154,1150,1150,1150,1150,1150,1150,1154,1167,1167,1154,1150,1150,1150,1150,1150,1150,1150,1150,1154,1167,1187,1215,1250,1292,1339,1392,1450,1512,1578,1647,1719,1788,1860,1930,1605,1566,1531,1502,1480,1463,1453,1450,1450,1450,1426,1382,1343,1310,1284,1265,1254,1250,1250,1250,1250,1250,1250,1254,1265,1265,1254,1250,1250,1250,1250,1250,1250,1250,1250,1254,1265,1284,1310,1343,1382,1426,1476,1531,1590,1653,1719,1788,1860,1930,2002,1696,1659,1626,1599,1578,1562,1553,1550,1550,1550,1515,1473,1437,1406,1382,1364,1354,1350,1350,1350,1350,1350,1350,1354,1364,1364,1354,1350,1350,1350,1350,1350,1350,1350,1350,1354,1364,1382,1406,1437,1473,1515,1562,1614,1670,1730,1794,1860,1930,2002,2071]);
  var SDF_FULL_REF = new Int16Array([1975,1942,1915,1892,1874,1829,1788,1753,1722,1670,1614,1562,1515,1473,1437,1406,1382,1364,1354,1350,1350,1350,1350,1350,1295,1231,1154,1081,1013,940,872,810,756,712,671,621,582,558,550,558,582,621,671,731,799,844,893,950,1013,1081,1154,1881,1847,1818,1794,1775,1739,1696,1659,1626,1590,1531,1476,1426,1382,1343,1310,1284,1265,1254,1250,1250,1250,1250,1250,1223,1154,1090,1013,940,872,799,731,671,621,582,533,489,460,450,460,489,533,590,657,712,756,810,872,940,1013,1081,1788,1753,1722,1696,1676,1650,1605,1566,1531,1502,1450,1392,1339,1292,1250,1215,1187,1167,1154,1150,1150,1150,1150,1150,1154,1081,1013,950,872,799,731,657,590,533,489,450,397,362,350,362,397,450,516,582,621,671,731,799,872,940,1013,1696,1659,1626,1599,1578,1562,1515,1473,1437,1406,1371,1310,1254,1203,1158,1120,1090,1068,1055,1050,1050,1050,1050,1050,1055,1013,940,872,810,731,657,590,516,450,397,362,311,266,250,266,311,374,450,489,533,590,657,731,799,872,940,1605,1566,1531,1502,1480,1463,1426,1382,1343,1310,1284,1231,1171,1116,1068,1027,994,970,955,950,950,950,950,950,955,940,872,799,731,671,590,516,450,374,311,266,233,174,150,174,233,311,362,397,450,516,590,657,731,799,872,1515,1473,1437,1406,1382,1364,1339,1292,1250,1215,1187,1154,1090,1032,980,935,899,872,856,850,850,850,850,850,856,872,799,731,657,590,533,450,374,311,233,174,150,91,50,91,174,233,266,311,374,450,516,590,657,731,799,1426,1382,1343,1310,1284,1265,1254,1203,1158,1120,1090,1068,1013,950,893,844,804,775,756,750,750,750,750,750,756,775,731,657,590,516,450,397,311,233,174,91,50,50,-150,50,91,150,174,233,311,374,450,516,590,657,731,1339,1292,1250,1215,1187,1167,1154,1116,1068,1027,994,970,940,872,810,756,712,678,657,650,650,650,650,650,657,678,657,590,516,450,374,311,266,174,91,50,-150,-150,-191,-150,50,50,91,174,233,311,374,450,516,590,671,1254,1203,1158,1120,1090,1068,1055,1032,980,935,899,872,856,799,731,671,621,582,558,550,550,550,550,550,558,582,590,516,450,374,311,233,174,150,50,-150,-191,-250,-274,-191,-150,-150,50,91,174,233,311,374,450,533,621,1171,1116,1068,1027,994,970,955,950,893,844,804,775,756,731,657,590,533,489,460,450,450,450,450,450,460,489,533,450,374,311,233,174,91,50,50,-150,-250,-333,-333,-274,-250,-191,-150,50,91,174,233,311,397,489,582,1090,1032,980,935,899,872,856,850,810,756,712,678,657,650,590,516,450,397,362,350,350,350,350,350,362,397,450,397,311,233,174,91,50,-150,-150,-191,-274,-366,-411,-366,-333,-274,-191,-150,50,91,174,266,362,460,558,1013,950,893,844,804,775,756,750,731,671,621,582,558,550,516,450,374,311,266,250,250,250,250,250,266,311,350,350,266,174,91,50,-150,-191,-250,-274,-333,-411,-333,-274,-250,-250,-274,-191,-150,50,150,250,350,450,550,940,872,810,756,712,678,657,650,657,590,533,489,460,450,450,374,311,233,174,150,150,150,150,150,174,233,250,250,233,150,50,-150,-191,-274,-333,-366,-411,-333,-274,-191,-150,-150,-191,-250,-150,50,150,250,350,450,550,872,799,731,671,621,582,558,550,558,516,450,397,362,350,350,311,233,174,91,50,50,50,50,50,91,150,150,150,150,91,50,50,-150,-250,-350,-450,-366,-274,-191,-150,50,50,-150,-150,-150,50,150,250,350,450,550,799,731,657,590,533,489,460,450,460,450,374,311,266,250,250,233,174,91,50,-150,-150,-150,-150,-150,50,50,50,50,50,50,-150,-150,-191,-274,-366,-450,-350,-250,-150,50,91,91,50,50,50,91,174,266,362,460,558,731,657,590,516,450,397,362,350,362,374,311,233,174,150,150,150,91,50,-150,-191,-250,-250,-250,-191,-150,-150,-150,-150,-150,-150,-191,-250,-274,-333,-411,-450,-350,-250,-150,50,150,174,150,150,150,174,233,311,397,489,582,671,590,516,450,374,311,266,250,266,311,233,174,91,50,50,50,50,-150,-191,-274,-333,-350,-333,-274,-250,-250,-250,-250,-250,-250,-274,-333,-366,-411,-474,-411,-333,-250,-150,50,150,250,250,250,250,266,311,374,450,533,621,621,533,450,374,311,233,174,150,174,233,174,91,50,-150,-150,-150,-150,-191,-274,-333,-411,-450,-411,-366,-350,-350,-350,-350,-350,-350,-366,-411,-462,-497,-462,-366,-274,-191,-150,50,150,250,350,350,350,362,397,450,516,590,671,582,489,397,311,233,174,91,50,91,150,91,50,-150,-191,-191,-150,-191,-274,-333,-411,-474,-550,-497,-462,-450,-450,-450,-450,-450,-450,-462,-497,-550,-497,-411,-333,-250,-150,50,91,174,266,362,450,450,460,489,533,590,657,731,558,460,362,266,174,91,50,-150,50,50,50,-150,-191,-191,-150,50,-150,-250,-350,-450,-550,-616,-589,-560,-550,-550,-550,-550,-550,-550,-560,-589,-560,-462,-366,-274,-191,-150,50,150,233,311,397,489,550,558,582,621,671,731,799,550,450,350,250,150,50,-150,-191,-150,-150,-150,-191,-150,-150,50,50,-150,-250,-333,-411,-474,-550,-497,-462,-450,-462,-497,-550,-589,-633,-650,-650,-550,-450,-350,-250,-150,50,91,174,266,362,450,533,621,657,678,712,756,810,872,550,450,350,250,150,50,-150,-250,-250,-250,-250,-150,50,50,91,50,-150,-191,-274,-333,-411,-474,-411,-366,-350,-366,-411,-462,-497,-550,-550,-560,-550,-450,-350,-250,-150,50,150,233,311,397,489,582,671,756,775,804,844,893,950,550,450,350,250,150,50,-150,-191,-250,-191,-150,-150,50,150,174,91,50,-150,-191,-274,-366,-411,-333,-274,-250,-274,-333,-366,-411,-450,-450,-462,-497,-411,-333,-250,-150,50,150,250,350,450,533,621,712,804,872,899,935,980,1032,558,460,362,266,174,91,50,-150,-150,-150,50,50,91,174,233,174,91,50,-150,-250,-350,-366,-274,-191,-150,-191,-250,-274,-333,-350,-350,-366,-411,-366,-274,-191,-150,50,150,250,350,450,550,650,750,844,935,994,1027,1068,1116,582,489,397,311,233,174,91,50,50,50,91,150,174,233,174,91,50,-150,-191,-250,-250,-274,-250,-150,50,-150,-150,-191,-250,-250,-250,-274,-333,-350,-250,-150,50,91,174,266,362,460,558,657,756,856,955,1055,1120,1158,1203,621,533,450,374,311,233,174,150,150,150,174,233,266,250,150,50,-150,-191,-191,-150,-150,-191,-191,-150,50,50,50,-150,-150,-150,-150,-191,-274,-350,-250,-150,50,150,233,311,397,489,582,678,775,872,970,1068,1167,1250,1292,671,590,516,450,374,311,266,250,250,250,266,311,350,250,150,50,-150,-250,-150,50,50,-150,-150,50,91,150,91,50,50,50,50,-150,-250,-350,-250,-150,50,150,233,311,397,489,582,678,775,872,970,1068,1167,1265,1364,731,657,590,516,450,397,362,350,350,350,362,397,350,250,150,50,-150,-191,-191,-150,50,-150,-150,50,150,233,174,150,150,91,50,-150,-250,-250,-250,-150,50,91,174,266,362,460,558,657,756,856,955,1055,1154,1254,1354,799,731,657,590,533,489,460,450,450,450,460,460,362,266,174,91,50,-150,-150,-191,-150,-191,-150,50,91,150,174,233,150,50,-150,-191,-150,-150,-191,-191,-150,50,150,250,350,450,550,650,750,850,950,1050,1150,1250,1350,872,799,731,671,621,582,558,550,550,550,558,489,397,311,233,174,91,50,50,-150,-191,-274,-191,-150,50,50,91,174,150,50,-150,-150,50,50,-150,-250,-150,50,150,250,350,450,550,650,750,850,950,1050,1150,1250,1350,940,872,810,756,712,678,657,650,650,650,621,533,450,374,311,233,174,150,91,50,-150,-191,-150,-150,-150,-150,50,91,91,50,-150,-191,-150,50,-150,-250,-150,50,150,250,350,450,550,650,750,850,950,1050,1150,1250,1350,1013,950,893,844,804,775,756,750,750,750,671,590,516,450,374,311,266,233,174,91,50,-150,50,50,-150,-191,-150,50,50,-150,-191,-150,-150,-150,-150,-150,-150,50,150,250,350,450,550,650,750,850,950,1050,1150,1250,1350,1090,1032,980,935,899,872,856,850,850,810,731,657,590,516,450,397,362,311,233,150,50,-150,50,91,50,-150,-191,-150,-150,-191,-150,50,50,50,50,50,50,91,174,266,362,460,558,657,756,856,955,1055,1154,1254,1354,1171,1116,1068,1027,994,970,955,950,950,872,799,731,657,590,533,489,450,350,250,150,50,-150,50,50,-150,-150,-150,-150,-150,-150,50,91,150,150,150,150,150,174,233,311,397,489,582,678,775,872,970,1068,1167,1265,1364,1254,1203,1158,1120,1090,1068,1055,1050,1013,940,872,799,731,671,621,558,460,362,266,174,91,50,91,91,50,50,50,50,50,50,91,174,233,250,250,250,250,266,311,374,450,533,621,712,804,899,994,1090,1187,1284,1382,1339,1292,1250,1215,1187,1167,1154,1150,1081,1013,940,872,810,756,678,582,489,397,311,233,174,150,174,174,150,150,150,150,150,150,174,233,311,350,350,350,350,362,397,450,516,590,671,756,844,935,1027,1120,1215,1310,1406,1426,1382,1343,1310,1284,1265,1254,1223,1154,1081,1013,950,893,804,712,621,533,450,374,311,266,250,266,266,250,250,250,250,250,250,266,311,374,450,450,450,450,460,489,533,590,657,731,810,893,980,1068,1158,1250,1343,1437,1515,1473,1437,1406,1382,1364,1354,1295,1223,1154,1090,1027,935,844,756,671,590,516,450,397,362,350,362,362,350,350,350,350,350,350,362,397,450,516,550,550,550,558,582,621,671,731,799,872,950,1032,1116,1203,1292,1382,1473,1605,1566,1531,1502,1480,1463,1437,1364,1295,1231,1158,1068,980,893,810,731,657,590,533,489,460,450,460,460,450,450,450,450,450,450,460,489,533,590,650,650,650,657,678,712,756,810,872,940,1013,1090,1171,1254,1339,1426,1515,1696,1659,1626,1599,1578,1562,1506,1437,1371,1292,1203,1116,1032,950,872,799,731,671,621,582,558,550,558,558,550,550,550,550,550,550,558,582,621,671,731,750,750,756,775,804,844,893,950,1013,1081,1154,1231,1310,1392,1476,1562]);

  function sampleSdfBilinear(sdf, rx, ry) {
    var gx = rx + SDF_PAD;
    var gy = ry + SDF_PAD;
    if (gx < 0 || gx >= SDF_W - 1 || gy < 0 || gy >= SDF_H - 1) {
      return 10.0;
    }
    var x0 = Math.floor(gx);
    var y0 = Math.floor(gy);
    var fx = gx - x0;
    var fy = gy - y0;
    var row0 = y0 * SDF_W;
    var row1 = (y0 + 1) * SDF_W;
    var v00 = sdf[row0 + x0];
    var v10 = sdf[row0 + x0 + 1];
    var v01 = sdf[row1 + x0];
    var v11 = sdf[row1 + x0 + 1];
    var val = (1 - fx) * (1 - fy) * v00 +
              fx * (1 - fy) * v10 +
              (1 - fx) * fy * v01 +
              fx * fy * v11;
    return val * 0.01;
  }

  function catmullRomPeriodic(t, values) {
    var n = values.length;
    var normT = ((t % 1) + 1) % 1;
    var x = normT * n;
    var i = Math.floor(x) % n;
    var u = x - Math.floor(x);

    var p0 = values[(i - 1 + n) % n];
    var p1 = values[i];
    var p2 = values[(i + 1) % n];
    var p3 = values[(i + 2) % n];

    var u2 = u * u;
    var u3 = u2 * u;

    return 0.5 * (
      (2 * p1) +
      (-p0 + p2) * u +
      (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 +
      (-p0 + 3 * p1 - 3 * p2 + p3) * u3
    );
  }

  function lerp(a, b, u) {
    return a + (b - a) * u;
  }

  function smoothstep(e0, e1, x) {
    var t = (x - e0) / (e1 - e0);
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    return t * t * (3 - 2 * t);
  }

  function distCapsule(px, py, ax, ay, ra, bx, by, rb) {
    var vx = bx - ax;
    var vy = by - ay;
    var wx = px - ax;
    var wy = py - ay;
    var l2 = vx * vx + vy * vy;
    if (l2 < 1e-6) {
      return Math.hypot(wx, wy) - (ra > rb ? ra : rb);
    }
    var h = (wx * vx + wy * vy) / l2;
    if (h < 0) h = 0;
    else if (h > 1) h = 1;
    var cx = ax + h * vx;
    var cy = ay + h * vy;
    var r = ra + h * (rb - ra);
    return Math.hypot(px - cx, py - cy) - r;
  }

  function stepJoint(x, y, length, angleDeg) {
    var rad = angleDeg * DEG_TO_RAD;
    return {
      x: x + length * Math.sin(rad),
      y: y + length * Math.cos(rad)
    };
  }

  var KEYFRAMES = {
    torsoDy:      [0.00,  0.30,  0.55,  0.12, -0.48, -0.82, -0.45,  0.12,  0.50,  0.36,  0.08, -0.04],
    withersDy:    [0.00,  0.18, -0.08, -0.62, -0.95, -0.75, -0.10,  0.45,  0.78,  0.55,  0.20,  0.04],
    croupDy:      [0.00,  0.38,  0.72,  0.55,  0.08, -0.35, -0.52, -0.32,  0.05,  0.22,  0.08, -0.04],
    spineStretch: [0.00,  0.22,  0.60,  1.15,  1.58,  1.68,  1.32,  0.82,  0.38,  0.10, -0.04, -0.02],
    spineFlex:    [0.00, -0.12, -0.38, -0.72, -0.92, -0.85, -0.52, -0.22, -0.06,  0.04,  0.08,  0.04],
    neckAngleDeg: [0.00,  2.0,   4.8,   7.8,   9.8,   9.2,   6.5,   3.0,   0.6,  -0.6,  -0.8,  -0.3],
    tailLift:     [0.00, -0.48, -0.90, -0.55,  0.22,  0.95,  1.35,  1.10,  0.55,  0.15, -0.08, -0.02],
    tailWhip:     [0.00,  0.48, -0.16, -0.90, -1.25, -0.55,  0.42,  1.10,  1.28,  0.82,  0.28,  0.06],

    nfForearm:    [ 14,   28,   46,   62,   70,   64,   44,   14,  -12,  -20,    2,   10],
    nfKneeFlex:   [ 88,   62,   32,   10,    2,    0,    0,    4,   22,   66,   86,   90],
    nfFetlock:    [-18,  -16,   -6,    8,   18,   22,   24,   24,   -6,  -28,  -24,  -20],

    ffForearm:    [ -6,   20,   44,   58,   54,   30,    4,  -20,  -28,  -12,   -8,   -8],
    ffKneeFlex:   [ 48,   34,   14,    2,    0,    2,    6,   28,   70,   82,   68,   56],
    ffFetlock:    [-26,  -12,    6,   18,   22,   26,   24,   -8,  -36,  -44,  -36,  -30],

    nhGaskin:     [ -4,  -12,  -22,  -38,  -52,  -58,  -54,  -38,  -24,  -16,   -8,   -4],
    nhHockFlex:   [ 48,   30,   16,    6,    4,   18,   38,   58,   64,   58,   52,   50],
    nhFetlock:    [ 40,   22,   24,   16,   -6,  -24,  -28,  -22,   -4,   18,   34,   40],

    fhGaskin:     [-32,  -24,  -38,  -54,  -56,  -36,  -14,  -10,  -14,  -20,  -28,  -32],
    fhHockFlex:   [ 70,   32,   12,    6,   24,   54,   64,   66,   68,   70,   72,   72],
    fhFetlock:    [-38,   18,   22,    4,  -22,  -28,  -18,  -14,  -20,  -28,  -34,  -38]
  };

  function PixelHorseAnimation(options) {
    options = options || {};
    this.canvas = typeof options.canvas === 'string'
      ? document.querySelector(options.canvas)
      : options.canvas;

    if (!this.canvas) {
      throw new Error('PixelHorseAnimation: A valid <canvas> element is required.');
    }

    this.ctx = this.canvas.getContext('2d', { alpha: true });

    this.gridCols = options.gridCols || 58;
    this.gridRows = options.gridRows || 38;
    this.offsetX = 9.0;
    this.offsetY = 5.0;

    this.pixelColor = options.pixelColor || '#F2EEE4';
    this.cycleDuration = options.cycleDuration || 510;
    this.mode = options.mode || 'loading';

    this.phase = options.initialPhase || 0.0;
    this.speedMultiplier = 1.0;
    this.standBlend = 0.0;
    this.breathPhase = 0.0;
    this.isRunning = false;
    this.isPausedByVisibility = false;
    this.rafId = null;
    this.lastTimestamp = 0;

    this._onCycleCompleteCallbacks = [];

    var totalCells = this.gridCols * this.gridRows;
    this.gridState = new Uint8Array(totalCells);
    this.cellLum = new Float32Array(totalCells);
    this.cellDepth = new Uint8Array(totalCells);

    this.prefersReducedMotion = false;
    if (global.matchMedia) {
      var mq = global.matchMedia('(prefers-reduced-motion: reduce)');
      this.prefersReducedMotion = !!mq.matches;
    }

    this._boundTick = this._tick.bind(this);
    this._boundResize = this.resize.bind(this);
    this._boundVisibility = this._onVisibilityChange.bind(this);

    this._setupListeners();
    this.resize();
    this.renderFrame(this.phase, this.standBlend, 1000);
  }

  PixelHorseAnimation.prototype._setupListeners = function () {
    global.addEventListener('resize', this._boundResize, { passive: true });
    document.addEventListener('visibilitychange', this._boundVisibility, false);
  };

  PixelHorseAnimation.prototype.destroy = function () {
    this.stop();
    this._onCycleCompleteCallbacks.length = 0;
    global.removeEventListener('resize', this._boundResize);
    document.removeEventListener('visibilitychange', this._boundVisibility);
  };

  PixelHorseAnimation.prototype._onVisibilityChange = function () {
    if (document.hidden) {
      if (this.isRunning) {
        this.isPausedByVisibility = true;
        if (this.rafId) {
          cancelAnimationFrame(this.rafId);
          this.rafId = null;
        }
      }
    } else if (this.isPausedByVisibility && this.isRunning) {
      this.isPausedByVisibility = false;
      this.lastTimestamp = performance.now();
      this.rafId = requestAnimationFrame(this._boundTick);
    }
  };

  PixelHorseAnimation.prototype.resize = function () {
    var rect = this.canvas.getBoundingClientRect();
    var cssWidth = rect.width || 420;
    var cssHeight = rect.height || Math.round(cssWidth * (this.gridRows / this.gridCols));
    var dpr = Math.min(global.devicePixelRatio || 1, 2);

    var targetWidth = Math.max(1, Math.round(cssWidth * dpr));
    var targetHeight = Math.max(1, Math.round(cssHeight * dpr));

    if (this.canvas.width !== targetWidth || this.canvas.height !== targetHeight) {
      this.canvas.width = targetWidth;
      this.canvas.height = targetHeight;
    }

    var rawPitchX = targetWidth / this.gridCols;
    var rawPitchY = targetHeight / this.gridRows;
    var cellPitch = Math.max(2, Math.floor(Math.min(rawPitchX, rawPitchY)));
    var gap = Math.max(1, Math.round(cellPitch * 0.24));
    var squareSize = Math.max(1, cellPitch - gap);

    this.metrics = {
      width: targetWidth,
      height: targetHeight,
      cellPitch: cellPitch,
      squareSize: squareSize,
      gap: gap,
      originX: Math.floor((targetWidth - this.gridCols * cellPitch + gap) * 0.5),
      originY: Math.floor((targetHeight - this.gridRows * cellPitch + gap) * 0.5)
    };

    this.renderFrame(this.phase, this.standBlend, 1000);
  };

  PixelHorseAnimation.prototype.computePose = function (rawT, standBlend) {
    var sb = standBlend || 0;
    var normRaw = ((rawT % 1) + 1) % 1;

    var warp = 0.022 * (Math.sin(TWO_PI * (normRaw - 0.16)) - Math.sin(TWO_PI * -0.16));
    var t = ((normRaw + warp * (1 - sb)) % 1 + 1) % 1;

    var torsoDy      = catmullRomPeriodic(t, KEYFRAMES.torsoDy);
    var withersDy    = catmullRomPeriodic(t, KEYFRAMES.withersDy);
    var croupDy      = catmullRomPeriodic(t, KEYFRAMES.croupDy);
    var spineStretch = catmullRomPeriodic(t, KEYFRAMES.spineStretch);
    var spineFlex    = catmullRomPeriodic(t, KEYFRAMES.spineFlex);
    var neckAngleDeg = catmullRomPeriodic(t, KEYFRAMES.neckAngleDeg);
    var tailLift     = catmullRomPeriodic(t, KEYFRAMES.tailLift);
    var tailWhip     = catmullRomPeriodic(t, KEYFRAMES.tailWhip);

    var nfForearm    = catmullRomPeriodic(t, KEYFRAMES.nfForearm);
    var nfKneeFlex   = catmullRomPeriodic(t, KEYFRAMES.nfKneeFlex);
    var nfFetlock    = catmullRomPeriodic(t, KEYFRAMES.nfFetlock);

    var ffForearm    = catmullRomPeriodic(t, KEYFRAMES.ffForearm);
    var ffKneeFlex   = catmullRomPeriodic(t, KEYFRAMES.ffKneeFlex);
    var ffFetlock    = catmullRomPeriodic(t, KEYFRAMES.ffFetlock);

    var nhGaskin     = catmullRomPeriodic(t, KEYFRAMES.nhGaskin);
    var nhHockFlex   = catmullRomPeriodic(t, KEYFRAMES.nhHockFlex);
    var nhFetlock    = catmullRomPeriodic(t, KEYFRAMES.nhFetlock);

    var fhGaskin     = catmullRomPeriodic(t, KEYFRAMES.fhGaskin);
    var fhHockFlex   = catmullRomPeriodic(t, KEYFRAMES.fhHockFlex);
    var fhFetlock    = catmullRomPeriodic(t, KEYFRAMES.fhFetlock);

    var distT0 = t < 0.5 ? t : 1.0 - t;
    var refLock = Math.max(0.0, 1.0 - (distT0 / 0.10));
    refLock = refLock * refLock * (3.0 - 2.0 * refLock);

    if (sb > 0) {
      refLock *= (1.0 - sb);
      var breath = Math.sin(this.breathPhase) * 0.12 * sb;
      torsoDy      = lerp(torsoDy, breath, sb);
      withersDy    = lerp(withersDy, -0.25 + breath * 0.5, sb);
      croupDy      = lerp(croupDy, 0.0, sb);
      spineStretch = lerp(spineStretch, 0.35, sb);
      spineFlex    = lerp(spineFlex, -0.20, sb);
      neckAngleDeg = lerp(neckAngleDeg, 1.5 + breath * 2.0, sb);
      tailLift     = lerp(tailLift, -0.6, sb);
      tailWhip     = lerp(tailWhip, -0.25, sb);

      nfForearm    = lerp(nfForearm, 5.0, sb);
      nfKneeFlex   = lerp(nfKneeFlex, 2.0, sb);
      nfFetlock    = lerp(nfFetlock, 16.0, sb);

      ffForearm    = lerp(ffForearm, -6.0, sb);
      ffKneeFlex   = lerp(ffKneeFlex, 2.0, sb);
      ffFetlock    = lerp(ffFetlock, 16.0, sb);

      nhGaskin     = lerp(nhGaskin, -22.0, sb);
      nhHockFlex   = lerp(nhHockFlex, 20.0, sb);
      nhFetlock    = lerp(nhFetlock, 14.0, sb);

      fhGaskin     = lerp(fhGaskin, -30.0, sb);
      fhHockFlex   = lerp(fhHockFlex, 22.0, sb);
      fhFetlock    = lerp(fhFetlock, 14.0, sb);
    }

    return {
      torsoDy: torsoDy,
      withersDy: withersDy,
      croupDy: croupDy,
      spineStretch: spineStretch,
      spineFlex: spineFlex,
      neckAngleDeg: neckAngleDeg,
      tailLift: tailLift,
      tailWhip: tailWhip,
      refLock: refLock,
      nfForearm: nfForearm,
      nfKneeFlex: nfKneeFlex,
      nfFetlock: nfFetlock,
      ffForearm: ffForearm,
      ffKneeFlex: ffKneeFlex,
      ffFetlock: ffFetlock,
      nhGaskin: nhGaskin,
      nhHockFlex: nhHockFlex,
      nhFetlock: nhFetlock,
      fhGaskin: fhGaskin,
      fhHockFlex: fhHockFlex,
      fhFetlock: fhFetlock
    };
  };

  function evalUpperBodySkinnedSDF(rx, ry, pose) {
    var y = ry - pose.torsoDy;
    var x = rx;

    var wTail = 1.0 - smoothstep(6.0, 11.2, x);
    var wNeckHead = smoothstep(23.5, 28.0, x) * (1.0 - smoothstep(7.5, 12.5, y));

    var stretch = pose.spineStretch;
    var torsoDx = lerp(-0.42 * stretch, 0.58 * stretch, smoothstep(11.0, 29.0, x));

    var wFore = smoothstep(14.0, 28.0, x);
    var pitchDy = lerp(pose.croupDy, pose.withersDy, wFore);
    var bellArg = (x - 20.5) / 4.2;
    var midBell = Math.exp(-(bellArg * bellArg)) * smoothstep(6.0, 11.0, x) * (1.0 - wNeckHead);
    var archDy = pose.spineFlex * midBell;

    var tailDist = Math.max(0.0, (10.8 - x) / 10.8) * wTail;
    var tailDy = pose.tailLift * Math.pow(tailDist, 1.15) + pose.tailWhip * Math.pow(tailDist, 2.1);
    var tailDx = -0.35 * Math.abs(pose.tailLift) * Math.pow(tailDist, 1.4);

    var xPre = x - torsoDx - tailDx;
    var yPre = y - pitchDy - archDy - tailDy;

    if (wNeckHead > 0.001 && Math.abs(pose.neckAngleDeg) > 0.01) {
      var ang = -(pose.neckAngleDeg * wNeckHead) * DEG_TO_RAD;
      var cosA = Math.cos(ang);
      var sinA = Math.sin(ang);
      var px0 = 26.8, py0 = 10.5;
      var dx = xPre - px0;
      var dy = yPre - py0;
      xPre = px0 + dx * cosA - dy * sinA;
      yPre = py0 + dx * sinA + dy * cosA;
    }

    return sampleSdfBilinear(SDF_UPPER, xPre, yPre);
  }

  function buildLimbChain(x0, y0, l1, l2, l3, ang1, flex2, isHind, fetlockAng) {
    var j1 = stepJoint(x0, y0, l1, ang1);
    var cannonAng = isHind ? (ang1 + flex2) : (ang1 - flex2);
    var j2 = stepJoint(j1.x, j1.y, l2, cannonAng);
    var hoofAng = cannonAng + fetlockAng;
    var j3 = stepJoint(j2.x, j2.y, l3, hoofAng);
    var radHf = (hoofAng + 15.0) * DEG_TO_RAD;
    return {
      p0x: x0, p0y: y0,
      p1x: j1.x, p1y: j1.y,
      p2x: j2.x, p2y: j2.y,
      p3x: j3.x, p3y: j3.y,
      htx: j3.x + 0.55 * Math.sin(radHf),
      hty: j3.y + 0.55 * Math.cos(radHf)
    };
  }

  function evalLegSDF(px, py, leg, rUpper, rMid, rLow, rHoof) {
    var d1 = distCapsule(px, py, leg.p0x, leg.p0y, rUpper, leg.p1x, leg.p1y, rMid);
    var d2 = distCapsule(px, py, leg.p1x, leg.p1y, rMid, leg.p2x, leg.p2y, rLow);
    var d3 = distCapsule(px, py, leg.p2x, leg.p2y, rLow, leg.p3x, leg.p3y, rHoof);
    var d4 = distCapsule(px, py, leg.p3x, leg.p3y, rHoof, leg.htx, leg.hty, rHoof * 0.92);
    return Math.min(d1, d2, d3, d4);
  }

  PixelHorseAnimation.prototype.renderFrame = function (phase, standBlend, dtMs) {
    var dt = dtMs || 16.67;
    var pose = this.computePose(phase, standBlend);
    var ox = this.offsetX;
    var oy = this.offsetY;
    var stretch = pose.spineStretch;
    var ty = pose.torsoDy;

    var hipX = 14.0 - 0.42 * stretch;
    var hipY = 16.5 + ty + pose.croupDy;

    var chestX = 27.6 + 0.58 * stretch;
    var chestY = 17.2 + ty + pose.withersDy;

    var nfLeg = buildLimbChain(chestX + 0.6, chestY + 0.2, 5.2, 3.6, 2.1, pose.nfForearm, pose.nfKneeFlex, false, pose.nfFetlock);
    var ffLeg = buildLimbChain(chestX - 1.4, chestY + 0.0, 4.8, 3.4, 2.0, pose.ffForearm, pose.ffKneeFlex, false, pose.ffFetlock);
    var nhLeg = buildLimbChain(hipX + 1.5,   hipY + 0.3,   4.6, 4.4, 2.4, pose.nhGaskin,  pose.nhHockFlex, true,  pose.nhFetlock);
    var fhLeg = buildLimbChain(hipX - 1.3,   hipY - 0.1,   4.4, 4.3, 2.2, pose.fhGaskin,  pose.fhHockFlex, true,  pose.fhFetlock);

    var refLock = pose.refLock;
    var cols = this.gridCols;
    var rows = this.gridRows;
    var state = this.gridState;
    var lum = this.cellLum;
    var depth = this.cellDepth;
    var m = this.metrics;
    var ctx = this.ctx;

    ctx.clearRect(0, 0, m.width, m.height);

    var minCol = Math.max(0, Math.floor(ox - 6));
    var maxCol = Math.min(cols - 1, Math.ceil(ox + 45));
    var minRow = Math.max(0, Math.floor(oy - 4));
    var maxRow = Math.min(rows - 1, Math.ceil(oy + 31));

    var pitch = m.cellPitch;
    var sq = m.squareSize;
    var origX = m.originX;
    var origY = m.originY;

    var attackAlpha = dt >= 100 ? 1.0 : (1.0 - Math.exp(-dt / 11.0));
    var releaseAlpha = dt >= 100 ? 1.0 : (1.0 - Math.exp(-dt / 19.0));

    for (var r = minRow; r <= maxRow; r++) {
      var ry = r - oy;
      var rowOffset = r * cols;
      var drawY = origY + r * pitch;

      for (var c = minCol; c <= maxCol; c++) {
        var rx = c - ox;
        var idx = rowOffset + c;

        var dUpper = evalUpperBodySkinnedSDF(rx, ry, pose);
        var dNf = evalLegSDF(rx, ry, nfLeg, 1.65, 1.05, 0.85, 0.98);
        var dFf = evalLegSDF(rx, ry, ffLeg, 1.55, 0.98, 0.80, 0.94);
        var dNh = evalLegSDF(rx, ry, nhLeg, 1.85, 1.10, 0.86, 0.98);
        var dFh = evalLegSDF(rx, ry, fhLeg, 1.75, 1.04, 0.80, 0.92);

        var dNear = Math.min(dUpper, dNf, dNh);
        var dFar  = Math.min(dFf, dFh);
        var dTotal = dNear < dFar ? dNear : dFar;

        if (refLock > 0.001) {
          var dRef = sampleSdfBilinear(SDF_FULL_REF, rx, ry);
          dTotal = lerp(dTotal, dRef, refLock);
          dNear = lerp(dNear, dRef, refLock);
        }

        var prevActive = state[idx];
        var threshold = prevActive ? 0.018 : -0.018;
        var isActive = dTotal <= threshold ? 1 : 0;
        state[idx] = isActive;

        if (isActive) {
          depth[idx] = (dNear <= 0.05) ? 1 : 2;
        }

        var targetLum = isActive ? (depth[idx] === 2 ? 0.88 : 1.0) : 0.0;
        var curLum = lum[idx];
        if (targetLum > curLum) {
          curLum += (targetLum - curLum) * attackAlpha;
        } else {
          curLum += (targetLum - curLum) * releaseAlpha;
        }

        if (curLum < 0.22) {
          lum[idx] = 0.0;
          continue;
        }
        lum[idx] = curLum;

        var drawX = origX + c * pitch;
        if (curLum >= 0.95) {
          ctx.fillStyle = '#F2EEE4';
          ctx.fillRect(drawX, drawY, sq, sq);
        } else if (depth[idx] === 2 && isActive) {
          ctx.fillStyle = '#F2EEE4';
          ctx.fillRect(drawX, drawY, sq, sq);
        } else {
          ctx.fillStyle = 'rgba(242, 238, 228, ' + curLum.toFixed(3) + ')';
          ctx.fillRect(drawX, drawY, sq, sq);
        }
      }
    }
  };

  PixelHorseAnimation.prototype.start = function () {
    if (this.isRunning) return;
    if (this.prefersReducedMotion) { this.renderFrame(0, 1, 1000); return; }
    this.isRunning = true;
    this.lastTimestamp = performance.now();
    this.rafId = requestAnimationFrame(this._boundTick);
  };

  PixelHorseAnimation.prototype.stop = function () {
    this.isRunning = false;
    this.isPausedByVisibility = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  };

  PixelHorseAnimation.prototype._tick = function (now) {
    if (!this.isRunning) return;

    var dt = now - this.lastTimestamp;
    this.lastTimestamp = now;
    /* A long frame (the page was busy) used to be treated as 16 ms, which stalled the legs and then jumped them. The real time
       is used, capped, so the gait stays continuous and merely catches up over a few frames. */
    if (dt < 0) dt = 16.67;
    if (dt > 100) dt = 100;

    if (this.mode === 'loading') {
      var effectiveSpeed = this.prefersReducedMotion
        ? this.speedMultiplier * 0.65
        : this.speedMultiplier;

      var prevPhase = this.phase;
      var deltaPhase = (dt / this.cycleDuration) * effectiveSpeed;
      var nextPhase = prevPhase + deltaPhase;

      this.breathPhase = (this.breathPhase + dt * 0.0035) % TWO_PI;

      if (nextPhase >= 1.0) {
        nextPhase = nextPhase % 1.0;
        if (this._onCycleCompleteCallbacks.length > 0) {
          var cbs = this._onCycleCompleteCallbacks.slice();
          this._onCycleCompleteCallbacks.length = 0;
          for (var i = 0; i < cbs.length; i++) {
            cbs[i]();
          }
        }
      }

      this.phase = nextPhase;
      this.renderFrame(this.phase, this.standBlend, dt);
    }

    if (this.isRunning) {
      this.rafId = requestAnimationFrame(this._boundTick);
    }
  };

  PixelHorseAnimation.prototype.onNextCycleComplete = function (callback) {
    if (typeof callback === 'function') {
      this._onCycleCompleteCallbacks.push(callback);
    }
  };

  PixelHorseAnimation.prototype.setScrollProgress = function (progress) {
    this.phase = ((progress % 1) + 1) % 1;
    this.standBlend = 0.0;
    this.renderFrame(this.phase, 0.0, 16.67);
  };

  global.PixelHorseAnimation = PixelHorseAnimation;
})(window);
