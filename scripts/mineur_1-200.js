// BEGIN-IGNORE //

//Créateur Simoki //
AUTO_DELETE = [10792, 10793, 10795, 10796, 10801, 10797, 10784, 10798, 10799, 10794, 10785, 10800, 881, 385, 1736, 884, 883, 395, 885, 304, 14672, 2419, 2422, 384, 882, 2419, 887, 2425, 2419, 14687, 2419, 2425];


// END-IGNORE //
// BEGIN-ENCODE //
var IDItem1 = 312; // Fer
var IDItem2 = 441; // Cuivre
var IDItem3 = 442; // Bronze
var IDItem4 = 443; // Kobalte
var IDItem5 = 444; // Etain
var IDItem6 = 350; // Argent
var IDItem7 = 446; // Bauxite
var IDItem8 = 313; // Or

var gotobanqueastrub = false;
var mineur1 = false;
var mineur20 = false;
var combatAstrub = false;
var gotobanquebrakmar = false;

function* Selling() {
    var hdida = getItems().find(item => item.name == "Fer").quantity;
    if (characterKamas() > 1000 && hdida > 99) {
        // yield openSellShop();
        let Priceitem = getPriceItem(IDItem1, 2);
        if (Priceitem > 10) {
            while ((hdida > 99) && (availableSpace() > 0)) {
                yield openSellShop();
                yield sell(IDItem1, 2, Priceitem - 1);
                yield log.success("lhdida  sold");
                closeShop()

            }

        }

    }
    var cuivra = getItems().find(item => item.name == "Cuivre").quantity;
    if (characterKamas() > 1000 && cuivra > 99) {
        //yield openSellShop();
        let Priceitem = getPriceItem(IDItem2, 2);
        if (Priceitem > 10) {
            while ((cuivra > 99) && (availableSpace() > 0)) {
                yield openSellShop();
                yield sell(IDItem2, 2, Priceitem - 1);
                yield log.success("cuivre sold");
                closeShop()

            }

        }

    }
    var Bronza = getItems().find(item => item.name == "Bronze").quantity;
    if (characterKamas() > 1000 && Bronza > 99) {
        // yield openSellShop();
        let Priceitem = getPriceItem(IDItem3, 2);
        if (Priceitem > 10) {
            while ((Bronza > 99) && (availableSpace() > 0)) {
                yield openSellShop();
                yield sell(IDItem3, 2, Priceitem - 1);
                yield log.success("bronze sold");
                closeShop()

            }

        }

    }
    var Kobalta = getItems().find(item => item.name == "Kobalte").quantity;
    if (characterKamas() > 1000 && Kobalta > 99) {
        //yield openSellShop();
        let Priceitem = getPriceItem(IDItem4, 2);
        if (Priceitem > 10) {
            while ((Kobalta > 99) && (availableSpace() > 0)) {
                yield openSellShop();
                yield sell(IDItem4, 2, Priceitem - 1);
                yield log.success("kobatle sold");
                closeShop()

            }

        }

    }
    var Etaina = getItems().find(item => item.name == "Etain").quantity;
    if (characterKamas() > 1000 && Etaina > 99) {
        //yield openSellShop();
        let Priceitem = getPriceItem(IDItem5, 2);
        if (Priceitem > 10) {
            while ((Etaina > 99) && (availableSpace() > 0)) {
                yield openSellShop();
                yield sell(IDItem5, 2, Priceitem - 1);
                yield log.success("etain sold");
                closeShop()

            }

        }

    }
    var Argenta = getItems().find(item => item.name == "Argent").quantity;
    if (characterKamas() > 1000 && Argenta > 99) {
        // yield openSellShop();
        let Priceitem = getPriceItem(IDItem6, 2);
        if (Priceitem > 10) {
            while ((Argenta > 99) && (availableSpace() > 0)) {
                yield openSellShop();
                yield sell(IDItem6, 2, Priceitem - 1);
                yield log.success("argent sold");
                closeShop()

            }

        }

    }
    var Ora = getItems().find(item => item.name == "Or").quantity;
    if (characterKamas() > 1000 && Ora > 99) {
        // yield openSellShop();
        let Priceitem = getPriceItem(IDItem8, 2);
        if (Priceitem > 10) {
            while ((Ora > 99) && (availableSpace() > 0)) {
                yield openSellShop();
                yield sell(IDItem8, 2, Priceitem - 1);
                yield log.success("or sold");
                closeShop()

            }

        }

    }
    var Bauxita = getItems().find(item => item.name == "Bauxite").quantity;
    if (characterKamas() > 1000 && Bauxita > 99) {
        //yield openSellShop();
        let Priceitem = getPriceItem(IDItem7, 2);
        if (Priceitem > 10) {
            while ((Bauxita > 99) && (availableSpace() > 0)) {
                yield openSellShop();
                yield sell(IDItem7, 2, Priceitem - 1);
                yield log.success("Bauxite sold");
                closeShop()

            }

        }

    }


} // PRICE 9ado mzl mbuggi

