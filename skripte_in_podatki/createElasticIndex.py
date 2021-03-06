'''
==============================
Title: createElasticIndex
Authors: Robert Kalem, Antonio Katarov
Date: 15 Nov 2018
==============================

This is a script for parsing and importing data to Elasticsearch index.

Usage: 
    python3 createElasticIndex.py indexName pathToData

Arguments pathToData and indexName are optional, 
    the default path is "./Podatki" and default indexName is "prometnavarnost".

Argument indexName will be converted to lowercase, due to Elasticsearch regulations.
'''

import sys
from elasticsearch import Elasticsearch
from elasticsearch.helpers import bulk, streaming_bulk
import os
from lookupTables import *
from sortTextFile import sort_data
es=Elasticsearch([{'host':'localhost','port':'9200'}])

es


sort_data("./Podatki")

if (len(sys.argv)>1):
    indexName = sys.argv[1].lower()
else:
    indexName = "prometnavarnost"

if (len(sys.argv)>2):
    pathToData = sys.argv[2]
else:
    pathToData = "./Podatki"


def date_to_date(Date):
    calendar = Date.split(".")
    newDate = calendar[2]+"-"+calendar[1]+"-"+calendar[0]
    return newDate


def import_data(myPath, index_name, doc_type_name="en"):

    i=1
    lineNum=0
    stBranj = 0
    subfolders = [dI for dI in os.listdir(myPath) if os.path.isdir(os.path.join(myPath,dI))]

    for folder in subfolders:
        if folder.startswith('pn'):
            year = folder[2:]

