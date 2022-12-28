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
        let logoEl = $(logoHtml).css({
          "grid-row-start": index,
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

class GanttBox {
  box;
  target;

  constructor() {
    this.addGanttBox();
  }

  addGanttBox() {
    const boxHTML = `
      <div class="box gantt-info">
        <div class="body">
          <div class="header">
            <div class="title"></div>
            <div class="subtitle"></div>
          </div>
          <div class="content">
            <div class="dates">
              <i class="fa-regular fa-calendar"></i>
              <span></span>
            </div>
            <div class="summary"></div>
            <div class="tags"></div>
          </div>
        </div>
        <div class="polygon">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="100"
            height="100"
            viewBox="10 25 150 100"
            preserveAspectRatio="none"
          >
            <path
              xmlns="http://www.w3.org/2000/svg"
              d="M29.24 84.66a1 1 0 0 0 .96 1.75l111.82-38.93a1 1 0 0 0-.33-1.97l-57.03.06a17.28 17.28 0 0 0-10.7 3.72z"
              stroke="#343a40"
              stroke-width="3"
            />
          </svg>
        </div>
      </div>
    `;

    this.box = $(boxHTML);
    $("main").append(this.box);
  }

  possition(element) {
    if (element == this.target && this.box.is(":visible")) {
      return;
    }

    // set the target to the element, so we can recalculate on scroll
    this.target = element;

    let polygonScale = 1;
    let polygonRight = "auto";
    let left = element.position().left + element.width() * 0.5;
    let top = element.position().top - this.box.height();

    if ($(window).width() < left + this.box.width()) {
      polygonScale = -1;
      polygonRight = 0;
      left -= this.box.width();

      const parentLeft = element.parent(".gantt").position().left;
      if (parentLeft < left) {
        left -= parentLeft;
      }
    }

    this.box.find("div.polygon svg").css({
      transform: `scale(${polygonScale}, 1)`,
      right: polygonRight,
    });

    this.box.css({
      top: top,
      left: left,
    });
  }

  info(bar) {
    this.box.find("div.title").text(bar.title);

    let subs = [];
    if ("location" in bar) {
      subs.push(bar.location);
    }

    if ("subtitle" in bar) {
      subs.push(bar.subtitle);
    }

    this.box.find("div.subtitle").html(subs.join("&ensp; &bull; &ensp;"));

    this.box.find("div.summary").text(`"${bar.summary}"`);
    this.box
      .find("div.dates span")
      .html(
        bar.span
          .map((d) => `<div class="date">${d}</div>`)
          .join(`<i class="fa-solid fa-arrow-right"></i>`)
      );

    let tags = null;
    if ("tags" in bar) {
      tags = bar.tags.map((t) => $(`<div class="tag">#${t}</div>`));
    }
    this.box.find("div.tags").html(tags);
  }

  show() {
    if (!this.box.is(":visible")) {
      this.box.fadeIn();
    }
  }

  hide() {
    if (this.box.is(":visible")) {
      this.box.fadeOut();
      this.target = null;
    }
  }
}
