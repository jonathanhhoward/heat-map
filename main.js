const datasetURL = 'https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json';

d3.json(datasetURL)
  .then(dataset => heatMap(dataset.baseTemperature, dataset.monthlyVariance))
  .catch(console.error);

function heatMap(baseTemp, dataset) {
  const svgWidth = window.innerWidth;
  const svgHeight = window.innerHeight * 0.97;
  const margin = { top: 100, right: 50, bottom: 80, left: 100 };

  const root = d3.select('#root');

  const svg = root.append('svg')
    .attr('width', svgWidth)
    .attr('height', svgHeight);

  svg.selectAll('text')
    .data([
      { id: 'title', text: 'Global Surface Temperature', y: margin.top * 0.5 },
      { id: 'description', text: `Monthly Variance from 8.66°C`, y: margin.top * 0.75 },
    ])
    .enter()
    .append('text')
    .attr('id', d => d.id)
    .attr('x', svgWidth * 0.5)
    .attr('y', d => d.y)
    .text(d => d.text);

  const chart = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`);

  const chartWidth = svgWidth - margin.left - margin.right;
  const chartHeight = svgHeight - margin.top - margin.bottom;

  const [startYear, stopYear] = d3.extent(dataset, d => d.year);

  const xScale = d3.scaleBand()
    .domain(d3.range(startYear, stopYear + 1))
    .range([0, chartWidth]);

  const xAxis = d3.axisBottom(xScale)
    .tickValues(xScale.domain().filter(d => d % 20 === 0))
    .tickSizeOuter(0);

  chart.append('g')
    .attr('id', 'x-axis')
    .attr('transform', `translate(0, ${chartHeight})`)
    .call(xAxis);

  const yScale = d3.scaleBand()
    .domain(d3.range(12))
    .range([chartHeight, 0]);

  const yAxis = d3.axisLeft(yScale)
    .tickFormat(d => d3.utcFormat('%B')(new Date(0, d)))
    .tickSizeOuter(0);

  chart.append('g')
    .attr('id', 'y-axis')
    .call(yAxis);

  const colorScale = d3.scaleSequential()
    .domain(d3.extent(dataset, d => d.variance))
    .interpolator(d3.interpolatePuOr);

  chart.selectAll('rect')
    .data(dataset)
    .enter()
    .append('rect')
    .attr('class', 'cell')
    .attr('x', d => xScale(d.year))
    .attr('y', d => yScale(d.month - 1))
    .attr('width', xScale.bandwidth())
    .attr('height', yScale.bandwidth())
    .attr('fill', d => colorScale(d.variance))
    .attr('data-month', d => d.month - 1)
    .attr('data-year', d => d.year)
    .attr('data-temp', d => baseTemp + d.variance)
    .on('mouseover', showTooltip)
    .on('mouseout', hideTooltip);

  const tooltip = root.append('div')
    .attr('id', 'tooltip');

  function showTooltip(event, data) {
    const w = 100;
    const h = 50;
    const offset = 20;
    const left = event.pageX + offset;
    const top = event.pageY + offset;
    const right = (svgWidth - event.pageX) + offset;
    const bottom = (svgHeight - event.pageY) + offset;
    const isOverflowX = left + w > svgWidth;
    const isOverflowY = top + h > svgHeight;

    tooltip.attr('data-year', data.year)
      .html(
        `${d3.utcFormat('%b %Y')(new Date(data.year, data.month - 1)).toUpperCase()}<br>` +
        `temp: ${d3.format('.3f')(baseTemp + data.variance)}&deg;C<br>` +
        `var: ${data.variance}&deg;C`,
      )
      .style('left', isOverflowX ? '' : `${left}px`)
      .style('top', isOverflowY ? '' : `${top}px`)
      .style('right', isOverflowX ? `${right}px` : '')
      .style('bottom', isOverflowY ? `${bottom}px` : '')
      .style('display', 'block');
  }

  function hideTooltip() {
    tooltip.style('display', 'none');
  }

  const legend = svg.append('g')
    .attr('id', 'legend')
    .attr('transform', `translate(${margin.left}, ${svgHeight - margin.bottom * 0.5})`);

  const [legendStart, legendStop] = d3.extent(dataset, d => d.variance);

  const legendScale = d3.scaleBand()
    .domain(d3.range(legendStart, legendStop + 1))
    .range([0, chartWidth < 400 ? chartWidth : 400]);

  const legendAxis = d3.axisBottom(legendScale)
    .tickFormat(d => `${d3.format('.0f')(d)}°`)
    .tickSizeOuter(0);

  const legendHeight = 10;

  legend.append('g')
    .attr('transform', `translate(0, ${legendHeight})`)
    .call(legendAxis)
    .call(g => g.select('.domain').remove());

  legend.selectAll('rect')
    .data(legendScale.domain())
    .enter()
    .append('rect')
    .attr('x', d => legendScale(d))
    .attr('y', 0)
    .attr('width', legendScale.bandwidth())
    .attr('height', legendHeight)
    .attr('fill', d => colorScale(d));
}