##################################################################################################################################################################
#####################################   1995 - 2000 ##############################################################################################################
##################################################################################################################################################################

            if (year >= '1995' and year <= '2000'): 
                dataFiles = [fI for fI in os.listdir(myPath+'/'+folder) if os.path.isfile(os.path.join(myPath+'/'+folder, fI))]
                for each in dataFiles:
                    if each[2:4] == year[2:4] :
                        file = open( myPath+'/'+folder+'/'+each, 'r', encoding='cp1250', errors='ignore')
                        dogodkiLines = file.readlines()
                        file.close()
                        file = open( myPath+'/'+folder+'/'+'pnose'+year[2:4]+'.txt', 'r', encoding='cp1250', errors='ignore')
                        osebeLines = file.readlines()
                        file.close()
                        lineNum = 0
                        osebeLineIndex = 0      
                        dataList = [""] * 19
                        for line in dogodkiLines:
                            
                            line = line.replace("Ê", "Š").replace("ć", "Š").replace("¶", "Ž").replace("¦", "Ž").replace("¨", "Č")
                            if( not line.startswith('FIO') and len(line)>10):    
                                
                                # individual field lengths (fieldCharCount)
                                fieldCharCount = [9, 1, 4, 10, 5, 1, 1, 5, 25, 5, 25, 4, 1, 2, 2, 1, 1, 2, 2]
                                currentCharIndex = 0
                                dataListIndex = 0
                                for x in fieldCharCount:
                                    if(currentCharIndex >= len(line)):
                                        dataList[dataListIndex] = ""
                                    else:
                                        dataList[dataListIndex] = line[currentCharIndex:x+currentCharIndex]
                                        currentCharIndex = currentCharIndex + x;
                                    dataListIndex += 1

                                sifrantUpEnota = dataList[2]
                                if not sifrantUpEnota.isdigit():
                                    sifrantUpEnota="5599"

                                sifrantLokacija = dataList[12]
                                if sifrantLokacija=="":
                                    sifrantLokacija="C"

                                sifrantKategorijaC = dataList[6]
                                if sifrantKategorijaC=="":
                                    sifrantKategorijaC="C"

                                FIOStevilkaZadeve = dataList[0]
                                KlasifikacijaNesrece = get_klasifikacija_nesrece(dataList[1])
                                UpravnaEnota = get_upravna_enota(int(sifrantUpEnota))
                                DatumPN = date_to_date(dataList[3])
                                UraPN = dataList[4]
                                VNaselju = dataList[5]
                                Lokacija = get_opis_kraja_nesrece(sifrantLokacija)
                                VrstaCesteNaselja = get_kategorija_ceste(dataList[6])
                                SifraCesteNaselja = dataList[7]
                                TekstCesteNaselja = dataList[8]
                                SifraOdsekaUlice = dataList[9]
                                TekstOdsekaUlice = dataList[10]
                                StacionazaDogodka = dataList[11]
                                VzrokNesrece = get_vzrok_nesrece(dataList[13])
                                TipNesrece = get_tip_nesrece(dataList[14])
                                VremenskeOkoliscine = get_vremenske_okoliscine(dataList[15])
                                StanjePrometa = get_stanje_prometa(dataList[16])
                                StanjeVozisca = get_stanje_vozisca(dataList[18])
                                VrstaVozisca = get_stanje_povrsine_vozisca(dataList[17])
            
                                udelezenci = []

                                fieldCharCountpnOSE = [9, 1, 4, 1, 4, 3, 1, 2, 1, 4, 4, 4]
                                
                                dataListIndex = 0
                                
                                while osebeLines[osebeLineIndex][:9] == FIOStevilkaZadeve:  

                                    line = osebeLines[osebeLineIndex].replace("Ê", "Š").replace("ć", "Š").replace("¶", "Ž").replace("¦", "Ž").replace("¨", "Č")
                                    currentCharIndex = 0
                                    dataListIndex = 0
                                    osebeDataList = [""]*12
                                    for x in fieldCharCountpnOSE:
                                        if(currentCharIndex >= len(line)):
                                            osebeDataList[dataListIndex] = ""
                                        else:
                                            osebeDataList[dataListIndex] = line[currentCharIndex:x+currentCharIndex]
                                            currentCharIndex = currentCharIndex + x;
                                        dataListIndex += 1

                                    print(osebeDataList)

                                    alkoTest = osebeDataList[10].replace(',', '.')
                                    if(alkoTest == "" or alkoTest == "\n") :
                                        alkoTest = 0

                                    strokPregled = osebeDataList[11].replace(',', '.')
                                    staz = osebeDataList[9].split("-")[0][0:2]
                                    drzavljanstvo = osebeDataList[5]

                                    if not drzavljanstvo.isdigit():
                                        drzavljanstvo = "999"

                                    if not strokPregled.isdigit():
                                        strokPregled = "0.00"

                                    if not staz.isdigit():
                                        staz = "999"

                                    
                                    udelezenci.append({
                                        "Vloga" : get_vloga_udelezenca_za1995(osebeDataList[1]),
                                        "Starost" : int(osebeDataList[2][0:2]),
                                        "Spol" : get_spol_udelezenca(osebeDataList[3]),
                                        "Drzavljanstvo" : get_drzavljanstvo_osebe(int(drzavljanstvo)),
                                        "PoskodbaUdelezenca" : get_poskodba_osebe(osebeDataList[6]),
                                        "VrstaUdelezenca" : get_vrsta_udelezenca(osebeDataList[7]),
                                        "UporabaVarnostnegaPasu" : get_uporaba_pasu(osebeDataList[8]),
                                        "VozniskiStazVLetih" : int(staz),
                                        "VrednostAlkotesta" : float(alkoTest),
                                        "VrednostStrokovnegaPregleda" : float(strokPregled)
                                    })

                                    if (osebeLineIndex+1 != len(osebeLines) ):
                                        osebeLineIndex+=1
                                    else:
                                        break;

                                yield {
                                    "_index": index_name,
                                    "_type": "dogodek",
                                    "Leto":  int(year),
                                    "StevilkaZadeve": int(FIOStevilkaZadeve),
                                    "KlasifikacijaNesrece": KlasifikacijaNesrece,
                                    "UpravnaEnota": UpravnaEnota,
                                    "DatumPN": DatumPN,
                                    "UraPN": int(UraPN[0:2]),
                                    "VNaselju": get_v_naselju(VNaselju),
                                    "VrstaCesteNaselja": VrstaCesteNaselja,
                                    "TekstCesteNaselja": TekstCesteNaselja,
                                    "VzrokNesrece": VzrokNesrece,
                                    "TipNesrece": TipNesrece,
                                    "VremenskeOkoliscine": VremenskeOkoliscine,
                                    "StanjePrometa": StanjePrometa,
                                    "Udelezenec" : udelezenci
                                    }
                                i+=1
                            lineNum+=1

