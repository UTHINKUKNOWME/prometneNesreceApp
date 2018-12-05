import {Injectable} from '@angular/core';
import {Dogodek} from './models/Dogodek';
// import {Client} from 'elasticsearch';

@Injectable({
    providedIn: 'root'
})
export class DogodkiService {

    // private client: Client;
    private index: string = 'prometnavarnost';

    // private connect() {
    //     this.client = new Client({
    //         host: 'http://localhost:9200',
    //         log: 'trace'
    //     });
    // }

    constructor() {
        // this.connect();

    }

    // filter(query: string): any {
    //
    //     this.client.search({
    //             index: this.index,
    //             q: query
    //         }
    //     ).then(res => {
    //
    //         let dogodki: Dogodek[] = [];
    //         let data = res.hits.hits;
    //         for (let i = 0; i < data.length; i++) {
    //             // console.log(data[i]._source);
    //             let dogodek: Dogodek = data[i]._source;
    //             // if(data[i]._source.Povzrocitelj.Povzrocitelj1 != undefined) {
    //             dogodek.Povzrocitelj = data[i]._source.Povzrocitelj.Povzrocitelj1;
    //             // }
    //             // if(data[i]._source.Udelezenec.Udelezenec1 != undefined) {
    //             dogodek.Udelezenec = data[i]._source.Udelezenec.Udelezenec1;
    //             // }
    //             dogodki.push(dogodek);
    //         }
    //         console.log(dogodki);
    //         return dogodki;
    //     });
    // }

}
