/* This script loads the content of a gantt chart as a table.

  Requires:
    - luxon (time parser)
    - jquery
  
  The content of the gantt chart should be included as a JSON object,
  loaded from the data folder. Moreover, the table to populate should
  contain the name of the data file as the `data-name` property of the table.

  First, the script will capture all the tables with class `gantt`. Then, we
  parse the date range and calculate the number of columns necessary. The number of
  columns will be given by the difference between the dates transformed to the `columns`
  format (e.g., days, months, years, etc).
  
  Lastly,the script will populate the body and the head of the table. To populate the
  headers, it will use the `legend` attribute, which is the date format. We will calculate
  for each header how many dates are repeated before the next different one appears in a 
  while loop, and then jump to the next one using the given format. The header will span
  for those many columns. The body will follow a similar approach, calculating the starting
  and ending column based on the distance to the original starting date.
*/

class Gantt {
  format = "LLL-yy";
  axis = "axis";

  constructor(element, data, staticURL, format) {
    this.element = element;
    this.data = data;
    this.staticURL = staticURL;

    if (format) {
      this.format = format;
    }

    // Add the grid layout
    this.addGridColumns();
    this.addGridRows();

    // Add the rows and columns
    this.element.append(this.rows);
    this.element.append(this.columns);

    const tooltipTriggerList = document.querySelectorAll(
      '[data-bs-toggle="tooltip"]'
    );
    const tooltipList = [...tooltipTriggerList].map(
      (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
    );
  }

  get datesInterval() {
    let DateTime = luxon.DateTime;
    let Interval = luxon.Interval;

    const [start, end] = this.data.range;

    const startDate = DateTime.fromISO(start);
    const endDate = DateTime.fromISO(end);
    const interval = Interval.fromDateTimes(startDate, endDate);
    return interval;
  }

  get rows() {
    const DateTime = luxon.DateTime;

    const barHtml = '<div class="bar"></div>';
    const logoHtml = '<div class="logo"></div>';
    const titleHtml = '<div class="title"></div>';

    let rows = [];
    let index = 1;

    for (const section of this.data.sections) {
      const title = $(`<small>${section.title}</small>`);
      let titleEl = $(titleHtml).append(title).css({
        "grid-row-start": index,
      });
      rows.push(titleEl);
      index++;

      for (const lane of section.lanes) {
        let logoEl = $(logoHtml)
          .css({
            "grid-row-start": index,
          })
          .attr({
            "data-bs-toggle": "tooltip",
            "data-bs-title": lane.name,
          });

        if ("logo" in lane) {
          let logoImg = $(
            `<img loading="lazy" src="${this.staticURL}${lane.logo}">`
          );
          logoEl.append(logoImg);
        }

        rows.push(logoEl);

        for (const bar of lane.bars) {
          let end = "all";
          if (bar.span[1] != "now") {
            end = DateTime.fromISO(bar.span[1]).toFormat(this.format);
          }

          let barEl = $(barHtml)
            .css({
              "grid-row-start": index,
              "grid-column-start": DateTime.fromISO(bar.span[0]).toFormat(
                this.format
              ),
              "grid-column-end": end,
            })
            .attr("data-lane", lane.id)
            .attr("data-bar", bar.id)
            .attr("data-section", section.id);
          rows.push(barEl);
        }

        index++;
      }
    }

    return rows;
  }

  get legendFormat() {
    const legend = this.data.legend;
    const formats = {
      years: "yyyy",
      months: "LLLL",
    };

    return formats[legend];
  }

  get columns() {
    const column = '<div class="xaxis-column"></div>';

    let splitBy = {};
    splitBy[this.data.legend] = 1;

    const groups = this.datesInterval.splitBy(splitBy);
    let columns = [$(column)];

    for (const group of groups) {
      let text = group.start.toFormat(this.legendFormat);
      let col_h = $(column);

      col_h.text(text).css({
        "grid-column-start": group.start.toFormat(this.format),
        "grid-column-end": group.end.toFormat(this.format),
      });

      columns.push(col_h);
    }

    return columns;
  }

  addGridRows() {
    let numRows = this.data.sections.map((section) => section.lanes.length + 1);
    numRows = numRows.reduce((a, b) => a + b, 0);

    this.element.css({
      "grid-template-rows": `repeat(${numRows}, [row-start] 1fr) [${this.axis}] 1fr`,
    });
  }

  addGridColumns() {
    const interval = this.datesInterval;
    const format = this.format;

    const dates = this.months(interval);
    const gridColumns = Array.from(dates)
      .map((d) => {
        let str = d.toFormat(format);

        return `[${str}] 1fr`;
      }, this)
      .join(" ");

    this.element.css({
      "grid-template-columns": `[${this.axis}] 4em ` + gridColumns,
    });
  }

  *months(interval) {
    let cursor = interval.start.startOf("month");
    while (cursor < interval.end) {
      yield cursor;
      cursor = cursor.plus({ months: 1 });
    }
  }
}

function showGanttBarModalInfo(bar) {
  const box = $("#ganttModal");

  // Add the title and subtitle of the modal
  let subs = [];
  if ("location" in bar) {
    subs.push(bar.location);
  }

  if ("subtitle" in bar) {
    subs.push(bar.subtitle);
  }

  const subtitle = $(
    `<div class="subtitle">${subs.join("&ensp; &bull; &ensp;")}</div>`
  );
  const title = $(`<div class="title">${bar.title}</div>`);

  box.find("div.modal-title").html([title, subtitle]);

  const summary = $(`<div class="summary">${bar.summary}</div>`);

  // Add the content of the body to the modal
  const datesmapped = bar.span
    .map((d) => `<div class="date">${d}</div>`)
    .join(`<i class="fa-solid fa-arrow-right"></i>`);

  const dates = $(`<div class="dates">
              <i class="fa-regular fa-calendar"></i>
              <span>${datesmapped}</span>
            </div>`);

  let tagList = null;
  if ("tags" in bar) {
    tagList = bar.tags.map((t) => $(`<div class="tag">#${t}</div>`));
  }
  const tags = $(`<div class="tags"></div>`).html(tagList);

  box.find("div.modal-body").html([dates, summary, tags]);

  // Show the box
  box.modal("show");
}