function* goAstrub() {
    yield talk(888);
    yield sleep(2500);
    yield reply(0);
    yield sleep(2500);
    yield reply(0);
    yield log.success("Transfert vers Astrub");
    yield sleep(2500);
    yield reply(0);
    yield leave();
}

function* prendreKamasBrakmar() {
    yield npcBank();
    yield sleep(400);
    yield sendAllObjects();
    yield sleep(400);
    yield takeKamas();
    yield yield log.success("[Banque] : kamas baybee On les prend et on reprend la route");
    yield leave();
    yield sleep(400);
    yield openSellShop();
    yield sleep(400);
    yield updateAllItems(closeWhenOver);
    yield log.success("Mise à jour des prix");
    yield sleep(400);
    yield tpbrakmar();
    yield gotobanquebrakmar === false;
    yield mineur20 === true;
}

function* prendreKamasAstrub() {
    yield npcBank();
    yield sleep(400);
    yield sendAllObjects();
    yield sleep(400);
    yield takeKamas();
    yield log.success("[Banque] : kamas baybee On les prend et on reprend la route");
    yield leave();
    yield sleep(400);
    yield openSellShop();
    yield sleep(400);
    yield updateAllItems(closeWhenOver);
    yield log.success("Mise à jour des prix");
    yield sleep(400);
    yield tpastrub();
    yield mineur1 === true;
    yield gotobanqueastrub === false;
}

function* tpastrub() {
    yield openSellShop();
    yield sleep(400);
    yield buy(548, 1, 300, closeWhenOver);
    yield log.success("Popo rappel");
    yield sleep(400);
    yield useItem(548);
    yield log.success("Utilisée");
}

function* tpbrakmar() {
    yield openSellShop();
    yield sleep(400);
    yield buy(6964, 1, 300, closeWhenOver);
    yield log.success("Popo brak");
    yield sleep(400);
    yield useItem(6964);
    yield log.success("Utilisée");
}

function* apprendreMineur() {
    yield talk(596);
    yield sleep(400);
    yield reply(1);
    yield sleep(400);
    yield reply(0);
    yield sleep(400);
    yield leave();
    yield moveToCell(263);
}

function* gomapmine() {
    yield moveToCell(263);
}

function* loopastrub1() {
    yield moveToCell(137);
}

function* loopastrub2() {
    if (onCell(535) == true) {
        yield sleep(400);
        yield moveToCell(306);
    } else {
        yield sleep(400);
        yield moveToCell(548);
    }
}

function* loopastrub3() {
    if (onCell(506) == true) {
        yield sleep(400);
        yield moveToCell(361);
    } else {
        yield sleep(400);
        yield moveToCell(519);
    }
}

function* loopastrub4() {
    yield moveToCell(534);
}

function* loopBrak10() {

    if (onCell(474) == true) {
        yield sleep(400);
        yield moveToCell(416);
        yield sleep(400);
        yield moveToCell(489);
    } else {
        yield sleep(400);
        yield moveToCell(489);
    }

}

function* loopBrak9() {
    if (onCell(460) == true) {
        yield sleep(400);
        yield moveToCell(155);
    } else if (onCell(170) == true) {
        yield sleep(400);
        yield moveToCell(474);
    } else {
        yield sleep(400);
        yield moveToCell(155);
    }
}

