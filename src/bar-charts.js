import { select, selectAll, mouse } from 'd3-selection';
import { max } from 'd3-array';
import { format } from 'd3-format';
import { f } from 'd3-jetpack/essentials';

import SCORECARD_DATA from '../data/data.json';

function graphBars(container, { cred, column }, highlights = []) {
  const data = SCORECARD_DATA
    .filter(row => row.institution === 'Columbia University in the City of New York' && row.cred === cred)
    .map(row => ({ field: row.field, [column]: row[column] }))
    .sort((a, b) => b[column] - a[column]);
  const maxValue = max(data, d => d[column]);

  // Create bars
  data.forEach((d, i) => {
    const { field} = d;

    const fieldLabel = container.append('p.bar-label')
      .text(field);
    const barContainer = container.append('div.bar-container');

    const numberLabel = barContainer.append('p.bar-number-label')
      .translate([10, 0])
      .text(format('$,')(d[column]));

    const bar = barContainer.insert('div.bar', ':first-child')

    const setLabelVisibility = visibility => {
      if (highlights.includes(field))
        visibility = 1;
      fieldLabel.st({ opacity: visibility });
      numberLabel.st({ opacity: visibility });
      bar.st({ borderWidth: visibility * 2 });
    };

    setLabelVisibility(0);
    bar.st({ width: d[column] / maxValue * 100 + '%' })
      .on('mouseover', () => setLabelVisibility(1))
      .on('mouseleave', () => setLabelVisibility(0));
  })
}

for (const container of document.getElementsByClassName('bars-container')) {  
  // Get desired highlights
  const highlights = container
    .getAttribute('data-highlights')
    .split(';')
    .map(h => h.trim());

  // Derive subject data
  const columns = container
    .getAttribute('data-columns')
    .split(';')
    .map(c => {
      let [ cred, column ] = c.split(': ');
      cred = { 'B': 'Bachelor', 'M': 'Master' }[ cred.trim() ];
      return { cred, column }
    })
    .filter(c => c.column === 'debt' || c.column === 'earnings');
  if (columns.length === 0) {
    console.error('No valid columns in this string:', container.getAttribute('data-columns'));
    break;
  }

  // Create chart containers and graph and title each one
  select(container)
    .appendMany('div.bar-chart-container', columns)
    .each(function(column) {
      const chartContainer = select(this);
      graphBars(chartContainer, column, highlights);
    });
}
