require.undef('chord_chart');

require.config({
    paths: { 
        d3: 'https://d3js.org/d3.v4.min'
    }
});

console.log('loaded chord chart v0.0.9');

// used to change the font colors if they're black on bright colors.
// https://www.w3.org/WAI/ER/WD-AERT/#color-contrast
function brightness(rgb) {
  return rgb.r * .299 + rgb.g * .587 + rgb.b * .114;
}

define('chord_chart', ['d3'], function(d3) {
    const linkElement = document.createElement('link');
    linkElement.setAttribute('rel', 'stylesheet');
    linkElement.setAttribute('type', 'text/css');
    linkElement.setAttribute('href', 'https://otosense-dev-ui.s3.amazonaws.com/static/css/chord_chart.css');
    document.head.appendChild(linkElement);
    let height = 500;
    let width = 500;
    let svg;
    const fillColors = [
        '#E69F00', '#56B4E9',
        '#009E73', '#F0E442',
        '#0072B2', '#D55E00',
        '#CC79A7', '#fe9600',
        '#ffbe00', '#189487',
        '#12bbd4', '#55ab4c',
        '#d0d82f', '#f14633',
        '#9636b0', '#fb581c',
        '#e52b62', '#396C84',
        '#00aaf4', '#3556b5',
        '#6043b7', '#D55E00',
        '#FC6D44', '#FEC349',
        '#588C73',
    ];

    function getSize(selector, style) {
        const selection = d3.select(selector);
        if (!selection.empty()) {
            const returnStyle = +selection.style(style).replace('px', '');
            const bbox = selection.node().getBoundingClientRect()[style];
            return returnStyle || bbox;
        }
        return 0;
    }

    function initializeDom(element) {
        if (!document.getElementById('modelTooltip')) {
            const tooltipDiv = document.createElement('div');
            tooltipDiv.setAttribute('id', 'modelTooltip');
            tooltipDiv.setAttribute('class', 'model-tooltip');
            element.appendChild(tooltipDiv);
        }
        svg = d3.select(element)
            .append('svg')
            .attr('class', 'chord-chart')
            .attr('id', 'chordModel')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', `0 0 ${width} ${height}`)
            .style('height', height)
            .style('width', width);
    }

    function drawConfusionChart(element, modelData) {
        initializeDom(element);
        const tagList = modelData.model && modelData.model.CentroidSmoothing ?
            modelData.model.CentroidSmoothing.classes_ : modelData.tag_list;
        const struct = structureData(modelData);
        const assess = assessModel(struct);
        // if (storeModelStats) {
        //     storeModelStats(assess);
        // }
        const fillColor = d3.scaleOrdinal().range(fillColors);
        const matrix = [];
        tagList.forEach((t, i) => {
            matrix[i] = [];
            tagList.forEach((s, j) => {
                matrix[i][j] = struct.filter((obj) => {
                    return (obj.prediction === s) && (obj.tagged === t);
                }).length;
            });
        });

        // const dimension = Math.min(window.innerHeight, window.innerWidth * 0.40) - 60;
        // d3.select('#chordModel')
        //     .attr({ width: dimension, height: dimension, viewBox: '0 0 500 500' });

        const arc = d3.arc()
            .innerRadius(height * 0.4)
            .outerRadius(height * 12 / 25);

        const layout = d3.chord().padAngle(0.05)
            .sortSubgroups(d3.descending)
            .sortChords(d3.ascending);

        const path = d3.ribbon()
            .radius(height * 0.4);

        svg.append('g')
            .attr('id', 'modelCircle')
            .attr('transform', 'translate(250,250)')
            .datum(layout(matrix))
            .append('circle')
            .attr('r', 240);

        const groupTag = d3.select('g#modelCircle')
            .selectAll('.groupTag')
            .data((chords) => {
                console.log({ chords });
                return chords.groups;
            }).enter().append('g')
            .classed('group', 1)
            .on('mouseover', mouseover)
            .on('mouseleave', mouseleave)
            .on('mousemove', mousemove)
            .on('dblclick', (d) => {
                // const srefs = struct.filter((s) => {
                //     const thisTag = tagList[d.index];
                //     return s.tagged === thisTag || s.prediction === thisTag;
                // }).map((item) => item.sref);
                // console.log({ srefs });
                // apiRetrieveForSrefs( srefs, ['fv', 'source'], function(objArr) {
                //     objArr.forEach( function(d) { d.sref = d._id; });
                //     goToSwidget(objArr);
                // });
                    // goToSwidget(srefs);
            });

        groupTag.data()
            .forEach((d) => {
                d.tag = tagList[d.index];
                const assessTag = assess.filter((a) => {
                    return a.tag === d.tag;
                })[0];
                ['N_targets', 'N_hits', 'tp', 'tn', 'fp', 'fn']
                    .forEach((key) => {
                        d[key] = assessTag[key];
                    });
            });

        groupTag.append('path')
            .attr('id', (d, i) => {
                return 'groupTag' + i;
            })
            .attr('d', arc)
            .style('fill', (d, i) => {
                const tag = tagList[d.index];
                return fillColor(tag);
            });

        const groupText = groupTag.append('text')
            .attr('x', 10)
            .attr('dy', 26);

        groupText.append('textPath')
            .attr('xlink:href', (d, i) => {
                return '#groupTag' + i;
            })
            .text((d, i) => {
                return tagList[i];
            })
            .style({
                fill: (d) => brightness(d3.rgb(fillColor(tagList[d.index]) ||
                    '#eee')) < 125 ? '#ddd' : 'black',
            });

        // groupText.filter(function(d, i) {
        //     return groupPath._groups[0][i].getTotalLength() / 2 - 40 < this.getComputedTextLength();
        // }).remove();

        // let displayTooltip: boolean = false;

        const chord = d3.select('g#modelCircle').selectAll('.chord')
            .data((d) => d).enter().append('path')
            .classed('chord', 1)
            .classed('same', (d) => {
                return d.source.index === d.target.index;
            })
            .attr('d', path)
            .on('mouseenter', function(d) {
                // const thisTag = d.tag;

                d3.selectAll('.model .groupTag').select('path')
                    .classed('fadeFill', (p) => {
                        return (p.index !== d.target.index && p.index !== d.source.index);
                    });

                const fadedGroup = d3.selectAll('.model .groupTag').select('path.fadeFill');
                fadedGroup
                    .each(function() {
                        d3.select(this.parentElement).select('text').style('fill', 'black');
                    });

                d3.selectAll('path.chord').classed('fade', 1);
                d3.select(this).classed('fade', 0);

                const predictions = {};
                predictions.AB = d.source.value;
                predictions.BA = d.target.value;
                const tagA = tagList[d.source.index];
                const tagB = tagList[d.target.index];

                predictions.AA = struct.filter((s) => {
                    return s.prediction === tagA && s.tagged === tagA;
                }).length;
                predictions.BB = struct.filter((s) => {
                    return s.prediction === tagB && s.tagged === tagB;
                }).length;

                const str1 = '<p>' + d.source.value + ' <span class=bold>' + tagList[d.source.index] +
                    '</span> predicted as <span class=bold>' + tagList[d.target.index] + '</span></p>';
                const str2 = '<p>' + d.source.value + ' <span class=bold>' + tagList[d.source.index] +
                    '</span> predicted as <span class=bold>' + tagList[d.target.index] + '</span></p><p>' +
                    d.target.value + ' <span class=bold>' + tagList[d.target.index] +
                    '</span> predicted as <span class=bold>' + tagList[d.source.index] + '</span></p>';
                d3.select('#modelTooltip')
                    .html('<div>' + (d.source.index === d.target.index ? str1 : str2) + '</div>');
            })
            .on('mousemove', mousemove)
            .on('mouseleave', () => {
                d3.selectAll('path.chord').classed('fade', 0);
                d3.selectAll('.fadeFill').classed('fadeFill', 0);
                d3.select('#modelTooltip').style('display', 'none');
            })
            .on('dblclick', (d) => {
                // console.log({ d, modelData, struct });
                // const srefTagMemo: any[] = [];
                // // const srefMemo: string[] = [];
                // // const tagMemo: string[] = [];
                // struct.forEach((s, i) => {
                //     if ((s.prediction === tagList[d.source.index] &&
                //             s.tagged === tagList[d.target.index]) ||
                //         (s.tagged === tagList[d.source.index] &&
                //             s.prediction === tagList[d.target.index])) {
                //         srefTagMemo.push({
                //             sref: s.sref,
                //             tag: s.tagged,
                //         });
                //         // srefMemo.push(s.sref);
                //         // tagMemo.push(s.tagged);
                //     }
                // });
                // this.appState.srefTagMemo = srefTagMemo;
                // console.log({ srefTagMemo });
                // this.appState.layoutManager.initializeView('swidgets');
            });

        function mouseover(d, i) {
            const taggedN = struct.filter((s) => s.tagged === d.tag).length;
            const predictedN =  struct.filter((s) => s.prediction === d.tag).length;

            chord.classed('fade', (p) => p.source.index !== i && p.target.index !== i);
            const indices = d3.merge(d3.selectAll('.chord:not(.fade)').data()
                .map((d1) => [d1.source.index, d1.target.index]));

            d3.selectAll('.groupTag').filter((d1) => indices.indexOf(d1.index) === -1)
                .classed('fadeFill', 1);

            const str2 = '<div><p style=\'font-weight:bold; font-decoration:underline\'>' + d.tag + '</p><p> tagged: ' +
                taggedN + '</p><p>predicted: ' + predictedN + '</p></div>';
            d3.select('#modelTooltip')
                .html(str2);
        }

        function mousemove(d) {
            d3.select('#modelTooltip')
                .style('display', 'block')
                .style('position', 'fixed')
                .style('left', (d3.event.pageX + 10) + 'px')
                .style('top', (d3.event.pageY) + 'px');

            const H = Math.max(getSize('#modelTooltip div', 'height') + 20, 80);
            d3.select('#modelTooltip').style('height', () => H + 'px');
        }

        function mouseleave() {
            d3.selectAll('.fade').classed('fade', 0);
            d3.selectAll('.fadeFill').classed('fadeFill', 0);
            d3.select('#modelTooltip').style('display', 'none');
        }

        function structureData(data) {
            console.log({ data });
            return data.predict_proba.map((a, i) => {
                let tagged = data.orig_tags[i];
                if (data.group_tags && data.group_tags[tagged]) {
                    tagged = data.group_tags[tagged];
                }
                return {
                    prediction: tagList[a.indexOf(_.max(a))],
                    tagged,
                };
            });
        }

        function assessModel(S) {
            const reportFormat = d3.format('.2f');

            const nTotal = S.length;
            d3.set(S.map((s) => s.group || s.tagged)).values()
                .filter((t) => t !== 'row');

            const nest = d3.nest()
                .key((d) => d.tagged)
                .key((d) => d.prediction)
                .rollup((leaf) => leaf.length)
                .entries(S);

            console.log({ nest });

            const hits = [];

            const results = nest.map((n, i) => {
                const tag = n.key;
                const nTargets =  d3.sum(n.values.map((d) => d.value));
                hits[i] = nest.map((n1) => {
                    const sol = n1.values.filter((v) => {
                        return v.key === tag;
                    })[0];
                    return sol ? sol.value : 0;
                });
                const nHits = d3.sum(hits[i]);
                const tp = hits[i][i];
                return {
                    N_hits: nHits,
                    N_targets: nTargets,
                    fp: (nHits - tp),
                    tag,
                    tp: hits[i][i],
                };
            });

            results.forEach((d, k) => {
                d.tn = d3.sum(d3.merge(hits.filter((h, i) => i !== k).map((h, j) => h.filter((e, i) => i !== k))));
                d.fn = nTotal - d.tp - d.fp - d.tn;
                d.accuracy = reportFormat((d.tp + d.tn) / (d.tp + d.tn + d.fp + d.fn));
                d.precision = reportFormat(d.tp / (d.tp + d.fp) || 0);
                d.recall = reportFormat(d.tp / (d.tp + d.fn));
                d.F1 = reportFormat(2 * (+d.precision * (+d.recall)) / (+d.precision + (+d.recall)) || 0);
            });
            return results;
        }
    }

    return drawConfusionChart;
});