function* loopBrak8() {

    if (onCell(460) == true) {
        yield sleep(400);
        yield moveToCell(416);
        yield sleep(400);
        yield moveToCell(474);
    } else {
        yield sleep(400);
        yield moveToCell(474);
    }

}

function* loopBrak7() {

    if (onCell(460) == true) {
        yield sleep(400);
        yield moveToCell(155);
    } else if (onCell(170) == true) {
        yield sleep(400);
        yield moveToCell(474);
    } else {
        yield sleep(400);
        yield moveToCell(155);
    }

}

function* loopBrak6() {

    if (onCell(449) == true) {
        yield sleep(400);
        yield moveToCell(408);
        yield sleep(400);
        yield moveToCell(462);
    } else {
        yield sleep(400);
        yield moveToCell(462);
    }

}

function* loopBrak5() {

    if (onCell(449) == true) {
        yield sleep(400);
        yield moveToCell(138);
    } else if (onCell(152) == true) {
        yield sleep(400);
        yield moveToCell(113);

    } else if (onCell(127) == true) {
        yield sleep(400);
        yield moveToCell(462);
    } else {
        yield sleep(400);
        yield moveToCell(462);
    }

}

function* loopBrak4() {

    if (onCell(449) == true) {
        yield sleep(400);
        yield moveToCell(152);
    } else if (onCell(165) == true) {
        yield sleep(400);
        yield moveToCell(462);
    } else {
        yield sleep(400);
        yield moveToCell(152);
    }

}

function* loopBrak3() {

    if (onCell(170) == true) {
        yield sleep(400);
        yield moveToCell(213);
        yield sleep(400);
        yield moveToCell(155);
    } else {
        yield sleep(400);
        yield moveToCell(155);
    }

}

function* loopBrak2() {

    if (onCell(170) == true) {
        yield sleep(400);
        yield moveToCell(474);
    } else if (onCell(460) == true) {
        yield sleep(400);
        yield moveToCell(155);
    } else {
        yield sleep(400);
        yield moveToCell(474);
    }

}

function* loopBrak1() {

    if (onCell(127) == true) {
        yield sleep(400);
        yield moveToCell(432);
    } else if (onCell(417) == true) {
        yield sleep(400);
        yield moveToCell(138);
    } else if (onCell(152) == true) {
        yield sleep(400);
        yield moveToCell(113);

    } else if (onCell(449) == true) {
        yield sleep(400);
        yield moveToCell(432);
    } else {
        yield sleep(400);
        yield moveToCell(113);
    }

}

