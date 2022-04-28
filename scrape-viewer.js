"use strict";

const nf = new Intl.NumberFormat('en-US');

let db = {
	json: new Map(),
	index: {
		shinmaSkills: null,
		characters: null,
	}
};

function datamineJsonUrl(path) {
	return `https://raw.githubusercontent.com/sinoalice-datamine/data/master/${path}.json`;
}

const en_ultimate_art_method_mst_list = datamineJsonUrl("EN/ultimate_art_method_mst_list");
const en_character_mst_list = datamineJsonUrl("EN/character_mst_list");

const weaponMapShort = [
	'',
	'I', 'T', 'A', 'S',
	'B', 'H', 'P', 'P',
];

const weaponMapLong = [
	'',
	'Instrument', 'Tome', 'Artifact', 'Staff',
	'Blade', 'Heavy', 'Projectile', 'Polearm',
];

function viewGuildHistory(matchHistory, shinmaSkills) {
	function generateShinmaCells(shinma, shinmaSkills) {
		if (!shinma) {
			return '<td align="center"></td><td align="center"></td>';
		}

		const shinmaMst = shinmaSkills.get(shinma.artMstId);
		const shinmaWeapons =
			weaponMapShort[shinmaMst.element1] +
			weaponMapShort[shinmaMst.element2] +
			weaponMapShort[shinmaMst.element3] +
			weaponMapShort[shinmaMst.element4];

		return `<td align="center">${shinmaWeapons}</td>` +
			`<td align="center">${shinma.guildACount}/${shinma.guildBCount}</td>`;
	}

	const guildA = matchHistory.items[0].guildAName;

	let html = `<h1>${guildA}</h1>`;
	html += '<table class="table table-striped table-bordered table-sm"><thead><tr>';
	html += '<th>Date</th>';
	html += '<th>Rank</th>';
	html += '<th>Result</th>';
	html += '<th>Enemy Guild</th>';
	html += '<th>Guild ID</th>';
	html += `<th>${guildA} (Lifeforce)</th>`;
	html += '<th>Enemy Guild (Lifeforce)</th>';
	html += `<th>${guildA} (Combo)</th>`;
	html += '<th>Enemy Guild (Combo)</th>';
	html += `<th>${guildA} (Ship)</th>`;
	html += '<th>Enemy Guild (Ship)</th>';
	html += '<th>1st Shinma</th>';
	html += '<th>Tally</th>';
	html += '<th>2nd Shinma</th>';
	html += '<th>Tally</th>';
	html += '</tr></thead>';
	html += '<tbody>';

	const matchCount = matchHistory.items.length;
	for (let i = matchCount-1; i >= 0; i--) {
		const m = matchHistory.items[i];
		const dt = new Date(m.startTime * 1000);

		let result = "Tie";
		if (m.guildAPoints > m.guildBPoints)
			result = "Victory";
		else if (m.guildAPoints < m.guildBPoints)
			result = "Defeat";

		const matchUrl = `?view=match&time=${m.startTime}&a=${m.guildAId}&b=${m.guildBId}`;

		html += '<tr>';
		html += `<td><a href="${matchUrl}">${dt.getUTCFullYear()}/${dt.getUTCMonth()+1}/${dt.getUTCDate()}</a></td>`;
		html += `<td>${m.rank}</td>`;
		html += `<td>${result}</td>`;
		html += `<td>${m.guildBName}</td>`;
		html += `<td align="right">${m.guildBId}</td>`;
		html += `<td align="right">${nf.format(m.guildAPoints)}</td>`;
		html += `<td align="right">${nf.format(m.guildBPoints)}</td>`;
		html += `<td align="right">${m.guildACombo}</td>`;
		html += `<td align="right">${m.guildBCombo}</td>`;
		html += `<td align="right">${m.guildAShipWin}</td>`;
		html += `<td align="right">${m.guildBShipWin}</td>`;
		html += generateShinmaCells(m.shinma[0], shinmaSkills);
		html += generateShinmaCells(m.shinma[1], shinmaSkills);
		html += '</tr>';
	}
	html += '</tbody></table>';

	let content = document.getElementById("content");
	content.innerHTML = html;
	return `Scrape Viewer: ${guildA} match history`;
}