##################################################################################################################################################################
#####################################   2001 - 2004 ##############################################################################################################
##################################################################################################################################################################

            if (year >= '2001' and year <= '2004'): 
                dataFiles = [fI for fI in os.listdir(myPath+'/'+folder) if os.path.isfile(os.path.join(myPath+'/'+folder, fI))]
                for each in dataFiles:
                    if each[2:4] == year[2:4] :
                        file = open( myPath+'/'+folder+'/'+each, 'r', encoding='cp1250', errors='ignore')
                        dogodkiLines = file.readlines()
                        file.close()
                        file = open( myPath+'/'+folder+'/'+'PNO'+year[2:4]+'.txt', 'r', encoding='cp1250', errors='ignore')
                        osebeLines = file.readlines()
                        file.close()
                        lineNum = 0
                        osebeLineIndex = 0      
                        dataList = [""] * 19
                        for line in dogodkiLines:
                            
                            print("Parsing line: \n", line)
                            line = line.replace("Ê", "Š").replace("ć", "Š").replace("¶", "Ž").replace("¦", "Ž").replace("¨", "Č").rstrip()
                            if( not line.startswith('FIO') and len(line)>10):    
                                
                                currentCharIndex = 0
                                dataListIndex = 0
                                
                                dataList = line.split('$')
                                

                                sifrantUpEnota = dataList[2]
                                if not sifrantUpEnota.isdigit():
                                    sifrantUpEnota="5599"

                                sifrantLokacija = dataList[12]
                                if sifrantLokacija=="":
                                    sifrantLokacija="C"

                                sifrantKategorijaC = dataList[6]
                                if sifrantKategorijaC=="":
                                    sifrantKategorijaC="C"

                                FIOStevilkaZadeve = dataList[0]
                                KlasifikacijaNesrece = get_klasifikacija_nesrece(dataList[1])
                                UpravnaEnota = get_upravna_enota(int(sifrantUpEnota))
                                DatumPN = date_to_date(dataList[3])
                                UraPN = dataList[4]
                                VNaselju = dataList[5]
                                Lokacija = get_opis_kraja_nesrece(sifrantLokacija)
                                VrstaCesteNaselja = get_kategorija_ceste(dataList[6])
                                SifraCesteNaselja = dataList[7]
                                TekstCesteNaselja = dataList[8]
                                SifraOdsekaUlice = dataList[9]
                                TekstOdsekaUlice = dataList[10]
                                StacionazaDogodka = dataList[11]
                                VzrokNesrece = get_vzrok_nesrece(dataList[13])
                                TipNesrece = get_tip_nesrece(dataList[14])
                                VremenskeOkoliscine = get_vremenske_okoliscine(dataList[15])
                                StanjePrometa = get_stanje_prometa(dataList[16])
                                udelezenci = []

                                fieldCharCountpnOSE = [9, 1, 4, 1, 4, 3, 1, 2, 1, 4, 4, 4]
                                currentCharIndex = 0
                                dataListIndex = 0

                                while osebeLines[osebeLineIndex].split("$")[0] == FIOStevilkaZadeve:  

                                    osebeDataList = osebeLines[osebeLineIndex].split("$")

                                    print(osebeDataList)

                                    drzavljanstvo = osebeDataList[5]
                                    staz = osebeDataList[9]
                                    alkoTest = osebeDataList[11].replace(',', '.')
                                    if(alkoTest == "" or alkoTest == "    ") :
                                        alkoTest = 0
                                    strokPregled = osebeDataList[12].replace(',', '.')
                                    poskodbaOsebe = osebeDataList[6]
                                    vrstaUdel = osebeDataList[7]
                                    starost = osebeDataList[2]

                                    if not drzavljanstvo.isdigit():
                                        drzavljanstvo = "999"

                                    if not staz.isdigit():
                                        staz = "999"

                                    if not strokPregled.isdigit():
                                        strokPregled = "0.00"

                                    if poskodbaOsebe == " ":
                                        poskodbaOsebe = "B"

                                    if vrstaUdel == "  ":
                                        vrstaUdel = "L"

                                    if not starost.isdigit():
                                        starost = "999"    
                                    
                                    if (osebeDataList[1] == "1" or osebeDataList[1] == "0"):
                                        udelezenci.append({
                                            "Vloga" : get_vloga_udelezenca(osebeDataList[1]),
                                            "Starost" : int(starost),
                                            "Spol" : get_spol_udelezenca(osebeDataList[3]),
                                            "Drzavljanstvo" : get_drzavljanstvo_osebe(int(drzavljanstvo)),
                                            "PoskodbaUdelezenca" : get_poskodba_osebe(poskodbaOsebe),
                                            "VrstaUdelezenca" : get_vrsta_udelezenca(vrstaUdel),
                                            "UporabaVarnostnegaPasu" : get_uporaba_pasu(osebeDataList[8]),
                                            "VozniskiStazVLetih" : int(staz),
                                            "VrednostAlkotesta" : float(alkoTest),
                                            "VrednostStrokovnegaPregleda" : float(strokPregled)
                                        })

                                    if (osebeLineIndex+1 != len(osebeLines) ):
                                        osebeLineIndex+=1
                                    else:
                                        break;

                                yield {
                                    "_index": index_name,
                                    "_type": "dogodek",
                                    "Leto":  int(year),
                                    "StevilkaZadeve": int(FIOStevilkaZadeve),
                                    "KlasifikacijaNesrece": KlasifikacijaNesrece,
                                    "UpravnaEnota": UpravnaEnota,
                                    "DatumPN": DatumPN,
                                    "UraPN": int(UraPN[0:2]),
                                    "VNaselju": get_v_naselju(VNaselju),
                                    "VrstaCesteNaselja": VrstaCesteNaselja,
                                    "TekstCesteNaselja": TekstCesteNaselja,
                                    "VzrokNesrece": VzrokNesrece,
                                    "TipNesrece": TipNesrece,
                                    "VremenskeOkoliscine": VremenskeOkoliscine,
                                    "StanjePrometa": StanjePrometa,
                                    "Udelezenec" : udelezenci
                                    }
                                i+=1
                            lineNum+=1