function* move() {
    Selling();
    let joblvl = characterJobs().find(job => job.name == "Mineur").level;

    if (joblvl < 20 && characterLevel() > 19 && characterKamas() > 299) {
        yield mineur1 = true;
        yield mineur20 = false;
        yield combatAstrub = false;
        yield gotobanquebrakmar = false;
        yield gotobanqueastrub = false;
    }

    if (joblvl < 20 && characterLevel() > 19 && characterKamas() < 300) {
        yield gotobanqueastrub = true;
        yield mineur1 = false;
        yield mineur20 = false;
        yield combatAstrub = false;
        yield gotobanquebrakmar = false;
    }

    if (joblvl > 19 && characterLevel() > 19 && characterKamas() > 299) {
        yield mineur20 = true;
        yield gotobanquebrakmar = false;
        yield combatAstrub = false;
        yield mineur1 = false;
        yield gotobanqueastrub = false;
    }

    if (joblvl > 19 && characterLevel() > 19 && characterKamas() < 300) {
        yield gotobanquebrakmar = true;
        yield mineur20 = false;
        yield combatAstrub = false;
        yield mineur1 = false;
        yield gotobanqueastrub = false;
    }

    if (characterLevel() < 20) {
        yield combatAstrub = true;
        yield mineur20 = false;
        yield mineur1 = false;
        yield gotobanquebrakmar = false;
        yield gotobanqueastrub = false;
    }


    if (combatAstrub == true) {
        if (characterLevel() <= 5) {
            yield MIN_MONSTERS = 1;
            yield MAX_MONSTERS = 1;
        }
        if (characterLevel() > 5 && characterLevel() <= 10) {
            yield MIN_MONSTERS = 1;
            yield MAX_MONSTERS = 2;
        }
        if (characterLevel() > 10 && characterLevel() < 20) {
            yield MIN_MONSTERS = 1;
            yield MAX_MONSTERS = 3;
        }
        return [{
                map: '-5,-1',
                path: 'bottom'
            }, //Dessente incarnam
            {
                map: '-4,0',
                path: 'right'
            },
            {
                map: '-3,1',
                path: 'right'
            },
            {
                map: '-2,2',
                path: 'bottom'
            },
            {
                map: '0,3',
                path: 'right'
            },
            {
                map: '1,3',
                path: 'right'
            },
            {
                map: '2,3',
                path: 'right'
            },
            {
                map: '3,3',
                path: 'right'
            },
            {
                map: '4,3',
                path: 'right'
            },
            {
                map: '5,3',
                path: 'right'
            },
            {
                map: '6,3',
                path: 'right'
            },
            {
                map: '7,3',
                path: 'right'
            },
            {
                map: '8,3',
                path: 'right'
            },
            {
                map: '80220676',
                custom: goAstrub
            },
            {
                map: '2,-12',
                path: 'right'
            }, //Phénix Piou
            {
                map: '3,-12',
                path: 'right'
            },
            {
                map: '4,-12',
                path: 'top'
            },
            {
                map: '4,-13',
                path: 'top'
            },
            {
                map: '4,-14',
                path: 'top'
            },
            {
                map: '4,-15',
                path: 'left'
            }, //Phénix Piou
            {
                map: '-1,-14',
                fight: true,
                path: 'right'
            }, // Combats Astrub
            {
                map: '0,-14',
                fight: true,
                path: 'right'
            },
            {
                map: '1,-14',
                fight: true,
                path: 'right'
            },
            {
                map: '2,-14',
                fight: true,
                path: 'right'
            },
            {
                map: '3,-14',
                fight: true,
                path: 'top'
            },
            {
                map: '3,-15',
                fight: true,
                path: 'top'
            },
            {
                map: '3,-16',
                fight: true,
                path: 'right'
            },
            {
                map: '4,-16',
                fight: true,
                path: 'right'
            },
            {
                map: '5,-16',
                fight: true,
                path: 'right'
            },
            {
                map: '6,-16',
                fight: true,
                path: 'right'
            },
            {
                map: '7,-16',
                fight: true,
                path: 'top'
            },
            {
                map: '7,-17',
                fight: true,
                path: 'top'
            },
            {
                map: '7,-18',
                fight: true,
                path: 'top'
            },
            {
                map: '7,-19',
                fight: true,
                path: 'top'
            },
            {
                map: '7,-20',
                fight: true,
                path: 'top'
            },
            {
                map: '7,-21',
                fight: true,
                path: 'left'
            },
            {
                map: '6,-21',
                fight: true,
                path: 'bottom'
            },
            {
                map: '6,-20',
                fight: true,
                path: 'bottom'
            },
            {
                map: '6,-19',
                fight: true,
                path: 'left'
            },
            {
                map: '5,-19',
                fight: true,
                path: 'left'
            },
            {
                map: '4,-19',
                path: 'left'
            },
            {
                map: '84674566',
                fight: true,
                path: 'right	'
            },
            {
                map: '3,-19',
                fight: true,
                path: 'top'
            },
            {
                map: '3,-20',
                fight: true,
                path: 'top'
            },
            {
                map: '3,-21',
                fight: true,
                path: 'top'
            },
            {
                map: '3,-22',
                fight: true,
                path: 'left'
            },
            {
                map: '2,-22',
                fight: true,
                path: 'left'
            },
            {
                map: '1,-22',
                fight: true,
                path: 'bottom'
            },
            {
                map: '1,-21',
                fight: true,
                path: 'bottom'
            },
            {
                map: '2,-20',
                fight: true,
                path: 'left'
            },
            {
                map: '1,-20',
                fight: true,
                path: 'bottom'
            },
            {
                map: '1,-19',
                fight: true,
                path: 'left'
            },
            {
                map: '0,-19',
                fight: true,
                path: 'left'
            },
            {
                map: '-1,-19',
                fight: true,
                path: 'bottom'
            },
            {
                map: '-1,-18',
                fight: true,
                path: 'bottom'
            },
            {
                map: '-1,-17',
                fight: true,
                path: 'bottom'
            },
            {
                map: '-1,-16',
                fight: true,
                path: 'bottom'
            },
            {
                map: '-1,-15',
                fight: true,
                path: 'bottom'
            },
            {
                map: '83887104',
                path: '396'
            },
        ];
    }


    if (mineur1 == true && joblvl < 1) {

        return [{
                map: '-1,-14',
                path: 'top'
            },
            {
                map: '0,-14',
                path: 'top'
            },
            {
                map: '1,-14',
                path: 'top'
            },
            {
                map: '2,-14',
                path: 'top'
            },
            {
                map: '3,-14',
                path: 'top'
            },
            {
                map: '4,-15',
                path: 'top'
            },
            {
                map: '4,-16',
                path: 'top'
            },
            {
                map: '3,-15',
                path: 'top'
            },
            {
                map: '3,-16',
                path: 'top'
            },
            {
                map: '3,-17',
                path: 'top'
            },
            {
                map: '3,-18',
                path: 'top'
            },
            {
                map: '-1,-15',
                path: 'top'
            },
            {
                map: '-1,-16',
                path: 'right'
            },
            {
                map: '0,-16',
                path: 'right'
            },
            {
                map: '1,-16',
                path: 'right'
            },
            {
                map: '2,-16',
                path: 'right'
            },
            {
                map: '0,-15',
                path: 'right'
            },
            {
                map: '1,-15',
                path: 'right'
            },
            {
                map: '2,-15',
                path: 'right'
            },
            {
                map: '-1,-17',
                path: 'right'
            },
            {
                map: '0,-17',
                path: 'right'
            },
            {
                map: '1,-17',
                path: 'right'
            },
            {
                map: '2,-17',
                path: 'right'
            },
            {
                map: '-1,-18',
                path: 'right'
            },
            {
                map: '0,-18',
                path: 'right'
            },
            {
                map: '1,-18',
                path: 'right'
            },
            {
                map: '2,-18',
                path: 'right'
            },
            {
                map: '-1,-19',
                path: 'right'
            },
            {
                map: '0,-19',
                path: 'right'
            },
            {
                map: '1,-19',
                path: 'right'
            },
            {
                map: '2,-19',
                path: 'right'
            },
            {
                map: '4,-17',
                path: 'top'
            },
            {
                map: '4,-18',
                path: 'top'
            },
            {
                map: '5,-15',
                path: 'top'
            },
            {
                map: '5,-16',
                path: 'top'
            },
            {
                map: '6,-15',
                path: 'top'
            },
            {
                map: '7,-15',
                path: 'top'
            },
            {
                map: '7,-16',
                path: 'top'
            },
            {
                map: '6,-16',
                path: 'top'
            },
            {
                map: '6,-17',
                path: 'top'
            },
            {
                map: '5,-17',
                path: 'top'
            },
            {
                map: '7,-18',
                path: 'left'
            },
            {
                map: '6,-18',
                path: 'left'
            },
            {
                map: '5,-18',
                path: 'left'
            },
            {
                map: '7,-19',
                path: 'left'
            },
            {
                map: '6,-19',
                path: 'left'
            },
            {
                map: '5,-19',
                path: 'left'
            },
            {
                map: '5,-20',
                path: 'bottom'
            },
            {
                map: '5,-21',
                path: 'bottom'
            },
            {
                map: '6,-21',
                path: 'bottom'
            },
            {
                map: '7,-21',
                path: 'bottom'
            },
            {
                map: '7,-20',
                path: 'left'
            },
            {
                map: '6,-20',
                path: 'bottom'
            },
            {
                map: '-1,-22',
                path: 'bottom'
            },
            {
                map: '-1,-21',
                path: 'bottom'
            },
            {
                map: '-1,-20',
                path: 'bottom'
            },
            {
                map: '0,-22',
                path: 'bottom'
            },
            {
                map: '0,-21',
                path: 'bottom'
            },
            {
                map: '0,-20',
                path: 'bottom'
            },
            {
                map: '1,-22',
                path: 'bottom'
            },
            {
                map: '1,-21',
                path: 'bottom'
            },
            {
                map: '1,-20',
                path: 'bottom'
            },
            {
                map: '2,-22',
                path: 'bottom'
            },
            {
                map: '2,-21',
                path: 'bottom'
            },
            {
                map: '2,-20',
                path: 'bottom'
            },
            {
                map: '3,-22',
                path: 'bottom'
            },
            {
                map: '3,-21',
                path: 'bottom'
            },
            {
                map: '3,-20',
                path: 'bottom'
            },
            {
                map: '84674051',
                path: 'right'
            },
            {
                map: '84674563',
                custom: saveZaapAstrub,
                path: 'top'
            }, // SAUVEGARDE ZAAP
            {
                map: '84675586',
                path: 'left'
            },
            {
                map: '84675074',
                path: 'bottom'
            },
            {
                map: '84675075',
                path: 'left'
            },
            {
                map: '84674562',
                path: 'top'
            },
            {
                map: '84674561',
                path: 'top'
            },
            {
                map: '84674560',
                path: 'right'
            },
            {
                map: '84675072',
                path: 'right'
            },
            {
                map: '84675584',
                path: 'right'
            },
            {
                map: '84676096',
                path: 'right'
            },
            {
                map: '84676608',
                path: 'right'
            },
            {
                map: '84677120',
                path: 'top'
            },
            {
                map: '84677377',
                interactive: 358
            },
            {
                map: '102236673',
                custom: apprendreMineur
            },
        ];
    }

    if (mineur1 == true && joblvl > 0) {

        return [{
                map: '-1,-14',
                path: 'top'
            },
            {
                map: '0,-14',
                path: 'top'
            },
            {
                map: '1,-14',
                path: 'top'
            },
            {
                map: '2,-14',
                path: 'top'
            },
            {
                map: '3,-14',
                path: 'top'
            },
            {
                map: '4,-15',
                path: 'top'
            },
            {
                map: '4,-16',
                path: 'top'
            },
            {
                map: '3,-15',
                path: 'top'
            },
            {
                map: '3,-16',
                path: 'top'
            },
            {
                map: '3,-17',
                path: 'top'
            },
            {
                map: '3,-18',
                path: 'top'
            },
            {
                map: '-1,-15',
                path: 'top'
            },
            {
                map: '-1,-16',
                path: 'right'
            },
            {
                map: '0,-16',
                path: 'right'
            },
            {
                map: '1,-16',
                path: 'right'
            },
            {
                map: '2,-16',
                path: 'right'
            },
            {
                map: '0,-15',
                path: 'right'
            },
            {
                map: '1,-15',
                path: 'right'
            },
            {
                map: '2,-15',
                path: 'right'
            },
            {
                map: '-1,-17',
                path: 'right'
            },
            {
                map: '0,-17',
                path: 'right'
            },
            {
                map: '1,-17',
                path: 'right'
            },
            {
                map: '2,-17',
                path: 'right'
            },
            {
                map: '-1,-18',
                path: 'right'
            },
            {
                map: '0,-18',
                path: 'right'
            },
            {
                map: '1,-18',
                path: 'right'
            },
            {
                map: '2,-18',
                path: 'right'
            },
            {
                map: '-1,-19',
                path: 'right'
            },
            {
                map: '0,-19',
                path: 'right'
            },
            {
                map: '1,-19',
                path: 'right'
            },
            {
                map: '2,-19',
                path: 'right'
            },
            {
                map: '4,-17',
                path: 'top'
            },
            {
                map: '4,-18',
                path: 'top'
            },
            {
                map: '5,-15',
                path: 'top'
            },
            {
                map: '5,-16',
                path: 'top'
            },
            {
                map: '6,-15',
                path: 'top'
            },
            {
                map: '7,-15',
                path: 'top'
            },
            {
                map: '7,-16',
                path: 'top'
            },
            {
                map: '6,-16',
                path: 'top'
            },
            {
                map: '6,-17',
                path: 'top'
            },
            {
                map: '5,-17',
                path: 'top'
            },
            {
                map: '7,-18',
                path: 'left'
            },
            {
                map: '6,-18',
                path: 'left'
            },
            {
                map: '5,-18',
                path: 'left'
            },
            {
                map: '7,-19',
                path: 'left'
            },
            {
                map: '6,-19',
                path: 'left'
            },
            {
                map: '5,-19',
                path: 'left'
            },
            {
                map: '5,-20',
                path: 'bottom'
            },
            {
                map: '5,-21',
                path: 'bottom'
            },
            {
                map: '6,-21',
                path: 'bottom'
            },
            {
                map: '7,-21',
                path: 'bottom'
            },
            {
                map: '7,-20',
                path: 'left'
            },
            {
                map: '6,-20',
                path: 'bottom'
            },
            {
                map: '-1,-22',
                path: 'bottom'
            },
            {
                map: '-1,-21',
                path: 'bottom'
            },
            {
                map: '-1,-20',
                path: 'bottom'
            },
            {
                map: '0,-22',
                path: 'bottom'
            },
            {
                map: '0,-21',
                path: 'bottom'
            },
            {
                map: '0,-20',
                path: 'bottom'
            },
            {
                map: '1,-22',
                path: 'bottom'
            },
            {
                map: '1,-21',
                path: 'bottom'
            },
            {
                map: '1,-20',
                path: 'bottom'
            },
            {
                map: '2,-22',
                path: 'bottom'
            },
            {
                map: '2,-21',
                path: 'bottom'
            },
            {
                map: '2,-20',
                path: 'bottom'
            },
            {
                map: '3,-22',
                path: 'bottom'
            },
            {
                map: '3,-21',
                path: 'bottom'
            },
            {
                map: '3,-20',
                path: 'bottom'
            },
            {
                map: '84674051',
                path: 'right'
            },
            {
                map: '84674563',
                path: 'top'
            }, // zaap astrub
            {
                map: '84675586',
                path: 'left'
            },
            {
                map: '84675074',
                path: 'bottom'
            },
            {
                map: '84675075',
                path: 'left'
            },
            {
                map: '84674562',
                path: 'top'
            },
            {
                map: '84674561',
                path: 'top'
            },
            {
                map: '84674560',
                path: 'right'
            },
            {
                map: '84675072',
                path: 'right'
            },
            {
                map: '84675584',
                path: 'right'
            },
            {
                map: '84676096',
                path: 'right'
            },
            {
                map: '84676608',
                path: 'right'
            },
            {
                map: '84677120',
                path: 'top'
            },
            {
                map: '84677377',
                interactive: 358
            },
            {
                map: '102236673',
                custom: gomapmine
            },
            {
                map: '102237697',
                gather: true,
                custom: loopastrub1
            },
            {
                map: '102238721',
                gather: true,
                custom: loopastrub2
            },
            {
                map: '102239745',
                gather: true,
                custom: loopastrub3
            },
            {
                map: '102236675',
                gather: true,
                custom: loopastrub4
            },

        ];
    }

    if (mineur20 == true) {
        return [{
                map: '102237697',
                custom: tpbrakmar
            },
            {
                map: '102238721',
                custom: tpbrakmar
            },
            {
                map: '102239745',
                custom: tpbrakmar
            },
            {
                map: '102236675',
                custom: tpbrakmar
            },
            {
                map: '8913935',
                custom: tpbrakmar
            }, // Pour banque brak si jamais on force le retour banque
            {
                map: '13631488',
                path: '534'
            },
            {
                map: '144420',
                path: 'top'
            },
            {
                map: '144419',
                path: 'top'
            },
            {
                map: '144418',
                path: 'top'
            },
            {
                map: '144417',
                path: 'top'
            },
            {
                map: '144416',
                path: 'top'
            },
            {
                map: '144415',
                interactive: 125
            },
            {
                map: '143902',
                path: 'top'
            },
            {
                map: '143901',
                path: 'top'
            },
            {
                map: '143900',
                path: 'top'
            },
            {
                map: '143899',
                path: 'top'
            },
            {
                map: '143898',
                path: 'top'
            },
            {
                map: '143897',
                path: 'top'
            },
            {
                map: '143896',
                interactive: 174
            }, // DIRECTION MINE BRAK
            {
                map: '29884416',
                path: '347'
            },
            {
                map: '29885952',
                gather: true,
                custom: loopBrak1
            },
            {
                map: '29887491',
                gather: true,
                custom: loopBrak2
            },
            {
                map: '29884422',
                gather: true,
                custom: loopBrak3
            },
            {
                map: '29885958',
                gather: true,
                custom: loopBrak4
            },
            {
                map: '29887494',
                gather: true,
                custom: loopBrak5
            },
            {
                map: '29884425',
                gather: true,
                custom: loopBrak6
            },
            {
                map: '29885961',
                gather: true,
                custom: loopBrak7
            },
            {
                map: '29887497',
                gather: true,
                custom: loopBrak8
            },
            {
                map: '29884419',
                gather: true,
                custom: loopBrak9
            },
            {
                map: '29885955',
                gather: true,
                custom: loopBrak10
            }, //LOOP 20 - 100
        ];
    }

    if (gotobanquebrakmar == true) {

        return [{
                map: '29885952',
                custom: tpbrakmar
            },
            {
                map: '29887491',
                custom: tpbrakmar
            },
            {
                map: '29884422',
                custom: tpbrakmar
            },
            {
                map: '29885958',
                custom: tpbrakmar
            },
            {
                map: '29887494',
                custom: tpbrakmar
            },
            {
                map: '29884425',
                custom: tpbrakmar
            },
            {
                map: '29885961',
                custom: tpbrakmar
            },
            {
                map: '29887497',
                custom: tpbrakmar
            },
            {
                map: '29884419',
                custom: tpbrakmar
            },
            {
                map: '29885955',
                custom: tpbrakmar
            },
            {
                map: '29885955',
                custom: tpbrakmar
            }, // LOOP 20 - 100
            {
                map: '13631488',
                path: 'zaapi(144931)'
            }, //de la milice a la banque
            {
                map: '144931',
                interactive: '218'
            }, // banque porte milieu
            {
                map: '8913935',
                custom: prendreKamasBrakmar
            },
        ];
    }

    if (gotobanqueastrub == true) {

        return [{
                map: '102237697',
                custom: tpastrub
            },
            {
                map: '102238721',
                custom: tpastrub
            },
            {
                map: '102239745',
                custom: tpastrub
            },
            {
                map: '102236675',
                custom: tpastrub
            },
            {
                map: '4,-19',
                path: 'bottom'
            },
            {
                map: '4,-18',
                path: 'bottom'
            },
            {
                map: '4,-17',
                path: 'bottom'
            },
            {
                map: '84674566',
                interactive: '303'
            },
            {
                map: '83887104',
                custom: prendreKamasAstrub
            },
        ];
    }
}