function viewMatch(dt, match, shinmaSkills, characters) {
	function generateShinmaRow(shinma, shinmaSkills) {
		if (!shinma) {
			return '<tr><th scope="row"></th><td></td><td></td></tr>';
		}

		const shinmaMst = shinmaSkills.get(shinma.artMstId);
		const shinmaWeapons =
			weaponMapShort[shinmaMst.element1] +
			weaponMapShort[shinmaMst.element2] +
			weaponMapShort[shinmaMst.element3] +
			weaponMapShort[shinmaMst.element4];

		return `<tr><th scope="row">${shinmaWeapons}</th>` +
			`<td>${shinma.guildACount}</td>` +
			`<td>${shinma.guildBCount}</td></tr>`;
	}

	function generateMemberList(guild, members, characters) {
		let html = '<table class="table table-striped table-bordered table-sm text-nowrap"><thead>';
		html += `<tr><th>${guild}</th><th>Weapon</th><th>Stats</th><th>HP</th><th>Class</th></tr>`;
		html += '</thead><tbody>';
		for (let i = 0; i < members.length; i++) {
			const m = members[i];
			const char = characters.get(m.characterMstId);
			html += '<tr>';
			html += `<td>${m.name}</td>`;
			html += `<td>${weaponMapLong[char.favoriteWeapon]}</td>`;
			html += `<td>${nf.format(m.totalPower)}</td>`;
			html += `<td>${nf.format(m.maxHp)}</td>`;
			html += `<td>${char.name}</td>`;
			html += '</tr>';
		}
		html += '</tbody></table>';
		return html;
	}

	let guildStatsA = 0;
	let guildStatsB = 0;
	{
		const guildMemberA = match.getBattleUserList.guildMemberA;
		const guildMemberB = match.getBattleUserList.guildMemberB;
		for (let i = 0; i < guildMemberA.length; i++) {
			guildStatsA += guildMemberA[i].totalPower;
		}
		for (let i = 0; i < guildMemberB.length; i++) {
			guildStatsB += guildMemberB[i].totalPower;
		}
	}

	let pageTitle;
	let html = '<div class="container">';
	{
		const res = match.getResult.gvgResult;
		const guildA = res.selfGuildName;
		const guildB = res.enemyGuildName;
		const date = `${pad(4,dt.getFullYear())}/${pad(2,dt.getMonth()+1)}/${pad(2,dt.getDate())}`;
		const time = `${dt.getHours()}:${pad(2,dt.getMinutes())}:${pad(2,dt.getSeconds())}`;

		pageTitle = `Scrape Viewer: ${date} ${guildA} vs. ${guildB}`;
		html += '<div class="row" justify-content-center>';
		{
			html += '<div class="col">';
			html += `<h1>${guildA} vs. ${guildB}</h1>`;
			html += `<p>${date} ${time}</p>`;
			html += '</div>';
		}
		html += '</div>';

		html += '<div class="row">';
		{
			html += '<div class="col">';
			html += '<table class="table table-striped table-bordered table-sm"><thead><tr>';
			html += '<th></th>';
			html += `<th scope="col">${guildA}</th>`;
			html += `<th scope="col">${guildB}</th>`;
			html += '</tr></thead>';
			html += '<tbody>';

			const lifeforceA = nf.format(res.selfTotalGuildPoint);
			const lifeforceB = nf.format(res.enemyTotalGuildPoint);
			html += `<tr><th scope="row">Lifeforce</th><td>${lifeforceA}</td><td>${lifeforceB}</td></tr>`;

			const combo_a = nf.format(res.selfComboCount);
			const combo_b = nf.format(res.enemyComboCount);
			html += `<tr><th scope="row">Combo</th><td>${combo_a}</td><td>${combo_b}</td></tr>`;

			const shipsA = nf.format(res.selfSiegeWinCount);
			const shipsB = nf.format(res.enemySiegeWinCount);
			html += `<tr><th scope="row">Downed ships</th><td>${shipsA}</td><td>${shipsB}</td></tr>`;

			const gsA = nf.format(guildStatsA);
			const gsB = nf.format(guildStatsB);
			html += `<tr><th scope="row">Guild stats</th><td>${gsA}</td><td>${gsB}</td></tr>`;

			html += '</tbody></table>';
			html += '</div>'
		}

		if (match.getResult.gvgUltimateArtInfo)
		{
			const shinma = match.getResult.gvgUltimateArtInfo.gvgUltimateArtDataList;
			html += '<div class="col">';
			html += '<table class="table table-striped table-bordered table-sm"><thead><tr>';
			html += '<th>Shinma</th>';
			html += `<th scope="col">${guildA}</th>`;
			html += `<th scope="col">${guildB}</th>`;
			html += '</tr></thead>';
			html += '<tbody>';
			html += generateShinmaRow(shinma[0], shinmaSkills);
			html += generateShinmaRow(shinma[1], shinmaSkills);
			html += '</tbody></table>';
			html += '</div>'
		}

		html += '</div>';
	}

	{
		const rankTypes = [
			"Lifeforce", "Recover",
			"Ally ATK Support", "Ally DEF Support",
			"Enemy ATK Debuff", "Enemy DEF Debuff",
			"Combo"
		];
		const mvpRanks = match.getResult.gvgMvpRank;
		html += '<div class="row">';
		html += '<h2>Contribution Rank</h2>';
		for (let i = 0; i < mvpRanks.length; i++) {
			const mvpRank = mvpRanks[i];
			html += '<div class="col-md-4">';
			html += '<div class="card">';
			html += '<div class="card-body">';
			html += `<h3 class="card-title">${rankTypes[mvpRank.type - 1]}</h3>`;
			html += '<table class="table table-striped table-bordered table-sm"><tbody>';
			const list = mvpRank.gvgMvpRankDetailList;
			for (let j = 0; j < list.length; j++) {
				html += '<tr class="text-center">';
				html += `<td rowspan="2" class="align-middle">${j + 1}</td>`;
				html += `<td>${list[j].nameA}</td>`;
				html += `<td>${list[j].nameB}</td>`;
				html += '</tr>';
				html += '<tr class="text-end">';
				html += `<td>${nf.format(list[j].valueA)}</td>`;
				html += `<td>${nf.format(list[j].valueB)}</td>`;
				html += '</tr>';
			}
			html += '</tbody></table>';
			html += '</div>';
			html += '</div>';
			html += '</div>';
		}
		html += '</div>';
	}

	{
		const l = match.getBattleUserList;
		html += '<div class="row">';
		html += '<div class="col">';
		html += generateMemberList(l.guildDataNameA, l.guildMemberA, characters);
		html += '</div>';
		html += '<div class="col">';
		html += generateMemberList(l.guildDataNameB, l.guildMemberB, characters);
		html += '</div>';
		html += '</div>';
	}
	html += '</div>';

	let content = document.getElementById("content");
	content.innerHTML = html;
	return pageTitle;
}

