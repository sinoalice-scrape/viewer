"use strict";

class Table {
	tableModel;

	dialogColumnIdx;

	domTable;
	domFilterRoot;
	domFilterOk;
	domFilterSortAsc;
	domFilterSortDsc;

	bsModal;

	constructor(tableModel, dialogIdPrefix) {
		this.tableModel = tableModel;
		this.dialogColumnIdx = 0;

		this.domTable         = document.createElement('table');
		this.domFilterRoot    = document.getElementById(dialogIdPrefix);
		this.domFilterOk      = document.getElementById(`${dialogIdPrefix}-ok`);
		this.domFilterSortAsc = document.getElementById(`${dialogIdPrefix}-sort-asc`);
		this.domFilterSortDsc = document.getElementById(`${dialogIdPrefix}-sort-dsc`);

		this.bsModal = new bootstrap.Modal(this.domFilterRoot, {});

		this.domFilterOk.addEventListener('click', (e) => this.#onFilterOkClick(e));
		this.domFilterSortAsc.addEventListener('click', (e) => this.#onFilterSortClick(e,  1));
		this.domFilterSortDsc.addEventListener('click', (e) => this.#onFilterSortClick(e, -1));

		if (tableModel.class)
			this.domTable.className = tableModel.class;

		let html = '';

		html += '<thead';
		if (tableModel.theadClass)
			html += ` class="${tableModel.theadClass}"`;
		html += '><tr>';
		for (const col of tableModel.columns) {
			html += `<th>${col.title}</th>`;
		}
		html += '</tr></thead>';

		html += '<tbody>';
		const rowCount = tableModel.data.length;
		for (let i = 0; i < rowCount; i++) {
			const rowData = tableModel.data[i];
			html += `<tr data-source-idx="${i}">`;
			for (const col of tableModel.columns) {
				html += '<td';
				if (col.align) {
					html += ` align="${col.align}"`;
				}
				if (col.classGenerator) {
					const cssClass = col.classGenerator(rowData);
					if (cssClass)
						html += ` class="${cssClass}"`;
				}
				html += '>';

				let data;
				if (col.field) {
					data = rowData[col.field];
				} else {
					data = col.generator(rowData);
				}
				if (col.numberFormat) {
					data = col.numberFormat.format(data);
				}
				html += data;

				html += '</td>';
			}
			html += '</tr>';
		}
		html += '</tbody>';

		this.domTable.innerHTML = html;
		tableModel.dom = this.domTable;

		const thead = tableModel.dom.children[0];
		const theadRow = thead.children[0];
		for (let i = 0; i < tableModel.columns.length; i++) {
			if (tableModel.columns[i].cmp) {
				const th = theadRow.children[i];
				th.addEventListener('click', (e) => this.#onColumnHeadClick(e, i, tableModel));
				// Will switch between `bi-filter` and `bi-funnel-fill`
				th.className = 'clickable bi bi-filter'; // See https://icons.getbootstrap.com/
			}
		}

		if (this.#canSort()) {
			this.#applySort();
		}
	}

	#onColumnHeadClick(event, columnIdx) {
		const modalTitle = this.domFilterRoot.querySelector('.modal-title');
		modalTitle.textContent = `Column '${this.tableModel.columns[columnIdx].title}'`;
		this.dialogColumnIdx = columnIdx;
		this.bsModal.show();
	}

	#onFilterOkClick(event) {
		console.log('clicked ok');
		this.bsModal.hide();
	}

	#onFilterSortClick(event, dir) {
		this.bsModal.hide();
		this.tableModel.sortColumn = this.dialogColumnIdx;
		this.tableModel.sortDirection = dir;
		this.#applySort();
	}

	#canSort() {
		return typeof this.tableModel.sortColumn !== 'undefined' && typeof this.tableModel.sortDirection !== 'undefined';
	}

	#applySort() {
		const table = this.tableModel;
		if (!this.#canSort()) {
			console.error("Attempting to apply sort when sort direction or column are undefined.");
			return;
		}

		const sortColumn = table.sortColumn;
		const sortDirection = table.sortDirection;
		const tbody = table.dom.children[1];
		const rows = new Array(tbody.children.length);
		for (let i = 0; i < rows.length; i++) {
			const dom = tbody.children[i];
			const sourceIdx = dom.getAttribute("data-source-idx");
			rows[i] = {
				dom: dom,
				data: table.data[sourceIdx],
			};
		}

		const cmp = table.columns[sortColumn].cmp;

		rows.sort(function(l, r) {
			return sortDirection * cmp(l, r, sortColumn);
		});

		for (const row of rows) {
			tbody.appendChild(row.dom);
		}
	}

}

function generateTable(table) {
	const tableObj = new Table(table, 'column-filter-dialog');
	return tableObj.domTable;
}
