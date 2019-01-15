import {ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, ɵunv} from '@angular/core';
import {Client} from 'elasticsearch-browser';
import {Dogodek} from './models/Dogodek';

import * as d3 from 'd3';
import {DogodkiService} from './dogodki.service';
import {Povzrocitelj} from './models/Povzrocitelj';
import {Udelezenec} from './models/Udelezenec';
import {max} from 'rxjs/operators';
import {animate, state, style, transition, trigger} from '@angular/animations';
import {run} from 'tslint/lib/runner';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],

})
export class AppComponent implements OnInit {

    private index: string = 'prometnavarnost';
    private client: Client;
    status: string;
    private isConnected: boolean;

    first: boolean = true;

    selectedValue: string = 'okolisce';

    goBack: boolean = false;

    dataPass: any;
    dataSelect: any;
    dataNajpogostejse: any;
    dataCompare: any;

    yearATM: string = '';

    chartYLabel: string = '';
    chartXLabel: string = '';

    totalDogodtkiPerYear: any[] = [];
    @ViewChild('chart')
    chartElement: ElementRef;

    private svgElement: HTMLElement;
    private chartProps: any;


    toggle1color = 'accent';
    toggle1checked = false;
    toggle1disabled = false;
    togglecheckedM = false;
    togglecheckedZ = false;

    title = 'Prometne nesreče v Sloveniji';

    constructor(private cd: ChangeDetectorRef,
                private dogodkiService: DogodkiService
    ) {
        if (!this.client) {
            this.connect();
        }
    }

    getYear() {
        return parseInt(this.yearATM);
    }