##################################################################################################################################################################
#####################################   2005 - 2010 ##############################################################################################################
##################################################################################################################################################################
            
            if (year >= '2005' and year <= '2010'): #2010
                dataFiles = [fI for fI in os.listdir(myPath+'/'+folder) if os.path.isfile(os.path.join(myPath+'/'+folder, fI))]
                for each in dataFiles:
                    if each[4:11] == 'DOGODKI' and (each.endswith('_sorted.txt')):
                        stBranj += 1
                        file = open( myPath+'/'+folder+'/'+each, 'r', errors='ignore')
                        dogodkiLines = file.readlines()
                        file.close()
                        file = open( myPath+'/'+folder+'/'+'PNL-OSEBE-'+year+'.TXT', 'r', encoding='cp1250', errors='ignore')
                        osebeLines = file.readlines()
                        file.close()
                        lineNum = 0
                        osebeLineIndex = 1 

                        for line in dogodkiLines:
                            
                            print("Parsing line: \n", line)

                            if( not line.startswith('FIO')):
                                dataList = line.split('$')

                                sifrantUpEnota = dataList[2]
                                if sifrantUpEnota=="":
                                    sifrantUpEnota="5599"

                                sifrantLokacija = dataList[12]
                                if sifrantLokacija=="":
                                    sifrantLokacija="C"

                                sifrantKategorijaC = dataList[6]
                                if sifrantKategorijaC=="":
                                    sifrantKategorijaC="C"

                                FIOStevilkaZadeve = dataList[0]
                                KlasifikacijaNesrece = get_klasifikacija_nesrece(dataList[1])
                                UpravnaEnota = get_upravna_enota(int(sifrantUpEnota))
                                DatumPN = date_to_date(dataList[3])
                                UraPN = dataList[4]
                                VNaselju = get_v_naselju(dataList[5])
                                Lokacija = get_opis_kraja_nesrece(sifrantLokacija)
                                VrstaCesteNaselja = get_kategorija_ceste(dataList[6])
                                SifraCesteNaselja = dataList[7]
                                TekstCesteNaselja = dataList[8]
                                SifraOdsekaUlice = dataList[9]
                                TekstOdsekaUlice = dataList[10]
                                StacionazaDogodka = dataList[11]
                                VzrokNesrece = get_vzrok_nesrece(dataList[13])
                                TipNesrece = get_tip_nesrece(dataList[14])
                                VremenskeOkoliscine = get_vremenske_okoliscine(dataList[15])
                                StanjePrometa = get_stanje_prometa(dataList[16])
                                StanjeVozisca = get_stanje_vozisca(dataList[17])
                                VrstaVozisca = get_stanje_povrsine_vozisca(dataList[18])
                                GeoKoordinataX = int(dataList[19])
                                GeoKoordinataY = int(dataList[20])
                                udelezenci = []

                                while osebeLines[osebeLineIndex].split("$")[0] == FIOStevilkaZadeve:  

                                    osebeDataList = osebeLines[osebeLineIndex].split("$")

                                    print(osebeDataList)
                                    
                                    if (osebeDataList[1] == "POVZROČITELJ" or osebeDataList[1] == "UDELEŽENEC"):
                                        udelezenci.append({
                                            "Vloga" : osebeDataList[1],
                                            "Starost" : int(osebeDataList[2]),
                                            "Spol" : osebeDataList[3],
                                            "Drzavljanstvo" : osebeDataList[4],
                                            "PoskodbaUdelezenca" : osebeDataList[5],
                                            "VrstaUdelezenca" : osebeDataList[6],
                                            "UporabaVarnostnegaPasu" : get_uporaba_pasu(osebeDataList[7]),
                                            "VozniskiStazVLetih" : int(osebeDataList[8].split("-")[0]),
                                            "VrednostAlkotesta" : float(osebeDataList[9].replace(',', '.')),
                                            "VrednostStrokovnegaPregleda" : float(osebeDataList[10].replace(',', '.'))
                                        })

                                    if (osebeLineIndex+1 != len(osebeLines) ):
                                        osebeLineIndex+=1
                                    else:
                                        break;

                                yield {
                                    "_index": index_name,
                                    "_type": "dogodek",
                                    "Leto":  int(year),
                                    "StevilkaZadeve": int(FIOStevilkaZadeve),
                                    "KlasifikacijaNesrece": KlasifikacijaNesrece,
                                    "UpravnaEnota": UpravnaEnota,
                                    "DatumPN": DatumPN,
                                    "UraPN": int(UraPN),
                                    "VNaselju": get_v_naselju(VNaselju),
                                    "VrstaCesteNaselja": VrstaCesteNaselja,
                                    "TekstCesteNaselja": TekstCesteNaselja,
                                    "VzrokNesrece": VzrokNesrece,
                                    "TipNesrece": TipNesrece,
                                    "VremenskeOkoliscine": VremenskeOkoliscine,
                                    "StanjePrometa": StanjePrometa,
                                    "Udelezenec" : udelezenci
                                    }
                                i+=1
                            lineNum+=1

