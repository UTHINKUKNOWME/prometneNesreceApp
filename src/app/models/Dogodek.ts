import {Povzrocitelj} from './Povzrocitelj';
import {Udelezenec} from './Udelezenec';

export interface Dogodek {
    DatumPN: Date;
    GeoKoordinataX: number;
    GeoKoordinataY: number;
    KlasifikacijaNesrece: string;
    Leto: number;
    Lokacija: string
    OpisKraja: string;
    Povzrocitelj: Povzrocitelj[];
    SifraCesteNaselja: string;
    SifraOdsekaUlice: number;
    StacionazaDogodka: number;
    StanjePrometa: string;
    StanjeVozisca: string;
    StevilkaZadeve: number;
    SteviloUdelezencev: number;
    TekstCesteNaselja: string;
    TekstOdsekaUlice: string;
    TipNesrece: string
    Udelezenec: Udelezenec[];
    UpravnaEnota: string;
    UraPN: number;
    VNaselju: string;
    VremenskeOkoliscine: string;
    VrstaCesteNaselja: string;
    VrstaVozisca: string;
    VzrokNesrece: string;
}