async function showView(searchText, pushState) {
	const params = new URLSearchParams(searchText);

	let view = params.get("view");
	if (!view)
		view = '';

	let pageTitle;
	switch(view.toLowerCase())
	{
		case "history":
		{
			const guild = params.get("guild");
			if (!guild)
				return;

			let historyUrl;
			switch (guild.toLowerCase()) {
				case "daydreamer":
					historyUrl = "match_history_Melesie.json";
					break;
				case "wildcard":
					historyUrl = "match_history_Ludmila.json";
					break;
				default:
					return;
			}

			const [history, shinmaSkills] = await Promise.allSettled([
				loadJson(historyUrl),
				loadShinmaSkills()
			]);

			pageTitle = viewGuildHistory(history.value, shinmaSkills.value);
		}
		break;

		case "match":
		{
			const startTime = parseInt(params.get('time'));
			const guildA = parseInt(params.get('a'));
			const guildB = parseInt(params.get('b'));
			if (!startTime || !guildA || !guildB)
				return;

			const dt = new Date(startTime * 1000);

			let matchUrl = 'matches/';
			matchUrl += pad(4, dt.getUTCFullYear());
			matchUrl += '-';
			matchUrl += pad(2, dt.getUTCMonth() + 1);
			matchUrl += '-';
			matchUrl += pad(2, dt.getUTCDate());
			matchUrl += '_';
			matchUrl += pad(2, dt.getUTCHours());
			matchUrl += '-';
			matchUrl += pad(2, dt.getUTCMinutes());
			matchUrl += '-';
			matchUrl += pad(2, dt.getUTCSeconds());
			matchUrl += `_${pad(5, guildA)}_vs_${pad(5, guildB)}.json`;

			const [match, shinmaSkills, characters] = await Promise.allSettled([
				loadJson(matchUrl),
				loadShinmaSkills(),
				loadCharacters(),
			]);

			pageTitle = viewMatch(dt, match.value, shinmaSkills.value, characters.value);
		}
		break;

		default:
		{
			document.getElementById("content").innerHTML = "";
			pageTitle = 'Scrape Viewer';
		}
		break;
	}

	{
		const content = document.getElementById('content');
		const links = content.querySelectorAll('a');
		for (let i = 0; i < links.length; i++) {
			const link = links[i];
			if (link.getAttribute('href').startsWith('?'))
				link.addEventListener('click', onLinkClick);
		}
	}

	if (pushState) {
		history.pushState({}, '', searchText);
	}
	document.title = pageTitle;
}