##################################################################################################################################################################
#####################################   2011 - 2017 ##############################################################################################################
##################################################################################################################################################################
     
            if (year >= '2011'):
                dataFiles = [fI for fI in os.listdir(myPath+'/'+folder) if os.path.isfile(os.path.join(myPath+'/'+folder, fI))]
                for each in dataFiles:
                    if each[12:] == 'dogodki.txt':
                        
                        file = open( myPath+'/'+folder+'/'+each, 'r', encoding='cp1250', errors='ignore')
                        dogodkiLines = file.readlines()
                        file.close()
                        file = open( myPath+'/'+folder+'/'+each[:12]+'osebe.txt', 'r', encoding='cp1250', errors='ignore')
                        osebeLines = file.readlines()
                        file.close()
                        lineNum = 0
                        osebeLineIndex = 1      # vrstice z indexom 0 ne potrebujemo

                        for line in dogodkiLines:
                            
                            print("Parsing line: \n", line)

                            if(lineNum!=0):     # prvo vrstico vedno preskocimo
                                dataList = line.split('$')

                                FIOStevilkaZadeve = dataList[0]
                                KlasifikacijaNesrece = dataList[1]
                                UpravnaEnota = dataList[2]
                                DatumPN = date_to_date(dataList[3])
                                UraPN = dataList[4]
                                VNaselju = dataList[5]
                                Lokacija = dataList[6]
                                VrstaCesteNaselja = dataList[7]
                                SifraCesteNaselja = dataList[8]
                                TekstCesteNaselja = dataList[9]
                                SifraOdsekaUlice = dataList[10]
                                TekstOdsekaUlice = dataList[11]
                                StacionazaDogodka = dataList[12]
                                OpisKraja = dataList[13]
                                VzrokNesrece = dataList[14]
                                TipNesrece = dataList[15]
                                VremenskeOkoliscine = dataList[16]
                                StanjePrometa = dataList[17]
                                StanjeVozisca = dataList[18]
                                VrstaVozisca = dataList[19]
                                GeoKoordinataX = int(dataList[20])
                                GeoKoordinataY = int(dataList[21])
            
                                udelezenci = []

                                while osebeLines[osebeLineIndex].split("$")[0] == FIOStevilkaZadeve:  

                                    osebeDataList = osebeLines[osebeLineIndex].split("$")

                                    if (osebeDataList[1] == "POVZROČITELJ" or osebeDataList[1] == "UDELEŽENEC"):
                                        udelezenci.append({
                                            "Vloga" : osebeDataList[1],
                                            "Starost" : int(osebeDataList[2]),
                                            "Spol" : osebeDataList[3],
                                            "Drzavljanstvo" : osebeDataList[5],
                                            "PoskodbaUdelezenca" : osebeDataList[6],
                                            "VrstaUdelezenca" : osebeDataList[7],
                                            "UporabaVarnostnegaPasu" : get_uporaba_pasu(osebeDataList[8]),
                                            "VozniskiStazVLetih" : int(osebeDataList[9]),
                                            "VrednostAlkotesta" : float(osebeDataList[11].replace(',', '.')),
                                        })

                                    if (osebeLineIndex+1 != len(osebeLines) ):
                                        osebeLineIndex+=1
                                    else:
                                        break;

                                yield {
                                    "_index": index_name,
                                    "_type": "dogodek",
                                    "Leto":  int(year),
                                    "StevilkaZadeve": int(FIOStevilkaZadeve),
                                    "KlasifikacijaNesrece": KlasifikacijaNesrece,
                                    "UpravnaEnota": UpravnaEnota,
                                    "DatumPN": DatumPN,
                                    "UraPN": int(UraPN),
                                    "VNaselju": VNaselju,
                                    "VrstaCesteNaselja": VrstaCesteNaselja,
                                    "TekstCesteNaselja": TekstCesteNaselja,
                                    "OpisKraja": OpisKraja,
                                    "VzrokNesrece": VzrokNesrece,
                                    "TipNesrece": TipNesrece,
                                    "VremenskeOkoliscine": VremenskeOkoliscine,
                                    "StanjePrometa": StanjePrometa,
                                    "Udelezenec" : udelezenci 
                                    }
                                i+=1
                            lineNum+=1
                                    
output, _ = bulk(es, import_data(pathToData, indexName))
print('Indexed %d elements' % output)





