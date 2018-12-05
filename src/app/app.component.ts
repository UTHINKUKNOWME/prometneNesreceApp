import {ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ɵunv} from '@angular/core';
import {Client} from 'elasticsearch-browser';
import {Dogodek} from './models/Dogodek';

import * as d3 from 'd3';
import {DogodkiService} from './dogodki.service';
import {Povzrocitelj} from './models/Povzrocitelj';
import {Udelezenec} from './models/Udelezenec';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

    private index: string = 'prometnavarnost';
    private client: Client;
    status: string;
    private isConnected: boolean;

    first: boolean = true;

    showCHART: boolean = false;

    chartTitle: string = 'Vozniski staz';

    dogodki: Dogodek[] = [];
    dataPass: any;

    totalDogodtkiPerYear: any[] = [];
    @ViewChild('chart')
    chartElement: ElementRef;

    private svgElement: HTMLElement;
    private chartProps: any;

    title = 'PrometnaVarnostApp';

    constructor(private cd: ChangeDetectorRef,
                private dogodkiService: DogodkiService
    ) {
        if (!this.client) {
            this.connect();
        }
    }

    private connect() {
        this.client = new Client({
            host: 'http://localhost:9200',
            log: 'trace'
        });
    }

    isAvailable(): any {
        return this.client.ping({
            requestTimeout: Infinity,
            body: 'Yep its available!'
        });
    }


    filter(query: string): any {

        this.client.search({
                index: this.index,
                size: 10000,
                // q: query,
                // q: 'Leto:2011'
                // q: 'Povzrocitelj.Povzrocitelj1.Starost:29'
                // q:'DatumPN:2013-02-13'
                // q: 'StevilkaZadeve:760186'
                // body: {
                //     query: {
                //         range: {
                //             DatumPN: {
                //                 gte: '2015-02-01',
                //                 lte: '2015-12-05'
                //             }
                //         }
                //     }
                // }
            }
        ).then(res => {
            let data = res.hits.hits;
            this.dogodki = [];
            for (let i = 0; i < data.length; i++) {

                // for the first chart the dogodek has to have povzrocitelj
                // udelezenec in ura
                if (data[i]._source.Povzrocitelj.length > 0 && data[i]._source.Udelezenec.length > 0 && data[i]._source.UraPN != '') {
                    let dogodek: Dogodek = data[i]._source;

                    // handle the array of povzrocitelji
                    let povzrocitelji: Povzrocitelj[] = [];
                    for (let p in data[i]._source.Povzrocitelj) {
                        let povz: Povzrocitelj = data[i]._source.Povzrocitelj[p];
                        povzrocitelji.push(povz);
                    }
                    dogodek.Povzrocitelj = povzrocitelji;

                    // handle the array of povzrocitelji
                    let udelezenci: Udelezenec[] = [];
                    for (let p in data[i]._source.Udelezenec) {
                        let udel: Udelezenec = data[i]._source.Udelezenec[p];
                        udelezenci.push(udel);
                    }
                    dogodek.Udelezenec = udelezenci;
                    this.dogodki.push(dogodek);

                }
            }
            if (this.first) {
                this.first = false;
                // this.buildChart();
            } else {
                this.updateChart();
            }

        });
    }

    multipleSearch(): any {

        this.client.search({
            index: this.index,
            body: {
                query: {
                    bool: {
                        should: [
                            {match: {Leto: '2011'}},
                            {match: {Leto: '2012'}},
                            {match: {Leto: '2013'}},
                            {match: {Leto: '2014'}},
                            {match: {Leto: '2015'}}
                        ]
                    }
                }
            }
        }).then(res => {
            // console.log('res = ' + res);
        });
    }


    countAgg() {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        'match_all': {}
                    },
                    aggs: {
                        poLetih: {
                            terms: {
                                field: 'Leto',
                                size: 13
                            }
                        }
                    }
                }
            }
        ).then(res => {
            this.totalDogodtkiPerYear = res.aggregations.poLetih.buckets;
            // console.log('AGG URA = '+ JSON.stringify(aggregationsUra));

            this.drawBars();
        });
    }

    filterPoUrah(query: string): any {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        'match_all': {}
                    },
                    aggs: {
                        poUrah: {
                            terms: {
                                field: 'UraPN',
                                size: 24
                            }
                        }
                    }
                }
            }
        ).then(res => {
            let aggregationsUra = res.aggregations.poUrah.buckets;
            this.dataPass = aggregationsUra;
            console.log(aggregationsUra);
            this.buildChart();
        });
    }

    filterPoKlasifikaciji(query: string): any {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        'match_all': {}
                    },
                    aggs: {
                        poKlasi: {
                            terms: {
                                field: 'KlasifikacijaNesrece.keyword',
                                size: 8
                            }
                        }
                    }
                }
            }
        ).then(res => {
            let data = res.hits.hits;
            let aggregationsKlasifikacija = res.aggregations.poKlasi.buckets;
            this.dataPass = aggregationsKlasifikacija;
            console.log(aggregationsKlasifikacija);
        });
    }


    filterPoVremenu(query: string): any {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        'match_all': {}
                    },
                    aggs: {
                        poVzroku: {
                            terms: {
                                field: 'VremenskeOkoliscine.keyword',
                                size: 5
                            }
                        }
                    }
                }
            }
        ).then(res => {
            let aggregations = res.aggregations.poVzroku.buckets;
            this.dataPass = aggregations;
            console.log(aggregations);
        });
    }

    filterPoNaselju(query: string): any {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        'match_all': {}
                    },
                    aggs: {
                        poSpolu: {
                            terms: {
                                field: 'VNaselju.Spol.keyword',
                                size: 2
                            }
                        }
                    }
                }
            }
        ).then(res => {
            let aggregations = res.aggregations.poSpolu.buckets;
            this.dataPass = aggregations;
            console.log(aggregations);
        });
    }

    // count(leto: string): any {
    //     this.client.count({
    //         index: this.index,
    //         body: {
    //             query: {term: {Leto: leto}}
    //         }
    //     }).then(res => {
    //         // console.log('res = ' + res.count);
    //         // divide by 1000 for scaling
    //         let count = res.count / 100;
    //         let dogodek = {count: count, year: leto};
    //         this.totalDogodtkiPerYear.push(dogodek);
    //         if (leto == '2015') {
    //
    //         }
    //     });
    // }

    ngOnInit() {
        this.isAvailable().then(() => {
            this.status = 'OK';
            this.isConnected = true;
        }, error => {
            this.status = 'ERROR';
            this.isConnected = false;
            console.error('Server is down', error);
        }).then(() => {
            this.cd.detectChanges();
        });

        this.filterPoUrah('');

        this.countAgg();
        // this.filter('StevilkaZadeve:693354');
        // this.filter('Povzrocitelj.Starost:29');
        // this.filter('VremenskeOkoliscine:JASNO');
        // this.filter('VremenskeOkoliscine:JASNO');
        // this.multipleSearch();
        // this.filter('VremenskeOkoliscine:JASNO AND DatumPN:2013-[?:.*]-02');
    }


    formatDate() {
        this.dogodki.forEach(ms => {
            if (typeof ms.DatumPN === 'string') {
                ms.DatumPN = new Date(ms.DatumPN);
                ms.DatumPN.setHours(ms.UraPN);
            }
        });
        this.dogodki.sort((a: Dogodek, b: Dogodek) => {
            return a.DatumPN.getTime() - b.DatumPN.getTime();
        });
    }


    sortPoUrah() {
        this.dataPass.sort((a: any, b: any) => {
            return a.key - b.key;
        });
    }


    buildChart() {
        this.chartProps = {};
        // this.formatDate();
        this.sortPoUrah();
        console.log(this.dataPass);
        // Set the dimensions of the canvas / graph
        let margin = {top: 30, right: 50, bottom: 30, left: 50},
            width = window.innerWidth - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // Set the ranges
        this.chartProps.x = d3.scaleLinear().range([0, width]);
        this.chartProps.y = d3.scaleLinear().range([height, 0]);

        // Define the axes
        let xAxis = d3.axisBottom(this.chartProps.x);
        let yAxis = d3.axisLeft(this.chartProps.y).ticks(5);

        let _this = this;

        // Define the age line
        let valueline = d3.line<Dogodek>()
            .x(function (d) {
                if (d.DatumPN instanceof Date) {
                    return _this.chartProps.x(d.DatumPN.getTime());
                }
            })
            .y(function (d) {
                if (d.Povzrocitelj.length > 0) {
                    return _this.chartProps.y(d.Povzrocitelj[0].Starost);
                } else {
                    console.log('HERE VALUE LINE y');
                    return _this.chartProps.y(0);
                }
            });


        // Define the vozniski staz
        let vozniskiStazVLetih = d3.line<Dogodek>()
            .x(function (d) {
                if (d.DatumPN instanceof Date) {
                    return _this.chartProps.x(d.DatumPN.getTime());
                }
            })
            .y(function (d) {
                // console.log('VALUE LINE DY = ' + d.Udelezenec.Starost);
                if (d.Povzrocitelj.length > 0) {
                    return _this.chartProps.y(d.Povzrocitelj[0].VozniskiStazVLetih);
                } else {
                    console.log('HERE VALUE LINE y');
                    return _this.chartProps.y(0);
                }
            });

        // Define po urah
        let poUrah = d3.line<any>()
            .x(function (d) {
                return _this.chartProps.x(d.key);
            })
            .y(function (d) {
                return _this.chartProps.y(d.doc_count);
            });

        let svg = d3.select(this.chartElement.nativeElement)
        // let svg = d3.select(element)
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);

        // Scale the range of the data
        // this.chartProps.x.domain(
        //     d3.extent(_this.dataPass, function (d) {
        //         // if (d.DatumPN instanceof Date) {
        //         //     return (d.DatumPN as Date).getTime();
        //         // }
        //         // return d.DatumPN as Date);
        //         return d.key;
        //
        //     }));

        this.chartProps.x.domain(d3.extent(_this.dataPass, function (d) {
            return d.key;
        }));
        this.chartProps.y.domain([0, d3.max(_this.dataPass, function (d) {
            // return Math.max(0, d.doc_count);
            return d.doc_count * 1.10;
        })]);

        // Add the valueline path.
        svg.append('path')
            .attr('class', 'line line1')
            .style('stroke', '#f4f4f4')
            .style('fill', 'none')
            .attr('d', poUrah(_this.dataPass));

        // // Add the valueline path.
        // svg.append('path')
        //     .attr('class', 'line line1')
        //     .style('stroke', 'black')
        //     .style('fill', 'none')
        //     .attr('d', vozniskiStazVLetih(_this.dogodki));


        // Add the X Axis
        svg.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(0,${height})`)
            .call(xAxis);

        // Add the Y Axis
        svg.append('g')
            .attr('class', 'y axis')
            .call(yAxis);

        // Setting the required objects in chartProps so they could be used to update the chart
        this.chartProps.svg = svg;
        this.chartProps.valueline = valueline;
        this.chartProps.valueline2 = vozniskiStazVLetih;
        this.chartProps.xAxis = xAxis;
        this.chartProps.yAxis = yAxis;
    }


    drawBars() {

        // BARS

        let _this = this;
        let margin = {top: 30, right: 20, bottom: 30, left: 20},
            width = window.innerWidth - margin.left - margin.right,
            height = window.innerHeight - margin.top - margin.bottom;

        // var width = window.innerWidth;
        // var height = window.innerHeight;

        let barHeight = 40;
        let rectArray = [];

        let widthScale = d3.scaleLinear()
            .domain([0, 1000])    // originalni razpon vrednosti
            .range([0, width]);  // preslikani razpon vrednosti

        let colorScale = d3.scaleLinear()
            .domain([0, 1000])
            .range(['orange', 'purple']);

        let canvas = d3.select('#barChart')
            .append('svg')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height);

        let bars = canvas.selectAll('g')
            .data(this.totalDogodtkiPerYear)
            .enter()
            // .attr('class', 'bars')
            .append('g')
            .attr('transform', (d, i) => 'translate(0,' + i * barHeight + ')');


        bars.append('rect')
            .attr('width', function (d) {
                // console.log(d.doc_count);
                return widthScale(d.doc_count / 100);
            })
            .attr('height', barHeight - 2)
            .attr('fill', function (d) {
                return colorScale(d.doc_count / 100);
            })
            .on('click', klik);


        function goback() {
            console.log('goin back');
        }

        // COUNT LABEL ON THE BARS
        bars.append('text')
            .text(function (d) {
                return d.doc_count;
            })
            .attr('y', function (d, i) {
                return barHeight / 2 + 5;
            })
            .attr('class', 'barText')
            .attr('x', function (d, i) {
                return widthScale(d.doc_count / 100) - 50;
            })
            .style('fill', 'white')
            .style('font-family', 'Helvetica Neue');

        // YEAR LABEL ON THE BARS
        bars.append('text')
            .text(function (d) {
                // console.log(d.key);
                return d.key;
            })
            .attr('class', 'barText')
            .attr('y', function (d, i) {
                return barHeight / 2 + 5;
            })
            .attr('x', function (d, i) {
                return 20;
            })
            .style('fill', 'white')
            .style('font-weight', 'bold')
            .style('font-family', 'Helvetica Neue');


        bars.selectAll('rect')
            .on('mouseover', handleMouseOver)
            .on('mouseout', handleMouseOut);


        function klik() {
            let m = d3.mouse(this);

            bars.selectAll('rect').transition()
                .duration(1300)       // trajanje tranzicije v milisekundah
                .ease(d3.easeBounce)  // prehod v gibanju (se odbije)
                .attr('width', 0)
                .style('opacity', 0.0);

            d3.select(this).transition()
            //.delay(800)
                .duration(1000)
                .ease(d3.easeBounce)
                .attr('width', width)
                .style('opacity', 1.0);


            d3.select(this).moveToFront();

            console.log('THIS = ', this);

            d3.select(this).transition()
                .delay(900)
                .duration(600)
                .ease(d3.easeSin)
                .attr('height', height)
                .attr('transform', 'translate(0,0)');


            d3.select(this.parentNode).transition()
                .delay(900)
                .duration(600)
                .ease(d3.easeSin)
                .attr('transform', 'translate(0,0)');

            d3.selectAll('.barText').style('display', 'none');

            d3.select('#chart').transition()
                .delay(900)
                .duration(600)
                // .ease(d3.easeSin)
                .attr('style', 'display:block;opacity:1;position: absolute;top: 180px;animation:fadein 3s');

            // _this.chartElement.nativeElement.style.animation = 'fadein 5s';
            // _this.chartElement.nativeElement.style.display = 'block';
            // _this.chartElement.nativeElement.style.opacity = '1';

        }

        d3.selection.prototype.moveToFront = function () {
            return this.each(function () {
                this.parentNode.appendChild(this);
            });
        };


        function handleMouseOver(d, i) {  // Add interactivity
            // Use D3 to select element, change color and size
            d3.select(this)
                .attr('opacity', 0.50);
        }

        function handleMouseOut(d, i) {
            // Use D3 to select element, change color back to normal
            d3.select(this)
                .attr('opacity', 1);
        }
    }


    updateChart() {

        // this.formatDate();

        // Scale the range of the data again
        this.chartProps.x.domain(d3.extent(this.dogodki, function (d) {
            if (d.DatumPN instanceof Date) {
                return d.DatumPN.getTime();
            }
        }));

        this.chartProps.y.domain([0, d3.max(this.dogodki, function (d) {
            return Math.max(0, d.Povzrocitelj[0].Starost);
        })]);

        // Select the section we want to apply our changes to
        this.chartProps.svg.transition();

        // Make the changes to the line chart
        this.chartProps.svg.select('.line.line1') // update the line
            .attr('d', this.chartProps.valueline(this.dataPass))
            .style('display', 'block');

        // this.chartProps.svg.select('.line.line2') // update the line
        //     .attr('d', this.chartProps.valueline2(this.dogodki));

        this.chartProps.svg.select('.x.axis') // update x axis
            .call(this.chartProps.xAxis);

        this.chartProps.svg.select('.y.axis') // update y axis
            .call(this.chartProps.yAxis);
    }

}