function onLinkClick(event) {
	event.preventDefault();
	showView(event.target.getAttribute('href'), true);
}

function onDocumentLoad(event) {
	{
		const navs = document.getElementsByTagName('nav');
		for (let i = 0; i < navs.length; i++) {
			const links = navs[i].querySelectorAll('a');
			for (let j = 0; j < links.length; j++) {
				const link = links[j];
				if (link.getAttribute('href').startsWith('?'))
					link.addEventListener('click', onLinkClick);
			}
		}
	}

	showView(document.location.search, false);
}

function onPopState(event) {
	showView(document.location.search, false);
}

function asyncRequest(method, url) {
	return new Promise(function(resolve, reject) {
		let xhr = new XMLHttpRequest();
		xhr.open(method, url, true);
		xhr.onload = function() {
			if (this.status >= 200 && this.status < 300) {
				resolve(xhr.response);
			} else {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			}
		};
		xhr.onerror = function() {
			reject({
				status: this.status,
				statusText: xhr.statusText
			});
		};
		xhr.send();
	});
}

async function loadJson(url) {
	let json = db.json.get(url);
	if (json) {
		return json;
	}

	let response = await asyncRequest("GET", url);
	json = JSON.parse(response);
	db.json.set(url, json);
	return json;
}

async function loadShinmaSkills() {
	let shinmaSkills = db.index.shinmaSkills;
	if (shinmaSkills) {
		return shinmaSkills;
	}

	const shinmaTable = await loadJson(en_ultimate_art_method_mst_list);

	shinmaSkills = new Map();
	for (let i = 0; i < shinmaTable.length; i++) {
		let shinmaMst = shinmaTable[i];
		shinmaSkills.set(shinmaMst.ultimateArtMethodMstId, shinmaMst);
	}

	db.index.shinmaSkills = shinmaSkills;
	return shinmaSkills;
}

async function loadCharacters() {
	let characters = db.index.characters;
	if (characters) {
		return characters;
	}

	const characterMstList = await loadJson(en_character_mst_list);
	characters = new Map();
	for (let i = 0; i < characterMstList.length; i++) {
		const mst = characterMstList[i];
		characters.set(mst.characterMstId, mst);
	}

	db.index.characters = characters;
	return characters;
}

function pad(p, val) {
	return val.toString().padStart(p, '0');
}

window.addEventListener('load', onDocumentLoad);
window.addEventListener('popstate', onPopState);