function bank() {

    if (mineur20 == true) {
        return [{
                map: '29885952',
                custom: tpbrakmar
            },
            {
                map: '29887491',
                custom: tpbrakmar
            },
            {
                map: '29884422',
                custom: tpbrakmar
            },
            {
                map: '29885958',
                custom: tpbrakmar
            },
            {
                map: '29887494',
                custom: tpbrakmar
            },
            {
                map: '29884425',
                custom: tpbrakmar
            },
            {
                map: '29885961',
                custom: tpbrakmar
            },
            {
                map: '29887497',
                custom: tpbrakmar
            },
            {
                map: '29884419',
                custom: tpbrakmar
            },
            {
                map: '29885955',
                custom: tpbrakmar
            },
            {
                map: '29885955',
                custom: tpbrakmar
            }, // LOOP 20 - 100
            {
                map: '13631488',
                path: 'zaapi(144931)'
            }, //de la milice a la banque
            {
                map: '144931',
                interactive: '218'
            }, // banque porte milieu
            {
                map: '8913935',
                custom: prendreKamasBrakmar
            },
        ];
    }

    if (mineur1 == true) {
        return [{
                map: '102237697',
                custom: tpastrub
            },
            {
                map: '102238721',
                custom: tpastrub
            },
            {
                map: '102239745',
                custom: tpastrub
            },
            {
                map: '102236675',
                custom: tpastrub
            },
            {
                map: '4,-19',
                path: 'bottom'
            },
            {
                map: '4,-18',
                path: 'bottom'
            },
            {
                map: '4,-17',
                path: 'bottom'
            },
            {
                map: '84674566',
                interactive: '303'
            },
            {
                map: '83887104',
                custom: prendreKamasAstrub
            },
        ];
    }
}