    refresh() {
        this.goBack = false;
        this.toggle1checked = false;
        d3.select('#backBtn').transition()
            .duration(200)
            .ease(d3.easeSin)
            .style('opacity', 0);
        d3.select('#chart').transition()
            .duration(400)
            .ease(d3.easeSin)
            .style('opacity', '0');
        d3.select('#piechart').transition()
            .duration(200)
            .ease(d3.easeSin)
            .style('opacity', '0');
        d3.select('#barChart').transition()
            .duration(400)
            .ease(d3.easeSin)
            .style('opacity', '0');
        d3.select('#selecter').transition()
            .duration(400)
            .ease(d3.easeSin)
            .style('opacity', '0')
            .style('display', 'none');
        d3.select('#pieText').transition()
            .duration(400)
            .ease(d3.easeSin)
            .style('opacity', '0')
            .style('display', 'none');
        d3.select('#togglesDIV').transition()
            .duration(400)
            .ease(d3.easeSin)
            .style('opacity', '0')
            .style('display', 'none');

        setTimeout(() => {
            d3.select('#piechart').selectAll('*').remove();
            d3.select('#chart').selectAll('*').remove();
            d3.select('#barChart').selectAll('*').remove();
            this.countAgg();
        }, 500);

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

    countAgg() {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        'match_all': {}
                        // range:{
                        //     Leto: {
                        //         gte: 2010,
                        //         lte: 2017
                        //     }
                        // }
                    },
                    aggs: {
                        poLetih: {
                            terms: {
                                field: 'Leto',
                                size: 25
                            }
                        }
                    }
                }
            }
        ).then(res => {
            this.totalDogodtkiPerYear = res.aggregations.poLetih.buckets;
            console.log('buckets = ' + this.totalDogodtkiPerYear.length);

            this.drawBars(this.totalDogodtkiPerYear[0].doc_count);
        });
    }

    filterPoUrah(year: string, update: boolean = false): any {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        range: {
                            Leto: {
                                gte: year,
                                lte: year
                            }
                        }
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
            this.chartYLabel = 'Število nesrečov';
            this.chartXLabel = 'Ure (0-24)';
            this.sortPoUrah();
            if (update) {
                this.updateChart();
            } else {
                this.buildChart();
            }
        });
    }

    filterPoUrahU(year: string, match: any[], range: any): any {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        bool: {
                            must: match,
                            filter: {
                                bool: {
                                    should: [
                                        {range: range},
                                    ]
                                }
                            }
                        }
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
            this.chartYLabel = 'Število nesrečov';
            this.chartXLabel = 'Ure (0-24)';
            this.sortPoUrah();
            this.updateChart();

        });
    }

    filterPoKlasifikaciji(year: number): any {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        // 'match_all': {}
                        range: {
                            Leto: {
                                gte: year,
                                lte: year
                            }
                        }
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


    filterPoVremenu(year: number): any {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        bool: {
                            must: {match: {'KlasifikacijaNesrece.keyword': 'S SMRTNIM IZIDOM'}},
                            filter: {range: {'Leto': {'gte': year, 'lte': year}}}
                        }
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
            this.dataSelect = aggregations;
            this.drawPie();
            console.log(aggregations);
        });
    }

    filterPoNaselju(year: number): any {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        // 'match_all': {}
                        range: {
                            Leto: {
                                gte: year,
                                lte: year
                            }
                        }
                    },
                    aggs: {
                        poSpolu: {
                            terms: {
                                field: 'VNaselju.keyword',
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

    filterNajpogostejsihStarosti() {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        'match': {
                            'Udelezenec.Vloga': 'Povzročitelj'
                        }
                    },
                    aggs: {
                        agregacija: {
                            terms: {
                                field: 'Udelezenec.Starost',
                                size: 5
                            }
                        }
                    }
                }
            }
        ).then(res => {
            this.dataSelect = res.aggregations.agregacija.buckets;
            this.drawPie();
            console.log('najpogostejse', this.dataNajpogostejse);
        });
    }

    filterComparePovzrociteljSpol() {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        'match': {
                            'Udelezenec.Vloga': 'Povzročitelj'
                        }
                    },
                    aggs: {
                        poSpolu: {
                            terms: {
                                field: 'Udelezenec.Spol.keyword',
                                size: 2
                            }
                        }
                    }

                }
            }
        ).then(res => {
            this.dataSelect = res.aggregations.poSpolu.buckets;
            this.drawPie();
            console.log('dataCompare', this.dataCompare);
        });
    }

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

        this.countAgg();

    }

    filterSelect(leto: any, selectString: string, size: number) {
        this.client.search({
                index: this.index,
                body: {
                    query: {
                        bool: {
                            must: {match: {'KlasifikacijaNesrece.keyword': 'S SMRTNIM IZIDOM'}},
                            filter: {range: {'Leto': {'gte': leto, 'lte': leto}}}
                        }

                    },
                    aggs: {
                        poPasu: {
                            terms: {
                                field: selectString,
                                size: size
                            }
                        }
                    }

                }
            }
        ).then(res => {
            this.dataSelect = res.aggregations.poPasu.buckets;
            this.drawPie();
            console.log('filterSelect', this.dataSelect);

        });
    }


    onChange(newValue) {
        console.log('THE NEW VALUE IS', newValue);
        console.log('YEAR', this.getYear());
        d3.select('#piechart').selectAll('*').remove();
        if (newValue == 'naselje') {
            this.filterSelect(this.yearATM, 'VNaselju.keyword', 2);
        } else if (newValue == 'pas') {
            this.filterSelect(this.yearATM, 'Udelezenec.UporabaVarnostnegaPasu.keyword', 2);
        } else if (newValue == 'okolisce') {
            this.filterSelect(this.yearATM, 'VremenskeOkoliscine.keyword', 5);
        } else if (newValue == 'tipnesrece') {
            this.filterSelect(this.yearATM, 'TipNesrece.keyword', 6);
        }


    }

    // formatDate() {
    //     this.dogodki.forEach(ms => {
    //         if (typeof ms.DatumPN === 'string') {
    //             ms.DatumPN = new Date(ms.DatumPN);
    //             ms.DatumPN.setHours(ms.UraPN);
    //         }
    //     });
    //     this.dogodki.sort((a: Dogodek, b: Dogodek) => {
    //         return a.DatumPN.getTime() - b.DatumPN.getTime();
    //     });
    // }


    sortPoUrah() {
        this.dataPass.sort((a: any, b: any) => {
            return a.key - b.key;
        });
    }


    buildChart() {
        this.chartProps = {};
        // this.formatDate();
        this.sortPoUrah();

        console.log('CHART DATA', this.dataPass);

        // Set the dimensions of the canvas / graph
        let margin = {top: 30, right: 100, bottom: 80, left: 50},
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
            .attr('height', height + margin.top + margin.bottom);
        // .append('g')
        // .attr('transform', `translate(${margin.left + 30},${margin.top})`);

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

        var g = svg.append('g').attr('transform', `translate(${margin.left + 30},${margin.top})`);

        this.chartProps.x.domain(d3.extent(_this.dataPass, function (d) {
            return d.key;
        }));
        this.chartProps.y.domain([0, d3.max(_this.dataPass, function (d) {
            // return Math.max(0, d.doc_count);
            return d.doc_count * 1.10;
        })]);

        // Add the valueline path.
        g.append('path')
            .attr('class', 'line line1')
            .style('stroke', '#f4f4f4')
            .style('stroke-width', '2px')
            .attr('stroke-linejoin', 'round')
            .style('fill', 'none')
            .attr('d', poUrah(_this.dataPass));

        // // Add the valueline path.
        // svg.append('path')
        //     .attr('class', 'line line1')
        //     .style('stroke', 'black')
        //     .style('fill', 'none')
        //     .attr('d', vozniskiStazVLetih(_this.dogodki));


        var focus = g.append('g')
            .attr('class', 'focus')
            .style('display', 'none');

        focus.append('line')
            .attr('class', 'x-hover-line hover-line')
            .attr('y1', 0)
            .attr('y2', height);

        focus.append('line')
            .attr('class', 'y-hover-line hover-line')
            .attr('x1', width)
            .attr('x2', width);

        focus.append('circle')
            .style('fill', 'white')
            .attr('r', 7.5);

        focus.append('text')
        // .attr("x", )
            .attr('y', -20)
            .style('fill', 'white')
            .attr('text-anchor', 'middle')
            .attr('dy', '.31em');

        svg.append('rect')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')')
            .attr('class', 'overlay')
            .attr('width', width)
            .attr('height', height)
            .style('fill', 'none')
            .style('pointer-events', 'all')
            .on('mouseover', function () {
                focus.style('display', null);
            })
            .on('mouseout', function () {
                focus.style('display', 'none');
            })
            .on('mousemove', mousemove);

        // var parseTime = d3.timeParse("%Y")
        let bisectDate = d3.bisector(function (d) {
            return d.key;
        }).left;

        function mousemove() {
            var x0 = _this.chartProps.x.invert(d3.mouse(this)[0]),
                i = bisectDate(_this.dataPass, x0, 1),
                d0 = _this.dataPass[i - 1],
                d1 = _this.dataPass[i],
                d = x0 - d0.key > d1.key - x0 ? d1 : d0;
            focus.attr('transform', 'translate(' + _this.chartProps.x(d.key) + ',' + _this.chartProps.y(d.doc_count) + ')');
            focus.select('text').text(function () {
                return d.doc_count;
            });
            focus.select('.x-hover-line').attr('y2', height - _this.chartProps.y(d.doc_count));
            focus.select('.y-hover-line').attr('x2', width + width);
        }

        // Add the X Axis
        let xAxisG = g.append('g')
            .attr('class', 'x axis')
            .attr('transform', `translate(0,${height})`)
            .call(customXAxis);

        // Add the Y Axis
        let yAxisG = g.append('g')
            .attr('class', 'y axis')
            .call(customYAxis);


        // Setting the required objects in chartProps so they could be used to update the chart
        this.chartProps.svg = svg;
        this.chartProps.valueline = poUrah;
        this.chartProps.valueline2 = vozniskiStazVLetih;
        this.chartProps.xAxis = xAxis;
        this.chartProps.yAxis = yAxis;

        function customYAxis(g) {
            g.call(yAxis);
            g.append('text')
                .attr('class', 'axis-label')
                .attr('y', -50)
                .attr('x', -height / 2)
                .attr('transform', `rotate(-90)`)
                .attr('text-anchor', 'middle')
                .style('font-family', 'sans-serif')
                .style('font-size', '2.5em')
                .style('fill', 'white')
                .text(_this.chartYLabel);
            // g.select(".domain").remove();
            g.select('.domain').attr('stroke', '#f4f4f4');
            g.selectAll('.tick line').attr('stroke', '#f4f4f4');
            // g.selectAll(".tick text").attr("x", 4).attr("dy", -4);
            g.selectAll('.tick text').attr('color', 'white');
        }

        function customXAxis(g) {
            g.call(xAxis);
            g.append('text')
                .attr('class', 'axis-label')
                .attr('y', 50)
                .attr('x', width / 2)
                .attr('text-anchor', 'middle')
                .style('font-family', 'sans-serif')
                .style('font-size', '2.5em')
                .style('fill', 'white')
                .text(_this.chartXLabel);
            // g.select(".domain").remove();
            g.select('.domain').attr('stroke', '#f4f4f4');
            g.selectAll('.tick:not(:first-of-type) line').attr('stroke', '#f4f4f4');
            g.selectAll('.tick line').attr('stroke', '#f4f4f4');

            // g.selectAll(".tick text").attr("x", 4).attr("dy", -4);
            g.selectAll('.tick text').attr('color', 'white');
        }
    }

    drawBars(maxScale: number) {

        // BARS
        console.log('MAX SCALE = ', maxScale);

        let _this = this;
        let margin = {top: 30, right: 20, bottom: 30, left: 20},
            width = window.innerWidth - margin.left - margin.right,
            // height = window.innerHeight - margin.top - margin.bottom;
            height = 1000;
        // var width = window.innerWidth;
        // var height = window.innerHeight;

        let barHeight = 40;
        let rectArray = [];

        let widthScale = d3.scaleLinear()
            .domain([0, maxScale / 100])    // originalni razpon vrednosti
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

            _this.goBack = true;

            console.log('THE CLICKED YEAR = ', this.parentNode.children[2].innerHTML);
            let year = this.parentNode.children[2].innerHTML;
            _this.yearATM = year;

            d3.select('#backBtn').transition()
                .delay(900)
                .duration(800)
                .ease(d3.easeSin)
                .style('opacity', 1);

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

            _this.filterPoUrah(year);
            // _this.filterPoKlasifikaciji(year);
            _this.filterPoVremenu(year);
            // _this.filterPoNaselju(year);
            // _this.filterComparePovzrociteljSpol();
            // _this.filterNajpogostejsihStarosti();

            d3.select('#chart').transition()
                .delay(1000)
                // .duration(600)
                // .ease(d3.easeSin)
                .attr('style', 'display:block;opacity:1;position: absolute;top: 150px;animation:fadein 3s');

            d3.select('#piechart').transition()
                .delay(1150)
                .duration(500)
                .ease(d3.easeSin)
                .attr('style', 'display:block;opacity:1;position: absolute;top: 600px;animation:fadein 3s');

            d3.select('#selecter').transition()
                .delay(1150)
                .duration(500)
                .ease(d3.easeSin)
                .attr('style', 'display:block;opacity:1;position: absolute;top: 550px;left: 200px;width: 230px;animation:fadein 3s');

            d3.select('#pieText').transition()
                .delay(1150)
                .duration(500)
                .ease(d3.easeSin)
                .attr('style', 'display:block;opacity:1;position: absolute;top: 1050px;left: 160px;width: 100%;font-family: sans-serif;color: white;animation:fadein 3s');

            if (parseInt(year) > 2004) {
                d3.select('#togglesDIV').transition()
                    .delay(1150)
                    .duration(500)
                    .ease(d3.easeSin)
                    .attr('style', 'display:block;opacity:1;position: absolute;top: 550px;left: 60vw;width: 500px;height: 100%;animation:fadein 3s');
            }
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

        d3.select('#barChart').transition()
            .delay(200)
            .duration(800)
            .ease(d3.easeSin)
            .style('opacity', '1');
    }

    updateChart() {

        let _this = this;
        // Get the data again

        // Set the dimensions of the canvas / graph
        let margin = {top: 30, right: 100, bottom: 80, left: 50},
            width = window.innerWidth - margin.left - margin.right,
            height = 400 - margin.top - margin.bottom;

        // Scale the range of the data again
        this.chartProps.x.domain(d3.extent(_this.dataPass, function (d) {
            return d.key;
        }));
        this.chartProps.y.domain([0, d3.max(_this.dataPass, function (d) {
            // return Math.max(0, d.doc_count);
            return d.doc_count * 1.10;
        })]);

        // Define po urah
        let poUrah = d3.line<any>()
            .x(function (d) {
                return _this.chartProps.x(d.key);
            })
            .y(function (d) {
                return _this.chartProps.y(d.doc_count);
            });

        // Define the axes
        let xAxis = d3.axisBottom(this.chartProps.x);
        let yAxis = d3.axisLeft(this.chartProps.y).ticks(5);

        // Select the section we want to apply our changes to
        let tran = this.chartProps.svg.transition();

        // Make the changes to the line chart
        tran.select('.line.line1').duration(700) // update the line
            .attr('d', poUrah(this.dataPass))
            .style('display', 'block');

        // this.chartProps.svg.select('.line.line2') // update the line
        //     .attr('d', this.chartProps.valueline2(this.dogodki));

        console.log(tran);

        tran.select('.x.axis')
            .duration(900)// update x axis
            .call(xAxis);

        tran.select('.y.axis')
            .duration(900)// update y axis
            .call(yAxis);

        tran.selectAll('.tick:not(:first-of-type) line').attr('stroke', '#f4f4f4')
        tran.selectAll('.tick line').attr('stroke', '#f4f4f4');
        tran.selectAll('.tick text').attr('color', '#f4f4f4');

    }

    drawPie() {

        let _this = this;

        var divisionRatio = 2.5;
        var legendoffset = 0;
        let chart = d3.select('#piechart');
        let width = 700,
            height = 500,
            radius = Math.min(width, height) / divisionRatio;
        var rcolor = d3.scaleOrdinal().range(['steelblue', 'lightgreen', 'cadetblue', 'powderblue', 'khaki', 'olive']);

        let arc = d3.arc()
            .outerRadius(radius)
            .innerRadius(radius - 200);

        let arcOver = d3.arc()
            .outerRadius(radius + 10)
            .innerRadius(radius - 200);

        chart = chart
            .append('svg')  //append svg element inside #chart
            .attr('width', width)    //set width
            .attr('height', height)  //set height
            .append('g')
            .attr('transform', 'translate(' + (width / divisionRatio) + ',' + ((height / divisionRatio) + 30) + ')');

        var pie = d3.pie(this.dataSelect)
            .sort(null)
            .value(function (d) {
                return d.doc_count;
            });

        var g = chart.selectAll('.arc')
            .data(pie(this.dataSelect))
            .enter().append('g')
            .attr('class', 'arc');

        var count = 0;

        var path = g.append('path')
            .attr('d', arc)
            .attr('id', function (d) {
                return 'arc-' + (count++);
            })
            .style('opacity', function (d) {
                return d.data['op'];
            });

        path.on('mouseenter', function (d) {
            d3.select(this)
                .attr('stroke', 'white')
                .transition()
                .duration(200)
                .attr('d', arcOver)
                .attr('stroke-width', 1);
            d3.select(this.parentNode).append('text')
                .attr('transform', function (d) {
                    return 'translate(' + arc.centroid(d) + ')';
                })
                .attr('dy', '.35em')
                .style('text-anchor', 'end')
                .style('opacity', 1)
                .style('pointer-events', 'none')
                .style('z-index', '1')
                .style('font', '20px sans-serif')
                .text(function (d) {
                    return d.data['doc_count'];
                });

        }).on('mouseleave', function (d) {
            d3.select(this).transition()
                .duration(200)
                .attr('d', arc)
                .attr('stroke', 'none');
            d3.select(this.parentNode).select('text').remove();
        });

        path.append('svg:title')
            .text(function (d) {
                return d.data['key'] + ' (' + d.data['doc_count'] + ')';
            });

        // PATH STYLING
        path.style('fill', function (d) {
            return rcolor(d.data['key']);
        });
        path.style('stroke', 'white');
        path.style('stroke-width', '2');


        // g.append('text')
        //     .attr('transform', function (d) {
        //         return 'translate(' + arc.centroid(d) + ')';
        //     })
        //     .attr('dy', '.35em')
        //     .style('text-anchor', 'middle')
        //     .style('opacity', 1)
        //     .style('font', '20px sans-serif')
        //     .text(function (d) {
        //         return d.data['doc_count'];
        //     });
        count = 0;


        var legend = chart.selectAll('.legend')
            .data(this.dataSelect).enter()
            .append('g').attr('class', 'legend')
            .attr('legend-id', function (d) {
                return count++;
            })
            .attr('transform', function (d, i) {
                return 'translate(15,' + (parseInt('-' + (_this.dataSelect.length * 10)) + i * 28 + legendoffset) + ')';
            });
        // .style('cursor', 'pointer');


        var leg = legend.append('rect');

        leg.attr('x', width / 2)
            .attr('width', 18).attr('height', 18)
            .style('fill', function (d) {
                console.log('COLOR D', d);
                return rcolor(d['doc_count']);
            });

        legend.append('text').attr('x', (width / 2) - 5)
            .attr('y', 9).attr('dy', '.35em')
            .style('text-anchor', 'end')
            .style('font', '14px sans-serif')
            .style('fill', 'white')
            .style('pointer-events', 'none')
            .text(function (d) {
                return d.key;
            });

        leg.append('svg:title')
            .text(function (d) {
                return d['key'] + ' (' + d['doc_count'] + ')';
            });
    }

    onToggleChange(type: number) {

        if (this.toggle1checked && type == 1) {
            this.togglecheckedM = false;
            this.togglecheckedZ = false;
            this.filterPoUrahU(this.yearATM, [{match: {'Udelezenec.Vloga': 'Povzročitelj'}}, {match: {'Leto': this.yearATM}}], {
                'Udelezenec.VrednostAlkotesta': {
                    'gt': 0,
                    'lt': 5
                }
            });
        } else if (this.togglecheckedM  && type == 2) {
            this.toggle1checked = false;
            this.togglecheckedZ = false;
            this.filterPoUrahU(this.yearATM, [{match: {'Udelezenec.Vloga': 'Povzročitelj'}}, {match: {'Udelezenec.Spol.keyword': 'MOŠKI'}}], {
                'Leto': {
                    'gte': this.yearATM,
                    'lte': this.yearATM
                }
            });
        } else if (this.togglecheckedZ  && type == 3) {
            this.togglecheckedM = false;
            this.toggle1checked = false;
            this.filterPoUrahU(this.yearATM, [{match: {'Udelezenec.Vloga': 'Povzročitelj'}}, {match: {'Udelezenec.Spol.keyword': 'ŽENSKI'}}], {
                'Leto': {
                    'gte': this.yearATM,
                    'lte': this.yearATM
                }
            });

        } else {
            this.toggle1checked = false;
            this.togglecheckedM = false;
            this.togglecheckedZ = false;
            this.filterPoUrah(this.yearATM, true);
        }
        console.log('checked ', this.toggle1checked);
    }

}
