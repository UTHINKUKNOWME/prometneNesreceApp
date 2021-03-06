'''
==============================
Title: sortTextFile
Authors: Robert Kalem, Antonio Katarov
Date: 28 Nov 2018
==============================

This is a script for sorting data

Usage: 
    python3 sortTextFile.py pathToData

'''

import sys
import os


def sort_data(myPath):

    subfolders = [dI for dI in os.listdir(myPath) if os.path.isdir(os.path.join(myPath,dI))]

    for folder in subfolders:
        if folder.startswith('pn') :
            year = folder[2:]

            if (year >= '2005' and year <= '2010'): #2010
                dataFiles = [fI for fI in os.listdir(myPath+'/'+folder) if os.path.isfile(os.path.join(myPath+'/'+folder, fI))]
                for each in dataFiles:
                    if each[4:11] == 'DOGODKI' and ( not each.endswith('_sorted.txt')):
                        file = open( myPath+'/'+folder+'/'+each, 'r', encoding='cp1250', errors='ignore')
                        dogodkiLines = file.readlines()
                        file.close()
                        dogodkiLines.sort()
                        newfile = open(myPath+'/'+folder+'/'+each[:-4]+'_sorted.txt', 'w')
                        for line in dogodkiLines:
                            newfile.write(line)

                        newfile.close()


sort_data("./Podatki")



